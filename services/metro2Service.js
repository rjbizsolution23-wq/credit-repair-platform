/**
 * Rick Jefferson Solutions - Metro 2® Compliance Service
 * Credit Reporting Data Standards Validation
 * FCRA Section 623 Compliance Engine
 */

const winston = require('winston');
const moment = require('moment-timezone');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

/**
 * Metro 2® Format Field Requirements
 * Based on Consumer Data Industry Association (CDIA) Metro 2® Format
 */
const METRO2_FIELDS = {
  // Base Segment Fields
  PROCESSING_INDICATOR: { required: true, length: 1, type: 'alpha' },
  TIME_STAMP: { required: true, length: 26, type: 'timestamp' },
  IDENTIFICATION_NUMBER: { required: true, length: 20, type: 'alphanumeric' },
  CYCLE_IDENTIFIER: { required: true, length: 2, type: 'numeric' },
  CONSUMER_ACCOUNT_NUMBER: { required: true, length: 30, type: 'alphanumeric' },
  PORTFOLIO_TYPE: { required: true, length: 1, type: 'alpha' },
  ACCOUNT_TYPE: { required: true, length: 2, type: 'alphanumeric' },
  DATE_OPENED: { required: true, length: 8, type: 'date' },
  CREDIT_LIMIT: { required: false, length: 9, type: 'numeric' },
  HIGHEST_CREDIT: { required: false, length: 9, type: 'numeric' },
  TERMS_DURATION: { required: false, length: 3, type: 'numeric' },
  TERMS_FREQUENCY: { required: false, length: 1, type: 'alpha' },
  SCHEDULED_MONTHLY_PAYMENT: { required: false, length: 9, type: 'numeric' },
  ACTUAL_PAYMENT_AMOUNT: { required: false, length: 9, type: 'numeric' },
  ACCOUNT_STATUS: { required: true, length: 2, type: 'alphanumeric' },
  PAYMENT_RATING: { required: true, length: 1, type: 'alphanumeric' },
  PAYMENT_HISTORY_PROFILE: { required: false, length: 24, type: 'alphanumeric' },
  SPECIAL_COMMENT: { required: false, length: 2, type: 'alphanumeric' },
  COMPLIANCE_CONDITION_CODE: { required: false, length: 2, type: 'alphanumeric' },
  CURRENT_BALANCE: { required: false, length: 9, type: 'numeric' },
  AMOUNT_PAST_DUE: { required: false, length: 9, type: 'numeric' },
  ORIGINAL_CHARGE_OFF_AMOUNT: { required: false, length: 9, type: 'numeric' },
  DATE_ACCOUNT_INFORMATION_REPORTED: { required: true, length: 8, type: 'date' },
  DATE_OF_FIRST_DELINQUENCY: { required: false, length: 8, type: 'date' },
  DATE_CLOSED: { required: false, length: 8, type: 'date' },
  DATE_OF_LAST_PAYMENT: { required: false, length: 8, type: 'date' },
  INTEREST_TYPE_INDICATOR: { required: false, length: 1, type: 'alpha' },
  SURNAME: { required: true, length: 25, type: 'alpha' },
  FIRST_NAME: { required: true, length: 20, type: 'alpha' },
  MIDDLE_NAME: { required: false, length: 20, type: 'alpha' },
  GENERATION_CODE: { required: false, length: 1, type: 'alpha' },
  SOCIAL_SECURITY_NUMBER: { required: true, length: 9, type: 'numeric' },
  DATE_OF_BIRTH: { required: false, length: 8, type: 'date' },
  TELEPHONE_NUMBER: { required: false, length: 10, type: 'numeric' },
  ECOA_CODE: { required: true, length: 1, type: 'alpha' },
  CONSUMER_INFORMATION_INDICATOR: { required: false, length: 2, type: 'alphanumeric' },
  COUNTRY_CODE: { required: false, length: 2, type: 'alpha' },
  FIRST_LINE_OF_ADDRESS: { required: true, length: 32, type: 'alphanumeric' },
  SECOND_LINE_OF_ADDRESS: { required: false, length: 32, type: 'alphanumeric' },
  CITY: { required: true, length: 20, type: 'alpha' },
  STATE: { required: true, length: 2, type: 'alpha' },
  POSTAL_ZIP_CODE: { required: true, length: 9, type: 'alphanumeric' }
};

/**
 * Valid Metro 2® Account Status Codes
 */
const ACCOUNT_STATUS_CODES = {
  '11': 'Too new to rate',
  '13': 'Paid as agreed',
  '61': '30 days past due date',
  '62': '60 days past due date', 
  '63': '90 days past due date',
  '64': '120 days past due date',
  '71': '150 days past due date',
  '78': '180+ days past due date',
  '80': 'Repossession',
  '82': 'Bad debt/Placed for collection',
  '83': 'No payment history available',
  '84': 'Voluntary surrender',
  '89': 'Charged off to bad debt',
  '93': 'Account closed by consumer',
  '94': 'Account closed by credit grantor',
  '95': 'Paid or paying under a partial payment agreement',
  '96': 'Voluntary surrender',
  '97': 'Unpaid balance reported as a loss by credit grantor'
};

/**
 * Valid Payment Rating Codes
 */
const PAYMENT_RATING_CODES = {
  '0': 'Too new to rate; approved but not used',
  '1': 'Pays as agreed',
  '2': '30-59 days past due',
  '3': '60-89 days past due', 
  '4': '90-119 days past due',
  '5': '120-149 days past due',
  '6': '150-179 days past due',
  '7': '180+ days past due',
  '8': 'Repossession',
  '9': 'Bad debt/Placed for collection/Skip'
};

/**
 * ECOA (Equal Credit Opportunity Act) Codes
 */
const ECOA_CODES = {
  '1': 'Individual',
  '2': 'Joint',
  '3': 'Authorized user',
  '4': 'Terminated',
  '5': 'Shared',
  '6': 'On behalf of another person',
  '7': 'Maker',
  '8': 'Co-maker',
  '9': 'Co-signer',
  'X': 'Deceased',
  'Z': 'Delete entire account (for CRA use only)'
};

class Metro2Service {
  constructor() {
    this.timezone = 'America/Chicago';
  }

  /**
   * Validate credit report item against Metro 2® standards
   * @param {Object} item - Credit report item
   * @returns {Object} Validation results with violations
   */
  async validateItem(item) {
    try {
      const violations = [];
      const warnings = [];
      
      // Check required fields
      const requiredFieldViolations = this.checkRequiredFields(item);
      violations.push(...requiredFieldViolations);
      
      // Check field formats and lengths
      const formatViolations = this.checkFieldFormats(item);
      violations.push(...formatViolations);
      
      // Check date logic
      const dateViolations = this.checkDateLogic(item);
      violations.push(...dateViolations);
      
      // Check account status consistency
      const statusViolations = this.checkAccountStatusConsistency(item);
      violations.push(...statusViolations);
      
      // Check payment history consistency
      const paymentViolations = this.checkPaymentHistoryConsistency(item);
      violations.push(...paymentViolations);
      
      // Check ECOA code validity
      const ecoaViolations = this.checkEcoaCompliance(item);
      violations.push(...ecoaViolations);
      
      return {
        hasViolations: violations.length > 0,
        violations,
        warnings,
        complianceScore: this.calculateComplianceScore(violations, warnings),
        validatedAt: moment().tz(this.timezone).format()
      };
    } catch (error) {
      logger.error('Metro 2® validation failed', { error: error.message, item });
      throw error;
    }
  }

  /**
   * Check for missing required fields
   * @param {Object} item - Credit report item
   * @returns {Array} Array of violations
   */
  checkRequiredFields(item) {
    const violations = [];
    
    const requiredFields = Object.entries(METRO2_FIELDS)
      .filter(([field, config]) => config.required)
      .map(([field]) => field);
    
    for (const field of requiredFields) {
      const fieldName = field.toLowerCase().replace(/_/g, '');
      const value = this.getFieldValue(item, fieldName);
      
      if (!value || value === '' || value === null || value === undefined) {
        violations.push({
          type: 'MISSING_REQUIRED_FIELD',
          field: field,
          description: `Required Metro 2® field '${field}' is missing or empty`,
          severity: 'HIGH',
          fcraSection: '623(a)(1)'
        });
      }
    }
    
    return violations;
  }

  /**
   * Check field formats and lengths
   * @param {Object} item - Credit report item
   * @returns {Array} Array of violations
   */
  checkFieldFormats(item) {
    const violations = [];
    
    for (const [field, config] of Object.entries(METRO2_FIELDS)) {
      const fieldName = field.toLowerCase().replace(/_/g, '');
      const value = this.getFieldValue(item, fieldName);
      
      if (value) {
        // Check length
        if (value.toString().length > config.length) {
          violations.push({
            type: 'FIELD_LENGTH_EXCEEDED',
            field: field,
            description: `Field '${field}' exceeds maximum length of ${config.length} characters`,
            actualLength: value.toString().length,
            maxLength: config.length,
            severity: 'MEDIUM',
            fcraSection: '623(a)(2)'
          });
        }
        
        // Check data type
        if (!this.validateFieldType(value, config.type)) {
          violations.push({
            type: 'INVALID_FIELD_FORMAT',
            field: field,
            description: `Field '${field}' has invalid format. Expected: ${config.type}`,
            actualValue: value,
            expectedType: config.type,
            severity: 'HIGH',
            fcraSection: '623(a)(2)'
          });
        }
      }
    }
    
    return violations;
  }

  /**
   * Check date logic consistency
   * @param {Object} item - Credit report item
   * @returns {Array} Array of violations
   */
  checkDateLogic(item) {
    const violations = [];
    
    const dateOpened = this.parseDate(item.dateOpened);
    const dateClosed = this.parseDate(item.dateClosed);
    const dateOfFirstDelinquency = this.parseDate(item.dateOfFirstDelinquency);
    const dateOfLastPayment = this.parseDate(item.dateOfLastPayment);
    const dateAccountInformationReported = this.parseDate(item.dateAccountInformationReported);
    
    // Date opened cannot be in the future
    if (dateOpened && dateOpened.isAfter(moment())) {
      violations.push({
        type: 'FUTURE_DATE_OPENED',
        field: 'DATE_OPENED',
        description: 'Date opened cannot be in the future',
        severity: 'HIGH',
        fcraSection: '623(a)(2)'
      });
    }
    
    // Date closed cannot be before date opened
    if (dateOpened && dateClosed && dateClosed.isBefore(dateOpened)) {
      violations.push({
        type: 'INVALID_DATE_SEQUENCE',
        field: 'DATE_CLOSED',
        description: 'Date closed cannot be before date opened',
        severity: 'HIGH',
        fcraSection: '623(a)(2)'
      });
    }
    
    // Date of first delinquency cannot be before date opened
    if (dateOpened && dateOfFirstDelinquency && dateOfFirstDelinquency.isBefore(dateOpened)) {
      violations.push({
        type: 'INVALID_DELINQUENCY_DATE',
        field: 'DATE_OF_FIRST_DELINQUENCY',
        description: 'Date of first delinquency cannot be before date opened',
        severity: 'HIGH',
        fcraSection: '623(a)(2)'
      });
    }
    
    // Date of last payment cannot be before date opened
    if (dateOpened && dateOfLastPayment && dateOfLastPayment.isBefore(dateOpened)) {
      violations.push({
        type: 'INVALID_LAST_PAYMENT_DATE',
        field: 'DATE_OF_LAST_PAYMENT',
        description: 'Date of last payment cannot be before date opened',
        severity: 'MEDIUM',
        fcraSection: '623(a)(2)'
      });
    }
    
    return violations;
  }

  /**
   * Check account status consistency
   * @param {Object} item - Credit report item
   * @returns {Array} Array of violations
   */
  checkAccountStatusConsistency(item) {
    const violations = [];
    
    const accountStatus = item.accountStatus;
    const paymentRating = item.paymentRating;
    const currentBalance = parseFloat(item.currentBalance) || 0;
    const amountPastDue = parseFloat(item.amountPastDue) || 0;
    
    // Validate account status code
    if (accountStatus && !ACCOUNT_STATUS_CODES[accountStatus]) {
      violations.push({
        type: 'INVALID_ACCOUNT_STATUS',
        field: 'ACCOUNT_STATUS',
        description: `Invalid account status code: ${accountStatus}`,
        severity: 'HIGH',
        fcraSection: '623(a)(2)'
      });
    }
    
    // Validate payment rating code
    if (paymentRating && !PAYMENT_RATING_CODES[paymentRating]) {
      violations.push({
        type: 'INVALID_PAYMENT_RATING',
        field: 'PAYMENT_RATING',
        description: `Invalid payment rating code: ${paymentRating}`,
        severity: 'HIGH',
        fcraSection: '623(a)(2)'
      });
    }
    
    // Check consistency between account status and payment rating
    if (accountStatus === '89' && paymentRating !== '9') { // Charged off
      violations.push({
        type: 'INCONSISTENT_STATUS_RATING',
        field: 'PAYMENT_RATING',
        description: 'Payment rating inconsistent with charged-off account status',
        severity: 'HIGH',
        fcraSection: '623(a)(2)'
      });
    }
    
    // Check if past due amount exists without delinquent status
    if (amountPastDue > 0 && !['61', '62', '63', '64', '71', '78'].includes(accountStatus)) {
      violations.push({
        type: 'INCONSISTENT_PAST_DUE',
        field: 'AMOUNT_PAST_DUE',
        description: 'Past due amount reported without corresponding delinquent status',
        severity: 'MEDIUM',
        fcraSection: '623(a)(2)'
      });
    }
    
    return violations;
  }

  /**
   * Check payment history consistency
   * @param {Object} item - Credit report item
   * @returns {Array} Array of violations
   */
  checkPaymentHistoryConsistency(item) {
    const violations = [];
    
    const paymentHistory = item.paymentHistoryProfile;
    const accountStatus = item.accountStatus;
    
    if (paymentHistory && paymentHistory.length === 24) {
      // Check for invalid payment history codes
      for (let i = 0; i < paymentHistory.length; i++) {
        const code = paymentHistory[i];
        if (code && !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'B', 'D', 'E', 'G', 'H', 'J', 'K', 'L'].includes(code)) {
          violations.push({
            type: 'INVALID_PAYMENT_HISTORY_CODE',
            field: 'PAYMENT_HISTORY_PROFILE',
            description: `Invalid payment history code '${code}' at position ${i + 1}`,
            severity: 'MEDIUM',
            fcraSection: '623(a)(2)'
          });
        }
      }
      
      // Check consistency with current account status
      const recentHistory = paymentHistory.substring(0, 3); // Last 3 months
      if (accountStatus === '13' && recentHistory.includes('2')) { // Paid as agreed but shows 30+ days late
        violations.push({
          type: 'INCONSISTENT_PAYMENT_HISTORY',
          field: 'PAYMENT_HISTORY_PROFILE',
          description: 'Payment history shows delinquency but account status is "Paid as agreed"',
          severity: 'HIGH',
          fcraSection: '623(a)(2)'
        });
      }
    }
    
    return violations;
  }

  /**
   * Check ECOA compliance
   * @param {Object} item - Credit report item
   * @returns {Array} Array of violations
   */
  checkEcoaCompliance(item) {
    const violations = [];
    
    const ecoaCode = item.ecoaCode;
    
    if (ecoaCode && !ECOA_CODES[ecoaCode]) {
      violations.push({
        type: 'INVALID_ECOA_CODE',
        field: 'ECOA_CODE',
        description: `Invalid ECOA code: ${ecoaCode}`,
        severity: 'HIGH',
        fcraSection: '623(a)(2)'
      });
    }
    
    return violations;
  }

  /**
   * Calculate compliance score based on violations
   * @param {Array} violations - Array of violations
   * @param {Array} warnings - Array of warnings
   * @returns {number} Compliance score (0-100)
   */
  calculateComplianceScore(violations, warnings = []) {
    let score = 100;
    
    // Deduct points for violations
    for (const violation of violations) {
      switch (violation.severity) {
        case 'HIGH':
          score -= 15;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    }
    
    // Deduct points for warnings
    score -= warnings.length * 2;
    
    return Math.max(0, score);
  }

  /**
   * Generate dispute reasons based on Metro 2® violations
   * @param {Array} violations - Array of violations
   * @returns {Array} Array of dispute reasons
   */
  generateDisputeReasons(violations) {
    const reasons = [];
    
    for (const violation of violations) {
      switch (violation.type) {
        case 'MISSING_REQUIRED_FIELD':
          reasons.push(`Missing required Metro 2® field: ${violation.field}`);
          break;
        case 'FIELD_LENGTH_EXCEEDED':
          reasons.push(`Field length violation: ${violation.field} exceeds maximum length`);
          break;
        case 'INVALID_FIELD_FORMAT':
          reasons.push(`Invalid field format: ${violation.field} does not meet Metro 2® standards`);
          break;
        case 'FUTURE_DATE_OPENED':
          reasons.push('Date opened is in the future, violating logical date sequence');
          break;
        case 'INVALID_DATE_SEQUENCE':
          reasons.push('Date sequence violation: dates are logically inconsistent');
          break;
        case 'INVALID_ACCOUNT_STATUS':
          reasons.push('Invalid account status code not recognized by Metro 2® standards');
          break;
        case 'INVALID_PAYMENT_RATING':
          reasons.push('Invalid payment rating code not recognized by Metro 2® standards');
          break;
        case 'INCONSISTENT_STATUS_RATING':
          reasons.push('Account status and payment rating are inconsistent');
          break;
        case 'INCONSISTENT_PAYMENT_HISTORY':
          reasons.push('Payment history is inconsistent with current account status');
          break;
        case 'INVALID_ECOA_CODE':
          reasons.push('Invalid ECOA code violating Equal Credit Opportunity Act requirements');
          break;
        default:
          reasons.push(`Metro 2® compliance violation: ${violation.description}`);
      }
    }
    
    return reasons;
  }

  /**
   * Helper method to get field value from item
   * @param {Object} item - Credit report item
   * @param {string} fieldName - Field name
   * @returns {*} Field value
   */
  getFieldValue(item, fieldName) {
    // Map common field names
    const fieldMap = {
      'consumeraccountnumber': 'accountNumber',
      'dateopened': 'dateOpened',
      'dateaccountinformationreported': 'dateReported',
      'dateoffirstdelinquency': 'dateOfFirstDelinquency',
      'dateclosed': 'dateClosed',
      'dateoflastpayment': 'dateOfLastPayment',
      'accountstatus': 'accountStatus',
      'paymentrating': 'paymentRating',
      'paymenthistoryprofile': 'paymentHistoryProfile',
      'currentbalance': 'currentBalance',
      'amountpastdue': 'amountPastDue',
      'creditlimit': 'creditLimit',
      'highestcredit': 'highestCredit',
      'surname': 'lastName',
      'firstname': 'firstName',
      'socialsecuritynumber': 'ssn',
      'dateofbirth': 'dateOfBirth',
      'ecoacode': 'ecoaCode',
      'firstlineofaddress': 'address1',
      'secondlineofaddress': 'address2',
      'city': 'city',
      'state': 'state',
      'postalzipcode': 'zipCode'
    };
    
    const mappedField = fieldMap[fieldName] || fieldName;
    return item[mappedField];
  }

  /**
   * Validate field type
   * @param {*} value - Field value
   * @param {string} type - Expected type
   * @returns {boolean} True if valid
   */
  validateFieldType(value, type) {
    const stringValue = value.toString();
    
    switch (type) {
      case 'alpha':
        return /^[A-Za-z\s]*$/.test(stringValue);
      case 'numeric':
        return /^[0-9]*$/.test(stringValue);
      case 'alphanumeric':
        return /^[A-Za-z0-9\s]*$/.test(stringValue);
      case 'date':
        return moment(stringValue, ['MMDDYYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], true).isValid();
      case 'timestamp':
        return moment(stringValue).isValid();
      default:
        return true;
    }
  }

  /**
   * Parse date from various formats
   * @param {string} dateString - Date string
   * @returns {moment.Moment|null} Parsed date or null
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    const formats = ['MMDDYYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'MM-DD-YYYY'];
    const parsed = moment(dateString, formats, true);
    
    return parsed.isValid() ? parsed : null;
  }

  /**
   * Check if account is subject to Metro 2® reporting
   * @param {Object} item - Credit report item
   * @returns {boolean} True if subject to Metro 2®
   */
  isSubjectToMetro2(item) {
    // Most consumer credit accounts are subject to Metro 2®
    const exemptTypes = ['medical', 'utility', 'rental'];
    const accountType = (item.accountType || '').toLowerCase();
    
    return !exemptTypes.some(type => accountType.includes(type));
  }
}

module.exports = new Metro2Service();