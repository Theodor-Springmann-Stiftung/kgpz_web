package geonames

import (
	"fmt"
)

type Place struct {
	KGPZID       string       `json:"kgpzid"`
	KGPZURL      string       `json:"kgpzurl"`
	GeonameId    int          `json:"geonameId,omitempty"`
	Name         string       `json:"name,omitempty"`
	AsciiName    string       `json:"asciiName,omitempty"`
	ToponymName  string       `json:"toponymName,omitempty"`
	Lat          string       `json:"lat,omitempty"`
	Lng          string       `json:"lng,omitempty"`
	CountryName  string       `json:"countryName,omitempty"`
	CountryCode  string       `json:"countryCode,omitempty"`
	CountryId    string       `json:"countryId,omitempty"`
	Population   int          `json:"population,omitempty"`
	WikipediaURL string       `json:"wikipediaURL,omitempty"`
	Timezone     Timezone     `json:"timezone,omitempty"`
	Bbox         BoundingBox  `json:"bbox,omitempty"`
	Fcode        string       `json:"fcode,omitempty"`
	FcodeName    string       `json:"fcodeName,omitempty"`
	Fcl          string       `json:"fcl,omitempty"`
	FclName      string       `json:"fclName,omitempty"`
	ContinentCode string      `json:"continentCode,omitempty"`
	AdminName1   string       `json:"adminName1,omitempty"`
	AdminName2   string       `json:"adminName2,omitempty"`
	AdminName3   string       `json:"adminName3,omitempty"`
	AdminName4   string       `json:"adminName4,omitempty"`
	AdminName5   string       `json:"adminName5,omitempty"`
	AdminCode1   string       `json:"adminCode1,omitempty"`
	AdminCode2   string       `json:"adminCode2,omitempty"`
	AdminCode3   string       `json:"adminCode3,omitempty"`
	AdminCode4   string       `json:"adminCode4,omitempty"`
	AdminId1     string       `json:"adminId1,omitempty"`
	AdminId2     string       `json:"adminId2,omitempty"`
	AdminId3     string       `json:"adminId3,omitempty"`
	AdminId4     string       `json:"adminId4,omitempty"`
	AdminCodes1  AdminCodes1  `json:"adminCodes1,omitempty"`
	AlternateNames []AlternateName `json:"alternateNames,omitempty"`
	Astergdem    int          `json:"astergdem,omitempty"`
	Srtm3        int          `json:"srtm3,omitempty"`
}

type Timezone struct {
	TimeZoneId string  `json:"timeZoneId,omitempty"`
	GmtOffset  float64 `json:"gmtOffset,omitempty"`
	DstOffset  float64 `json:"dstOffset,omitempty"`
}

type BoundingBox struct {
	East         float64 `json:"east,omitempty"`
	West         float64 `json:"west,omitempty"`
	North        float64 `json:"north,omitempty"`
	South        float64 `json:"south,omitempty"`
	AccuracyLevel int    `json:"accuracyLevel,omitempty"`
}

type AdminCodes1 struct {
	ISO3166_2 string `json:"ISO3166_2,omitempty"`
}

type AlternateName struct {
	Name           string `json:"name,omitempty"`
	Lang           string `json:"lang,omitempty"`
	IsPreferredName bool  `json:"isPreferredName,omitempty"`
	IsShortName    bool   `json:"isShortName,omitempty"`
}

func (p Place) String() string {
	return fmt.Sprintf("Place{KGPZID: %v, Name: %v, GeonameId: %v, CountryName: %v, Lat: %v, Lng: %v, Population: %v, WikipediaURL: %v}",
		p.KGPZID, p.Name, p.GeonameId, p.CountryName, p.Lat, p.Lng, p.Population, p.WikipediaURL)
}

func (p Place) PlaceName() string {
	if p.Name != "" {
		return p.Name
	}
	if p.AsciiName != "" {
		return p.AsciiName
	}
	return p.ToponymName
}