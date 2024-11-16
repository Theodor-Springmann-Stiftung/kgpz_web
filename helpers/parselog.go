package helpers

import "sync"

type LogMessage struct {
	Commit  string
	File    string
	Message string
	Fatal   bool
}

type ParseLogger struct {
	mu       sync.Mutex
	Messages []LogMessage
}

func NewParseLog() *ParseLogger {
	return &ParseLogger{
		Messages: make([]LogMessage, 0),
	}
}

func (p *ParseLogger) AddMessage(commit, file, message string, fatal bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Messages = append(p.Messages, LogMessage{
		Commit:  commit,
		File:    file,
		Message: message,
		Fatal:   fatal,
	})
}

func (p *ParseLogger) Fatal() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, m := range p.Messages {
		if m.Fatal {
			return true
		}
	}
	return false
}

func (p *ParseLogger) GetMessages() []LogMessage {
	p.mu.Lock()
	defer p.mu.Unlock()
	res := make([]LogMessage, len(p.Messages))
	copy(res, p.Messages)
	return res
}

func (p *ParseLogger) Clear() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Messages = make([]LogMessage, 0)
}
