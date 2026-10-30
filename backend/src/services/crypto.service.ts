import crypto from 'crypto';
import argon2 from 'argon2';

export class CryptoService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP (100000 to 999999).
   */
  static generateSixDigitOtp(): string {
    const min = 100000;
    const max = 1000000;
    const num = crypto.randomInt(min, max);
    return num.toString();
  }

  /**
   * Hashes sensitive data (OTP, password, API key) using Argon2id.
   */
  static async hashSensitive(value: string): Promise<string> {
    return argon2.hash(value, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  /**
   * Verifies a plain text value against an Argon2id hash.
   */
  static async verifySensitive(hash: string, plainText: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText);
    } catch {
      return false;
    }
  }

  /**
   * Generates a cryptographically strong random token (hex string).
   */
  static generateSecureToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Generates an HMAC-SHA256 signature for message integrity & authentication.
   */
  static generateHmacSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Validates an HMAC-SHA256 signature using timing-safe comparison to prevent timing attacks.
   */
  static verifyHmacSignature(payload: string, secret: string, expectedSignature: string): boolean {
    const computedSignature = this.generateHmacSignature(payload, secret);
    const computedBuffer = Buffer.from(computedSignature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (computedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
  }
}
