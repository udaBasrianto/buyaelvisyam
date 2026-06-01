package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	jwtware "github.com/gofiber/jwt/v3"
	"github.com/golang-jwt/jwt/v4"
)

// Protected check token
func Protected() fiber.Handler {
	return jwtware.New(jwtware.Config{
		SigningKey:   []byte(os.Getenv("JWT_SECRET")),
		SigningMethod: "HS256",
		ErrorHandler: jwtError,
	})
}

func RequireAnyRole(roles ...string) fiber.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[strings.TrimSpace(r)] = struct{}{}
	}

	return func(c *fiber.Ctx) error {
		user := c.Locals("user")
		token, ok := user.(*jwt.Token)
		if !ok || token == nil {
			return c.Status(fiber.StatusUnauthorized).
				JSON(fiber.Map{"status": "error", "message": "Unauthorized", "data": nil})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).
				JSON(fiber.Map{"status": "error", "message": "Unauthorized", "data": nil})
		}

		role, _ := claims["role"].(string)
		role = strings.TrimSpace(role)
		if role == "" {
			return c.Status(fiber.StatusForbidden).
				JSON(fiber.Map{"status": "error", "message": "Forbidden", "data": nil})
		}

		if _, ok := allowed[role]; !ok {
			return c.Status(fiber.StatusForbidden).
				JSON(fiber.Map{"status": "error", "message": "Forbidden", "data": nil})
		}

		return c.Next()
	}
}

func jwtError(c *fiber.Ctx, err error) error {
	if err.Error() == "Missing or malformed JWT" {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"status": "error", "message": "Missing or malformed JWT", "data": nil})
	}
	return c.Status(fiber.StatusUnauthorized).
		JSON(fiber.Map{"status": "error", "message": "Invalid or expired JWT", "data": nil})
}
