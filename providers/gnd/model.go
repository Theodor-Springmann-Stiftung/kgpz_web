package gnd

type Person struct {
	KGPZID                                 string             `json:"kgpzid"`
	URL                                    string             `json:"id"`
	DateOfDeath                            []string           `json:"dateOfDeath"`
	PlaceOfDeath                           []Entity           `json:"placeOfDeath"`
	BibliographicalOrHistoricalInformation []string           `json:"bibliographicalOrHistoricalInformation"`
	PreferredName                          string             `json:"preferredName"`
	GndIdentifier                          string             `json:"gndIdentifier"`
	Wikipedia                              []Entity           `json:"wikipedia"`
	Depiction                              []Picture          `json:"depiction"`
	ProfessionOrOccupation                 []Entity           `json:"professionOrOccupation"`
	PreferredEntityForThePerson            []PersonNameEntity `json:"preferredEntityForThePerson"`
	DateOfBirth                            []string           `json:"dateOfBirth"`
	PlaceOfBirth                           []Entity           `json:"placeOfBirth"`
	VariantNameEntityForThePerson          []PersonNameEntity `json:"variantNameEntityForThePerson"`
	VariantName                            []string           `json:"variantName"`
	SameAs                                 []CrossReferences  `json:"sameAs"`
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
	Forename     []string `json:"forename"`
	Surname      []string `json:"surname"`
	PersonalName []string `json:"personalName"`
	NameAddition []string `json:"nameAddition"`
}
