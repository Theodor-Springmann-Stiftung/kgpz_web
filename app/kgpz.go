package app

import (
	"os"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/controllers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/gnd"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

// INFO: this holds all the stuff specific to the KGPZ application
// It implements Map(*fiber.App) error, so it can be used as a MuxProvider
// It also implements Funcs() map[string]interface{} to map funcs to a template engine

const (
	ASSETS_URL_PREFIX = "/assets"

	EDITION_URL  = "/edition/"
	PRIVACY_URL  = "/datenschutz/"
	CONTACT_URL  = "/kontakt/"
	CITATION_URL = "/zitation/"

	INDEX_URL = "/1764"

	YEAR_OVERVIEW_URL     = "/:year"
	PLACE_OVERVIEW_URL    = "/ort/:place"
	AGENTS_OVERVIEW_URL   = "/akteure/:letterorid"
	CATEGORY_OVERVIEW_URL = "/kategorie/:category"

	ISSSUE_URL    = "/:year/:issue/:page?"
	ADDITIONS_URL = "/:year/:issue/beilage/:page?"
)

type KGPZ struct {
	// GMU is only here to prevent concurrent pulls
	// or file system operations while parsing
	gmu     sync.Mutex
	Config  *providers.ConfigProvider
	Repo    *providers.GitProvider
	GND     *gnd.GNDProvider
	Library *xmlmodels.Library
}

func (k *KGPZ) Init() {
	if k.Config.Debug {
		// NOTE: validity checks done wrong, but speeding up dev mode:
		// In dev mode we expect the folder to be a valid repository
		if _, err := os.Stat(k.Config.FolderPath); err != nil {
			k.initRepo()
		} else {
			go k.initRepo()
		}
		k.Serialize()
		k.InitGND()
		k.Enrich()
		return
	}

	k.initRepo()
	k.Serialize()
	k.InitGND()
	k.Enrich()
}

func NewKGPZ(config *providers.ConfigProvider) *KGPZ {
	helpers.AssertNonNil(config, "Config is nil")
	if err := config.Validate(); err != nil {
		helpers.Assert(err, "Error validating config")
	}

	return &KGPZ{Config: config}
}

func (k *KGPZ) InitGND() {
	if k.GND == nil {
		k.GND = gnd.NewGNDProvider()
	}

	if err := k.GND.ReadCache(k.Config.GNDPath); err != nil {
		logging.Error(err, "Error reading GND cache")
	}
}

func (k *KGPZ) Routes(srv *fiber.App) error {
	srv.Get("/", func(c *fiber.Ctx) error {
		c.Redirect(INDEX_URL)
		return nil
	})

	srv.Get(PLACE_OVERVIEW_URL, controllers.GetPlace(k.Library))
	srv.Get(CATEGORY_OVERVIEW_URL, controllers.GetCategory(k.Library))
	srv.Get(AGENTS_OVERVIEW_URL, controllers.GetAgents(k.Library))

	// TODO: YEAR_OVERVIEW_URL being /:year is a bad idea, since it captures basically everything,
	// probably creating problems with static files, and also in case we add a front page later.
	// That's why we redirect to /1764 on "/ " above and don´t use an optional /:year? paramter.
	// -> Check SEO requirements on index pages that are 301 forwarded.
	// This applies to all paths with two or three segments without a static prefix:
	// Prob better to do /ausgabe/:year/:issue/:page? and /jahrgang/:year? respectively.
	srv.Get(YEAR_OVERVIEW_URL, controllers.GetYear(k.Library))
	srv.Get(ISSSUE_URL, controllers.GetIssue(k.Library))
	srv.Get(ADDITIONS_URL, controllers.GetIssue(k.Library))

	srv.Get(EDITION_URL, controllers.Get(EDITION_URL))
	srv.Get(PRIVACY_URL, controllers.Get(PRIVACY_URL))
	srv.Get(CONTACT_URL, controllers.Get(CONTACT_URL))
	srv.Get(CITATION_URL, controllers.Get(CITATION_URL))

	return nil
}

func (k *KGPZ) Funcs() map[string]interface{} {
	e := make(map[string]interface{})
	// App specific
	e["GetAgent"] = k.Library.Agents.Item
	e["GetPlace"] = k.Library.Places.Item
	e["GetWork"] = k.Library.Works.Item
	e["GetCategory"] = k.Library.Categories.Item
	e["GetIssue"] = k.Library.Issues.Item
	e["GetPiece"] = k.Library.Pieces.Item
	e["GetGND"] = k.GND.Person

	e["LookupPieces"] = k.Library.Pieces.ReverseLookup
	e["LookupWorks"] = k.Library.Works.ReverseLookup
	e["LookupIssues"] = k.Library.Issues.ReverseLookup

	return e
}

func (k *KGPZ) Enrich() error {
	if k.GND == nil {
		k.InitGND()
	}

	if k.Library == nil || k.Library.Agents == nil {
		return nil
	}

	go func() {
		data := xmlmodels.AgentsIntoDataset(k.Library.Agents)
		k.GND.FetchPersons(data)
		k.GND.WriteCache(k.Config.GNDPath)
	}()

	return nil
}

func (k *KGPZ) Serialize() {
	// TODO: this is error handling from hell
	// Preventing pulling and serializing at the same time
	k.gmu.Lock()
	defer k.gmu.Unlock()

	commit := ""
	source := xmlprovider.Path
	if k.Repo != nil {
		commit = k.Repo.Commit
		source = xmlprovider.Commit
	}

	if k.Library == nil {
		k.Library = xmlmodels.NewLibrary()
	}

	k.Library.Parse(source, k.Config.FolderPath, commit)
}

func (k *KGPZ) IsDebug() bool {
	return k.Config.Debug
}

func (k *KGPZ) Pull() {
	go func() {
		logging.Info("Pulling Repository...")
		k.gmu.Lock()

		if k.Repo == nil {
			k.gmu.Unlock()
			return
		}

		err, changed := k.Repo.Pull()
		logging.Error(err, "Error pulling GitProvider")

		// Need to unlock here to prevent deadlock, since Serialize locks the same mutex
		k.gmu.Unlock()

		if changed {
			logging.ObjDebug(&k.Repo, "Remote changed. Reparsing")
			k.Serialize()
		}
	}()
}

func (k *KGPZ) initRepo() {
	gp, err := providers.NewGitProvider(k.Config.Config.GitURL, k.Config.Config.FolderPath, k.Config.Config.GitBranch)
	// TODO: what to do if the repo can't be initialized?
	// What to do if the data can't be read?
	// Handle in Serialize --> it musttry to initialize the repository if files are missing.
	if err != nil {
		logging.Error(err, "Error initializing GitProvider")
		return
	}

	k.gmu.Lock()
	k.Repo = gp
	k.gmu.Unlock()
	k.Pull()

	logging.ObjDebug(&k.Repo, "GitProvider initialized")
}

func (k *KGPZ) Shutdown() {
	k.Repo.Wait()
}
