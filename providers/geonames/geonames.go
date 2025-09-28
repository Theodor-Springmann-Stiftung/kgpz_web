package geonames

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
)

const (
	GEONAMES_API_URL = "http://api.geonames.org/getJSON"
	GEONAMES_USERNAME = "theodorspringmans"
)

type GeonamesProvider struct {
	// Mutex is for file reading & writing, not place map access
	mu     sync.Mutex
	Places sync.Map

	// INFO: this holds all errors that occurred during fetching
	// and is used to prevent further fetches of the same place.
	errmu sync.Mutex
	errs  map[string]int
}

func NewGeonamesProvider() *GeonamesProvider {
	return &GeonamesProvider{
		errs: make(map[string]int),
	}
}

func (p *GeonamesProvider) ReadCache(folder string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if err := p.readPlaces(folder); err != nil {
		return err
	}
	return nil
}

func (p *GeonamesProvider) readPlaces(folder string) error {
	info, err := os.Stat(folder)
	if os.IsNotExist(err) {
		return os.MkdirAll(folder, 0755)
	}
	if err != nil || !info.IsDir() {
		return err
	}

	files, err := filepath.Glob(filepath.Join(folder, "*.json"))
	// TODO: try to recover by recreating the folder
	if err != nil {
		return err
	}

	wg := sync.WaitGroup{}
	wg.Add(len(files))

	for _, file := range files {
		go func(file string) {
			p.readPlace(file)
			wg.Done()
		}(file)
	}

	wg.Wait()
	return nil
}

func (p *GeonamesProvider) readPlace(file string) {
	place := Place{}
	f, err := os.Open(file)
	if err != nil {
		logging.Error(err, "Error opening file for reading: "+file)
		return
	}
	defer f.Close()

	bytevalue, err := io.ReadAll(f)
	if err != nil {
		logging.Error(err, "Error reading file: "+file)
		return
	}

	if err := json.Unmarshal(bytevalue, &place); err != nil {
		logging.Error(err, "Error unmarshalling file:"+file)
		return
	}

	if place.KGPZURL != "" {
		p.Places.Store(place.KGPZURL, place)
		return
	}
}

func (p *GeonamesProvider) WriteCache(folder string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if err := p.writePlaces(folder); err != nil {
		return err
	}
	return nil
}

// INFO: this writes all places to the cache folder
// We do that on every fetch, it's easier that way
func (p *GeonamesProvider) writePlaces(folder string) error {
	info, err := os.Stat(folder)
	if err == os.ErrNotExist {
		return os.MkdirAll(folder, 0755)
	}
	if err != nil || !info.IsDir() {
		return err
	}

	wg := sync.WaitGroup{}
	p.Places.Range(func(key, value interface{}) bool {
		wg.Add(1)
		go func(key string, value Place) {
			p.writePlace(folder, key, value)
			wg.Done()
		}(key.(string), value.(Place))
		return true
	})

	wg.Wait()
	return nil
}

// INFO: this overwrites any existing files
func (p *GeonamesProvider) writePlace(folder, id string, place Place) {
	// JSON marshalling of the place and sanity check:
	filepath := filepath.Join(folder, place.KGPZID+".json")
	f, err := os.Create(filepath)
	if err != nil {
		logging.Error(err, "Error creating file for writing: "+id)
		return
	}
	defer f.Close()

	bytevalue, err := json.Marshal(place)
	if err != nil {
		logging.Error(err, "Error marshalling place: "+id)
		return
	}

	if _, err := f.Write(bytevalue); err != nil {
		logging.Error(err, "Error writing file: "+id)
		return
	}
}

func (p *GeonamesProvider) Place(id string) *Place {
	place, ok := p.Places.Load(id)
	if !ok {
		return nil
	}

	plc := place.(Place)
	return &plc
}

func (p *GeonamesProvider) FetchPlaces(places []GeonamesData) {
	wg := sync.WaitGroup{}
	for _, place := range places {
		if place.ID == "" || place.Geonames == "" {
			continue
		}

		// TODO: place already fetched; check for updates??
		if _, ok := p.Places.Load(place.Geonames); ok {
			continue
		}

		p.errmu.Lock()
		if _, ok := p.errs[place.Geonames]; ok {
			continue
		}
		p.errmu.Unlock()

		wg.Add(1)
		go func(place *GeonamesData) {
			defer wg.Done()
			p.fetchPlace(place.ID, place.Geonames)
		}(&place)
	}
	wg.Wait()
}

func (p *GeonamesProvider) fetchPlace(ID, GeonamesURL string) {
	// Remove trailing slash if present
	cleanURL := strings.TrimSuffix(GeonamesURL, "/")
	SPLITURL := strings.Split(cleanURL, "/")
	if len(SPLITURL) < 2 {
		logging.Error(nil, "Error parsing Geonames ID from: "+GeonamesURL)
		return
	}

	GeonamesID := SPLITURL[len(SPLITURL)-1]

	requestURL := GEONAMES_API_URL + "?geonameId=" + GeonamesID + "&username=" + GEONAMES_USERNAME
	logging.Debug("Fetching place: " + ID + " with URL: " + requestURL)
	request, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		logging.Error(err, "Error creating request: "+ID)
		return
	}

	var response *http.Response

	// INFO: we do 3 retries with increasing time between them
	for i := 0; i < 3; i++ {
		response, err = http.DefaultClient.Do(request)
		if err == nil && response.StatusCode < 400 {
			if i > 0 {
				logging.Info("Successfully fetched place: " + ID + " after " + strconv.Itoa(i) + " retries")
			}
			break
		}

		time.Sleep(time.Duration(i+1) * time.Second)
		logging.Error(err, "Retry fetching place: "+ID)
	}

	if err != nil {
		logging.Error(err, "Error fetching place: "+ID)
		return
	}

	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		if response.StatusCode < 500 {
			p.errmu.Lock()
			p.errs[GeonamesURL] = response.StatusCode
			p.errmu.Unlock()
		}
		logging.Error(errors.New("Error fetching place: " + ID + " with status code: " + http.StatusText(response.StatusCode)))
		return
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		logging.Error(err, "Error reading response body: "+ID)
		return
	}

	// For debug purposes: Write response body to file:
	// os.WriteFile("geonames_responses/"+ID+".json", body, 0644)

	geonamesPlace := Place{}
	if err := json.Unmarshal(body, &geonamesPlace); err != nil {
		logging.Error(err, "Error unmarshalling response body: "+ID)
		return
	}

	geonamesPlace.KGPZID = ID
	geonamesPlace.KGPZURL = GeonamesURL
	p.Places.Store(GeonamesURL, geonamesPlace)
}