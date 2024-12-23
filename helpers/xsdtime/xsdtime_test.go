package xsdtime

import "testing"

type Test struct {
	Input  string
	Output XSDDate
	Type   XSDDatetype
}

var tests = []Test{
	{"2006-01-02", XSDDate{Year: 2006, Month: 1, Day: 2}, GYear},
	{"-1222-01-02", XSDDate{Year: -1222, Month: 1, Day: 2}, Date},
	{"-2777", XSDDate{Year: -2777}, GYear},
	{"1988-12:30", XSDDate{Year: 1988, hasTimezone: true, TZH: -12, TZM: 30}, GYear},
	{"--03+05:00", XSDDate{Month: 3, hasTimezone: true, TZH: 5, TZM: 0}, GMonth},
	{"---29", XSDDate{Day: 29}, GDay},
	{"-1234567-12Z", XSDDate{Year: -1234567, Month: 12, hasTimezone: true, TZH: 0, TZM: 0}, GYearMonth},
	{"-1234567-12+05:00", XSDDate{Year: -1234567, Month: 12, hasTimezone: true, TZH: 5, TZM: 0}, GYearMonth},
	{"--12-31", XSDDate{Month: 12, Day: 31}, GMonthDay},
}

func TestParse(t *testing.T) {
	for _, test := range tests {
		dt, err := New(test.Input)
		if err != nil {
			t.Errorf("Error parsing %v: %v", test.Input, err)
			continue
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

		if dt.hasTimezone != test.Output.hasTimezone {
			t.Errorf("Timezone mismatch for %v: expected %v, got %v", test.Input, test.Output.hasTimezone, dt.hasTimezone)
		}

		if dt.TZH != test.Output.TZH {
			t.Errorf("Timezone mismatch for %v: expected %v, got %v", test.Input, test.Output.TZH, dt.TZH)
		}

		if dt.TZM != test.Output.TZM {
			t.Errorf("Timezone mismatch for %v: expected %v, got %v", test.Input, test.Output.TZM, dt.TZM)
		}
	}
}

func TestString(t *testing.T) {
	for _, test := range tests {
		dt, err := New(test.Input)
		if err != nil {
			t.Errorf("Error parsing %v: %v", test.Input, err)
			continue
		}

		if dt.String() != test.Input {
			t.Errorf("String mismatch for %v: expected %v, got %v", test.Input, test.Input, dt.String())
		}
	}
}
