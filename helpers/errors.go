package helpers

import (
	"os"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
)

func Assert(err error, msg ...string) {
	if err == nil {
		return
	}

	logging.Error(err, msg...)
	os.Exit(1)
}

func AssertNonNil(obj interface{}, msg ...string) {
	if obj != nil {
		return
	}

	logging.Error(nil, msg...)
	os.Exit(1)
}

func AssertNil(obj interface{}, msg ...string) {
	if obj == nil {
		return
	}

	logging.Error(nil, msg...)
	os.Exit(1)
}

func AssertStr(str string, msg ...string) {
	if str != "" {
		return
	}

	logging.Error(nil, msg...)
	os.Exit(1)
}
