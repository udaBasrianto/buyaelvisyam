package handlers

import (
	"errors"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

// requestClaims returns the JWT claims of the caller, or nil when the request
// is anonymous or carries an invalid token. Works on both protected routes
// (claims set by the JWT middleware) and public routes (Authorization header
// parsed and verified here).
func requestClaims(c *fiber.Ctx) jwt.MapClaims {
	if tok, ok := c.Locals("user").(*jwt.Token); ok && tok != nil && tok.Valid {
		if claims, ok := tok.Claims.(jwt.MapClaims); ok {
			return claims
		}
	}

	authHeader := c.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil
	}
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		return nil
	}
	tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	tok, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || tok == nil || !tok.Valid {
		return nil
	}
	claims, _ := tok.Claims.(jwt.MapClaims)
	return claims
}

// requestIdentity returns (userID, role) of the caller; both empty when anonymous.
func requestIdentity(c *fiber.Ctx) (string, string) {
	claims := requestClaims(c)
	if claims == nil {
		return "", ""
	}
	uid, _ := claims["user_id"].(string)
	role, _ := claims["role"].(string)
	return strings.TrimSpace(uid), strings.TrimSpace(role)
}

func isAdminRole(role string) bool {
	return role == "admin" || role == "superadmin"
}

func isStaffRole(role string) bool {
	return isAdminRole(role) || role == "kontributor"
}
