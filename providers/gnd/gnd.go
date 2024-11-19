package gnd

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const (
	LOBID_URL = "https://lobid.org/gnd/"
)

type GNDProvider struct {
	// Mutex is for file reading & writing
	mu      sync.Mutex
	Persons sync.Map
}

func NewGNDProvider() *GNDProvider {
	return &GNDProvider{}
}

func (p *GNDProvider) ReadCache(folder string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if err := p.readPersons(folder); err != nil {
		return err
	}
	return nil
}

func (p *GNDProvider) readPersons(folder string) error {
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
			p.readPerson(file)
			wg.Done()
		}(file)
	}

	wg.Wait()
	return nil
}

func (p *GNDProvider) readPerson(file string) {
	person := Person{}
	// JSON unmarshalling of the file and sanity check:
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

	if err := json.Unmarshal(bytevalue, &person); err != nil {
		logging.Error(err, "Error unmarshalling file:"+file)
		return
	}

	if person.KGPZID != "" {
		p.Persons.Store(person.KGPZID, person)
		return
	}
}

func (p *GNDProvider) WriteCache(folder string) error {
	p.mu.Lock()
	defer p.mu.Unlock()
	if err := p.writePersons(folder); err != nil {
		return err
	}
	return nil
}

func (p *GNDProvider) writePersons(folder string) error {
	info, err := os.Stat(folder)
	if err == os.ErrNotExist {
		return os.MkdirAll(folder, 0755)
	}
	if err != nil || !info.IsDir() {
		return err
	}

	wg := sync.WaitGroup{}
	p.Persons.Range(func(key, value interface{}) bool {
		wg.Add(1)
		go func(key string, value Person) {
			p.writePerson(folder, key, value)
			wg.Done()
		}(key.(string), value.(Person))
		return true
	})

	wg.Wait()
	return nil
}

func (p *GNDProvider) writePerson(folder, id string, person Person) {
	// JSON marshalling of the person and sanity check:
	filepath := filepath.Join(folder, id+".json")
	f, err := os.Create(filepath)
	if err != nil {
		logging.Error(err, "Error creating file for writing: "+id)
		return
	}
	defer f.Close()

	bytevalue, err := json.Marshal(person)
	if err != nil {
		logging.Error(err, "Error marshalling person: "+id)
		return
	}

	if _, err := f.Write(bytevalue); err != nil {
		logging.Error(err, "Error writing file: "+id)
		return
	}
}

func (p *GNDProvider) GetPerson(id string) (Person, error) {
	person, ok := p.Persons.Load(id)
	if !ok {
		return Person{}, nil
	}
	return person.(Person), nil
}

func (p *GNDProvider) FetchPersons(persons []xmlprovider.Agent) {
	wg := sync.WaitGroup{}
	for _, person := range persons {
		if person.ID == "" {
			continue
		}
		if _, ok := p.Persons.Load(person.ID); ok {
			continue
		}
		wg.Add(1)
		go func(person xmlprovider.Agent) {
			defer wg.Done()
			if person.GND != "" {
				p.fetchPerson(person)
			}
		}(person)
	}
	wg.Wait()
}

func (p *GNDProvider) fetchPerson(person xmlprovider.Agent) {
	SPLITURL := strings.Split(person.GND, "/")
	if len(SPLITURL) < 2 {
		logging.Error(nil, "Error parsing GND ID: "+person.GND)
		return
	}

	GNDID := SPLITURL[len(SPLITURL)-1]

	logging.Debug("Fetching person: " + person.ID + " with URL: " + LOBID_URL + GNDID)
	request, _ := http.NewRequest("GET", LOBID_URL+GNDID, nil)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		logging.Error(err, "Error fetching person: "+person.ID)
		return
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		logging.Error(nil, "Error fetching person: "+person.ID+" with status code: "+response.Status)
		return
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		logging.Error(err, "Error reading response body: "+person.ID)
		return
	}

	gndPerson := Person{}
	if err := json.Unmarshal(body, &gndPerson); err != nil {
		logging.Error(err, "Error unmarshalling response body: "+person.ID)
		return
	}

	gndPerson.KGPZID = person.ID
	p.Persons.Store(person.ID, gndPerson)
}
