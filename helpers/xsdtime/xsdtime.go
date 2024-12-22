package xsdtime

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// An implementation of the xsd 1.1 datatypes:
// date, gDay, gMonth, gMonthDay, gYear, gYearMonth.

type XSDDatetype int
type Seperator byte

const (
	DEFAULT_YEAR  = 0
	DEFAULT_DAY   = 1
	DEFAULT_MONTH = 1

	MIN_ALLOWED_NUMBER = 0x30 // 0
	MAX_ALLOWED_NUMBER = 0x39 // 9
	SIGN               = 0x2D // -
	SEPERATOR          = 0x2D // -
	PLUS               = 0x2B // +
	COLON              = 0x3A // :
	TIMEZONE           = 0x5A // Z
	NONE               = 0x00 // 0
)

const (
	Date XSDDatetype = iota
	GDay
	GMonth
	GYear
	GMonthDay
	GYearMonth
)

type XSDDate struct {
	Year     int
	Month    int
	Day      int
	Timezone int

	Type        XSDDatetype
	HasTimezone bool

	Time time.Time
}

// Sanity check:
// MONTH DAY + Date: Sanity check Month and Day. Additional checks:
//		- Month: 2 - Day < 30
// 		- Month: 4, 6, 9, 11 - Day < 31
// 		- Month: 1, 3, 5, 7, 8, 10, 12 - Day < 32
// YEAR + Date: Sanity check Year + February 29. Check zero padding.
// Additional checks:
//		- Feb 29 on leap years: y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)
//		-> Check last 2 digits: if both are zero, check first two digits.
//			 Else if last digit is n % 4 == 0, the second to last digit m % 2 == 0
//			 Else if last digit is n % 4 == 2, the second to last digit m % 2 == 1
//			 Else its not a leap year.
//		- no 0000 Year
//

func (d XSDDate) String() string {
	var s string
	if d.Year != 0 {
		s += fmt.Sprintf("%d", d.Year)
	}

	if d.Month != 0 {
		if d.Year == 0 {
			s += "-"
		}
		s += fmt.Sprintf("-%02d", d.Month)
	}

	if d.Day != 0 {
		if d.Year == 0 && d.Month == 0 {
			s += "--"
		}
		s += fmt.Sprintf("-%02d", d.Day)
	}

	if d.HasTimezone {
		if d.Timezone == 0 {
			s += "Z"
		} else {
			m := d.Timezone % 60
			if m < 0 {
				m *= -1
			}

			hint := d.Timezone / 60
			sep := "+"
			if hint < 0 {
				sep = "-"
				hint *= -1
			}
			h := fmt.Sprintf("%02d", hint)

			s += fmt.Sprintf("%v%v:%02d", sep, h, m)
		}
	}

	return s
}

func (d *XSDDate) UnmarshalText(text []byte) error {
	dt, err := Parse(string(text))
	if err != nil {
		return err
	}
	d.Year = dt.Year
	d.Month = dt.Month
	d.Day = dt.Day
	d.Timezone = dt.Timezone
	d.Type = dt.Type
	d.HasTimezone = dt.HasTimezone

	return nil
}

func (d XSDDate) MarshalText() ([]byte, error) {
	return []byte(d.String()), nil
}

func Parse(s string) (XSDDate, error) {
	s = strings.TrimSpace(s)

	// The smallest possible date is 4 chars long
	if len(s) < 4 {
		return XSDDate{}, fmt.Errorf("Invalid date")
	}

	y := 0
	m := 0
	d := 0

	hastz := false
	tz := 0

	if len(s) >= 5 && s[len(s)-1] == TIMEZONE {
		hastz = true
		tz = 0
		s = s[:len(s)-1]
	} else if len(s) >= 10 {
		t, err := parseTimezone(s[len(s)-6:])
		if err == nil {
			hastz = true
			tz = t
			s = s[:len(s)-6]
		}
	}

	// Year
	if s[1] != SEPERATOR {
		i := 3
		for ; i < len(s); i++ {
			if !isAllowed(s[i]) {
				break
			}
		}

		yint, err := strconv.Atoi(s[:i])
		if err != nil {
			return XSDDate{}, fmt.Errorf("Invalid year: %v", s[:i])
		} else if yint == 0 {
			return XSDDate{}, fmt.Errorf("Zero is an invalid year")
		}
		y = yint

		if i == len(s) {
			return XSDDate{Year: y, Type: GYear, Timezone: tz, HasTimezone: hastz}, nil
		} else if i >= len(s)-1 || s[i] != SEPERATOR {
			return XSDDate{}, fmt.Errorf("Invalid date ending")
		}

		s = s[i+1:]
	} else {
		s = s[2:]
	}

	// Left are 02 (Month), -02 (Day), 02-02 (Date)
	if s[0] != SEPERATOR {
		mstr := s[:2]
		mint, err := strconv.Atoi(mstr)
		if err != nil {
			return XSDDate{}, fmt.Errorf("Invalid month")
		}

		if mint < 1 || mint > 12 {
			return XSDDate{}, fmt.Errorf("Invalid month value")
		}

		m = mint
		s = s[2:]
		if len(s) == 0 {
			if y == 0 {
				return XSDDate{Month: m, Type: GMonth, HasTimezone: hastz, Timezone: tz}, nil
			} else {
				return XSDDate{Year: y, Month: m, Type: GYearMonth, HasTimezone: hastz, Timezone: tz}, nil
			}
		} else if len(s) != 3 || s[0] != SEPERATOR {
			return XSDDate{}, fmt.Errorf("Invalid date ending: %v", s)
		}
	}

	s = s[1:]

	// Left is 02 Day
	dint, err := strconv.Atoi(s)
	if err != nil {
		return XSDDate{}, fmt.Errorf("Invalid day: %v", s)
	}

	if dint < 1 || dint > 31 {
		return XSDDate{}, fmt.Errorf("Invalid day value: %v", dint)
	}

	d = dint
	if y == 0 {
		if m == 0 {
			return XSDDate{Day: d, Type: GDay, HasTimezone: hastz, Timezone: tz}, nil
		} else {
			return XSDDate{Month: m, Day: d, Type: GMonthDay, HasTimezone: hastz, Timezone: tz}, nil
		}
	} else {
		return XSDDate{Year: y, Month: m, Day: d, Type: Date, HasTimezone: hastz, Timezone: tz}, nil
	}
}

func parseTimezone(s string) (int, error) {
	// INFO: We assume the check for 'Z' has already been done
	if len(s) != 6 || s[3] != COLON || (s[0] != PLUS && s[0] != SIGN) {
		return 0, fmt.Errorf("Invalid timezone")
	}

	h, err := strconv.Atoi(s[:3])
	if err != nil {
		return 0, fmt.Errorf("Invalid hour: %v", s[:3])
	}

	m, err := strconv.Atoi(s[4:])
	if err != nil {
		return 0, fmt.Errorf("Invalid minute: %v", s[4:])
	}

	if (h < -13 || h > 13) && ((h == -14 || h == 14) && m != 0) {
		return 0, fmt.Errorf("Invalid timezone: hour: %v minute: %v", h, m)
	}

	if m < 0 || m > 59 {
		return 0, fmt.Errorf("Invalid timezone: minute: %v", m)
	}

	h *= 60
	if h < 0 {
		h -= m
	} else {
		h += m
	}

	return h, nil
}

func isAllowed(c byte) bool {
	return c >= MIN_ALLOWED_NUMBER && c <= MAX_ALLOWED_NUMBER
}
