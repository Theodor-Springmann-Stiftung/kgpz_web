package logging

import (
	"fmt"
	"log/slog"
	"sync"
)

// WARNING: do not attempt to set this anywhere besides the init function of this module
var ParseMessages ParseLogger

type XMLEntityType int64

const (
	Agent XMLEntityType = iota
	Place
	Worke
	Category
	Issue
	Piece
	Unknown
)

type ParseErrorLevel int64

const (
	Clean ParseErrorLevel = iota
	ObjectMessage
	InfoMessage
	WarningMessage
	ErrorMessage
	FatalMessage
)

type ParseMessage struct {
	XMLType     XMLEntityType
	XMLPath     string
	Object      string
	Message     string
	MessageType ParseErrorLevel
}

func (pm ParseMessage) String() string {
	if pm.Object != "" {
		return fmt.Sprintf("%s: %s\n%s\n%s", pm.XMLType, pm.XMLPath, pm.Object, pm.Message)
	}
	return fmt.Sprintf("%s: %s\n%s", pm.XMLType, pm.XMLPath, pm.Message)
}

type ParseLogger struct {
	mu           sync.Mutex
	ParseInfo    chan ParseMessage
	ParseErrors  chan ParseMessage
	ParseObjects chan string
	messages     []ParseMessage
	objects      []string
	State        ParseErrorLevel
	subs         []func(ParseMessage)
}

func init() {
	ParseMessages = ParseLogger{
		ParseInfo:   make(chan ParseMessage, 100),
		ParseErrors: make(chan ParseMessage, 100),
	}
	ParseMessages.Start()
}

func (pl *ParseLogger) Start() {
	go func() {
		for {
			select {
			case msg, ok := <-pl.ParseObjects:
				pl.mu.Lock()
				pl.objects = append(pl.objects, msg)
				pl.mu.Unlock()
				if !ok {
					pl.ParseObjects = nil
				}
			case msg, ok := <-pl.ParseInfo:
				pl.mu.Lock()
				pl.messages = append(pl.messages, msg)
				pl.setState(InfoMessage)
				pl.mu.Unlock()
				if !ok {
					pl.ParseInfo = nil
				}
			case msg, ok := <-pl.ParseErrors:
				pl.mu.Lock()
				pl.messages = append(pl.messages, msg)
				pl.setState(msg.MessageType)
				pl.mu.Unlock()
				if !ok {
					pl.ParseErrors = nil
				}
			}

			if pl.ParseInfo == nil && pl.ParseInfo == nil && pl.ParseObjects == nil {
				break
			}
		}
	}()
}

func (pl *ParseLogger) GetMessages() []ParseMessage {
	res := make([]ParseMessage, len(pl.messages))
	pl.mu.Lock()
	defer pl.mu.Unlock()
	copy(res, pl.messages)
	return res
}

func (pl *ParseLogger) ClearMessages() {
	pl.mu.Lock()
	defer pl.mu.Unlock()
	pl.State = Clean
	pl.messages = []ParseMessage{}
}

func (pl *ParseLogger) LogInfo(xmlType XMLEntityType, xmlPath string, object string, message string) {
	pl.ParseInfo <- ParseMessage{
		XMLType:     xmlType,
		XMLPath:     xmlPath,
		Object:      object,
		Message:     message,
		MessageType: InfoMessage,
	}
}

func (pl *ParseLogger) LogError(xmlType XMLEntityType, xmlPath string, object string, message string) {
	pl.ParseErrors <- ParseMessage{
		XMLType:     xmlType,
		XMLPath:     xmlPath,
		Object:      object,
		Message:     message,
		MessageType: ErrorMessage,
	}
}

func (pl *ParseLogger) LogWarning(xmlType XMLEntityType, xmlPath string, object string, message string) {
	pl.ParseErrors <- ParseMessage{
		XMLType:     xmlType,
		XMLPath:     xmlPath,
		Object:      object,
		Message:     message,
		MessageType: WarningMessage,
	}
}

func (pl *ParseLogger) LogFatal(xmlType XMLEntityType, xmlPath string, object string, message string) {
	pl.ParseErrors <- ParseMessage{
		XMLType: xmlType,
		XMLPath: xmlPath,
		Object:  object,
		Message: message,
	}
}

func (pl *ParseLogger) setState(state ParseErrorLevel) {
	if state > pl.State {
		pl.State = state
	}
}

func (pl *ParseLogger) GetState() ParseErrorLevel {
	return pl.State
}

func (pl *ParseLogger) Len() int {
	pl.mu.Lock()
	defer pl.mu.Unlock()
	return len(pl.messages)
}

func (pl *ParseLogger) Subscribe(fn func(ParseMessage)) {
	pl.mu.Lock()
	defer pl.mu.Unlock()
	pl.subs = append(pl.subs, fn)
}

func (pl *ParseLogger) ResetSubscriptions() {
	pl.mu.Lock()
	defer pl.mu.Unlock()
	pl.subs = []func(ParseMessage){}
}

func (pl *ParseLogger) PrintObjects() {
	pl.mu.Lock()
	defer pl.mu.Unlock()
	for _, o := range pl.objects {
		Debug(o)
	}
}

func (pl *ParseLogger) PrintMessages() {
	pl.mu.Lock()
	defer pl.mu.Unlock()
	for _, m := range pl.messages {
		slog.Debug(m.String())
	}
}
