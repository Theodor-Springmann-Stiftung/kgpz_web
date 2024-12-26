package functions

func FirstLetter(s string) string {
	if len(s) == 0 {
		return ""
	}
	return string(s[:1])
}
