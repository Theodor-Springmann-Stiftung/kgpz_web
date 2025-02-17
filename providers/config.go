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
	DEFAULT_DIR              = "cache"
	DEFAULT_GIT_CACHE_DIR    = "git"
	DEFAULT_GND_CACHE_DIR    = "gnd"
	DEFAULT_GEO_CACHE_DIR    = "geo"
	DEFAULT_SEARCH_CACHE_DIR = "search"
	DEFAULT_IMG_DIR          = "data_bilder"

	DEFAULT_PORT  = "8080"
	DEFAULT_ADDR  = "localhost"
	DEFAULT_HTTPS = false

	ENV_PREFIX = "KGPZ"
)

type ConfigProvider struct {
	Files []string
	*Config
}

type Config struct {
	// At least one of these should be set
	BaseDIR         string `json:"base_dir" envconfig:"BASE_DIR"`
	GitURL          string `json:"git_url" envconfig:"GIT_URL"`
	GitBranch       string `json:"git_branch" envconfig:"GIT_BRANCH"`
	GITPath         string `json:"git_path" envconfig:"GIT_PATH"`
	GNDPath         string `json:"gnd_path" envconfig:"GND_PATH"`
	GeoPath         string `json:"geo_path" envconfig:"GEO_PATH"`
	ImgPath         string `json:"img_path" envconfig:"IMG_PATH"`
	WebHookEndpoint string `json:"webhook_endpoint" envconfig:"WEBHOOK_ENDPOINT"`
	WebHookSecret   string `json:"webhook_secret" envconfig:"WEBHOOK_SECRET"`
	Debug           bool   `json:"debug" envconfig:"DEBUG"`
	Watch           bool   `json:"watch" envconfig:"WATCH"`
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
	if strings.TrimSpace(c.Config.BaseDIR) == "" {
		return fmt.Errorf("Base directory path not set")
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
	_ = envconfig.Process(ENV_PREFIX, cfg)
	return cfg
}

func readDefaults(cfg *Config) *Config {
	if strings.TrimSpace(cfg.BaseDIR) == "" {
		cfg.BaseDIR = DEFAULT_DIR
	}

	if strings.TrimSpace(cfg.GITPath) == "" {
		cfg.GITPath = DEFAULT_GIT_CACHE_DIR
	}

	if strings.TrimSpace(cfg.GNDPath) == "" {
		cfg.GNDPath = DEFAULT_GND_CACHE_DIR
	}

	if strings.TrimSpace(cfg.GeoPath) == "" {
		cfg.GeoPath = DEFAULT_GEO_CACHE_DIR
	}

	if strings.TrimSpace(cfg.Address) == "" {
		cfg.Address = DEFAULT_ADDR
	}

	if strings.TrimSpace(cfg.Port) == "" {
		cfg.Port = DEFAULT_PORT
	}

	if strings.TrimSpace(cfg.ImgPath) == "" {
		cfg.ImgPath = DEFAULT_IMG_DIR
	}

	return cfg
}

func (c *Config) String() string {
	json, err := json.Marshal(c)
	if err != nil {
		return "Config: Error marshalling to JSON"
	}
	return string(json)
}
