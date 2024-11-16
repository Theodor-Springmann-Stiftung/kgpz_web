package helpers

import (
	"errors"
	"io/fs"
	"log"
	"path/filepath"
	"sync"

	"github.com/fsnotify/fsnotify"
)

var NotInitializedError = errors.New("FileWatcher not initialized")
var NoWatchFunctionError = errors.New("No watch function provided")

type IFileWatcher interface {
	RecursiveDir(path string) error
	Dir(path string) error
	Append(fn func(string))
	Prepend(fn func(string))
	Watch() error
	Close()
	Restart()
}

type FileWatcher struct {
	mu      sync.Mutex
	wf      []func(string)
	paths   []string
	watcher *fsnotify.Watcher
}

func NewFileWatcher() (*FileWatcher, error) {
	fw := &FileWatcher{mu: sync.Mutex{}}
	fw.Watch()
	return fw, nil
}

func (fw *FileWatcher) RecursiveDir(path string) error {
	err := filepath.WalkDir(path, func(path string, d fs.DirEntry, err error) error {
		if d.IsDir() {
			err := fw.Dir(path)
			if err != nil {
				return err
			}
		}
		return nil
	})

	return err
}

func (fw *FileWatcher) Dir(path string) error {
	fw.mu.Lock()
	defer fw.mu.Unlock()
	if fw.watcher != nil {
		err := fw.watcher.Add(path)
		if err != nil {
			return err
		}
	}

	fw.paths = append(fw.paths, path)

	return nil
}

func (fw *FileWatcher) Append(fn func(string)) {
	fw.mu.Lock()
	defer fw.mu.Unlock()
	fw.wf = append(fw.wf, fn)
}

func (fw *FileWatcher) Prepend(fn func(string)) {
	fw.mu.Lock()
	defer fw.mu.Unlock()
	fw.wf = append([]func(string){fn}, fw.wf...)
}

func (fw *FileWatcher) Watch() error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}

	fw.mu.Lock()
	fw.watcher = watcher
	fw.mu.Unlock()

	// Start listening for events.
	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				if !event.Has(fsnotify.Chmod) {
					log.Println("event:", event)
					fw.mu.Lock()
					for _, wf := range fw.wf {
						wf(event.Name)
					}
					fw.mu.Unlock()
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Println("error:", err)
			}
		}
	}()

	return nil
}

// INFO: After closing the watcher, you can't use it anymore.
// Also, after a restart, you need to re add the paths
func (fw *FileWatcher) Close() {
	fw.mu.Lock()
	defer fw.mu.Unlock()

	if fw.watcher != nil {
		fw.watcher.Close()
	}
	fw.watcher = nil
	fw.paths = nil
}

func (fw *FileWatcher) Restart() {
	fw.Close()
	fw.Watch()
}
