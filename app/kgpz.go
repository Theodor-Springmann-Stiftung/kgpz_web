package app

import (
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/controllers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/geonames"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/gnd"
	searchprovider "github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/search"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/etag"
)

// It also implements Funcs() map[string]interface{} to map funcs to a template engine
// It is meant to be constructed once and then used as a singleton.

const (
	IMG_PREFIX      = "/img/"
	PICTURES_PREFIX = "/static/pictures/"

	EDITION_URL  = "/edition/"
	PRIVACY_URL  = "/datenschutz/"
	CONTACT_URL  = "/kontakt/"
	CITATION_URL = "/zitation/"
	SEARCH_URL   = "/suche/"
	FILTER_URL   = "/filter"

	INDEX_URL = "/jahrgang/1764"

	YEAR_OVERVIEW_URL     = "/jahrgang/:year"
	PLACE_OVERVIEW_URL    = "/ort/:place?"
	AGENTS_OVERVIEW_URL   = "/akteure/:letterorid"
	CATEGORY_OVERVIEW_URL = "/kategorie/:category?/:year?"

	PIECE_URL     = "/beitrag/:id"
	PIECE_PAGE_URL = "/beitrag/:id/:page"
	PAGE_JUMP_URL = "/jump/:year/:page"
	PAGE_JUMP_FORM_URL = "/jump"
	ISSSUE_URL    = "/:year/:issue/:page?"
	ADDITIONS_URL = "/:year/:issue/beilage/:page?"
)

type KGPZ struct {
	// INFO: We need to prevent concurrent reads and writes to the fs here since
	// - Git is accessing the FS
	// - The Library is accessing the FS
	// So we need to prevent concurrent pulls and serializations
	// This is what fsmu is for. IT IS NOT FOR SETTING Config, Repo. GND or Library.
	// Those are only set once during initalization and construction.
	fsmu      sync.Mutex
	Config    *providers.ConfigProvider
	Repo      *providers.GitProvider
	GND       *gnd.GNDProvider
	Geonames  *geonames.GeonamesProvider
	Library   *xmlmodels.Library
	Search    *searchprovider.SearchProvider
}

func NewKGPZ(config *providers.ConfigProvider) (*KGPZ, error) {
	helpers.AssertNonNil(config, "Config is nil")
	if err := config.Validate(); err != nil {
		helpers.Assert(err, "Error validating config")
	}

	kgpz := &KGPZ{Config: config}
	err := kgpz.Init()
	if err != nil {
		return nil, err
	}

	return kgpz, nil
}

func (k *KGPZ) Pre(srv *fiber.App) error {
	// Check if folder exists and if yes, serve image files from it
	if _, err := os.Stat(k.Config.Config.ImgPath); err == nil {
		fs := os.DirFS(k.Config.Config.ImgPath)
		srv.Use(IMG_PREFIX, etag.New())
		srv.Use(IMG_PREFIX, helpers.StaticHandler(&fs))
	} else {
		logging.Info("Image folder not found. Skipping image serving.")
	}

	// Serve newspaper pictures from pictures directory
	if _, err := os.Stat("pictures"); err == nil {
		picturesFS := os.DirFS("pictures")
		srv.Use(PICTURES_PREFIX, etag.New())
		srv.Use(PICTURES_PREFIX, helpers.StaticHandler(&picturesFS))
		logging.Info("Serving newspaper pictures from pictures/ directory.")
	} else {
		logging.Info("Pictures folder not found. Skipping picture serving.")
	}

	return nil
}

func (k *KGPZ) Init() error {
	if gp, err := providers.NewGitProvider(
		k.Config.Config.GitURL,
		filepath.Join(k.Config.Config.BaseDIR, k.Config.Config.GITPath),
		k.Config.Config.GitBranch); err != nil {
		logging.Error(err, "Error initializing GitProvider. Continuing without Git.")
	} else {
		k.Repo = gp
	}

	if err := k.Serialize(); err != nil {
		logging.Error(err, "Error parsing XML.")
		return err
	}

	if err := k.initGND(); err != nil {
		logging.Error(err, "Error reading GND-Cache. Continuing.")
	}
	if err := k.initGeonames(); err != nil {
		logging.Error(err, "Error reading Geonames-Cache. Continuing.")
	}

	if sp, err := searchprovider.NewSearchProvider(filepath.Join(k.Config.Config.BaseDIR, k.Config.SearchPath)); err != nil {
		logging.Error(err, "Error initializing SearchProvider. Continuing without Search.")
	} else {
		k.Search = sp
	}

	k.Enrich()
	go k.Pull()
	err := k.Search.LoadIndeces()
	if err != nil {
		logging.Error(err, "Error loading search indeces.")
		k.BuildSearchIndex()
	} else {
		logging.Info("Search indeces loaded.")
	}

	return nil
}

func (k *KGPZ) initGND() error {
	k.GND = gnd.NewGNDProvider()
	return k.GND.ReadCache(filepath.Join(k.Config.BaseDIR, k.Config.GNDPath))
}

func (k *KGPZ) initGeonames() error {
	k.Geonames = geonames.NewGeonamesProvider()
	return k.Geonames.ReadCache(filepath.Join(k.Config.BaseDIR, k.Config.GeoPath))
}

func (k *KGPZ) Routes(srv *fiber.App) error {
	srv.Get("/", func(c *fiber.Ctx) error {
		c.Redirect(INDEX_URL)
		return nil
	})

	srv.Get(SEARCH_URL, controllers.GetSearch(k.Library, k.Search))
	srv.Get(FILTER_URL, controllers.GetQuickFilter(k.Library))
	srv.Get("/ort/fragment/:place", controllers.GetPlaceFragment(k.Library))
	srv.Get(PLACE_OVERVIEW_URL, controllers.GetPlace(k.Library))
	srv.Get(CATEGORY_OVERVIEW_URL, controllers.GetCategory(k.Library))
	srv.Get(AGENTS_OVERVIEW_URL, controllers.GetAgents(k.Library))
	srv.Get(PIECE_PAGE_URL, controllers.GetPieceWithPage(k.Library))
	srv.Get(PIECE_URL, controllers.GetPiece(k.Library))

	// Page jump routes for direct navigation
	srv.Get(PAGE_JUMP_URL, controllers.GetPageJump(k.Library))
	srv.Post(PAGE_JUMP_FORM_URL, controllers.GetPageJumpForm(k.Library))

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

	if k.Config.WebHookSecret != "" && k.Config.WebHookEndpoint != "" {
		handler, rc := controllers.PostWebhook(k.Config.WebHookSecret)
		srv.Post(k.Config.WebHookEndpoint, handler)
		go func() {
			for signal := range rc {
				if signal {
					k.Pull()
				}
			}
		}()
	}

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
	e["GetGeonames"] = k.Geonames.Place

	// Math functions
	e["sub"] = func(a, b int) int { return a - b }
	e["add"] = func(a, b int) int { return a + b }

	// String functions
	e["contains"] = func(s, substr string) bool { return strings.Contains(s, substr) }
	e["lower"] = func(s string) string { return strings.ToLower(s) }

	// Place helper functions
	e["GetModernCountryName"] = func(geoID string) string {
		if geoID == "" || k.Geonames == nil {
			return ""
		}

		geoPlace := k.Geonames.Place(geoID)
		if geoPlace == nil {
			return ""
		}

		// Map country names to German translations
		switch geoPlace.CountryName {
		case "France":
			return "heutiges Frankreich"
		case "United Kingdom":
			return "heutiges Großbritannien"
		case "Russia":
			return "heutiges Russland"
		case "Czech Republic", "Czechia":
			return "heutiges Tschechien"
		case "Netherlands", "The Netherlands":
			return "heutige Niederlande"
		case "Poland":
			return "heutiges Polen"
		case "Switzerland":
			return "heutige Schweiz"
		case "Latvia":
			return "heutiges Lettland"
		case "Sweden":
			return "heutiges Schweden"
		case "Austria":
			return "heutiges Österreich"
		case "Belgium":
			return "heutiges Belgien"
		case "Slovakia":
			return "heutige Slowakei"
		case "Finland":
			return "heutiges Finnland"
		case "Denmark":
			return "heutiges Dänemark"
		default:
			// Return original country name for unknown countries (excluding Germany)
			if geoPlace.CountryName != "Germany" && geoPlace.CountryName != "" {
				return geoPlace.CountryName
			}
			return ""
		}
	}

	e["GetFullPlaceInfo"] = func(geoID string, originalName string) string {
		if geoID == "" || k.Geonames == nil {
			return ""
		}

		geoPlace := k.Geonames.Place(geoID)
		if geoPlace == nil {
			return ""
		}

		// Only show info for places outside Germany
		if geoPlace.CountryName == "Germany" || geoPlace.CountryName == "" {
			return ""
		}

		// Get the modern country name
		countryName := ""
		switch geoPlace.CountryName {
		case "France":
			countryName = "heutiges Frankreich"
		case "United Kingdom":
			countryName = "heutiges Großbritannien"
		case "Russia":
			countryName = "heutiges Russland"
		case "Czech Republic", "Czechia":
			countryName = "heutiges Tschechien"
		case "Netherlands", "The Netherlands":
			countryName = "heutige Niederlande"
		case "Poland":
			countryName = "heutiges Polen"
		case "Switzerland":
			countryName = "heutige Schweiz"
		case "Latvia":
			countryName = "heutiges Lettland"
		case "Sweden":
			countryName = "heutiges Schweden"
		case "Austria":
			countryName = "heutiges Österreich"
		case "Belgium":
			countryName = "heutiges Belgien"
		case "Slovakia":
			countryName = "heutige Slowakei"
		case "Finland":
			countryName = "heutiges Finnland"
		case "Denmark":
			countryName = "heutiges Dänemark"
		default:
			countryName = geoPlace.CountryName
		}

		// Extract German alternate name (same logic as GetModernPlaceName)
		modernName := ""
		hasGermanName := false

		for _, altName := range geoPlace.AlternateNames {
			if altName.Lang == "de" {
				hasGermanName = true
				if altName.IsPreferredName {
					modernName = altName.Name
					break
				} else if modernName == "" {
					modernName = altName.Name
				}
			}
		}

		if !hasGermanName {
			modernName = geoPlace.ToponymName
		}

		// Combine country and modern place name
		result := countryName
		if modernName != "" && strings.ToLower(modernName) != strings.ToLower(originalName) {
			result += ", " + modernName
		}

		return result
	}

	e["GetModernPlaceName"] = func(geoID string, originalName string) string {
		if geoID == "" || k.Geonames == nil {
			return ""
		}

		geoPlace := k.Geonames.Place(geoID)
		if geoPlace == nil {
			return ""
		}

		// Only show modern names for places outside Germany
		if geoPlace.CountryName == "Germany" || geoPlace.CountryName == "" {
			return ""
		}

		// Extract German alternate name
		modernName := ""
		hasGermanName := false

		for _, altName := range geoPlace.AlternateNames {
			if altName.Lang == "de" {
				hasGermanName = true
				if altName.IsPreferredName {
					modernName = altName.Name
					break
				} else if modernName == "" {
					modernName = altName.Name
				}
			}
		}

		if !hasGermanName {
			modernName = geoPlace.ToponymName
		}

		// Only return if it's different from the original name
		if modernName != "" && strings.ToLower(modernName) != strings.ToLower(originalName) {
			return modernName
		}

		return ""
	}

	e["LookupPieces"] = k.Library.Pieces.ReverseLookup
	e["LookupWorks"] = k.Library.Works.ReverseLookup
	e["LookupIssues"] = k.Library.Issues.ReverseLookup
	e["LookupAnonymWorks"] = func() []xmlmodels.Work {
		var anonymWorks []xmlmodels.Work
		for _, work := range k.Library.Works.Array {
			// Check if work has no agents
			if len(work.AgentRefs) == 0 {
				anonymWorks = append(anonymWorks, work)
			}
		}
		return anonymWorks
	}

	return e
}

func (k *KGPZ) Enrich() error {
	if k.Library == nil || k.Library.Agents == nil {
		return nil
	}

	go func() {
		k.fsmu.Lock()
		defer k.fsmu.Unlock()

		// Fetch GND data for agents
		data := xmlmodels.AgentsIntoDataset(k.Library.Agents)
		k.GND.FetchPersons(data)
		k.GND.WriteCache(filepath.Join(k.Config.BaseDIR, k.Config.GNDPath))

		// Fetch Geonames data for places
		if k.Library.Places != nil {
			placeData := xmlmodels.PlacesIntoDataset(k.Library.Places)
			k.Geonames.FetchPlaces(placeData)
			k.Geonames.WriteCache(filepath.Join(k.Config.BaseDIR, k.Config.GeoPath))
		}
	}()

	return nil
}

// EnrichAndRebuildIndex ensures enrichment completes before rebuilding search index
func (k *KGPZ) EnrichAndRebuildIndex() error {
	if k.Library == nil || k.Library.Agents == nil {
		return nil
	}

	go func() {
		k.fsmu.Lock()
		defer k.fsmu.Unlock()

		logging.Info("Starting enrichment process...")

		// Fetch GND data for agents
		data := xmlmodels.AgentsIntoDataset(k.Library.Agents)
		k.GND.FetchPersons(data)
		k.GND.WriteCache(filepath.Join(k.Config.BaseDIR, k.Config.GNDPath))

		// Fetch Geonames data for places
		if k.Library.Places != nil {
			placeData := xmlmodels.PlacesIntoDataset(k.Library.Places)
			k.Geonames.FetchPlaces(placeData)
			k.Geonames.WriteCache(filepath.Join(k.Config.BaseDIR, k.Config.GeoPath))
		}

		logging.Info("Enrichment complete. Starting search index rebuild...")

		// Clear existing indices before rebuilding
		k.ClearSearchIndices()

		// Rebuild search index after enrichment is complete
		k.buildSearchIndexSync()
	}()

	return nil
}

// ClearSearchIndices removes all existing search indices
func (k *KGPZ) ClearSearchIndices() error {
	if k.Search == nil {
		return nil
	}

	return k.Search.ClearAllIndices()
}

// buildSearchIndexSync builds the search index synchronously (no goroutine)
func (k *KGPZ) buildSearchIndexSync() error {
	if k.Library == nil || k.Library.Agents == nil || k.Search == nil {
		return nil
	}

	wg := new(sync.WaitGroup)
	wg.Add(6)

	go func() {
		for _, agent := range k.Library.Agents.Array {
			err := k.Search.Index(agent, k.Library)
			if err != nil {
				logging.Error(err, "Error indexing agent")
			}
		}
		wg.Done()
	}()

	go func() {
		for _, place := range k.Library.Places.Array {
			err := k.Search.Index(place, k.Library)
			if err != nil {
				logging.Error(err, "Error indexing place")
			}
		}
		wg.Done()
	}()

	go func() {
		for _, cat := range k.Library.Categories.Array {
			err := k.Search.Index(cat, k.Library)
			if err != nil {
				logging.Error(err, "Error indexing category")
			}
		}
		wg.Done()
	}()

	go func() {
		for _, work := range k.Library.Works.Array {
			err := k.Search.Index(work, k.Library)
			if err != nil {
				logging.Error(err, "Error indexing work")
			}
		}
		wg.Done()
	}()

	go func() {
		for _, issue := range k.Library.Issues.Array {
			err := k.Search.Index(issue, k.Library)
			if err != nil {
				logging.Error(err, "Error indexing issue")
			}
		}
		wg.Done()
	}()

	go func() {
		for _, piece := range k.Library.Pieces.Array {
			err := k.Search.Index(piece, k.Library)
			if err != nil {
				logging.Error(err, "Error indexing piece")
			}
		}
		wg.Done()
	}()

	wg.Wait()
	logging.Info("Search index built.")

	return nil
}

func (k *KGPZ) BuildSearchIndex() error {
	if k.Library == nil || k.Library.Agents == nil || k.Search == nil {
		return nil
	}

	go func() {
		k.fsmu.Lock()
		defer k.fsmu.Unlock()
		k.buildSearchIndexSync()
	}()
	return nil
}

func (k *KGPZ) Serialize() error {
	// TODO: this is error handling from hell
	// Preventing pulling and serializing at the same time
	k.fsmu.Lock()
	defer k.fsmu.Unlock()

	commit := ""
	source := xmlprovider.Path
	if k.Repo != nil {
		commit = k.Repo.Commit
		source = xmlprovider.Commit
	}

	if k.Library == nil {
		k.Library = xmlmodels.NewLibrary()
	}

	err := k.Library.Parse(source, filepath.Join(k.Config.BaseDIR, k.Config.GITPath), commit)
	return err
}

func (k *KGPZ) IsDebug() bool {
	return k.Config.Debug
}

func (k *KGPZ) Pull() {
	if k.Repo == nil {
		return
	}

	logging.Info("Pulling Repository...")

	k.fsmu.Lock()
	err, changed := k.Repo.Pull()
	logging.Error(err, "Error pulling GitProvider")
	k.fsmu.Unlock()

	if changed {
		logging.ObjDebug(&k.Repo, "Remote changed. Reparsing")
		k.Serialize()
		k.EnrichAndRebuildIndex()
	}
}

func (k *KGPZ) Shutdown() {
	k.Repo.Wait()
}
