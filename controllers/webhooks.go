package controllers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/gofiber/fiber/v2"
)

const SIGNATURE_PREFIX = "sha256="

func PostWebhook(kgpz WebhookInterface) func(c *fiber.Ctx) error {
	return func(c *fiber.Ctx) error {
		body := c.Body()
		ip := c.IP()
		event := c.Get("X-GitHub-Event")
		ua := c.Get("User-Agent")
		sigValid := verifySignature256([]byte(kgpz.GetWebHookSecret()), body, c.Get("X-Hub-Signature-256"))

		logging.Info("webhook received",
			"ip="+ip,
			"event="+event,
			"user_agent="+ua,
			"signature_valid="+fmt.Sprintf("%t", sigValid),
		)

		if !sigValid {
			logging.Info("webhook rejected: invalid signature from " + ip)
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		if event == "" {
			logging.Info("webhook rejected: missing X-GitHub-Event from " + ip)
			return c.SendStatus(fiber.StatusBadRequest)
		}

		if kgpz.IsPullInProgress() {
			logging.Info("webhook skipped: pull already in progress")
			return c.SendStatus(fiber.StatusOK)
		}

		// Respond with 200 immediately, then process asynchronously
		logging.Info("webhook accepted: starting pull for event " + event)
		go kgpz.Pull()

		return c.SendStatus(fiber.StatusOK)
	}
}

// WebhookInterface defines the interface needed by the webhook
type WebhookInterface interface {
	GetWebHookSecret() string
	Pull()
	IsPullInProgress() bool
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
