package server

import (
	"fmt"
	"io/fs"
	"path/filepath"
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/templating"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/views"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cache"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/storage/memory/v2"
)

const (
	// INFO: This timeout is stupid. Uploads can take a long time, others might not. It's messy.
	REQUEST_TIMEOUT = 8 * time.Second
	SERVER_TIMEOUT  = 8 * time.Second

	STATIC_PREFIX = "/assets"
)

const (
	STATIC_FILEPATH = "./views/assets"
	ROUTES_FILEPATH = "./views/routes"
	LAYOUT_FILEPATH = "./views/layouts"
)

// INFO: Server is a meta-package that handles the current router, which it starts in a goroutine.
// The router must be able to restart itself, if the data validation fails, so we subscribe to a channel on the app,
// which indicates that the data has changed
// On data change:
// - we invalidate all caches if data is valid
// - we reload all clients
// - if data validity catastrophically fails, we restart the router to map error pages.
// TODO: Use fiber
type Server struct {
	Config   *providers.ConfigProvider
	running  chan bool
	shutdown *sync.WaitGroup
	cache    *memory.Storage
}

func Start(k *app.KGPZ, c *providers.ConfigProvider) *Server {
	return &Server{
		Config: c,
	}
}

// INFO: this is a hacky way to add watchers to the server, which will restart the server if the files change
// It is very rudimentary and just restarts everything
// TODO: send a reload on a websocket
func (e *Server) AddWatchers(paths []string) error {
	var dirs []string
	for _, path := range paths {
		// Get all subdirectories for paths
		filepath.WalkDir(path, func(path string, d fs.DirEntry, err error) error {
			if d.IsDir() {
				dirs = append(dirs, path)
			}
			return nil
		})
	}

	watcher, err := helpers.NewFileWatcher(dirs)
	if err != nil {
		return err
	}

	go func() {
		w := watcher.GetEvents()
		<-w
		watcher.Close()
		time.Sleep(200 * time.Millisecond)
		e.Restart()
	}()

	return nil
}

func (s *Server) Start() {
	s.cache = memory.New(memory.Config{
		GCInterval: 30 * time.Second,
	})

	engine := templating.NewEngine(&views.LayoutFS, &views.RoutesFS)

	srv := fiber.New(fiber.Config{
		AppName:            s.Config.Address,
		CaseSensitive:      false,
		StrictRouting:      true,
		EnableIPValidation: true,
		EnablePrintRoutes:  s.Config.Debug,
		// TODO: Error handler, which sadly, is global:
		ErrorHandler: fiber.DefaultErrorHandler,
		// WARNING: The app must be run in a console, since this uses environment variables:
		// Prefork:           true,
		StreamRequestBody: false,
		WriteTimeout:      REQUEST_TIMEOUT,
		ReadTimeout:       REQUEST_TIMEOUT,

		PassLocalsToViews: true,

		Views:       engine,
		ViewsLayout: templating.DEFAULT_LAYOUT_NAME,
	})

	if s.Config.Debug {
		srv.Use(logger.New())
	}

	srv.Use(recover.New())

	// TODO: Dont cache static assets, bc storage gets huge
	if s.Config.Debug {
		srv.Use(cache.New(cache.Config{
			Next: func(c *fiber.Ctx) bool {
				return c.Query("noCache") == "true"
			},
			Expiration:   30 * time.Minute,
			CacheControl: false,
			Storage:      s.cache,
		}))
	} else {
		srv.Use(cache.New(cache.Config{
			Next: func(c *fiber.Ctx) bool {
				return c.Query("noCache") == "true"
			},
			Expiration:   30 * time.Minute,
			CacheControl: true,
			Storage:      s.cache,
		}))
	}

	srv.Use(STATIC_PREFIX, static(&views.StaticFS))

	srv.Get("/", func(c *fiber.Ctx) error {
		return c.Render("/", fiber.Map{})
	})

	s.runner(srv)

	if s.Config.Debug {
		err := s.AddWatchers([]string{ROUTES_FILEPATH, LAYOUT_FILEPATH})
		if err != nil {
			fmt.Println(err)
		}
	}
}

func (s *Server) Stop() {
	if s.running == nil {
		return
	}

	s.running <- true
	s.shutdown.Wait()
}

func (s *Server) Kill() {
	if s.running == nil {
		return
	}

	s.running <- false
	s.shutdown.Wait()
}

func (s *Server) Restart() {
	s.Stop()
	s.Start()
}

func (s *Server) runner(srv *fiber.App) {
	s.running = make(chan bool)
	s.shutdown = &sync.WaitGroup{}

	s.shutdown.Add(1)

	cleanup := sync.WaitGroup{}
	cleanup.Add(1)

	go func() {
		defer s.shutdown.Done()
		if err := srv.Listen(s.Config.Address + ":" + s.Config.Port); err != nil {
			fmt.Println(err)
			fmt.Println("Error starting server")
			return
		}

		cleanup.Wait()
	}()

	go func() {
		defer cleanup.Done()
		clean := <-s.running

		srv.Server().CloseOnShutdown = true

		if clean {
			if err := srv.ShutdownWithTimeout(SERVER_TIMEOUT); err != nil {
				fmt.Println(err)
				fmt.Println("Error shutting down server")
			}
			s.cache.Close()
		} else {
			if err := srv.ShutdownWithTimeout(0); err != nil {
				fmt.Println(err)
				fmt.Println("Error closing server")
			}
		}
	}()

}
