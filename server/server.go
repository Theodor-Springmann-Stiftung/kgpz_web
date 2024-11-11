package server

import (
	"fmt"
	"io"
	"net/http"

	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/app"
)

// INFO: Server is a meta-package that handles the current router, which it starts in a goroutine.
// The router must be able to restart itself, if the data validation fails, so we subscribe to a channel on the app,
// which indicates that the data has changed
// On data change:
// - we invalidate all caches if data is valid
// - we reload all clients
// - if data validity catastrophically fails, we restart the router to map error pages.
type Server struct {
	running chan bool
	alive   chan bool
	Killed  chan bool
}

func Start(k *app.KGPZ) *Server {
	return &Server{}
}

func (s *Server) Start() {
	srv := &http.Server{Addr: ":8080"}
	s.running = make(chan bool, 1)
	s.alive = make(chan bool, 1)
	s.Killed = s.killHandler(srv, s.alive)
	shuttingdown := s.shutdownHandler(srv, s.running)
	shutdown := s.runnerHandler(srv, shuttingdown)
	s.restartHandler(shutdown)
}

func (s *Server) Restart() {
	s.running <- false
}

func (s *Server) Kill() {
	s.alive <- false
}

func (s *Server) killHandler(srv *http.Server, alive chan bool) chan bool {
	kill := make(chan bool, 1)

	go func() {
		<-alive

		if err := srv.Shutdown(nil); err != nil {
			fmt.Println("Error shutting down server")
		}

		kill <- true
	}()

	return kill
}

func (s *Server) restartHandler(shutdown chan bool) {
	go func() {
		<-shutdown
		s.Start()
	}()
}

func (s *Server) runnerHandler(srv *http.Server, shuttingdown chan bool) chan bool {
	shutdown := make(chan bool, 1)

	go func() {
		// EXAMPLE:
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			io.WriteString(w, "hello world\n")
		})

		if err := srv.ListenAndServe(); err != http.ErrServerClosed {
			fmt.Println("Error starting server")
		}

		<-shuttingdown
		shutdown <- true
	}()

	return shutdown
}

func (s *Server) shutdownHandler(srv *http.Server, running chan bool) chan bool {
	shuttingdown := make(chan bool, 1)

	go func() {
		<-running

		if err := srv.Shutdown(nil); err != nil {
			fmt.Println("Error shutting down server")
		}

		shuttingdown <- true
	}()

	return shuttingdown
}

func (s *Server) Shutdown() {
}
