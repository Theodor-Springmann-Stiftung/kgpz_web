package xsdtime

import "testing"

type Test struct {
	Input  string
	Output XSDDate
}

var tests = []Test{
	{"2006-01-02", XSDDate{Year: 2006, Month: 1, Day: 2, Type: Date}},
	{"-1222-01-02", XSDDate{Year: -1222, Month: 1, Day: 2, Type: Date}},
	{"-2777", XSDDate{Year: -2777, Type: GYear}},
	{"1988-12:30", XSDDate{Year: 1988, Type: GYear, HasTimezone: true, Timezone: (60*12 + 30) * -1}},
	{"--03+05:00", XSDDate{Month: 3, Type: GMonth, HasTimezone: true, Timezone: 300}},
	{"---29", XSDDate{Day: 29, Type: GDay}},
	{"-1234567-12Z", XSDDate{Year: -1234567, Month: 12, Type: GYearMonth, HasTimezone: true, Timezone: 0}},
	{"-1234567-12+05:00", XSDDate{Year: -1234567, Month: 12, Type: GYearMonth, HasTimezone: true, Timezone: 300}},
	{"--12-31", XSDDate{Month: 12, Day: 31, Type: GMonthDay}},
}

func TestParse(t *testing.T) {
	for _, test := range tests {
		dt, err := Parse(test.Input)
		if err != nil {
			t.Errorf("Error parsing %v: %v", test.Input, err)
			continue
		}
		if dt.Type != test.Output.Type {
			t.Errorf("Type mismatch for %v: expected %v, got %v", test.Input, test.Output.Type, dt.Type)
		}
		if dt.Year != test.Output.Year {
			t.Errorf("Year mismatch for %v: expected %v, got %v", test.Input, test.Output.Year, dt.Year)
		}
		if dt.Month != test.Output.Month {
			t.Errorf("Month mismatch for %v: expected %v, got %v", test.Input, test.Output.Month, dt.Month)
		}
		if dt.Day != test.Output.Day {
			t.Errorf("Day mismatch for %v: expected %v, got %v", test.Input, test.Output.Day, dt.Day)
		}
		if dt.HasTimezone != test.Output.HasTimezone {
			t.Errorf("Timezone mismatch for %v: expected %v, got %v", test.Input, test.Output.HasTimezone, dt.HasTimezone)
		}
		if dt.Timezone != test.Output.Timezone {
			t.Errorf("Timezone mismatch for %v: expected %v, got %v", test.Input, test.Output.Timezone, dt.Timezone)
		}
	}
}

func TestString(t *testing.T) {
	for _, test := range tests {
		dt, err := Parse(test.Input)
		if err != nil {
			t.Errorf("Error parsing %v: %v", test.Input, err)
			continue
		}
		if dt.String() != test.Input {
			t.Errorf("String mismatch for %v: expected %v, got %v", test.Input, test.Input, dt.String())
		}
	}
}
