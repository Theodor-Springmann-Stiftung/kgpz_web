package functions

type Month struct {
	Full   string
	Short  string
	Number string
	No     int
}

type Weekday struct {
	Full  string
	Short string
	No    int
}

var TRANSLM = []Month{
	{"NotAvailable", "NA", "0", 0},
	{"Januar", "Jan", "1", 1},
	{"Februar", "Feb", "2", 2},
	{"März", "Mär", "3", 3},
	{"April", "Apr", "4", 4},
	{"Mai", "Mai", "5", 5},
	{"Juni", "Jun", "6", 6},
	{"Juli", "Jul", "7", 7},
	{"August", "Aug", "8", 8},
	{"September", "Sep", "9", 9},
	{"Oktober", "Okt", "10", 10},
	{"November", "Nov", "11", 11},
	{"Dezember", "Dez", "12", 12},
}

var TRANSLD = []Weekday{
	{"NotAvailable", "NA", 0},
	{"Montag", "Mo", 1},
	{"Dienstag", "Di", 2},
	{"Mittwoch", "Mi", 3},
	{"Donnerstag", "Do", 4},
	{"Freitag", "Fr", 5},
	{"Samstag", "Sa", 6},
	{"Sonntag", "So", 7},
}

func MonthName(i int) Month {
	if i > 12 || i < 1 {
		return TRANSLM[0]
	}
	return TRANSLM[i]
}

func WeekdayName(i int) Weekday {
	if i > 7 || i < 1 {
		return TRANSLD[0]
	}
	return TRANSLD[i]
}
