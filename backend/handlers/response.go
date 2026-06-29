package handlers

import "github.com/gofiber/fiber/v2"

// StandardResponse defines the unified API response format
type StandardResponse struct {
	Status  string      `json:"status"`  // "success" or "error"
	Message string      `json:"message"` // Human-readable message
	Data    interface{} `json:"data"`    // Response payload or error details
	Error   string      `json:"error"`   // Deprecated: use message instead
}

// SuccessResponse sends a standardized success response
func SuccessResponse(c *fiber.Ctx, code int, message string, data interface{}) error {
	return c.Status(code).JSON(StandardResponse{
		Status:  "success",
		Message: message,
		Data:    data,
	})
}

// ErrorResponse sends a standardized error response
func ErrorResponse(c *fiber.Ctx, code int, message string) error {
	return c.Status(code).JSON(StandardResponse{
		Status:  "error",
		Message: message,
		Data:    nil,
	})
}

// ParseErrorResponse converts fiber errors to standard format
func ParseErrorResponse(c *fiber.Ctx, err error) error {
	if err == nil {
		return nil
	}

	if fiberErr, ok := err.(*fiber.Error); ok {
		return ErrorResponse(c, fiberErr.Code, fiberErr.Message)
	}

	// Generic error
	return ErrorResponse(c, fiber.StatusInternalServerError, "Internal server error")
}
