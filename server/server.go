package server

import (
	"strings"
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/templating"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cache"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/storage/memory/v2"
)

const (
	// INFO: This timeout is stupid. Uploads can take a long time, other routes might not. It's messy.
	REQUEST_TIMEOUT = 16 * time.Second
	SERVER_TIMEOUT  = 16 * time.Second

	// INFO: Maybe this is too long/short?
	CACHE_TIME        = 24 * time.Hour
	CACHE_GC_INTERVAL = 120 * time.Second
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

	// Maybe that is to much, it should just be a list of method, path, handler structs
	// in the order in which they are ought to be mapped.
	muxproviders    []MuxProvider
	premuxproviders []PreMuxProvider
}

func Create(c *providers.ConfigProvider, e *templating.Engine) *Server {
	if c == nil {
		logging.Error(nil, "Error creating server: Config or App is posssibly nil.")
		return nil
	}

	return &Server{
		Config: c,
		engine: e,
	}
}

func (s *Server) Engine(e *templating.Engine) {
	s.Stop()
	s.mu.Lock()
	s.engine = e
	s.mu.Unlock()
	s.Start()
}

func (s *Server) AddMux(m MuxProvider) {
	s.muxproviders = append(s.muxproviders, m)
}

func (s *Server) ClearMux() {
	s.muxproviders = []MuxProvider{}
}

func (s *Server) AddPre(m PreMuxProvider) {
	s.premuxproviders = append(s.premuxproviders, m)
}

func (s *Server) ClearPre() {
	s.premuxproviders = []PreMuxProvider{}
}

// TODO: There is no error handler
func (s *Server) Start() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cache == nil {
		s.cache = memory.New(memory.Config{
			GCInterval: CACHE_GC_INTERVAL,
		})
	}

	srv := fiber.New(fiber.Config{
		AppName:       s.Config.Address,
		CaseSensitive: false,

		// INFO: This is a bit of an issue, since this treats /foo and /foo/ as different routes:
		// Maybe we turn that behavior permanently off and differentiate HTMX from "normal" reuqests only by headers.
		StrictRouting: true,

		// EnablePrintRoutes: s.Config.Debug,

		// TODO: Error handler, which sadly, is global:
		ErrorHandler: fiber.DefaultErrorHandler,

		// WARNING: The app must be run in a console, since this uses environment variables:
		// It is not trivial to turn this on, since we need to mark goroutines that must be started only once.
		// Prefork:           true,
		StreamRequestBody: false,
		WriteTimeout:      REQUEST_TIMEOUT,
		ReadTimeout:       REQUEST_TIMEOUT,

		PassLocalsToViews: true,

		Views:       s.engine,
		ViewsLayout: templating.DEFAULT_LAYOUT_NAME,
	})

	for _, m := range s.premuxproviders {
		err := m.Pre(srv)
		if err != nil {
			logging.Error(err, "Error mapping premuxprovider")
			return
		}
	}

	if s.Config.Debug {
		srv.Use(logger.New())
	}

	srv.Use(recover.New())

	// Add compression middleware for HTML responses (non-static routes)
	srv.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed, // Fast compression for HTML responses
		Next: func(c *fiber.Ctx) bool {
			// Only compress for routes that don't start with static prefixes
			path := c.Path()
			return strings.HasPrefix(path, "/assets") ||
				strings.HasPrefix(path, "/static/pictures/") ||
				strings.HasPrefix(path, "/img/")
		},
	}))

	// INFO: No caching middleware in debug mode to avoid cache issues during development
	// We cant do it with cach busting the files via ?v=XXX, since we also cache the templates.
	// TODO: Dont cache static assets, bc storage gets huge on images.
	// -> Maybe fiber does this already, automatically?
	if !s.Config.Debug {
		srv.Use(cache.New(cache.Config{
			Next:         CacheFunc,
			Expiration:   CACHE_TIME,
			CacheControl: true,
			Storage:      s.cache,
		}))
	}

	for _, m := range s.muxproviders {
		err := m.Routes(srv)
		if err != nil {
			logging.Error(err, "Error mapping muxprovider")
			return
		}
	}

	s.runner(srv)
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
			s.cache.Reset()
		}

		if !clean {
			if err := srv.ShutdownWithTimeout(0); err != nil {
				logging.Error(err, "Error closing server by force.")
			}
		}
	}()
}
