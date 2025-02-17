package xmlprovider

import (
	"strconv"
	"strings"
)

func Sort[T IXMLItem](i, j T) int {

	keys_a := i.Keys()
	keys_b := j.Keys()

	if len(keys_a) == 0 && len(keys_b) == 0 {
		return 0
	}

	if len(keys_a) == 0 && len(keys_b) > 0 {
		return -1
	}

	if len(keys_a) > 0 && len(keys_b) == 0 {
		return 1
	}

	sort_a := strings.Split(keys_a[0], "-")
	sort_b := strings.Split(keys_b[0], "-")

	for i, item := range sort_a {
		if i >= len(sort_b) {
			return 1
		}

		// INFO: this is a bit lazy since
		// - we are comparing bit values not unicode code points
		// - the comparison is case sensitive
		int_a, err := strconv.Atoi(item)
		if err != nil {
			if item < sort_b[i] {
				return -1
			}

			if item > sort_b[i] {
				return 1
			}

			continue
		}

		int_b, err := strconv.Atoi(sort_b[i])
		if err != nil {

			if item < sort_b[i] {
				return -1
			}

			if item > sort_b[i] {
				return 1
			}

			continue
		}

		if int_a < int_b {
			return -1
		}

		if int_a > int_b {
			return 1
		}
	}

	if len(sort_b) > len(sort_a) {
		return -1
	}

	return 0
}
