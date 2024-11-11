package server

import (
	"fmt"
	"io"
	"net/http"

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
}

func Start(k *app.KGPZ) *Server {
	return &Server{}
}

func (s *Server) Start() {
	srv := &http.Server{Addr: ":8081"}
	s.killHandler(srv)
	s.shutdownHandler(srv)
	s.runnerHandler(srv)
	s.restartHandler()
}

func (s *Server) runnerHandler(srv *http.Server) {

	shutttingdown := s.Events.Subscribe(1)
	go func() {
		s.Events.Publish(Running)
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

	loop:
		for {
			msg := <-shutttingdown
			if msg == ShuttingDown {
				s.Events.Publish(ShuttedDown)
				break loop
			}
			if msg == Killing {
				s.Events.Publish(Killed)
				break loop
			}
		}
	}()

	go func() {
		s.BreakUntil(shutdown, ShutDown)
		fmt.Println("Shutting down server")
		if err := srv.Shutdown(nil); err != nil {
			fmt.Println("Error shutting down server")
		}

		s.Events.Publish(ShuttingDown)
	}()

}
