package app

import (
	"os"
	"path/filepath"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/gnd"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
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

	commit := "staticfile"
	if k.Repo != nil {
		commit = k.Repo.Commit
	}

	issues, err := getXMLFiles(filepath.Join(k.Config.FolderPath, ISSUES_DIR))
	helpers.Assert(err, "Error getting issues")

	pieces, err := getXMLFiles(filepath.Join(k.Config.FolderPath, PIECES_DIR))
	helpers.Assert(err, "Error getting pieces")

	if k.Library == nil {
		k.Library = xmlmodels.NewLibrary(k.Config.FolderPath)
	}

	k.Library.Serialize(commit)
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
