package main

import (
  "fmt"
  "golang.org/x/crypto/bcrypt"
)

func main() {
  hash := "$2a$14$GJNqzKFN6Xyy5moh0y83pO9qa0Bm9Ikr7vkrTLGVAMrfKRQon6d8S"
  password := "mas@abd.com"
  err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
  fmt.Println("compare err:", err)
}
