//go:build ignore

package main

import (
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	godotenv.Load()

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"), os.Getenv("DB_PORT"))

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("DB connection failed:", err)
	}

	email := "mas@abd.com"
	password := "mas@abd.com"
	displayName := "Admin"

	hashed, _ := bcrypt.GenerateFromPassword([]byte(password), 14)
	userID := uuid.New()

	// Delete any existing entries for this email first
	db.Exec(`DELETE FROM user_roles WHERE user_id IN (SELECT user_id FROM profiles WHERE email = ?)`, email)
	db.Exec(`DELETE FROM profiles WHERE email = ?`, email)

	// Insert profile
	db.Exec(`INSERT INTO profiles (user_id, email, password, display_name, created_at, updated_at)
		VALUES (?, ?, ?, ?, NOW(), NOW())`,
		userID, email, string(hashed), displayName)

	// Insert admin role (no created_at/updated_at in this table)
	db.Exec(`INSERT INTO user_roles (id, user_id, role)
		VALUES (?, ?, 'admin')`,
		uuid.New(), userID)

	// Insert default site_settings if empty
	db.Exec(`INSERT INTO site_settings (id, site_name, tagline, footer_text, updated_at)
		SELECT uuid_generate_v4(), 'BlogUstad', 'Berbagi ilmu agama Islam untuk umat', '© 2026 BlogUstad', NOW()
		WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1)`)

	fmt.Println("✅ Admin account created:")
	fmt.Println("   Email:", email)
	fmt.Println("   Password:", password)
	fmt.Println("   Role: admin")
	fmt.Println("   User ID:", userID)
}
