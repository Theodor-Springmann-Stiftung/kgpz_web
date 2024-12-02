package logging

// BUG: loggings happens without manual flush, so the messagees come from all threads at the same time.

import (
	"fmt"
	"log/slog"
)

func ObjDebug[T fmt.Stringer](object *T, msg string) {
	if msg != "" {
		slog.Debug(msg)
	}

	if object != nil {
		obj := *object
		slog.Debug(obj.String())
	}
}

func ObjErr[T fmt.Stringer](object *T, err error, msg ...string) {
	if err == nil {
		return
	}

	if len(msg) > 0 {
		for _, m := range msg {
			slog.Error(m)
		}
	}

	if object != nil {
		obj := *object
		slog.Debug(obj.String())
	}

	slog.Error(err.Error())
}

func Error(err error, msg ...string) {
	if err == nil {
		return
	}

	if len(msg) > 0 {
		for _, m := range msg {
			slog.Error(m)
		}
	}

	slog.Error(err.Error())
}

func Info(msg ...string) {
	if len(msg) > 0 {
		for _, m := range msg {
			slog.Info(m)
		}
	}
}

func Debug(msg ...string) {
	if len(msg) > 0 {
		for _, m := range msg {
			slog.Debug(m)
		}
	}
}

func SetDebug() {
	slog.SetLogLoggerLevel(slog.LevelDebug)
}

func SetInfo() {
	slog.SetLogLoggerLevel(slog.LevelInfo)
}
