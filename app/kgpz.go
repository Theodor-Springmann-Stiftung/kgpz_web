package app

import (
	"os"
	"path/filepath"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/gnd"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const (
	AGENTS_PATH     = "XML/akteure.xml"
	PLACES_PATH     = "XML/orte.xml"
	WORKS_PATH      = "XML/werke.xml"
	CATEGORIES_PATH = "XML/kategorien.xml"

	ISSUES_DIR = "XML/stuecke/"
	PIECES_DIR = "XML/beitraege/"
)

type KGPZ struct {
	// LMU is here for file system access
	lmu sync.Mutex
	// GMU is only here to prevent concurrent pulls
	gmu     sync.Mutex
	Config  *providers.ConfigProvider
	Repo    *providers.GitProvider
	GND     *gnd.GNDProvider
	Library *xmlprovider.Library
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

func (k *KGPZ) Enrich() error {
	if k.GND == nil {
		k.InitGND()
	}

	k.lmu.Lock()
	defer k.lmu.Unlock()

	if k.Library == nil || k.Library.Agents == nil {
		return nil
	}

	// INFO: We pass agents by value since we don't want to block the library
	agents := k.Library.Agents.Everything()
	go func(agents []*xmlprovider.Agent) {
		k.GND.FetchPersons(agents)
		k.GND.WriteCache(k.Config.GNDPath)
	}(agents)

	return nil
}

func (k *KGPZ) Serialize() {
	// TODO: this is error handling from hell
	// There is no need to recreate the whole library if the paths haven't changed
	// We do it to keep the old data if the new data is missing

	// Preventing pulling and serializing at the same time
	k.gmu.Lock()
	defer k.gmu.Unlock()

	commit := "staticfile"
	if k.Repo != nil {
		commit = k.Repo.Commit
	}

	issues, err := getXMLFiles(filepath.Join(k.Config.FolderPath, ISSUES_DIR))
	helpers.Assert(err, "Error getting issues")

	pieces, err := getXMLFiles(filepath.Join(k.Config.FolderPath, PIECES_DIR))
	helpers.Assert(err, "Error getting pieces")

	k.lmu.Lock()
	defer k.lmu.Unlock()
	if k.Library == nil {
		lib := xmlprovider.NewLibrary(
			[]string{filepath.Join(k.Config.FolderPath, AGENTS_PATH)},
			[]string{filepath.Join(k.Config.FolderPath, PLACES_PATH)},
			[]string{filepath.Join(k.Config.FolderPath, WORKS_PATH)},
			[]string{filepath.Join(k.Config.FolderPath, CATEGORIES_PATH)},
			*issues,
			*pieces)

		lib.Serialize(commit)

		k.Library = lib
	} else {
		// TODO: where to clear the old data?
		// How to differentiate between deleted data points and stale data points bc of parse errors?
		k.Library.SetPaths(
			[]string{filepath.Join(k.Config.FolderPath, AGENTS_PATH)},
			[]string{filepath.Join(k.Config.FolderPath, PLACES_PATH)},
			[]string{filepath.Join(k.Config.FolderPath, WORKS_PATH)},
			[]string{filepath.Join(k.Config.FolderPath, CATEGORIES_PATH)},
			*issues,
			*pieces)
		k.Library.Serialize(commit)
	}
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

func getXMLFiles(path string) (*[]string, error) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil, err
	}

	matches, err := filepath.Glob(filepath.Join(path, "*.xml"))

	return &matches, err
}
