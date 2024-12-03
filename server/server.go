package server

import (
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/controllers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
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

	CACHE_TIME = 24 * time.Hour

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
type Server struct {
	Config   *providers.ConfigProvider
	running  chan bool
	shutdown *sync.WaitGroup
	cache    *memory.Storage
	engine   *templating.Engine
	mu       sync.Mutex
	watcher  *helpers.FileWatcher

	kgpz *app.KGPZ
}

func Create(k *app.KGPZ, c *providers.ConfigProvider, e *templating.Engine) *Server {
	if c == nil || k == nil {
		logging.Error(nil, "Error creating server: Config or App is posssibly nil.")
		return nil
	}

	return &Server{
		Config: c,
		kgpz:   k,
		engine: e,
	}
}

// INFO: hot reloading for poor people
// BUG: unable to close the old file watcher here, since the process gets aborted in the middle of creating the new one.
func (s *Server) Watcher() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	watcher, err := helpers.NewFileWatcher()
	if err != nil {
		return err
	}

	s.watcher = watcher
	s.watcher.Append(func(path string) {
		logging.Info("File changed: ", path)
		time.Sleep(200 * time.Millisecond)
		s.Restart()
	})

	err = s.watcher.RecursiveDir(ROUTES_FILEPATH)
	if err != nil {
		return err
	}

	err = s.watcher.RecursiveDir(LAYOUT_FILEPATH)
	if err != nil {
		return err
	}

	return nil
}

func (s *Server) Start() {
	s.engine.Reload()

	if s.cache != nil {
		s.cache.Close()
	}

	s.cache = memory.New(memory.Config{
		GCInterval: 30 * time.Second,
	})

	srv := fiber.New(fiber.Config{
		AppName:       s.Config.Address,
		CaseSensitive: false,

		// INFO: This is a bit of an issue, since this treats /foo and /foo/ as different routes:
		// Maybe we turn that behavior permanently off and differentiate HTMX from "normal" reuqests only by headers.
		StrictRouting: true,

		EnablePrintRoutes: s.Config.Debug,

		// TODO: Error handler, which sadly, is global:
		ErrorHandler: fiber.DefaultErrorHandler,

		// WARNING: The app must be run in a console, since this uses environment variables:
		// It is not trivial to turn this on, since we need to mark goroutines that can be started only once.
		// Prefork:           true,
		StreamRequestBody: false,
		WriteTimeout:      REQUEST_TIMEOUT,
		ReadTimeout:       REQUEST_TIMEOUT,

		PassLocalsToViews: true,

		Views:       s.engine,
		ViewsLayout: templating.DEFAULT_LAYOUT_NAME,
	})

	if s.Config.Debug {
		srv.Use(logger.New())
	}

	srv.Use(recover.New())

	srv.Use("assets", static(&views.StaticFS))

	// TODO: Dont cache static assets, bc storage gets huge
	// INFO: Maybe fiber does this already?
	if s.Config.Debug {
		srv.Use(cache.New(cache.Config{
			Next:         CacheFunc,
			Expiration:   CACHE_TIME,
			CacheControl: false,
			Storage:      s.cache,
		}))
	} else {
		srv.Use(cache.New(cache.Config{
			Next:         CacheFunc,
			Expiration:   CACHE_TIME,
			CacheControl: true,
			Storage:      s.cache,
		}))
	}

	srv.Get("/:year?", controllers.GetYear(s.kgpz))
	srv.Get("/:year/:issue/:page?", controllers.GetIssue(s.kgpz))
	srv.Get("/:year/:issue/beilage/:page?", controllers.GetIssue(s.kgpz))

	s.runner(srv)

	if s.Config.Debug {
		err := s.Watcher()
		logging.Error(err, "Error setting up file watcher")
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

		logging.Info("Starting server on ", s.Config.Address+":"+s.Config.Port)
		if err := srv.Listen(s.Config.Address + ":" + s.Config.Port); err != nil {
			logging.Error(err, "Error starting server")
			return
		}

		cleanup.Wait()
	}()

	go func() {
		defer cleanup.Done()
		clean := <-s.running

		logging.Info("Server shutdown requested")

		if clean {
			if err := srv.ShutdownWithTimeout(SERVER_TIMEOUT); err != nil {
				logging.Error(err, "Error closing server cleanly. Shutting server down by force.")
				clean = false
			}
			s.cache.Close()
		}

		if !clean {
			if err := srv.ShutdownWithTimeout(0); err != nil {
				logging.Error(err, "Error closing server by force.")
			}
		}
	}()

}
