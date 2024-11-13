package server

import (
	"fmt"
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

const (
	REQUEST_TIMEOUT = 8 * time.Second
	SERVER_TIMEOUT  = 8 * time.Second
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
}

func Start(k *app.KGPZ, c *providers.ConfigProvider) *Server {
	return &Server{
		Config: c,
	}
}

func (s *Server) Start() {
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
	})

	if s.Config.Debug {
		srv.Use(logger.New())
	}

	srv.Use(recover.New())

	srv.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("I'm a GET request!")
	})

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
		} else {
			if err := srv.ShutdownWithTimeout(0); err != nil {
				fmt.Println(err)
				fmt.Println("Error closing server")
			}
		}
	}()

}
