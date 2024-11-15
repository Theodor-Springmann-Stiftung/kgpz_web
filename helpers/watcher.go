package helpers

import (
	"log"

	"github.com/fsnotify/fsnotify"
)

type IFileWatcher interface {
	GetEvents() chan string
}

type FileWatcher struct {
	path    []string
	events  chan string
	watcher *fsnotify.Watcher
}

func NewFileWatcher(path []string) (*FileWatcher, error) {
	fw := &FileWatcher{path: path, events: make(chan string, 48)}
	err := fw.Watch(path)
	if err != nil {
		return nil, err
	}
	return fw, nil
}

func (fw *FileWatcher) Watch(paths []string) error {
	fw.events = make(chan string, 48)

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	fw.watcher = watcher

	// Start listening for events.
	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				log.Println("event:", event)
				if !event.Has(fsnotify.Chmod) {
					fw.events <- event.Name
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Println("error:", err)
			}
		}
	}()

	for _, path := range paths {
		err = watcher.Add(path)
		if err != nil {
			return err
		}
	}

	return nil
}

func (fw *FileWatcher) GetEvents() chan string {
	return fw.events
}

func (fw *FileWatcher) Close() {
	fw.watcher.Close()
	close(fw.events)
}
