package viewmodels

import (
	"fmt"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/datatypes"
	searchprovider "github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/search"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/blevesearch/bleve/v2"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
	"golang.org/x/text/unicode/norm"
)

type Result[T any] struct {
	Count uint64
	Items []T
}

type SearchView struct {
	Agents     Result[xmlmodels.Agent]
	Works      Result[xmlmodels.Work]
	Places     Result[xmlmodels.Place]
	Categories Result[xmlmodels.Category]
	Pieces     Result[xmlmodels.Piece]
	Issues     Result[xmlmodels.Issue]
}

func NewSearchView(search string, kgpz *xmlmodels.Library, sp *searchprovider.SearchProvider) (*SearchView, error) {
	sw := SearchView{}
	search = datatypes.DeleteTags(search)
	search = datatypes.NormalizeString(search)
	search = datatypes.RemovePunctuation(search)
	search = cases.Lower(language.German).String(search)
	search = norm.NFKD.String(search)

	query := bleve.NewTermQuery(search)
	request := bleve.NewSearchRequest(query)
	request.Size = 100

	agentIndex, erragent := sp.GetIndex(xmlmodels.AGENT_TYPE)
	workIndex, errwork := sp.GetIndex(xmlmodels.WORK_TYPE)
	placeIndex, errplace := sp.GetIndex(xmlmodels.PLACE_TYPE)
	categoryIndex, errcategory := sp.GetIndex(xmlmodels.CATEGORY_TYPE)
	pieceIndex, errpiece := sp.GetIndex(xmlmodels.PIECE_TYPE)
	issueIndex, errissue := sp.GetIndex(xmlmodels.ISSUE_TYPE)

	if agentIndex == nil || workIndex == nil || placeIndex == nil || categoryIndex == nil || pieceIndex == nil || issueIndex == nil {
		return nil, fmt.Errorf("Indeces not found.")
	}

	wg := sync.WaitGroup{}
	if erragent == nil {
		wg.Add(1)
		go func() {
			agentResults, _ := agentIndex.Search(request)
			result := Result[xmlmodels.Agent]{Count: agentResults.Total}
			for _, hit := range agentResults.Hits {
				agent := kgpz.Agents.Item(hit.ID)
				if agent != nil {
					result.Items = append(result.Items, *agent)
				}
			}
			sw.Agents = result
			wg.Done()
		}()
	}

	if errwork == nil {
		wg.Add(1)
		go func() {
			workResults, _ := workIndex.Search(request)
			result := Result[xmlmodels.Work]{Count: workResults.Total}
			for _, hit := range workResults.Hits {
				work := kgpz.Works.Item(hit.ID)
				if work != nil {
					result.Items = append(result.Items, *work)
				}
			}
			sw.Works = result
			wg.Done()
		}()
	}

	if errplace == nil {
		wg.Add(1)
		go func() {
			placeResults, _ := placeIndex.Search(request)
			result := Result[xmlmodels.Place]{Count: placeResults.Total}
			for _, hit := range placeResults.Hits {
				place := kgpz.Places.Item(hit.ID)
				if place != nil {
					result.Items = append(result.Items, *place)
				}
			}
			sw.Places = result
			wg.Done()
		}()
	}

	if errcategory == nil {
		wg.Add(1)
		go func() {
			categoryResults, _ := categoryIndex.Search(request)
			result := Result[xmlmodels.Category]{Count: categoryResults.Total}
			for _, hit := range categoryResults.Hits {
				category := kgpz.Categories.Item(hit.ID)
				if category != nil {
					result.Items = append(result.Items, *category)
				}
			}
			sw.Categories = result
			wg.Done()
		}()
	}

	if errpiece == nil {
		wg.Add(1)
		go func() {
			pieceResults, _ := pieceIndex.Search(request)
			result := Result[xmlmodels.Piece]{Count: pieceResults.Total}
			for _, hit := range pieceResults.Hits {
				piece := kgpz.Pieces.Item(hit.ID)
				if piece != nil {
					result.Items = append(result.Items, *piece)
				}
			}
			sw.Pieces = result
			wg.Done()
		}()
	}

	if errissue == nil {
		wg.Add(1)
		go func() {
			issueResults, _ := issueIndex.Search(request)
			result := Result[xmlmodels.Issue]{Count: issueResults.Total}
			for _, hit := range issueResults.Hits {
				issue := kgpz.Issues.Item(hit.ID)
				if issue != nil {
					result.Items = append(result.Items, *issue)
				}
			}
			sw.Issues = result
			wg.Done()
		}()
	}

	wg.Wait()

	return &sw, nil
}
