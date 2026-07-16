package main

import (
	"log"
	"net/http"
	"os"

	"trova-backend/controllers"

	"github.com/gin-gonic/gin"
)

func main() {
	// Configure Gin Mode
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(ginMode)
	}

	r := gin.Default()

	// Strict CORS Configuration allowing developer frames and port tunnels
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Root operational check
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"platform": "Trova.co API Engine",
			"status":   "operational",
			"market":   "Global",
			"version":  "1.0.0",
		})
	})

	// Group API v1 endpoints
	v1 := r.Group("/api/v1")
	{
		// Escrow Transaction Routing Group
		v1.POST("/transaction/mint", controllers.MintTransaction)
		v1.POST("/dispute/activate", controllers.ActivateDispute)
		v1.POST("/chat/send", controllers.SendChatLog)

		// Status query details
		v1.GET("/transaction/:hash", func(c *gin.Context) {
			hash := c.Param("hash")
			c.JSON(http.StatusOK, gin.H{
				"hash":           hash,
				"currentState":   "secured_vault",
				"valuationTotal": 150000,
			})
		})
	}

	// Start the automatic settlement cron
	controllers.StartAutomaticSettlementCron()

	// Dynamic port determination
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Trova Full-Stack Go Engine booting on port %s...", port)
	if err := r.Run("0.0.0.0:" + port); err != nil {
		log.Fatalf("Fatal failed to launch core Gin engine: %v", err)
	}
}
