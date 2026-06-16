package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Profile struct {
	UserID      string `gorm:"primaryKey"`
	Email       string
	Password    string
	DisplayName string
}

type UserRole struct {
	ID     string `gorm:"primaryKey"`
	UserID string
	Role   string
}

func loadEnvFile(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if key == "" || value == "" {
			continue
		}
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}
}

func main() {
	// Load .env file if it exists, so Go command can use backend configuration.
	loadEnvFile(".env")

	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "127.0.0.1"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgres"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "buya_backup"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", dbHost, dbUser, dbPassword, dbName, dbPort)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	email := "mas@abd.com"
	password := "18Muharrom"
	displayName := "Admin Mas"

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	userID := uuid.New().String()

	// Create profile
	profile := Profile{
		UserID:      userID,
		Email:       email,
		Password:    string(hashedPassword),
		DisplayName: displayName,
	}

	if err := db.Create(&profile).Error; err != nil {
		log.Fatalf("Failed to create profile: %v", err)
	}

	// Create user role
	userRole := UserRole{
		ID:     uuid.New().String(),
		UserID: userID,
		Role:   "admin",
	}

	if err := db.Create(&userRole).Error; err != nil {
		log.Fatalf("Failed to create user role: %v", err)
	}

	fmt.Printf("✅ Admin berhasil dibuat!\n")
	fmt.Printf("📧 Email: %s\n", email)
	fmt.Printf("🔑 Password: %s\n", password)
	fmt.Printf("👤 User ID: %s\n", userID)
}
