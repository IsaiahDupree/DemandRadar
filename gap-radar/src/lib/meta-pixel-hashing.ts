/**
 * User Data Hashing (PII) for Meta Pixel & CAPI (META-006)
 * ==========================================================
 *
 * Implements SHA-256 hashing for PII data (email, phone) as required by
 * Meta's Conversions API. All PII must be hashed before sending to Meta.
 *
 * Official docs: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 */

import crypto from 'crypto';

/**
 * Hash a string using SHA-256
 *
 * Per Meta's requirements, all PII data (email, phone) must be hashed
 * using SHA-256 before sending to the Conversions API.
 *
 * @param value - The string to hash
 * @returns SHA-256 hash in hexadecimal format (64 characters)
 *
 * @example
 * const emailHash = hashSHA256('test@example.com');
 * // Returns: "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"
 */
export function hashSHA256(value: string): string {
  return crypto.createHash('sha256').update(value.trim()).digest('hex');
}

/**
 * Normalize email address for hashing
 *
 * Per Meta's requirements:
 * - Convert to lowercase
 * - Trim whitespace
 *
 * @param email - Email address to normalize
 * @returns Normalized email address
 *
 * @example
 * const normalized = normalizeEmail('  Test@EXAMPLE.COM  ');
 * // Returns: "test@example.com"
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize phone number for hashing
 *
 * Per Meta's requirements:
 * - Remove all non-numeric characters except leading +
 * - Trim whitespace
 *
 * @param phone - Phone number to normalize
 * @returns Normalized phone number
 *
 * @example
 * const normalized = normalizePhone('+1 (234) 567-8900');
 * // Returns: "+12345678900"
 */
export function normalizePhone(phone: string): string {
  // Trim whitespace
  const trimmed = phone.trim();

  // Check if it starts with +
  const hasPlus = trimmed.startsWith('+');

  // Remove all non-numeric characters
  const digitsOnly = trimmed.replace(/\D/g, '');

  // Add back the + if it was there
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * User data with PII
 */
export interface UserData {
  email?: string;
  phone?: string;
  fbc?: string; // Facebook Click ID
  fbp?: string; // Facebook Browser ID
  client_ip_address?: string;
  client_user_agent?: string;
}

/**
 * Hashed user data for CAPI
 */
export interface HashedUserData {
  em?: string; // Hashed email
  ph?: string; // Hashed phone
  fbc?: string; // Facebook Click ID (not hashed)
  fbp?: string; // Facebook Browser ID (not hashed)
  client_ip_address?: string;
  client_user_agent?: string;
}

/**
 * Hash user data for CAPI
 *
 * Hashes PII fields (email, phone) while preserving non-PII fields.
 * Follows Meta's normalization requirements:
 * - Email: lowercase, then hash
 * - Phone: remove formatting, then hash
 * - Facebook cookies: preserve as-is
 *
 * @param userData - User data with PII
 * @returns Hashed user data ready for CAPI
 *
 * @example
 * const hashed = hashUserData({
 *   email: 'Test@Example.com',
 *   phone: '+1 (234) 567-8900',
 *   fbc: 'fb.1.1234567890.abcdefg',
 *   fbp: 'fb.1.1234567890.hijklmn'
 * });
 * // Returns:
 * // {
 * //   em: "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b",
 * //   ph: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
 * //   fbc: "fb.1.1234567890.abcdefg",
 * //   fbp: "fb.1.1234567890.hijklmn"
 * // }
 */
export function hashUserData(userData: UserData): HashedUserData {
  const hashed: HashedUserData = {};

  // Hash email (normalize first)
  if (userData.email) {
    const normalized = normalizeEmail(userData.email);
    hashed.em = hashSHA256(normalized);
  }

  // Hash phone (normalize first)
  if (userData.phone) {
    const normalized = normalizePhone(userData.phone);
    hashed.ph = hashSHA256(normalized);
  }

  // Preserve non-PII fields as-is
  if (userData.fbc) {
    hashed.fbc = userData.fbc;
  }

  if (userData.fbp) {
    hashed.fbp = userData.fbp;
  }

  if (userData.client_ip_address) {
    hashed.client_ip_address = userData.client_ip_address;
  }

  if (userData.client_user_agent) {
    hashed.client_user_agent = userData.client_user_agent;
  }

  return hashed;
}
