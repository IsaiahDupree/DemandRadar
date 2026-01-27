/**
 * Tests for User Data Hashing (PII) (META-006)
 */

import crypto from 'crypto';
import { hashSHA256 } from '@/lib/meta-pixel-hashing';

describe('User Data Hashing (PII) (META-006)', () => {
  describe('hashSHA256', () => {
    it('should hash email correctly using SHA-256', () => {
      const email = 'test@example.com';
      const expectedHash = crypto
        .createHash('sha256')
        .update(email)
        .digest('hex');

      const hash = hashSHA256(email);

      expect(hash).toBe(expectedHash);
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64-character hex string
    });

    it('should hash phone number correctly', () => {
      const phone = '+1234567890';
      const expectedHash = crypto
        .createHash('sha256')
        .update(phone)
        .digest('hex');

      const hash = hashSHA256(phone);

      expect(hash).toBe(expectedHash);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should trim whitespace before hashing', () => {
      const email = '  test@example.com  ';
      const emailTrimmed = 'test@example.com';

      const hash = hashSHA256(email);
      const expectedHash = crypto
        .createHash('sha256')
        .update(emailTrimmed)
        .digest('hex');

      expect(hash).toBe(expectedHash);
    });

    it('should produce consistent hashes for the same input', () => {
      const email = 'user@example.com';

      const hash1 = hashSHA256(email);
      const hash2 = hashSHA256(email);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      const hash1 = hashSHA256(email1);
      const hash2 = hashSHA256(email2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle case-sensitive hashing (emails should be lowercased first)', () => {
      // According to Meta's requirements, emails should be lowercased before hashing
      const emailUpper = 'TEST@EXAMPLE.COM';
      const emailLower = 'test@example.com';

      const hashUpper = hashSHA256(emailUpper);
      const hashLower = hashSHA256(emailLower);

      // Should be different since we're hashing the raw input
      expect(hashUpper).not.toBe(hashLower);

      // But if we lowercase first, they should match
      const hashUpperLowercased = hashSHA256(emailUpper.toLowerCase());
      expect(hashUpperLowercased).toBe(hashLower);
    });
  });

  describe('normalizeEmail', () => {
    it('should convert email to lowercase', () => {
      const { normalizeEmail } = require('@/lib/meta-pixel-hashing');

      const email = 'Test@EXAMPLE.COM';
      const normalized = normalizeEmail(email);

      expect(normalized).toBe('test@example.com');
    });

    it('should trim whitespace from email', () => {
      const { normalizeEmail } = require('@/lib/meta-pixel-hashing');

      const email = '  test@example.com  ';
      const normalized = normalizeEmail(email);

      expect(normalized).toBe('test@example.com');
    });

    it('should handle already normalized emails', () => {
      const { normalizeEmail } = require('@/lib/meta-pixel-hashing');

      const email = 'test@example.com';
      const normalized = normalizeEmail(email);

      expect(normalized).toBe('test@example.com');
    });
  });

  describe('normalizePhone', () => {
    it('should remove non-numeric characters except leading +', () => {
      const { normalizePhone } = require('@/lib/meta-pixel-hashing');

      const phone = '+1 (234) 567-8900';
      const normalized = normalizePhone(phone);

      expect(normalized).toBe('+12345678900');
    });

    it('should preserve leading + for international format', () => {
      const { normalizePhone } = require('@/lib/meta-pixel-hashing');

      const phone = '+44 20 1234 5678';
      const normalized = normalizePhone(phone);

      expect(normalized).toBe('+442012345678');
    });

    it('should trim whitespace from phone', () => {
      const { normalizePhone } = require('@/lib/meta-pixel-hashing');

      const phone = '  +1234567890  ';
      const normalized = normalizePhone(phone);

      expect(normalized).toBe('+1234567890');
    });
  });

  describe('hashUserData', () => {
    it('should hash all PII fields correctly', () => {
      const { hashUserData } = require('@/lib/meta-pixel-hashing');

      const userData = {
        email: 'Test@Example.com',
        phone: '+1 (234) 567-8900',
        fbc: 'fb.1.1234567890.abcdefg',
        fbp: 'fb.1.1234567890.hijklmn',
      };

      const hashed = hashUserData(userData);

      // Email should be hashed (lowercased first)
      expect(hashed.em).toBeDefined();
      expect(hashed.em).toMatch(/^[a-f0-9]{64}$/);
      expect(hashed.em).not.toBe(userData.email);

      // Phone should be hashed (normalized first)
      expect(hashed.ph).toBeDefined();
      expect(hashed.ph).toMatch(/^[a-f0-9]{64}$/);
      expect(hashed.ph).not.toBe(userData.phone);

      // Facebook cookies should be preserved
      expect(hashed.fbc).toBe(userData.fbc);
      expect(hashed.fbp).toBe(userData.fbp);
    });

    it('should handle missing email/phone gracefully', () => {
      const { hashUserData } = require('@/lib/meta-pixel-hashing');

      const userData = {
        fbc: 'fb.1.1234567890.abcdefg',
        fbp: 'fb.1.1234567890.hijklmn',
      };

      const hashed = hashUserData(userData);

      expect(hashed.em).toBeUndefined();
      expect(hashed.ph).toBeUndefined();
      expect(hashed.fbc).toBe(userData.fbc);
      expect(hashed.fbp).toBe(userData.fbp);
    });

    it('should handle partial user data', () => {
      const { hashUserData } = require('@/lib/meta-pixel-hashing');

      const userData = {
        email: 'user@example.com',
      };

      const hashed = hashUserData(userData);

      expect(hashed.em).toBeDefined();
      expect(hashed.ph).toBeUndefined();
      expect(hashed.fbc).toBeUndefined();
      expect(hashed.fbp).toBeUndefined();
    });
  });

  describe('Integration with CAPI', () => {
    it('should produce correct hash format for Meta API', () => {
      // Test case from Meta's documentation
      const email = 'test@example.com';

      const hash = hashSHA256(email);

      // Verify it's a valid SHA-256 hex string
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash.length).toBe(64);

      // Verify it matches expected output
      const expectedHash = crypto
        .createHash('sha256')
        .update(email)
        .digest('hex');
      expect(hash).toBe(expectedHash);
    });

    it('should match Meta example: joe@example.com', () => {
      // Example from Meta's documentation
      const email = 'joe@example.com';

      const hash = hashSHA256(email);

      // This is the actual hash for joe@example.com using SHA-256
      const expectedHash =
        '2481f36dfc515ca76451aaadf1399026942a01ee50c6d0a61988b43cef039bc2';

      expect(hash).toBe(expectedHash);
    });
  });
});
