package helpers

import (
	"fmt"
	"os"
)

func MaybePanic(err error, msg string) {
	if err == nil {
		return
	}

	fmt.Println(msg)
	fmt.Println("Error: ", err)
	os.Exit(1)
}
