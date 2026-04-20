package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/database"
	"backend/models"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"gorm.io/gorm/clause"
	"gorm.io/datatypes"
	"os"
	"google.golang.org/protobuf/proto"
	_ "github.com/jackc/pgx/v5/stdlib"
)

type WhatsAppService struct {
	client         *whatsmeow.Client
	container      *sqlstore.Container
	connected      bool
	mu         sync.RWMutex
	qrChannel      chan string
	lastQRCode     string
	eventHandlers  map[string][]func(interface{})
}

var (
	whatsappService *WhatsAppService
	once            sync.Once
)

// GetWhatsAppService returns singleton instance
func GetWhatsAppService() *WhatsAppService {
	once.Do(func() {
		whatsappService = &WhatsAppService{
			connected:     false,
			qrChannel:     make(chan string, 1),
			eventHandlers: make(map[string][]func(interface{})),
		}
	})
	return whatsappService
}

// Initialize sets up WhatsApp service with database
func (w *WhatsAppService) Initialize() error {
	w.mu.Lock()
	defer w.mu.Unlock()

	// Create or open SQLite store for WhatsApp session
	dbLog := waLog.Stdout("Database", "DEBUG", true)
	var err error
	// Get Postgres connection details from env to build standard DSN
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	// pgx stdlib DSN format: postgres://user:password@host:port/dbname?sslmode=disable
	var dsn string
	if password != "" {
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, password, host, port, dbname)
	} else {
		// handle empty password
		dsn = fmt.Sprintf("postgres://%s@%s:%s/%s?sslmode=disable", user, host, port, dbname)
	}

	w.container, err = sqlstore.New(context.Background(), "pgx", dsn, dbLog)
	if err != nil {
		return fmt.Errorf("failed to create store: %v", err)
	}

	// Get device (creates if not exists)
	device, err := w.container.GetFirstDevice(context.Background())
	if err != nil {
		return fmt.Errorf("failed to get device: %v", err)
	}

	// Create client
	clientLog := waLog.Stdout("Client", "INFO", true)
	w.client = whatsmeow.NewClient(device, clientLog)

	// Add event handler
	w.client.AddEventHandler(w.handleEvents)

	// Try to restore connection
	if device.ID != nil {
		fmt.Println("Restoring WhatsApp connection from saved session...")
		if err := w.connect(); err == nil {
			return nil
		}
	}

	return nil
}

// Connect initiates WhatsApp connection with QR code
func (w *WhatsAppService) Connect(ctx context.Context) error {
	w.mu.Lock()
	alreadyConnected := w.connected
	w.mu.Unlock()

	if alreadyConnected {
		return fmt.Errorf("already connected")
	}

	// Clear any old QR code
	w.mu.Lock()
	w.lastQRCode = ""
	w.mu.Unlock()

	// GetQRChannel MUST be called before Connect()
	qrChan, err := w.client.GetQRChannel(ctx)
	if err != nil {
		// GetQRChannel returns error if already logged in
		fmt.Println("GetQRChannel:", err, "— attempting direct connect")
		return w.connect()
	}

	// Connect in background — handler returns immediately, QR arrives async
	go func() {
		defer func() {
			if r := recover(); r != nil {
				fmt.Println("Connect goroutine recovered from panic:", r)
			}
		}()

		// Start the QR listener goroutine first
		go func() {
			for evt := range qrChan {
				switch evt.Event {
				case "code":
					w.mu.Lock()
					w.lastQRCode = evt.Code
					w.mu.Unlock()
					fmt.Println("QR Code updated")
					select {
					case w.qrChannel <- evt.Code:
					default:
					}
				default:
					fmt.Println("WhatsApp login event:", evt.Event)
					if evt.Event == "success" {
						w.mu.Lock()
						w.connected = true
						w.lastQRCode = ""
						w.mu.Unlock()
						w.saveConnectionToDB()
					}
				}
			}
		}()

		// Now connect (this generates the QR)
		if err := w.client.Connect(); err != nil {
			fmt.Printf("WhatsApp connect error: %v\n", err)
			return
		}
		fmt.Println("WhatsApp connected (waiting for QR scan or existing session)")
	}()

	return nil
}

// connect performs actual connection
func (w *WhatsAppService) connect() error {
	if err := w.client.Connect(); err != nil {
		return fmt.Errorf("failed to connect: %v", err)
	}

	w.connected = true
	fmt.Printf("WhatsApp connected (waiting for QR scan or existing session)\n")

	// Note: saveConnectionToDB is called from the Connected event handler
	// after the QR code is scanned and login is complete (so Store.ID is not nil)

	return nil
}

// Disconnect closes WhatsApp connection
func (w *WhatsAppService) Disconnect() error {
	w.mu.Lock()
	defer w.mu.Unlock()

	if !w.connected || w.client == nil {
		return fmt.Errorf("not connected")
	}

	w.client.Disconnect()
	w.connected = false

	// Update database
	w.clearConnectionFromDB()

	return nil
}

// SendMessage sends a text message
func (w *WhatsAppService) SendMessage(phoneNumber string, message string) error {
	w.mu.RLock()
	defer w.mu.RUnlock()

	if !w.connected {
		return fmt.Errorf("not connected to WhatsApp")
	}

	// Parse phone number to JID
	jid, err := types.ParseJID(phoneNumber + "@s.whatsapp.net")
	if err != nil {
		return fmt.Errorf("invalid phone number: %v", err)
	}

	// Create message
	msg := &waE2E.Message{
		Conversation: proto.String(message),
	}

	// Send message
	response, err := w.client.SendMessage(context.Background(), jid, msg)
	if err != nil {
		return fmt.Errorf("failed to send message: %v", err)
	}

	fmt.Printf("Message sent: %s\n", response)
	return nil
}

// GetStatus returns connection status
func (w *WhatsAppService) GetStatus() map[string]interface{} {
	w.mu.RLock()
	defer w.mu.RUnlock()

	status := map[string]interface{}{
		"connected": w.connected,
	}

	if w.connected && w.client != nil {
		status["jid"] = w.client.Store.ID.String()
		status["phone"] = w.client.Store.ID.User
	}

	return status
}

// handleEvents handles WhatsApp events
func (w *WhatsAppService) handleEvents(evt interface{}) {
	switch evt.(type) {
	case *events.Connected:
		fmt.Println("WhatsApp connected successfully")
		w.mu.Lock()
		w.connected = true
		w.mu.Unlock()
		w.saveConnectionToDB()

	case *events.LoggedOut:
		fmt.Println("WhatsApp logged out")
		w.mu.Lock()
		w.connected = false
		w.mu.Unlock()
		w.clearConnectionFromDB()

	case *events.KeepAliveTimeout:
		fmt.Println("WhatsApp keep alive timeout")
	}

	// Trigger custom handlers
	if handlers, ok := w.eventHandlers[fmt.Sprintf("%T", evt)]; ok {
		for _, handler := range handlers {
			go handler(evt)
		}
	}
}

// AddEventHandler registers custom event handler
func (w *WhatsAppService) AddEventHandler(eventType string, handler func(interface{})) {
	w.mu.Lock()
	defer w.mu.Unlock()

	w.eventHandlers[eventType] = append(w.eventHandlers[eventType], handler)
}

// saveConnectionToDB saves connection info to database
func (w *WhatsAppService) saveConnectionToDB() {
	if w.client == nil {
		return
	}
	// Guard: Store.ID can be nil before QR code is scanned
	if w.client.Store == nil || w.client.Store.ID == nil {
		fmt.Println("saveConnectionToDB: Store.ID is nil, skipping…")
		return
	}

	session := models.WhatsAppSession{
		ID:          "main",
		JID:         w.client.Store.ID.String(),
		Phone:       w.client.Store.ID.User,
		Name:        w.client.Store.ID.User,
		Connected:   true,
		ConnectedAt: time.Now(),
		SessionData: datatypes.JSON([]byte("{}")),
	}

	db := database.DB
	db.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&session)
}

// clearConnectionFromDB clears connection info from database
func (w *WhatsAppService) clearConnectionFromDB() {
	db := database.DB
	db.Model(&models.WhatsAppSession{}).Where("id = ?", "main").Updates(map[string]interface{}{
		"connected": false,
		"phone": "",
		"name": "",
	})
}

// GetQRCode returns the latest QR code
func (w *WhatsAppService) GetQRCode() string {
	w.mu.RLock()
	defer w.mu.RUnlock()
	return w.lastQRCode
}

// Close closes WhatsApp service gracefully
func (w *WhatsAppService) Close() error {
	return w.Disconnect()
}
