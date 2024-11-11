package server

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
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
}

func Start(k *app.KGPZ, c *providers.ConfigProvider) *Server {
	return &Server{
		Config: c,
	}
}

func (s *Server) Start() {
	srv := &http.Server{Addr: s.Config.Address + ":" + s.Config.Port}
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

func (s *Server) runner(srv *http.Server) {
	s.running = make(chan bool)
	s.shutdown = &sync.WaitGroup{}

	s.shutdown.Add(1)

	cleanup := sync.WaitGroup{}
	cleanup.Add(1)

	go func() {
		defer s.shutdown.Done()
		// EXAMPLE:
		mux := http.NewServeMux()
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			io.WriteString(w, "hello world\n")
		})

		srv.Handler = mux

		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			fmt.Println(err)
			fmt.Println("Error starting server")
			return
		}

		cleanup.Wait()
	}()

	go func() {
		defer cleanup.Done()
		clean := <-s.running

		if clean {
			ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(8*time.Second))
			defer cancel()
			if err := srv.Shutdown(ctx); err != nil {
				fmt.Println(err)
				fmt.Println("Error shutting down server")
			}
		} else {
			if err := srv.Close(); err != nil {
				fmt.Println(err)
				fmt.Println("Error closing server")
			}
		}
	}()

}
