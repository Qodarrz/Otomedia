package helpers

import "github.com/gin-gonic/gin"

func RespondError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{
		"error":   true,
		"message": message,
	})
}

func RespondJSON(c *gin.Context, status int, payload interface{}) {
	c.JSON(status, payload)
}
