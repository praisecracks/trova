package controllers

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// DB connection dependency injected by main assembly
var DB *sql.DB

// EscrowTransaction represents our central model structure matching schema
type EscrowTransaction struct {
	ID             uuid.UUID `json:"id"`
	SecureHash     string    `json:"secureHash"`
	MerchantID     uuid.UUID `json:"merchantId"`
	ValuationTotal float64   `json:"valuationTotal"`
	ShippingFee    float64   `json:"shippingFee"`
	CurrentState   string    `json:"currentState"` // pending_deposit, secured_vault, dispatched, disputed, settled
	LockExpiration *time.Time `json:"lockExpiration"`
	EntryDate      time.Time `json:"entryDate"`
}

type MintRequest struct {
	MerchantID     uuid.UUID `json:"merchantId" binding:"required"`
	ValuationTotal float64   `json:"valuationTotal" binding:"required"`
	ShippingFee    float64   `json:"shippingFee"`
}

type DisputeRequest struct {
	TransactionID uuid.UUID `json:"transactionId" binding:"required"`
}

type ChatPayload struct {
	TransactionID uuid.UUID `json:"transactionId" binding:"required"`
	TextPayload   string    `json:"textPayload" binding:"required"`
	AuthorRole    string    `json:"authorRole" binding:"required"` // buyer, merchant, support
}

// 1. POST /api/v1/transaction/mint
// Generates secure SHA-256 hash parameter, inserts transaction with status 'pending_deposit'
func MintTransaction(c *gin.Context) {
	var req MintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields: " + err.Error()})
		return
	}

	// Calculate unique cryptographic hash representing this billing session
	randomSalt := fmt.Sprintf("%d-%f-%s", rand.Int63(), req.ValuationTotal, req.MerchantID.String())
	hasher := sha256.New()
	hasher.Write([]byte(randomSalt))
	secureHash := hex.EncodeToString(hasher.Sum(nil))[:16]

	newTxID := uuid.New()
	const query = `
		INSERT INTO transactions (id, secure_hash, merchant_id, valuation_total, shipping_fee, current_state, entry_date)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
	`
	
	// Real-world SQL execution with connection safety
	if DB != nil {
		_, err := DB.Exec(query, newTxID, secureHash, req.MerchantID, req.ValuationTotal, req.ShippingFee, "pending_deposit")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist database transaction: " + err.Error()})
			return
		}
	}

	checkoutURL := fmt.Sprintf("https://trova.co/pay/%s", secureHash)

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Trade escrow link minted successfully",
		"transaction":  newTxID,
		"secureHash":   secureHash,
		"currentState": "pending_deposit",
		"checkoutUrl":  checkoutURL,
	})
}

// 2. POST /api/v1/dispute/activate
// Triggered by buyer hold flag, pauses timer, updates state to 'disputed' & sets 72h countdown
func ActivateDispute(c *gin.Context) {
	var req DisputeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing transaction identifier: " + err.Error()})
		return
	}

	// Lock expiration timestamp is exactly 3 days (72 hours) from execution moment
	lockExpiryTime := time.Now().Add(72 * time.Hour)

	const updateQuery = `
		UPDATE transactions
		SET current_state = 'disputed', lock_expiration = $1
		WHERE id = $2 AND current_state IN ('secured_vault', 'dispatched')
	`

	if DB != nil {
		result, err := DB.Exec(updateQuery, lockExpiryTime, req.TransactionID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to apply database dispute hold: " + err.Error()})
			return
		}
		rows, _ := result.RowsAffected()
		if rows == 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "Transaction not eligible for dispute hold"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Custody dispute activated. Funds frozen inside secure vault.",
		"status":          "disputed",
		"lockExpiration":  lockExpiryTime,
		"arbitrationDays": 3,
	})
}

// 3. POST /api/v1/chat/send
// Records dispute messaging logs in the P2P chat ledger relational schema
func SendChatLog(c *gin.Context) {
	var payload ChatPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid text stream: " + err.Error()})
		return
	}

	const insertQuery = `
		INSERT INTO chat_logs (transaction_id, text_payload, author_role, logging_time)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
	`

	if DB != nil {
		_, err := DB.Exec(insertQuery, payload.TransactionID, payload.TextPayload, payload.AuthorRole)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log message: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Chat saved successfully",
		"author":      payload.AuthorRole,
		"loggingTime": time.Now(),
	})
}

// 4. Background Service Cron Route / RunBackgroundSettlements
// Continuous Go routine tracker script executing automatic bank settlement routines
func StartAutomaticSettlementCron() {
	ticker := time.NewTicker(30 * time.Minute)
	go func() {
		for range ticker.C {
			if DB == nil {
				continue
			}

			// (A) Check with 24 hours elapsed in dispatched state with no dispute
			autoReleaseTime := time.Now().Add(-24 * time.Hour)
			const releaseQuery = `
				SELECT id, valuation_total, shipping_fee, merchant_id 
				FROM transactions 
				WHERE current_state = 'dispatched' AND entry_date <= $1
			`

			rows, err := DB.Query(releaseQuery, autoReleaseTime)
			if err == nil {
				for rows.Next() {
					var txID, merchantID uuid.UUID
					var val, ship float64
					if errScan := rows.Scan(&txID, &val, &ship, &merchantID); errScan == nil {
						// Execute commercial settlement transfer routine
						DisburseFundsToMerchant(txID, merchantID, val+ship)
					}
				}
				rows.Close()
			}

			// (B) Check with 72h countdown lapsed under Dispute with no admin manual trigger
			const disputeReleaseQuery = `
				SELECT id, valuation_total, shipping_fee, merchant_id 
				FROM transactions 
				WHERE current_state = 'disputed' AND lock_expiration <= $1
			`

			rowsDispute, errDispute := DB.Query(disputeReleaseQuery, time.Now())
			if errDispute == nil {
				for rowsDispute.Next() {
					var txID, merchantID uuid.UUID
					var val, ship float64
					if errScan := rowsDispute.Scan(&txID, &val, &ship, &merchantID); errScan == nil {
						// Lock has expired with no action, trigger fallback settlement release
						DisburseFundsToMerchant(txID, merchantID, val+ship)
					}
				}
				rowsDispute.Close()
			}
		}
	}()
}

// DisburseFundsToMerchant handles payment settlement to target bank routing details
func DisburseFundsToMerchant(txID uuid.UUID, merchantID uuid.UUID, cashAmount float64) {
	// 1. Fetch bank account details inside vendors table
	var bankAcc, bankRouting string
	const vendorQuery = `
		SELECT target_account_number, bank_routing_code 
		FROM vendors 
		WHERE id = $1
	`
	
	err := DB.QueryRow(vendorQuery, merchantID).Scan(&bankAcc, &bankRouting)
	if err != nil {
		fmt.Printf("[CRITICAL SETTLE FAIL] Vendor retrieval error: %v for Tx: %s\n", err, txID.String())
		return
	}

	// 2. Perform NIBSS (Nigeria Inter-Bank Settlement System) clearing API mock transfer
	fmt.Printf("[Settlement Node] Transferring ₦%f to bank: %s account: %s via routing NIBSS\n", cashAmount, bankRouting, bankAcc)

	// 3) Update transaction state in database pool status to 'settled'
	const updateTx = `
		UPDATE transactions
		SET current_state = 'settled'
		WHERE id = $1
	`
	_, _ = DB.Exec(updateTx, txID)
}
