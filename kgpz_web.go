package main

import (
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/server"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/templating"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/views"
	"github.com/gofiber/fiber/v2"
)

const (
	DEFAULT_CONFIG = "config.json"
	DEV_CONFIG     = "config.dev.json"
)

type App struct {
	KGPZ   *app.KGPZ
	Server *server.Server
	Config *providers.ConfigProvider
	Engine *templating.Engine
}

func main() {
	cfg := providers.NewConfigProvider([]string{DEV_CONFIG, DEFAULT_CONFIG})
	if err := cfg.Read(); err != nil {
		helpers.Assert(err, "Error reading config")
	}

	app, err := Init(cfg)
	helpers.Assert(err, "Error initializing app")

	Run(app)
}

func Init(cfg *providers.ConfigProvider) (*App, error) {
	if cfg.Config.Debug {
		logging.SetDebug()
	} else {
		logging.SetInfo()
	}

	kgpz, err := app.NewKGPZ(cfg)
	if err != nil {
		panic(err)
	}

	engine := Engine(kgpz, cfg)
	server := server.Create(cfg, engine)

	// Set up callback to update engine globals when git data changes
	kgpz.SetGitUpdateCallback(func(commit, date, url string) {
		engine.UpdateGitGlobals(commit, date, url)
	})

	server.AddPre(engine)
	server.AddPre(kgpz)
	server.AddMux(kgpz)

	return &App{KGPZ: kgpz, Server: server, Config: cfg, Engine: engine}, nil
}

func Run(app *App) {
	app.Server.Start()

	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)

	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigs
		logging.Info("Signal received, Cleaning up...")
		// INFO: here we add cleanup functions
		if sig == syscall.SIGTERM {
			app.Server.Stop()
			logging.Info("Server stopped. Waiting for FS.")
		} else {
			app.Server.Kill()
			logging.Info("Server killed. Waiting for FS.")
		}
		app.KGPZ.Shutdown()
		logging.Info("Shutdown complete.")
		done <- true
	}()

	// INFO: hot reloading for poor people
	if app.Config.Watch {
		go func() {
			_, routesexist := os.Stat(server.ROUTES_FILEPATH)
			_, layoutexist := os.Stat(server.LAYOUT_FILEPATH)

			if routesexist != nil && layoutexist != nil {
				logging.Info("Routes or Layout folder does not exist. Watcher disabled.")
				return
			}

			watcher, err := helpers.NewFileWatcher()
			if err != nil {
				return
			}

			watcher.Append(func(path string) {
				logging.Info("File changed: ", path)
				time.Sleep(200 * time.Millisecond)
				engine := Engine(app.KGPZ, app.Config)
				app.Server.ClearPre()
				app.Server.AddPre(engine)
				app.Server.Engine(engine)
			})

			if routesexist != nil {
				err = watcher.RecursiveDir(server.ROUTES_FILEPATH)
				if err != nil {
					return
				}
			}

			if layoutexist != nil {
				err = watcher.RecursiveDir(server.LAYOUT_FILEPATH)
				if err != nil {
					return
				}
			}
		}()

	}

	// Interactive listening for input
	// if k.IsDebug() {
	// 	go func() {
	// 		for {
	// 			var input string
	// 			fmt.Scanln(&input)
	// 			if input == "r" {
	// 				s.Restart()
	// 			} else if input == "p" {
	// 				k.Pull()
	// 			} else if input == "q" {
	// 				sigs <- os.Signal(syscall.SIGTERM)
	// 			}
	// 		}
	// 	}()
	// }
	//
	<-done
}

func Engine(kgpz *app.KGPZ, c *providers.ConfigProvider) *templating.Engine {
	e := templating.NewEngine(&views.LayoutFS, &views.RoutesFS)
	e.AddFuncs(kgpz.Funcs())
	timestamp := time.Now().Unix()

	// Add git commit information to global data
	globals := fiber.Map{"isDev": c.Config.Debug, "name": "KGPZ", "lang": "de", "timestamp": timestamp}
	if kgpz.Repo != nil {
		globals["gitCommit"] = kgpz.Repo.Commit
		globals["gitDate"] = kgpz.Repo.Date.Format("2006-01-02T15:04:05Z07:00")
		globals["gitURL"] = c.Config.GitURL
	}

	e.Globals(globals)
	return e
}
