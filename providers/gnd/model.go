package gnd

import (
	"fmt"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type Person struct {
	KGPZID                              string             `json:"kgpzid"`
	Agent                               xmlprovider.Agent  `json:"agent"`
	URL                                 string             `json:"id"`
	DateOfBirth                         []string           `json:"dateOfBirth"`
	PlaceOfBirth                        []Entity           `json:"placeOfBirth"`
	DateOfDeath                         []string           `json:"dateOfDeath"`
	PlaceOfDeath                        []Entity           `json:"placeOfDeath"`
	PlaceOfBirthAsLiteral               []string           `json:"placeOfBirthAsLiteral"`
	PlaceOfDeathAsLiteral               []string           `json:"placeOfDeathAsLiteral"`
	BiographicalOrHistoricalInformation []string           `json:"biographicalOrHistoricalInformation"`
	PreferredName                       string             `json:"preferredName"`
	GndIdentifier                       string             `json:"gndIdentifier"`
	Wikipedia                           []Entity           `json:"wikipedia"`
	Depiction                           []Picture          `json:"depiction"`
	ProfessionOrOccupation              []Entity           `json:"professionOrOccupation"`
	PreferredNameEntityForThePerson     PersonNameEntity   `json:"preferredNameEntityForThePerson"`
	VariantNameEntityForThePerson       []PersonNameEntity `json:"variantNameEntityForThePerson"`
	VariantName                         []string           `json:"variantName"`
	SameAs                              []CrossReferences  `json:"sameAs"`
	Pseudonym                           []Entity           `json:"pseudonym"`
	GNDSubjectCategory                  []Entity           `json:"gndSubjectCategory"`
	Type                                []string           `json:"type"`
	PlaceOfActivity                     []Entity           `json:"placeOfActivity"`
}

type CrossReferences struct {
	Items Collection `json:"collection"`
	ID    string     `json:"id"`
}

type Collection struct {
	Abbr      string `json:"abbr"`
	Name      string `json:"name"`
	Publisher string `json:"publisher"`
	Icon      string `json:"icon"`
	ID        string `json:"id"`
}

type Link struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type Picture struct {
	ID        string `json:"id"`
	URL       string `json:"url"`
	Thumbnail string `json:"thumbnail"`
}

type Entity struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type PersonNameEntity struct {
	Prefix       []string `json:"prefix"`
	Counting     []string `json:"counting"`
	Forename     []string `json:"forename"`
	Surname      []string `json:"surname"`
	PersonalName []string `json:"personalName"`
	NameAddition []string `json:"nameAddition"`
}

func (p Person) String() string {
	// Copilot: Please format and return all fields of the struct
	return fmt.Sprintf("Person{KGPZID: %v, URL: %v, DateOfDeath: %v, PlaceOfDeath: %v, BiographicalOrHistoricalInformation: %v, PreferredName: %v, GndIdentifier: %v, Wikipedia: %v, Depiction: %v, ProfessionOrOccupation: %v, PreferredNameEntityForThePerson: %v, DateOfBirth: %v, PlaceOfBirth: %v, VariantNameEntityForThePerson: %v, VariantName: %v, SameAs: %v}", p.KGPZID, p.URL, p.DateOfDeath, p.PlaceOfDeath, p.BiographicalOrHistoricalInformation, p.PreferredName, p.GndIdentifier, p.Wikipedia, p.Depiction, p.ProfessionOrOccupation, p.PreferredNameEntityForThePerson, p.DateOfBirth, p.PlaceOfBirth, p.VariantNameEntityForThePerson, p.VariantName, p.SameAs)
}
