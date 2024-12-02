package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

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

// 1. Check if folder exists
//		- If not, clone the repo, if possible or throw if error
// 2. If the folder exists, we try to serialize -- and spawn a goroutine to pull.
//		Upon pulling, we read in the current state of the repository, even if it's up to date.
//		-> If the repo was changed we execute a callback and parse again.
//		-> If pulling fails, we retry after a certain amount of time.
//		   Still we can continue if serialization proceeds.
//		-> If serialization fails, we throw an error, log it. We try to pull in the background.
//		- setup commit date & hash
//		- Setup GitHub webhook if set

func main() {
	cfg := providers.NewConfigProvider([]string{DEV_CONFIG, DEFAULT_CONFIG})
	if err := cfg.Read(); err != nil {
		helpers.Assert(err, "Error reading config")
	}

	if cfg.Config.Debug {
		logging.SetDebug()
	} else {
		logging.SetInfo()
	}

	kgpz := app.NewKGPZ(cfg)
	kgpz.Init()

	engine := templating.NewEngine(&views.LayoutFS, &views.RoutesFS)
	engine.Funcs(kgpz)
	engine.Globals(fiber.Map{"isDev": cfg.Config.Debug, "name": "KGPZ", "lang": "de"})

	server := server.Create(kgpz, cfg, engine)
	Start(kgpz, server)
}

func Start(k *app.KGPZ, s *server.Server) {
	s.Start()

	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)

	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigs
		logging.Info("Signal received, Cleaning up...")
		// INFO: here we add cleanup functions
		if sig == syscall.SIGTERM {
			s.Stop()
			logging.Info("Server stopped. Waiting for FS.")
		} else {
			s.Kill()
			logging.Info("Server killed. Waiting for FS.")
		}
		k.Shutdown()
		logging.Info("Shutdown complete.")
		done <- true
	}()

	// Interactive listening for input
	if k.IsDebug() {
		go func() {
			for {
				var input string
				fmt.Scanln(&input)
				if input == "r" {
					s.Restart()
				} else if input == "p" {
					k.Pull()
				} else if input == "q" {
					sigs <- os.Signal(syscall.SIGTERM)
				}
			}
		}()
	}

	<-done
}
