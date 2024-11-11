package helpers

import "sync"

type EventMux[T any] struct {
	// INFO: This is a simple event multiplexer that allows to subscribe to events and to publish them.
	mu          sync.Mutex
	subscribers []chan T
}

func NewEventMux[T any]() *EventMux[T] {
	return &EventMux[T]{
		subscribers: make([]chan T, 0),
	}
}

func (e *EventMux[T]) Subscribe(size uint) chan T {
	e.mu.Lock()
	defer e.mu.Unlock()
	subscriber := make(chan T, size)
	e.subscribers = append(e.subscribers, subscriber)
	return subscriber
}

func (e *EventMux[T]) Unsubscribe(subscriber chan T) {
	e.mu.Lock()
	defer e.mu.Unlock()
	for i, s := range e.subscribers {
		if s == subscriber {
			close(s)
			e.subscribers = append(e.subscribers[:i], e.subscribers[i+1:]...)
			return
		}
	}
}

func (e *EventMux[T]) Publish(event T) {
	e.mu.Lock()
	defer e.mu.Unlock()
	for _, subscriber := range e.subscribers {
		subscriber <- event
	}
}

func (e *EventMux[T]) Close() {
	e.mu.Lock()
	defer e.mu.Unlock()
	for _, subscriber := range e.subscribers {
		close(subscriber)
	}
	e.subscribers = make([]chan T, 0)
}
