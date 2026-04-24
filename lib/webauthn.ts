/**
 * WebAuthn helpers — server-side challenge management.
 * Uses a simple in-memory challenge cache (replace with Redis / DB in production).
 */

// Active challenges: origin → base64url challenge
const challenges = new Map<string, string>()

export function generateChallenge(): string {
  const bytes = new Uint8Array(32)
  // Node crypto
  const { randomFillSync } = require('crypto')
  randomFillSync(bytes)
  return Buffer.from(bytes).toString('base64url')
}

export function storeChallenge(key: string, challenge: string) {
  challenges.set(key, challenge)
  // Auto-expire after 5 minutes
  setTimeout(() => challenges.delete(key), 5 * 60 * 1000)
}

export function consumeChallenge(key: string): string | null {
  const c = challenges.get(key) ?? null
  challenges.delete(key)
  return c
}

/**
 * Parse the clientDataJSON to verify the challenge.
 * Full verification (signature, counter, rpId, etc.) should use a library
 * like `@simplewebauthn/server` in production.
 */
export function verifyClientData(
  clientDataJSON: string,
  expectedChallenge: string,
  type: 'webauthn.create' | 'webauthn.get'
): boolean {
  try {
    const decoded = Buffer.from(clientDataJSON, 'base64url').toString('utf8')
    const data = JSON.parse(decoded)
    return data.type === type && data.challenge === expectedChallenge
  } catch {
    return false
  }
}
