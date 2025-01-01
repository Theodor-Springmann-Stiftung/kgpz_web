package server

import (
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/controllers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/templating"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/views"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cache"
	"github.com/gofiber/fiber/v2/middleware/etag"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/storage/memory/v2"
)

const (
	// INFO: This timeout is stupid. Uploads can take a long time, other routes might not. It's messy.
	REQUEST_TIMEOUT = 16 * time.Second
	SERVER_TIMEOUT  = 16 * time.Second

	// INFO: Maybe this is too long/short?
	CACHE_TIME = 24 * time.Hour
)

const (
	ASSETS_URL_PREFIX = "/assets"

	EDITION_URL  = "/edition/"
	PRIVACY_URL  = "/datenschutz/"
	CONTACT_URL  = "/kontakt/"
	CITATION_URL = "/zitation/"

	INDEX_URL = "/1764"

	YEAR_OVERVIEW_URL     = "/:year"
	PLACE_OVERVIEW_URL    = "/ort/:place"
	AGENTS_OVERVIEW_URL   = "/akteure/:letterorid"
	CATEGORY_OVERVIEW_URL = "/kategorie/:category"

	ISSSUE_URL    = "/:year/:issue/:page?"
	ADDITIONS_URL = "/:year/:issue/beilage/:page?"
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

func (s *Server) Engine(e *templating.Engine) {
	s.Stop()
	s.mu.Lock()
	s.engine = e
	s.mu.Unlock()
	s.Start()
}

// TODO: There is no error handler
func (s *Server) Start() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.cache == nil {
		s.cache = memory.New(memory.Config{
			GCInterval: 30 * time.Second,
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

	srv.Use(ASSETS_URL_PREFIX, etag.New())
	srv.Use(ASSETS_URL_PREFIX, static(&views.StaticFS))

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

	// TODO: this is probably a bad idea, since it basically applies to every /XXXX URL
	// And probably creates problems with static files, and in case we add a front page later.
	// That's why we redirect to /1764 on "/ " and don´t use an optional /:year?
	srv.Get("/", func(c *fiber.Ctx) error {
		c.Redirect(INDEX_URL)
		return nil
	})

	srv.Get(PLACE_OVERVIEW_URL, controllers.GetPlace(s.kgpz))
	srv.Get(CATEGORY_OVERVIEW_URL, controllers.GetCategory(s.kgpz))
	srv.Get(AGENTS_OVERVIEW_URL, controllers.GetAgents(s.kgpz))

	// TODO: Same here, this prob applies to all paths with two or three segments, which is bad.
	// Prob better to do /ausgabe/:year/:issue/:page? here and /jahrgang/:year? above.
	srv.Get(YEAR_OVERVIEW_URL, controllers.GetYear(s.kgpz))
	srv.Get(ISSSUE_URL, controllers.GetIssue(s.kgpz))
	srv.Get(ADDITIONS_URL, controllers.GetIssue(s.kgpz))

	srv.Get(EDITION_URL, controllers.Get(EDITION_URL))
	srv.Get(PRIVACY_URL, controllers.Get(PRIVACY_URL))
	srv.Get(CONTACT_URL, controllers.Get(CONTACT_URL))
	srv.Get(CITATION_URL, controllers.Get(CITATION_URL))

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
