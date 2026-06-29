package main

import (
  "fmt"
  "os"
  "strings"

  "backend/database"
  "backend/models"
  "golang.org/x/crypto/bcrypt"
)

func main() {
  os.Setenv("DB_HOST", "localhost")
  os.Setenv("DB_PORT", "5432")
  os.Setenv("DB_USER", "postgres")
  os.Setenv("DB_PASSWORD", "")
  os.Setenv("DB_NAME", "blogs")

  database.ConnectDB()

  email := strings.ToLower(strings.TrimSpace("mas@abd.com"))
  password := "mas@abd.com"
  hash, _ := bcrypt.GenerateFromPassword([]byte(password), 14)
  fmt.Println("hashing", string(hash))

  err := database.DB.Exec("UPDATE profiles SET password = ? WHERE LOWER(email) = ?", string(hash), email).Error
  if err != nil {
    panic(err)
  }
  var profile models.Profile
  if err := database.DB.Where("LOWER(email) = ?", email).First(&profile).Error; err != nil {
    panic(err)
  }
  fmt.Println("db hash after update", profile.Password)
}
