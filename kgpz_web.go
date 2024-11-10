package main

import (
	"os"
	"path/filepath"

	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
)

// 1. Check if folder exists
//		- If not, clone the repo, if possible or throw if error
// 2. If folder exists, try to pull the repo, and if successful:
//		- setup commit date & hash
//		- Setup GitHub webhook if set
// 3. Serialize XML DATA

const (
	AGENTS_PATH     = "XML/akteure.xml"
	PLACES_PATH     = "XML/orte.xml"
	WORKS_PATH      = "XML/werke.xml"
	CATEGORIES_PATH = "XML/kategorien.xml"
)

type KGPZ struct {
	Config *providers.ConfigProvider
	Repo   *providers.GitProvider
	Agents *providers.AgentProvider
	Places *providers.PlaceProvider
	Works  *providers.WorkProvider
}

func NewKGPZ(config *providers.ConfigProvider) *KGPZ {
	if config == nil {
		panic("ConfigProvider is nil")
	}

	if err := config.Validate(); err != nil {
		helpers.MaybePanic(err, "Error validating config")
	}

	return &KGPZ{Config: config}
}

func (k *KGPZ) IsDebug() bool {
	return k.Config.Debug
}

func (k *KGPZ) InitRepo() {
	gp := providers.NewGitProvider(k.Config.Config.GitURL, k.Config.Config.FolderPath, k.Config.Config.GitBranch)

	// If folder exists try to pull, otherwise clone:
	// TODO: there is no need to panic if clone can't be done, jus log the errors
	// The code will panic if the XML data can't be parsed.
	if gp != nil {
		if _, err := os.Stat(k.Config.FolderPath); os.IsNotExist(err) {
			err := gp.Clone()
			if err != nil {
				helpers.LogOnErr(gp, err, "Error cloning repo")
			}
		} else {
			err := gp.Pull()
			if err != nil {
				helpers.LogOnErr(gp, err, "Error pulling repo")
			}
		}

		if err := gp.Validate(); err != nil {
			helpers.LogOnErr(gp, err, "Error validating repo")
			gp = nil
		}

		if k.IsDebug() && gp != nil {
			helpers.LogOnDebug(gp, "GitProvider")
		}
	}
}

func (k *KGPZ) InitAgents() {
	ap := providers.NewAgentProvider([]string{filepath.Join(k.Config.FolderPath, AGENTS_PATH)})
	if ap != nil {
		if err := ap.Load(); err != nil {
			helpers.LogOnErr(ap, err, "Error loading agents")
		}

		if k.IsDebug() {
			helpers.LogOnDebug(ap, "AgentProvider")
		}
	}
}

func (k *KGPZ) InitPlaces() {
	pp := providers.NewPlaceProvider([]string{filepath.Join(k.Config.FolderPath, PLACES_PATH)})
	if pp != nil {
		if err := pp.Load(); err != nil {
			helpers.LogOnErr(pp, err, "Error loading places")
		}

		if k.IsDebug() {
			helpers.LogOnDebug(pp, "PlaceProvider")
		}
	}
}

func (k *KGPZ) InitWorks() {
	wp := providers.NewWorkProvider([]string{filepath.Join(k.Config.FolderPath, WORKS_PATH)})
	if wp != nil {
		if err := wp.Load(); err != nil {
			helpers.LogOnErr(wp, err, "Error loading works")
		}

		if k.IsDebug() {
			helpers.LogOnDebug(wp, "WorkProvider")
		}
	}
}

func (k *KGPZ) InitCategories() {
	cp := providers.NewCategoryProvider([]string{filepath.Join(k.Config.FolderPath, CATEGORIES_PATH)})
	if cp != nil {
		if err := cp.Load(); err != nil {
			helpers.LogOnErr(cp, err, "Error loading categories")
		}

		if k.IsDebug() {
			helpers.LogOnDebug(cp, "CategoryProvider")
		}
	}
}

func main() {
	cfg := providers.NewConfigProvider([]string{"config.dev.json", "config.json"})
	if err := cfg.Read(); err != nil {
		helpers.MaybePanic(err, "Error reading config")
	}

	kgpz := NewKGPZ(cfg)
	kgpz.InitRepo()
	kgpz.InitAgents()
	kgpz.InitPlaces()
	kgpz.InitWorks()
	kgpz.InitCategories()
}
