package controllers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"github.com/gofiber/fiber/v2"
)

const SIGNATURE_PREFIX = "sha256="

func PostWebhook(kgpz WebhookInterface) func(c *fiber.Ctx) error {
	return func(c *fiber.Ctx) error {
		body := c.Body()
		if !verifySignature256([]byte(kgpz.GetWebHookSecret()), body, c.Get("X-Hub-Signature-256")) {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		if c.Get("X-GitHub-Event") == "" {
			return c.SendStatus(fiber.StatusBadRequest)
		}

		// Respond with 200 immediately, then process asynchronously
		go kgpz.Pull()

		return c.SendStatus(fiber.StatusOK)
	}
}

// KGPZInterface defines the interface needed by the webhook
type WebhookInterface interface {
	GetWebHookSecret() string
	Pull()
}

func sign256(secret, body []byte) []byte {
	computed := hmac.New(sha256.New, secret)
	computed.Write(body)
	return []byte(computed.Sum(nil))
}

func verifySignature256(secret, payload []byte, header string) bool {
	if !strings.HasPrefix(header, SIGNATURE_PREFIX) {
		return false
	}

	sig, err := hex.DecodeString(header[len(SIGNATURE_PREFIX):])
	if err != nil {
		return false
	}

	mac := hmac.New(sha256.New, secret)
	mac.Write(payload)
	expected := mac.Sum(nil)

	return hmac.Equal(expected, sig)
}
