package main

import (
	"fmt"
	"log"

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

func main() {
	// Connect to database
	dsn := "host=localhost user=postgres password=postgres dbname=buya_backup port=5432 sslmode=disable"
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
