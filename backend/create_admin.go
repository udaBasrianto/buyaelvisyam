package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"backend/database"
	"backend/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

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

	os.Setenv("DB_HOST", dbHost)
	os.Setenv("DB_PORT", dbPort)
	os.Setenv("DB_USER", dbUser)
	os.Setenv("DB_PASSWORD", dbPassword)
	os.Setenv("DB_NAME", dbName)
	database.ConnectDB()
	db := database.DB

	email := "mas@abd.com"
	password := "18Muharrom"
	displayName := "Admin Mas"

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	var profile models.Profile
	existing := db.Where("email = ?", email).First(&profile)
	if existing.Error != nil {
		if existing.Error == gorm.ErrRecordNotFound {
			profile = models.Profile{
				UserID:      uuid.New(),
				Email:       email,
				Password:    string(hashedPassword),
				DisplayName: displayName,
			}
			if err := db.Create(&profile).Error; err != nil {
				log.Fatalf("Failed to create profile: %v", err)
			}
		} else {
			log.Fatalf("Failed to query profile: %v", existing.Error)
		}
	} else {
		if err := db.Exec(
			"UPDATE profiles SET password = ?, display_name = ? WHERE email = ?",
			string(hashedPassword),
			displayName,
			email,
		).Error; err != nil {
			log.Fatalf("Failed to update profile: %v", err)
		}
		if err := db.Where("email = ?", email).First(&profile).Error; err != nil {
			log.Fatalf("Failed to reload profile: %v", err)
		}
	}

	// Ensure admin role exists for this profile
	var userRole models.UserRole
	roleErr := db.Where("user_id = ? AND role = ?", profile.UserID, "admin").First(&userRole)
	if roleErr.Error != nil {
		if roleErr.Error == gorm.ErrRecordNotFound {
			userRole = models.UserRole{
				UserID: profile.UserID,
				Role:   "admin",
			}
			if err := db.Create(&userRole).Error; err != nil {
				log.Fatalf("Failed to create user role: %v", err)
			}
		} else {
			log.Fatalf("Failed to query user role: %v", roleErr.Error)
		}
	}

	fmt.Printf("✅ Admin berhasil dibuat atau diperbarui!\n")
	fmt.Printf("📧 Email: %s\n", email)
	fmt.Printf("🔑 Password: %s\n", password)
	fmt.Printf("👤 User ID: %s\n", profile.UserID)
}
