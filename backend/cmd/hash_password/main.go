package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "18Muharrom"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}
	fmt.Printf("Hashed password: %s\n", string(hashedPassword))
}
