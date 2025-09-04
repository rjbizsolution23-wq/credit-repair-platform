const crypto = require('crypto');
const winston = require('winston');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    
    // Get encryption key from environment variable
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    
    if (this.key.length !== this.keyLength) {
      throw new Error(`Encryption key must be ${this.keyLength * 2} hex characters (${this.keyLength} bytes)`);
    }
  }

  /**
   * Encrypt text using AES-256-GCM
   * @param {string} text - Text to encrypt
   * @returns {Object} - Object containing encrypted data, IV, and auth tag
   */
  encrypt(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text to encrypt must be a non-empty string');
      }

      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.key);
      cipher.setAAD(Buffer.from('credit-repair-platform'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      const result = {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.algorithm
      };
      
      logger.debug('Data encrypted successfully', {
        dataLength: text.length,
        encryptedLength: encrypted.length
      });
      
      return result;
    } catch (error) {
      logger.error('Encryption failed', {
        error: error.message,
        stack: error.stack
      });
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {Object} encryptedData - Object containing encrypted data, IV, and auth tag
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedData) {
    try {
      if (!encryptedData || typeof encryptedData !== 'object') {
        throw new Error('Encrypted data must be an object');
      }
      
      const { encrypted, iv, authTag, algorithm } = encryptedData;
      
      if (!encrypted || !iv || !authTag) {
        throw new Error('Missing required encryption components (encrypted, iv, authTag)');
      }
      
      if (algorithm && algorithm !== this.algorithm) {
        throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
      }
      
      const decipher = crypto.createDecipher(this.algorithm, this.key);
      decipher.setAAD(Buffer.from('credit-repair-platform'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      logger.debug('Data decrypted successfully', {
        encryptedLength: encrypted.length,
        decryptedLength: decrypted.length
      });
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', {
        error: error.message,
        stack: error.stack
      });
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * Hash password using PBKDF2
   * @param {string} password - Password to hash
   * @returns {Object} - Object containing salt and hash
   */
  hashPassword(password) {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }
      
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      
      logger.debug('Password hashed successfully');
      
      return { salt, hash };
    } catch (error) {
      logger.error('Password hashing failed', {
        error: error.message
      });
      throw new Error('Password hashing failed: ' + error.message);
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Password to verify
   * @param {string} salt - Salt used for hashing
   * @param {string} hash - Hash to verify against
   * @returns {boolean} - True if password matches
   */
  verifyPassword(password, salt, hash) {
    try {
      if (!password || !salt || !hash) {
        throw new Error('Password, salt, and hash are required');
      }
      
      const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      const isValid = hash === hashVerify;
      
      logger.debug('Password verification completed', { isValid });
      
      return isValid;
    } catch (error) {
      logger.error('Password verification failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Generate a secure random token
   * @param {number} length - Length of token in bytes (default: 32)
   * @returns {string} - Hex-encoded random token
   */
  generateToken(length = 32) {
    try {
      const token = crypto.randomBytes(length).toString('hex');
      
      logger.debug('Token generated successfully', {
        tokenLength: token.length
      });
      
      return token;
    } catch (error) {
      logger.error('Token generation failed', {
        error: error.message
      });
      throw new Error('Token generation failed: ' + error.message);
    }
  }

  /**
   * Create a hash of data (for integrity checking)
   * @param {string} data - Data to hash
   * @param {string} algorithm - Hash algorithm (default: sha256)
   * @returns {string} - Hex-encoded hash
   */
  createHash(data, algorithm = 'sha256') {
    try {
      if (!data) {
        throw new Error('Data is required for hashing');
      }
      
      const hash = crypto.createHash(algorithm).update(data).digest('hex');
      
      logger.debug('Hash created successfully', {
        algorithm,
        dataLength: data.length,
        hashLength: hash.length
      });
      
      return hash;
    } catch (error) {
      logger.error('Hash creation failed', {
        error: error.message,
        algorithm
      });
      throw new Error('Hash creation failed: ' + error.message);
    }
  }

  /**
   * Encrypt sensitive client data in bulk
   * @param {Object} clientData - Client data object
   * @returns {Object} - Object with encrypted sensitive fields
   */
  encryptClientData(clientData) {
    try {
      const sensitiveFields = ['ssn', 'bankAccount', 'creditCardNumber'];
      const encryptedData = { ...clientData };
      
      sensitiveFields.forEach(field => {
        if (clientData[field]) {
          encryptedData[`${field}_encrypted`] = this.encrypt(clientData[field]);
          delete encryptedData[field];
        }
      });
      
      logger.debug('Client data encrypted successfully', {
        fieldsEncrypted: sensitiveFields.filter(field => clientData[field]).length
      });
      
      return encryptedData;
    } catch (error) {
      logger.error('Client data encryption failed', {
        error: error.message
      });
      throw new Error('Client data encryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt sensitive client data in bulk
   * @param {Object} encryptedClientData - Client data with encrypted fields
   * @returns {Object} - Object with decrypted sensitive fields
   */
  decryptClientData(encryptedClientData) {
    try {
      const sensitiveFields = ['ssn', 'bankAccount', 'creditCardNumber'];
      const decryptedData = { ...encryptedClientData };
      
      sensitiveFields.forEach(field => {
        const encryptedField = `${field}_encrypted`;
        if (encryptedClientData[encryptedField]) {
          try {
            decryptedData[field] = this.decrypt(
              typeof encryptedClientData[encryptedField] === 'string' 
                ? JSON.parse(encryptedClientData[encryptedField])
                : encryptedClientData[encryptedField]
            );
            delete decryptedData[encryptedField];
          } catch (decryptError) {
            logger.warn(`Failed to decrypt ${field}`, {
              error: decryptError.message
            });
            // Keep encrypted field if decryption fails
          }
        }
      });
      
      logger.debug('Client data decrypted successfully');
      
      return decryptedData;
    } catch (error) {
      logger.error('Client data decryption failed', {
        error: error.message
      });
      throw new Error('Client data decryption failed: ' + error.message);
    }
  }

  /**
   * Mask sensitive data for logging/display
   * @param {string} data - Sensitive data to mask
   * @param {number} visibleChars - Number of characters to show (default: 4)
   * @returns {string} - Masked data
   */
  maskSensitiveData(data, visibleChars = 4) {
    if (!data || typeof data !== 'string') {
      return '***';
    }
    
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    
    const masked = '*'.repeat(data.length - visibleChars) + data.slice(-visibleChars);
    
    logger.debug('Sensitive data masked', {
      originalLength: data.length,
      maskedLength: masked.length
    });
    
    return masked;
  }
}

// Create and export singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;