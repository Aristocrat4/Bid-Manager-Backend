import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * EncryptionService provides AES-256-GCM encryption/decryption for sensitive data
 * Used to encrypt company Copart/IAAI credentials in the database
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate encryption key on module initialization
   */
  onModuleInit(): void {
    const key = this.configService.get<string>('ENCRYPTION_KEY');

    if (!key) {
      throw new Error(
        'ENCRYPTION_KEY is not defined in environment variables. ' +
          'Please set a 64-character hexadecimal encryption key.',
      );
    }

    // Key must be exactly 64 hex characters (32 bytes)
    if (key.length !== 64) {
      throw new Error(
        `ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes). ` +
          `Current length: ${key.length}`,
      );
    }

    // Validate hexadecimal format
    if (!/^[0-9a-f]{64}$/i.test(key)) {
      throw new Error(
        'ENCRYPTION_KEY must contain only hexadecimal characters (0-9, a-f)',
      );
    }

    this.encryptionKey = Buffer.from(key, 'hex');
  }

  /**
   * Encrypt a plain text string using AES-256-GCM
   * @param plainText The text to encrypt
   * @returns Encrypted string in format: iv:authTag:encryptedData
   */
  encrypt(plainText: string): string {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }

      // Generate random initialization vector (12 bytes for GCM)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // Encrypt the data
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag (for GCM mode)
      const authTag = cipher.getAuthTag();

      // Return format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      // NEVER log the plainText in production
      throw new InternalServerErrorException(
        'Failed to encrypt data',
      );
    }
  }

  /**
   * Decrypt an encrypted string using AES-256-GCM
   * @param encryptedText Encrypted string in format: iv:authTag:encryptedData
   * @returns Decrypted plain text
   */
  decrypt(encryptedText: string): string {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }

      // Split the encrypted text into components
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }

      const [ivHex, authTagHex, encrypted] = parts;

      // Convert hex strings to buffers
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // Set auth tag
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // NEVER log the encrypted or decrypted text
      throw new InternalServerErrorException(
        'Failed to decrypt data',
      );
    }
  }

  /**
   * Verify that a plain text matches an encrypted value
   * Useful for testing without exposing decrypted values
   */
  verify(plainText: string, encryptedText: string): boolean {
    try {
      const decrypted = this.decrypt(encryptedText);
      return decrypted === plainText;
    } catch (error) {
      return false;
    }
  }
}
