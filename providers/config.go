package providers

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/kelseyhightower/envconfig"
)

// WARNING: this is not intended to be used in a multi-threaded environment
// Instatiate this once on startup before any goroutines are started
const (
	DEFAULT_GIT_DIR = "data_git"
	DEFAULT_GND_DIR = "cache_gnd"
	DEFAULT_GEO_DIR = "cache_geo"

	DEFAULT_PORT  = "8080"
	DEFAULT_ADDR  = "localhost"
	DEFAULT_HTTPS = false
)

type ConfigProvider struct {
	Files []string
	*Config
}

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
	LogData         bool   `json:"log_data" envconfig:"LOG_DATA"`

	Address string `json:"address" envconfig:"ADDRESS"`
	Port    string `json:"port" envconfig:"PORT"`
	Https   bool   `json:"https" envconfig:"HTTPS"`
}

func NewConfigProvider(files []string) *ConfigProvider {
	return &ConfigProvider{Files: files}
}

func (c *ConfigProvider) Read() error {
	c.Config = &Config{}
	for _, file := range c.Files {
		c.Config = readSettingsFile(c.Config, file)
	}
	c.Config = readSettingsEnv(c.Config)
	c.Config = readDefaults(c.Config)
	return nil
}

func (c *ConfigProvider) Validate() error {
	if strings.TrimSpace(c.Config.FolderPath) == "" {
		return fmt.Errorf("Folder path not set")
	}
	return nil
}

func readSettingsFile(cfg *Config, path string) *Config {
	f, err := os.Open(path)
	if err != nil {
		logging.Error(err, "Error opening config file "+path)
		return cfg
	}
	defer f.Close()

	dec := json.NewDecoder(f)
	err = dec.Decode(cfg)
	helpers.Assert(err, "Error decoding config file")

	return cfg
}

func readSettingsEnv(cfg *Config) *Config {
	_ = envconfig.Process("KGPZ", cfg)
	return cfg
}

func readDefaults(cfg *Config) *Config {
	if strings.TrimSpace(cfg.FolderPath) == "" {
		cfg.FolderPath = DEFAULT_GIT_DIR
	}

	if strings.TrimSpace(cfg.GNDPath) == "" {
		cfg.GNDPath = DEFAULT_GND_DIR
	}

	if strings.TrimSpace(cfg.GeoPath) == "" {
		cfg.GeoPath = DEFAULT_GEO_DIR
	}

	if strings.TrimSpace(cfg.Address) == "" {
		cfg.Address = DEFAULT_ADDR
	}

	if strings.TrimSpace(cfg.Port) == "" {
		cfg.Port = DEFAULT_PORT
	}

	return cfg
}

// Implement stringer
func (c *Config) String() string {
	return fmt.Sprintf("GitURL: %s\nGitBranch: %s\nFolderPath: %s\nGNDPath: %s\nGeoPath: %s\nWebHookEndpoint: %s\nWebHookSecret: %s\n",
		c.GitURL, c.GitBranch, c.FolderPath, c.GNDPath, c.GeoPath, c.WebHookEndpoint, c.WebHookSecret)
}
