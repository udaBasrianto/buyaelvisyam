package main

import (
	"fmt"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	hash := "$2a$14$GJNqzKFN6Xyy5moh0y83pO9qa0Bm9Ikr7vkrTLGVAMrfKRQon6d8S"
	pwd := "mas@abd.com"
	fmt.Printf("hash=%q len=%d\n", hash, len(hash))
	fmt.Printf("pwd=%q len=%d\n", pwd, len(pwd))
	fmt.Printf("verify=%v\n", bcrypt.CompareHashAndPassword([]byte(hash), []byte(pwd)))
	// try common variants
	for _, s := range []string{pwd + "\n", pwd + " ", "\t" + pwd, pwd + "\r", strings.TrimSpace(pwd)} {
		fmt.Printf("try %q -> %v\n", s, bcrypt.CompareHashAndPassword([]byte(hash), []byte(s)))
	}
}
