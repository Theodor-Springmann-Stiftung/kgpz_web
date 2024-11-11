package server

import "net/http"

type Mux struct {
	sm http.ServeMux
}

func NewMux() *Mux {
	return &Mux{
		sm: http.ServeMux{},
	}
}

func (m *Mux) Router() *http.ServeMux {
	return &m.sm
}
