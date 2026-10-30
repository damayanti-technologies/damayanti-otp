/**
 * Damayanti OTP Client SDK
 * Official JavaScript/TypeScript SDK for Damayanti authentication platform.
 * Copyright (c) Damayanti Technologies.
 */
class DamayantiAuth {
  constructor(config) {
    this.baseUrl = (config.baseUrl || 'http://localhost:4000').replace(/\/$/, '');
    this.apiKey = config.apiKey || '';
  }

  async _fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error?.message || `API error HTTP ${res.status}`);
    }
    return data;
  }

  /**
   * Request a 6-digit OTP code for a phone number.
   * @param {string} phoneNumber - Indian or international mobile number (e.g. "9876543210")
   */
  async requestOtp(phoneNumber) {
    return this._fetch('/api/v1/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  /**
   * Verify the 6-digit OTP code against the correlation ID.
   * @param {string} correlationId - Correlation ID returned by requestOtp
   * @param {string} code - 6-digit numeric code
   */
  async verifyOtp(correlationId, code) {
    return this._fetch('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ correlationId, code: String(code).trim() }),
    });
  }

  /**
   * Invalidate previous code and resend a new OTP (after cooldown).
   * @param {string} correlationId - Existing correlation ID
   */
  async resendOtp(correlationId) {
    return this._fetch('/api/v1/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ correlationId }),
    });
  }

  /**
   * Terminate active authentication session.
   * @param {string} sessionToken - Active user session token
   */
  async logout(sessionToken) {
    return this._fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ sessionToken }),
    });
  }

  /**
   * Validate session status.
   * @param {string} sessionToken - Active user session token
   */
  async getSession(sessionToken) {
    return this._fetch('/api/v1/auth/session', {
      method: 'GET',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
  }
}

// Global export for vanilla HTML / ES modules
if (typeof window !== 'undefined') {
  window.DamayantiAuth = DamayantiAuth;
}
if (typeof module !== 'undefined') {
  module.exports = { DamayantiAuth };
}
