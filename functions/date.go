package functions

import (
	"time"
)

const TLAYOUT = "2006-01-02"

var TRANSLM = [][]string{
	{"Januar", "Jan", "1"},
	{"Februar", "Feb", "2"},
	{"März", "Mär", "3"},
	{"April", "Apr", "4"},
	{"Mai", "Mai", "5"},
	{"Juni", "Jun", "6"},
	{"Juli", "Jul", "7"},
	{"August", "Aug", "8"},
	{"September", "Sep", "9"},
	{"Oktober", "Okt", "10"},
	{"November", "Nov", "11"},
	{"Dezember", "Dez", "12"},
}

var TRANSLD = [][]string{
	{"Montag", "Mo"},
	{"Dienstag", "Di"},
	{"Mittwoch", "Mi"},
	{"Donnerstag", "Do"},
	{"Freitag", "Fr"},
	{"Samstag", "Sa"},
	{"Sonntag", "So"},
}

type Date struct {
	Month   string
	Mon     string
	MonthNo string
	DayNo   int
	Weekday string
	Wd      string
}

func GetDate(d string) Date {
	t, err := time.Parse(TLAYOUT, d)
	if err != nil {
		return Date{}
	}
	m := int(t.Month()) - 1
	wd := int(t.Weekday()) - 1
	return Date{
		Month:   TRANSLM[m][0],
		Mon:     TRANSLM[m][1],
		MonthNo: TRANSLM[m][2],
		DayNo:   t.Day(),
		Weekday: TRANSLD[wd][0],
		Wd:      TRANSLD[wd][1],
	}
}

func MonthName(m int) string {
	return TRANSLM[m-1][0]
}

func MonthNameShort(m int) string {
	return TRANSLM[m-1][1]
}
