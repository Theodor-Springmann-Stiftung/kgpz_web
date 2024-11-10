package helpers

import "fmt"

func LogOnDebug[T fmt.Stringer](object *T, msg string) {
	if msg != "" {
		fmt.Println(msg)
	}

	if object != nil {
		fmt.Println(*object)
	}
}

func LogOnErr[T fmt.Stringer](object *T, err error, msg string) {
	if err != nil {
		if msg != "" {
			fmt.Println(msg)
		}

		if object != nil {
			fmt.Println(*object)
		}
		fmt.Println("Error: ", err)
	}
}
