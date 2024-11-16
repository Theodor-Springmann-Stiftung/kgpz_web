package controllers

import (
	"net/http"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/templating"
)

// ControllerFunc is a function that get injected all dependencies and returns a http.HandlerFunc
// A controller is resposible for executing all the neccessary middlewares and rendering the HTML
type ControllerFunc func(kgpz *app.KGPZ, layouts *templating.LayoutRegistry, templates *templating.TemplateRegistry) http.HandlerFunc
