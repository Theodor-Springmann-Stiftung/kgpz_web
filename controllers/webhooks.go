package controllers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"github.com/gofiber/fiber/v2"
)

const SIGNATURE_PREFIX = "sha256="

func PostWebhook(secret string) (fiber.Handler, chan bool) {
	devchan := make(chan bool)
	return func(c *fiber.Ctx) error {
		body := c.Body()
		if !verifySignature256([]byte(secret), body, c.Get("X-Hub-Signature-256")) {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		if c.Get("X-GitHub-Event") == "" {
			return c.SendStatus(fiber.StatusBadRequest)
		}

		go func() {
			devchan <- true
		}()

		c.SendStatus(fiber.StatusOK)
		return nil
	}, devchan
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
