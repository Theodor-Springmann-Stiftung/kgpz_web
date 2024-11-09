package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/models"
	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/kelseyhightower/envconfig"
)

// 1. Check if folder exists
//		- If not, clone the repo, if possible or throw if error
// 2. If folder exists, try to pull the repo, and if successful:
//		- setup commit date & hash
//		- Setup GitHub webhook if set
// 3. Serialize XML DATA

type Config struct {
	// At least one of these should be set
	GitURL          string `json:"git_url" envconfig:"GIT_URL"`
	GitBranch       string `json:"git_branch" envconfig:"GIT_BRANCH"`
	FolderPath      string `json:"folder_path" envconfig:"FOLDER_PATH"`
	GNDPath         string `json:"gnd_path" envconfig:"GND_PATH"`
	GeoPath         string `json:"geo_path" envconfig:"GEO_PATH"`
	WebHookEndpoint string `json:"webhook_endpoint" envconfig:"WEBHOOK_ENDPOINT"`
	WebHookSecret   string `json:"webhook_secret" envconfig:"WEBHOOK_SECRET"`
	Debug           bool   `json:"debug" envconfig:"DEBUG"`
}

// Implement stringer
func (c *Config) String() string {
	return fmt.Sprintf("GitURL: %s\nGitBranch: %s\nFolderPath: %s\nGNDPath: %s\nGeoPath: %s\nWebHookEndpoint: %s\nWebHookSecret: %s\n",
		c.GitURL, c.GitBranch, c.FolderPath, c.GNDPath, c.GeoPath, c.WebHookEndpoint, c.WebHookSecret)
}

func main() {
	cfg := &Config{}
	cfg = readSettingsFile(cfg, "config.dev.json")
	cfg = readSettingsFile(cfg, "config.json")
	cfg = readSettingsEnv(cfg)
	cfg = readDefaults(cfg)

	fmt.Println("Running with config:")
	fmt.Println(cfg)

	if cfg.FolderPath == "" {
		panic("Folder path not set. Exiting.")
	}

	gp := providers.NewGitProvider(cfg.GitURL, cfg.FolderPath, cfg.GitBranch)

	// If folder exists try to pull, otherwise clone:
	// TODO: there is no need to panic if clone can't be done, jus log the errors
	// The code will panic if the XML data can't be parsed.
	if gp != nil {
		if _, err := os.Stat(cfg.FolderPath); os.IsNotExist(err) {
			err := gp.Clone()
			if err != nil {
				logOnErr(gp, err, "Error cloning repo")
			}
		} else {
			err := gp.Pull()
			if err != nil {
				logOnErr(gp, err, "Error pulling repo")
			}
		}

		if err := gp.Validate(); err != nil {
			logOnErr(gp, err, "Error validating repo")
			gp = nil
		}

		if cfg.Debug && gp != nil {
			logOnDebug(gp, "GitProvider")
		}
	}

	// At his point we may or may not have a GitProvider

}

func maybePanic(err error, msg string) {
	if err == nil {
		return
	}

	fmt.Println(msg)
	fmt.Println("Error: ", err)
	os.Exit(1)
}

func readSettingsFile(cfg *Config, path string) *Config {
	f, err := os.Open(path)
	if err != nil {
		fmt.Println("Error: ", err)
		fmt.Println("Coudln't open ", path)
		return cfg
	}
	defer f.Close()

	dec := json.NewDecoder(f)
	err = dec.Decode(cfg)
	maybePanic(err, "Error decoding config.json")

	return cfg
}

func readSettingsEnv(cfg *Config) *Config {
	_ = envconfig.Process("KGPZ", cfg)
	return cfg
}

func readDefaults(cfg *Config) *Config {
	if strings.TrimSpace(cfg.FolderPath) == "" {
		cfg.FolderPath = models.DEFAULT_GIT_DIR
	}

	if strings.TrimSpace(cfg.GNDPath) == "" {
		cfg.GNDPath = models.DEFAULT_GND_DIR
	}

	if strings.TrimSpace(cfg.GeoPath) == "" {
		cfg.GeoPath = models.DEFAULT_GEO_DIR
	}

	return cfg
}

func logOnDebug[T fmt.Stringer](object T, msg string) {
	if msg != "" {
		fmt.Println(msg)
	}
	fmt.Println(object)
}

func logOnErr[T fmt.Stringer](object T, err error, msg string) {
	if err != nil {
		if msg != "" {
			fmt.Println(msg)
		}
		fmt.Println(object)
		fmt.Println("Error: ", err)
	}
}
