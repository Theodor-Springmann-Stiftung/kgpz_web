package server

import (
	"fmt"
	"io"
	"net/http"
	"sync"

	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/app"
)

type ServerState int

const (
	Created ServerState = iota
	Running
	Restarting
	ShuttingDown
	ShutDown
	ShuttedDown
	Kill
	Killing
	Killed
)

// INFO: Server is a meta-package that handles the current router, which it starts in a goroutine.
// The router must be able to restart itself, if the data validation fails, so we subscribe to a channel on the app,
// which indicates that the data has changed
// On data change:
// - we invalidate all caches if data is valid
// - we reload all clients
// - if data validity catastrophically fails, we restart the router to map error pages.
type Server struct {
	running  *sync.WaitGroup
	shutdown *sync.WaitGroup
}

func Start(k *app.KGPZ) *Server {
	return &Server{}
}

func (s *Server) Start() {
	srv := &http.Server{Addr: ":8081"}
	s.runner(srv)
}

func (s *Server) Stop() {
	if s.running == nil {
		return
	}

	s.running.Done()
	s.shutdown.Wait()
}

func (s *Server) Restart() {
	if s.running != nil {
		s.running.Done()
		s.shutdown.Wait()
	}
	s.Start()
}

func (s *Server) runner(srv *http.Server) {
	s.running = &sync.WaitGroup{}
	s.shutdown = &sync.WaitGroup{}

	s.running.Add(1)
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
			fmt.Println("Error starting server")
			return
		}

		cleanup.Wait()
	}()

	go func() {
		defer cleanup.Done()
		s.running.Wait()

		if err := srv.Shutdown(nil); err != nil {
			fmt.Println("Error shutting down server")
		}
	}()

}
