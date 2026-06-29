package main

import (
  "fmt"
  "log"
  "os"
  "strings"

  "backend/database"
  "backend/models"
  "golang.org/x/crypto/bcrypt"
)

func loadEnvFile(path string) {
  data, err := os.ReadFile(path)
  if err != nil { return }
  for _, line := range strings.Split(string(data), "\n") {
    line = strings.TrimSpace(line)
    if line == "" || strings.HasPrefix(line, "#") { continue }
    parts := strings.SplitN(line, "=", 2)
    if len(parts) != 2 { continue }
    key := strings.TrimSpace(parts[0])
    value := strings.TrimSpace(parts[1])
    if key == "" { continue }
    if os.Getenv(key) == "" {
      os.Setenv(key, value)
    }
  }
}

func main() {
  loadEnvFile(".env")
  fmt.Println("DB_HOST", os.Getenv("DB_HOST"))
  fmt.Println("DB_PORT", os.Getenv("DB_PORT"))
  fmt.Println("DB_USER", os.Getenv("DB_USER"))
  fmt.Println("DB_PASSWORD", os.Getenv("DB_PASSWORD") == "")
  fmt.Println("DB_NAME", os.Getenv("DB_NAME"))
  fmt.Println("JWT_SECRET", os.Getenv("JWT_SECRET") != "")

  database.ConnectDB()

  email := strings.ToLower(strings.TrimSpace("mas@abd.com"))
  password := "mas@abd.com"

  hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 14)
  if err != nil {
    log.Fatal(err)
  }
  fmt.Println("new hash", string(hashedPassword))

  var profile models.Profile
  existing := database.DB.Where("LOWER(email) = ?", email).First(&profile)
  if existing.Error != nil {
    fmt.Println("existing error", existing.Error)
    if existing.Error == gorm.ErrRecordNotFound {
      profile = models.Profile{UserID: uuid.New(), Email: email, Password: string(hashedPassword), DisplayName: "Admin Mas"}
      if err := database.DB.Create(&profile).Error; err != nil { log.Fatal(err) }
    } else { log.Fatal(existing.Error) }
  } else {
    if err := database.DB.Exec("UPDATE profiles SET password = ?, display_name = ?, email = ? WHERE LOWER(email) = ?", string(hashedPassword), "Admin Mas", email, email).Error; err != nil { log.Fatal(err) }
  }

  var profile2 models.Profile
  if err := database.DB.Where("LOWER(email) = ?", email).First(&profile2).Error; err != nil { log.Fatal(err) }
  fmt.Println("db hash after update", profile2.Password)
}
