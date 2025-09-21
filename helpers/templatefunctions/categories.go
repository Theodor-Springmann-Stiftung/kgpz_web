package templatefunctions

import "github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"

// CategoryFlags represents all possible category flags for a piece
type CategoryFlags struct {
	// Categories from kategorien.xml
	Rezension               bool
	Weltnachrichten         bool
	EinkommendeFremde       bool
	Wechselkurse            bool
	Buecher                 bool
	Lokalanzeigen           bool
	Lokalnachrichten        bool
	Lotterie                bool
	Gedicht                 bool
	Vorladung               bool
	Auszug                  bool
	Provinienz              bool // Added missing category
	Aufsatz                 bool
	GelehrteNachrichten     bool
	Theaterkritik           bool
	Uebersetzung            bool
	Kommentar               bool
	Nachruf                 bool
	Replik                  bool
	Proklamation            bool
	Brief                   bool
	Anzeige                 bool
	Ineigenersache          bool
	Desertionsliste         bool
	Notenblatt              bool
	Vorlesungsverzeichnis   bool
	Erzaehlung              bool
	Abbildung               bool
	// Additional categories that appear in combinations
	Nachtrag                bool
	Panegyrik               bool
	Kriminalanzeige         bool
	Rezepte                 bool
	Korrektur               bool
}

// GetCategoryFlags analyzes a piece and returns a CategoryFlags struct with all category flags set
func GetCategoryFlags(piece xmlmodels.Piece) CategoryFlags {
	flags := CategoryFlags{}

	// Process CategoryRefs
	for _, catref := range piece.CategoryRefs {
		switch catref.Ref {
		case "rezension":
			flags.Rezension = true
		case "weltnachrichten":
			flags.Weltnachrichten = true
		case "einkommende-fremde":
			flags.EinkommendeFremde = true
		case "wechselkurse":
			flags.Wechselkurse = true
		case "buecher":
			flags.Buecher = true
		case "lokalanzeigen":
			flags.Lokalanzeigen = true
		case "lokalnachrichten":
			flags.Lokalnachrichten = true
		case "lotterie":
			flags.Lotterie = true
		case "gedicht":
			flags.Gedicht = true
		case "vorladung":
			flags.Vorladung = true
		case "auszug":
			flags.Auszug = true
		case "provinienz":
			flags.Provinienz = true
		case "aufsatz":
			flags.Aufsatz = true
		case "gelehrte-nachrichten":
			flags.GelehrteNachrichten = true
		case "theaterkritik":
			flags.Theaterkritik = true
		case "uebersetzung":
			flags.Uebersetzung = true
		case "kommentar":
			flags.Kommentar = true
		case "nachruf":
			flags.Nachruf = true
		case "replik":
			flags.Replik = true
		case "proklamation":
			flags.Proklamation = true
		case "ineigenersache":
			flags.Ineigenersache = true
		case "brief":
			flags.Brief = true
		case "anzeige":
			flags.Anzeige = true
		case "desertionsliste":
			flags.Desertionsliste = true
		case "notenblatt":
			flags.Notenblatt = true
		case "vorlesungsverzeichnis":
			flags.Vorlesungsverzeichnis = true
		case "erzaehlung":
			flags.Erzaehlung = true
		case "nachtrag":
			flags.Nachtrag = true
		case "panegyrik":
			flags.Panegyrik = true
		case "kriminalanzeige":
			flags.Kriminalanzeige = true
		case "abbildung":
			flags.Abbildung = true
		case "rezepte":
			flags.Rezepte = true
		case "korrektur":
			flags.Korrektur = true
		}
	}

	// Process WorkRefs with category mapping
	for _, workref := range piece.WorkRefs {
		kat := workref.Category
		if kat == "" {
			kat = "rezension" // Default category for WorkRefs
		}
		switch kat {
		case "rezension":
			flags.Rezension = true
		case "auszug":
			flags.Auszug = true
		case "theaterkritik":
			flags.Theaterkritik = true
		case "uebersetzung":
			flags.Uebersetzung = true
		case "kommentar":
			flags.Kommentar = true
		case "anzeige":
			flags.Anzeige = true
		case "replik":
			flags.Replik = true
		}
	}

	return flags
}