package models

import (
	"time"

	"gorm.io/datatypes"
)

// WhatsAppToken stores WhatsApp verification tokens
type WhatsAppToken struct {
	ID              string    `gorm:"primaryKey" json:"id"`
	PhoneNumber     string    `gorm:"index" json:"phone_number"`
	Token           string    `gorm:"index" json:"token"`
	CreatedAt       time.Time `json:"created_at"`
	ExpiresAt       time.Time `json:"expires_at"`
	VerifiedAt      *time.Time `json:"verified_at"`
	AttemptsCount   int       `json:"attempts_count"`
	MaxAttempts     int       `gorm:"default:3" json:"max_attempts"`
}

// TableName specifies the table name
func (WhatsAppToken) TableName() string {
	return "whatsapp_tokens"
}

// WhatsAppSession stores WhatsApp client session data
type WhatsAppSession struct {
	ID            string         `gorm:"primaryKey" json:"id"`
	JID           string         `json:"jid"`
	Phone         string         `json:"phone"`
	Name          string         `json:"name"`
	Connected     bool           `json:"connected"`
	ConnectedAt   time.Time      `json:"connected_at"`
	DisconnectedAt *time.Time    `json:"disconnected_at"`
	SessionData   datatypes.JSON `json:"session_data" gorm:"type:jsonb"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

// TableName specifies the table name
func (WhatsAppSession) TableName() string {
	return "whatsapp_sessions"
}

// WhatsAppConfig stores WhatsApp client configuration
type WhatsAppConfig struct {
	Enabled        bool
	TokenExpiry    int // minutes
	MaxAttempts    int
	SessionPath    string
}
