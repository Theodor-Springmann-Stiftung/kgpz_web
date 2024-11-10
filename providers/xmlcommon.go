package providers

import (
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"sync"
)

type KGPZXML[T any] interface {
	Append(data T) T
	fmt.Stringer
}

type XMLProvider[T KGPZXML[T]] struct {
	mu    sync.Mutex
	paths []string
	Items T
}

func (p *XMLProvider[T]) Load() error {
	var wg sync.WaitGroup
	for _, path := range p.paths {
		wg.Add(1)
		go func(path string) {
			defer wg.Done()
			var data T
			if err := UnmarshalFile(path, &data); err != nil {
				fmt.Println(err)
				return
			}
			p.mu.Lock()
			p.Items = p.Items.Append(data)
			p.mu.Unlock()
		}(path)
	}
	wg.Wait()
	return nil
}

func (a *XMLProvider[T]) String() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return fmt.Sprintf("Items: %s", a.Items)
}

type AnnotationNote struct {
	Annotations []string `xml:"anmerkung"`
	Notes       []string `xml:"vermerk"`
}

func UnmarshalFile[T any](filename string, data *T) error {
	xmlFile, err := os.Open(filename)
	if err != nil {
		fmt.Println(err)
		return err
	}
	fmt.Println("Successfully opened " + filename)
	defer xmlFile.Close()
	byteValue, _ := io.ReadAll(xmlFile)
	xml.Unmarshal(byteValue, data)

	return nil
}
