package gnd

import (
	"fmt"
)

type Person struct {
	KGPZID                              string             `json:"kgpzid"`
	KGPZURL                             string             `json:"kgpzurl"`
	URL                                 string             `json:"id,omitempty"`
	DateOfBirth                         []string           `json:"dateOfBirth,omitempty"`
	PlaceOfBirth                        []Entity           `json:"placeOfBirth,omitempty"`
	DateOfDeath                         []string           `json:"dateOfDeath,omitempty"`
	PlaceOfDeath                        []Entity           `json:"placeOfDeath,omitempty"`
	PlaceOfBirthAsLiteral               []string           `json:"placeOfBirthAsLiteral,omitempty"`
	PlaceOfDeathAsLiteral               []string           `json:"placeOfDeathAsLiteral,omitempty"`
	BiographicalOrHistoricalInformation []string           `json:"biographicalOrHistoricalInformation,omitempty"`
	PreferredName                       string             `json:"preferredName,omitempty"`
	GndIdentifier                       string             `json:"gndIdentifier,omitempty"`
	Wikipedia                           []Entity           `json:"wikipedia,omitempty"`
	Depiction                           []Picture          `json:"depiction,omitempty"`
	ProfessionOrOccupation              []Entity           `json:"professionOrOccupation,omitempty"`
	PreferredNameEntityForThePerson     PersonNameEntity   `json:"preferredNameEntityForThePerson,omitempty"`
	VariantNameEntityForThePerson       []PersonNameEntity `json:"variantNameEntityForThePerson,omitempty"`
	VariantName                         []string           `json:"variantName,omitempty"`
	SameAs                              []CrossReferences  `json:"sameAs,omitempty"`
	Pseudonym                           []Entity           `json:"pseudonym,omitempty"`
	GNDSubjectCategory                  []Entity           `json:"gndSubjectCategory,omitempty"`
	Type                                []string           `json:"type,omitempty"`
	PlaceOfActivity                     []Entity           `json:"placeOfActivity,omitempty"`
}

type CrossReferences struct {
	Items Collection `json:"collection,omitempty"`
	ID    string     `json:"id,omitempty"`
}

type Collection struct {
	Abbr      string `json:"abbr,omitempty"`
	Name      string `json:"name,omitempty"`
	Publisher string `json:"publisher,omitempty"`
	Icon      string `json:"icon,omitempty"`
	ID        string `json:"id,omitempty"`
}

type Link struct {
	ID    string `json:"id,omitempty"`
	Label string `json:"label,omitempty"`
}

type Picture struct {
	ID        string `json:"id,omitempty"`
	URL       string `json:"url,omitempty"`
	Thumbnail string `json:"thumbnail,omitempty"`
}

type Entity struct {
	ID    string `json:"id,omitempty"`
	Label string `json:"label,omitempty"`
}

type PersonNameEntity struct {
	Prefix       []string `json:"prefix,omitempty"`
	Counting     []string `json:"counting,omitempty"`
	Forename     []string `json:"forename,omitempty"`
	Surname      []string `json:"surname,omitempty"`
	PersonalName []string `json:"personalName,omitempty"`
	NameAddition []string `json:"nameAddition,omitempty"`
}

func (p Person) String() string {
	// Copilot: Please format and return all fields of the struct
	return fmt.Sprintf("Person{KGPZID: %v, URL: %v, DateOfDeath: %v, PlaceOfDeath: %v, BiographicalOrHistoricalInformation: %v, PreferredName: %v, GndIdentifier: %v, Wikipedia: %v, Depiction: %v, ProfessionOrOccupation: %v, PreferredNameEntityForThePerson: %v, DateOfBirth: %v, PlaceOfBirth: %v, VariantNameEntityForThePerson: %v, VariantName: %v, SameAs: %v}", p.KGPZID, p.URL, p.DateOfDeath, p.PlaceOfDeath, p.BiographicalOrHistoricalInformation, p.PreferredName, p.GndIdentifier, p.Wikipedia, p.Depiction, p.ProfessionOrOccupation, p.PreferredNameEntityForThePerson, p.DateOfBirth, p.PlaceOfBirth, p.VariantNameEntityForThePerson, p.VariantName, p.SameAs)
}
