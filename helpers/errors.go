package helpers

import (
	"fmt"
	"os"
)

func Panic(err error, msg string) {
	fmt.Println(msg)
	if err != nil {
		fmt.Println("Error: ", err)
	}
	os.Exit(1)
}

func MaybePanic(err error, msg string) {
	if err == nil {
		return
	}

	fmt.Println(msg)
	fmt.Println("Error: ", err)
	os.Exit(1)
}
