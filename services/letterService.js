/**
 * Rick Jefferson Solutions - Letter Generation Service
 * Metro 2® Compliant Dispute Letter Templates
 * FCRA Sections 609, 611, 623 Enforcement
 */

const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const moment = require('moment-timezone');
const PDFDocument = require('pdfkit');
const aiService = require('./aiService');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

/**
 * Letter Template Categories
 */
const LETTER_CATEGORIES = {
  INITIAL_DISPUTE: 'Initial Dispute Letters',
  VERIFICATION: 'Method of Verification',
  FURNISHER: 'Furnisher Direct Disputes',
  ESCALATION: 'Escalation Letters',
  LEGAL: 'Legal Notice Letters',
  GOODWILL: 'Goodwill Letters',
  VALIDATION: 'Debt Validation',
  CEASE_DESIST: 'Cease and Desist',
  SETTLEMENT: 'Settlement Offers',
  COMPLIANCE: 'Compliance Violations'
};

/**
 * Rick Jefferson Solutions Letter Templates
 * Each template follows Metro 2® compliance and FCRA requirements
 */
const LETTER_TEMPLATES = {
  // INITIAL DISPUTE LETTERS
  'CRA_DISPUTE_INACCURATE': {
    id: 'CRA_DISPUTE_INACCURATE',
    category: LETTER_CATEGORIES.INITIAL_DISPUTE,
    name: 'Credit Bureau Dispute - Inaccurate Information',
    description: 'FCRA Section 611 dispute for inaccurate account information',
    fcraSection: '611(a)(1)(A)',
    template: `{date}

{bureauName}
{bureauAddress}

Re: Dispute of Inaccurate Information
Consumer: {consumerName}
SSN: XXX-XX-{lastFourSSN}
DOB: {dateOfBirth}
Address: {consumerAddress}

Dear {bureauName} Dispute Department,

I am writing to formally dispute inaccurate information appearing on my credit report. Under the Fair Credit Reporting Act (FCRA) Section 611(a)(1)(A), I have the right to dispute incomplete or inaccurate information.

The following account(s) contain inaccurate information:

{disputeItems}

I am requesting that you:
1. Conduct a reasonable reinvestigation of the disputed information
2. Verify the accuracy and completeness of the reported data with the furnisher
3. Delete or correct any information that cannot be verified as accurate and complete
4. Provide me with written results of your investigation within 30 days

Enclosed please find copies of supporting documentation. I expect your prompt attention to this matter and compliance with FCRA requirements.

Sincerely,

{consumerSignature}
{consumerName}

Enclosures: Supporting Documentation

---
This letter was prepared by Rick Jefferson Solutions
THE Credit Repair & Wealth Management Authority
info@rickjeffersonsolutions.com | 877-763-8587
Your Credit Freedom Starts Here`
  },

  'CRA_DISPUTE_INCOMPLETE': {
    id: 'CRA_DISPUTE_INCOMPLETE',
    category: LETTER_CATEGORIES.INITIAL_DISPUTE,
    name: 'Credit Bureau Dispute - Incomplete Information',
    description: 'FCRA Section 611 dispute for incomplete account information',
    fcraSection: '611(a)(1)(A)',
    template: `{date}

{bureauName}
{bureauAddress}

Re: Dispute of Incomplete Information
Consumer: {consumerName}
SSN: XXX-XX-{lastFourSSN}
DOB: {dateOfBirth}
Address: {consumerAddress}

Dear {bureauName} Dispute Department,

Pursuant to the Fair Credit Reporting Act (FCRA) Section 611(a)(1)(A), I am disputing incomplete information on my credit report that fails to meet Metro 2® reporting standards.

The following account(s) contain incomplete information:

{disputeItems}

Specific Metro 2® field deficiencies:
{metro2Violations}

I request that you:
1. Verify that all required Metro 2® fields are present and accurate
2. Ensure furnisher compliance with FCRA Section 623(a)(2)
3. Delete any account that cannot be verified as complete per Metro 2® standards
4. Provide written confirmation of your investigation results

Incomplete reporting violates both FCRA accuracy requirements and Metro 2® data standards. I expect immediate correction or deletion of these items.

Sincerely,

{consumerSignature}
{consumerName}

Enclosures: Metro 2® Compliance Analysis

---
This letter was prepared by Rick Jefferson Solutions
THE Credit Repair & Wealth Management Authority
info@rickjeffersonsolutions.com | 877-763-8587
Trusted by NFL & Dallas Cowboys`
  },

  'MOV_REQUEST': {
    id: 'MOV_REQUEST',
    category: LETTER_CATEGORIES.VERIFICATION,
    name: 'Method of Verification Request',
    description: 'FCRA Section 611(a)(7) method of verification request',
    fcraSection: '611(a)(7)',
    template: `{date}

{bureauName}
{bureauAddress}

Re: Method of Verification Request
Consumer: {consumerName}
SSN: XXX-XX-{lastFourSSN}
Confirmation Number: {confirmationNumber}
Address: {consumerAddress}

Dear {bureauName} Compliance Department,

Pursuant to FCRA Section 611(a)(7), I am requesting disclosure of the method of verification used in your recent reinvestigation of my dispute.

Dispute Details:
- Date of Dispute: {disputeDate}
- Items Disputed: {disputedItems}
- Investigation Results: {investigationResults}

I am specifically requesting:
1. The method of verification used to confirm the accuracy of the disputed information
2. The name and business address of any furnisher contacted
3. The specific procedures followed during the reinvestigation
4. Any documentation received from the furnisher

FCRA Section 611(a)(7) requires you to provide this information within 15 days of my request. Please provide a detailed explanation of your verification process.

Sincerely,

{consumerSignature}
{consumerName}

---
This letter was prepared by Rick Jefferson Solutions
THE Credit Repair & Wealth Management Authority
info@rickjeffersonsolutions.com | 877-763-8587
Your Credit Freedom Starts Here`
  },

  'FURNISHER_DISPUTE_623': {
    id: 'FURNISHER_DISPUTE_623',
    category: LETTER_CATEGORIES.FURNISHER,
    name: 'Furnisher Direct Dispute - FCRA Section 623',
    description: 'Direct dispute to furnisher under FCRA Section 623(a)(8)',
    fcraSection: '623(a)(8)',
    template: `{date}

{furnisherName}
{furnisherAddress}

Re: Direct Dispute Under FCRA Section 623(a)(8)
Account Number: {accountNumber}
Consumer: {consumerName}
SSN: XXX-XX-{lastFourSSN}
Address: {consumerAddress}

Dear {furnisherName} Compliance Department,

I am disputing inaccurate information you are furnishing to consumer reporting agencies under FCRA Section 623(a)(8).

Disputed Account Information:
{disputeItems}

Specific Inaccuracies:
{specificInaccuracies}

Under FCRA Section 623(a)(8)(D), you are required to:
1. Conduct a reasonable investigation of the disputed information
2. Review all relevant information provided by me
3. Report the results of the investigation to all consumer reporting agencies
4. Modify, delete, or permanently block reporting of inaccurate information

FCRA Section 623(a)(1)(A) requires you to provide accurate and complete information. The current reporting violates this requirement.

I request that you:
- Immediately investigate this dispute
- Correct or delete the inaccurate information
- Notify all consumer reporting agencies of the correction
- Provide written confirmation of your actions

Please respond within 30 days as required by FCRA Section 623(a)(8)(E).

Sincerely,

{consumerSignature}
{consumerName}

Enclosures: Supporting Documentation

---
This letter was prepared by Rick Jefferson Solutions
THE Credit Repair & Wealth Management Authority
info@rickjeffersonsolutions.com | 877-763-8587
10 Step Total Enforcement Chain™`
  },

  'CFPB_COMPLAINT': {
    id: 'CFPB_COMPLAINT',
    category: LETTER_CATEGORIES.ESCALATION,
    name: 'CFPB Complaint Letter',
    description: 'Consumer Financial Protection Bureau complaint escalation',
    fcraSection: 'CFPB Authority',
    template: `{date}

Consumer Financial Protection Bureau
1700 G Street, NW
Washington, DC 20552

Re: FCRA Violation Complaint
Consumer: {consumerName}
Complaint Type: Credit Reporting
Violation: {violationType}

Dear CFPB,

I am filing this complaint against {respondentName} for violations of the Fair Credit Reporting Act (FCRA).

Complaint Summary:
{complaintSummary}

FCRA Violations:
{fcraViolations}

Timeline of Events:
{timeline}

I have attempted to resolve this matter directly with {respondentName} but they have failed to comply with FCRA requirements. I am requesting CFPB intervention to ensure compliance.

Desired Resolution:
{desiredResolution}

I have attached all relevant documentation including correspondence, credit reports, and dispute records.

Sincerely,

{consumerSignature}
{consumerName}
{consumerAddress}
{consumerPhone}
{consumerEmail}

Enclosures: Complete Documentation Package

---
This complaint was prepared by Rick Jefferson Solutions
THE Credit Repair & Wealth Management Authority
info@rickjeffersonsolutions.com | 877-763-8587
Trusted by NFL & Dallas Cowboys`
  },

  'GOODWILL_DELETION': {
    id: 'GOODWILL_DELETION',
    category: LETTER_CATEGORIES.GOODWILL,
    name: 'Goodwill Deletion Request',
    description: 'Goodwill letter requesting deletion of accurate negative information',
    fcraSection: 'Voluntary',
    template: `{date}

{creditorName}
{creditorAddress}

Re: Goodwill Deletion Request
Account Number: {accountNumber}
Consumer: {consumerName}
Address: {consumerAddress}

Dear {creditorName} Customer Relations,

I am writing to request your consideration for a goodwill deletion of negative reporting on my credit reports.

Account Details:
- Account Number: {accountNumber}
- Original Creditor: {originalCreditor}
- Negative Item: {negativeItem}
- Date of Delinquency: {delinquencyDate}

I acknowledge that this account had payment difficulties in the past. However, I have since:
{improvementStory}

I am respectfully requesting that you consider removing the negative reporting as a gesture of goodwill. This would greatly assist me in:
{futureGoals}

I understand this is a voluntary request and appreciate your consideration. I have been working with Rick Jefferson Solutions to rebuild my credit and would be grateful for your assistance.

Thank you for your time and consideration.

Sincerely,

{consumerSignature}
{consumerName}

---
This letter was prepared by Rick Jefferson Solutions
THE Credit Repair & Wealth Management Authority
info@rickjeffersonsolutions.com | 877-763-8587
Your Credit Freedom Starts Here`
  },

  'DEBT_VALIDATION': {
    id: 'DEBT_VALIDATION',
    category: LETTER_CATEGORIES.VALIDATION,
    name: 'Debt Validation Request',
    description: 'FDCPA Section 809(b) debt validation request',
    fcraSection: 'FDCPA 809(b)',
    template: `{date}

{collectorName}
{collectorAddress}

Re: Debt Validation Request
Account Number: {accountNumber}
Original Creditor: {originalCreditor}
Consumer: {consumerName}
Address: {consumerAddress}

Dear {collectorName},

This letter is sent in response to a notice I received from you on {noticeDate}. Be advised that this is not a refusal to pay, but a notice sent pursuant to the Fair Debt Collection Practices Act, 15 USC 1692g Sec. 809(b).

I am requesting validation of this debt. Please provide:

1. Proof that you own this debt or have been assigned this debt
2. Copy of the original signed contract or agreement
3. Complete payment history from the original creditor
4. Proof that the statute of limitations has not expired
5. Verification that you are licensed to collect debts in my state
6. Documentation showing the current balance and how it was calculated

Under FDCPA Section 809(b), you must cease all collection activities until you provide proper validation. Any continued collection efforts without validation would violate federal law.

I also request that you provide verification that any negative credit reporting is accurate and that you have the right to report this information.

Please respond within 30 days with the requested validation.

Sincerely,

{consumerSignature}
{consumerName}

---
This letter was prepared by Rick Jefferson Solutions
THE Credit Repair & Wealth Management Authority
info@rickjeffersonsolutions.com | 877-763-8587
10 Step Total Enforcement Chain™`
  },

  'CEASE_DESIST': {
    id: 'CEASE_DESIST',
    category: LETTER_CATEGORIES.CEASE_DESIST,
    name: 'Cease and Desist Letter',
    description: 'FDCPA Section 805(c) cease and desist communication',
    fcraSection: 'FDCPA 805(c)',
    template: `{date}

{collectorName}
{collectorAddress}

Re: Cease and Desist Communication
Account Number: {accountNumber}
Consumer: {consumerName}
Address: {consumerAddress}

Dear {collectorName},

This letter is to inform you that I am invoking my rights under the Fair Debt Collection Practices Act, 15 USC 1692 et seq.

Pursuant to FDCPA Section 805(c), I am requesting that you CEASE AND DESIST all communication with me regarding the alleged debt referenced above.

This includes but is not limited to:
- Telephone calls to my home, work, or mobile phone
- Text messages or emails
- Letters or postcards
- Contact with third parties regarding this matter
- Any other form of communication

The only acceptable communications are:
1. Notice that collection efforts are being terminated
2. Notice that specific legal action is being taken

Any continued communication after receipt of this letter, except as specifically allowed under FDCPA Section 805(c), will be considered harassment and a violation of federal law.

I am working with Rick Jefferson Solutions and all future communications should be directed through them if legally necessary.

Sincerely,

{consumerSignature}
{consumerName}

Certified Mail Receipt: {certifiedNumber}

---
This letter was prepared by Rick Jefferson Solutions
THE Credit Repair & Wealth Management Authority
info@rickjeffersonsolutions.com | 877-763-8587
Your Credit Freedom Starts Here`
  },

  // Legacy templates for backward compatibility
  initial: {
    not_mine: {
      subject: 'Dispute - Account Not Mine',
      template: `Dear {bureau} Credit Bureau,

I am writing to formally dispute the following item(s) on my credit report:

Account Name: {accountName}
Account Number: {accountNumber}

This account does not belong to me. I have never opened an account with this creditor, nor have I authorized anyone to open an account on my behalf. This appears to be an error or possible case of identity theft.

I am requesting that you investigate this matter and remove this inaccurate information from my credit report immediately. Under the Fair Credit Reporting Act (FCRA), you have 30 days to investigate and respond to this dispute.

Please provide me with written confirmation of the removal of this item from my credit report.

Sincerely,
{clientName}
{clientAddress}

Enclosures: Copy of ID, Proof of Address`
    },
    paid_in_full: {
      subject: 'Dispute - Account Paid in Full',
      template: `Dear {bureau} Credit Bureau,

I am writing to dispute the following account on my credit report:

Account Name: {accountName}
Account Number: {accountNumber}

This account shows an outstanding balance, however, it has been paid in full. I have fulfilled all payment obligations for this account and it should reflect a zero balance or be removed from my credit report.

I am requesting that you investigate this matter and update my credit report to accurately reflect the paid status of this account.

Under the Fair Credit Reporting Act (FCRA), you have 30 days to investigate and respond to this dispute.

Sincerely,
{clientName}
{clientAddress}

Enclosures: Payment records, Account statements`
    },
    incorrect_amount: {
      subject: 'Dispute - Incorrect Balance Amount',
      template: `Dear {bureau} Credit Bureau,

I am writing to dispute the balance amount reported for the following account:

Account Name: {accountName}
Account Number: {accountNumber}

The balance amount currently reported is inaccurate. The correct balance should be different from what is currently showing on my credit report.

I am requesting that you investigate this matter and correct the balance amount to accurately reflect the true status of this account.

Under the Fair Credit Reporting Act (FCRA), you have 30 days to investigate and respond to this dispute.

Sincerely,
{clientName}
{clientAddress}

Enclosures: Account statements, Payment records`
    },
    incorrect_date: {
      subject: 'Dispute - Incorrect Date Information',
      template: `Dear {bureau} Credit Bureau,

I am writing to dispute the date information for the following account:

Account Name: {accountName}
Account Number: {accountNumber}

The dates associated with this account (opening date, last payment date, or delinquency dates) are inaccurate and do not reflect the true timeline of this account.

I am requesting that you investigate this matter and correct the date information to accurately reflect the actual account history.

Under the Fair Credit Reporting Act (FCRA), you have 30 days to investigate and respond to this dispute.

Sincerely,
{clientName}
{clientAddress}

Enclosures: Account documentation, Payment history`
    },
    duplicate: {
      subject: 'Dispute - Duplicate Account Listing',
      template: `Dear {bureau} Credit Bureau,

I am writing to dispute a duplicate listing on my credit report:

Account Name: {accountName}
Account Number: {accountNumber}

This account appears to be listed multiple times on my credit report, which is inaccurate and negatively impacts my credit score. There should only be one listing for this account.

I am requesting that you investigate this matter and remove the duplicate listing(s) from my credit report.

Under the Fair Credit Reporting Act (FCRA), you have 30 days to investigate and respond to this dispute.

Sincerely,
{clientName}
{clientAddress}

Enclosures: Credit report highlighting duplicates`
    },
    identity_theft: {
      subject: 'Dispute - Identity Theft',
      template: `Dear {bureau} Credit Bureau,

I am writing to dispute the following fraudulent account on my credit report:

Account Name: {accountName}
Account Number: {accountNumber}

This account was opened as a result of identity theft. I have never opened this account, nor have I authorized anyone to open an account on my behalf. I am a victim of identity theft and this fraudulent account should be removed immediately.

I have filed a police report and an FTC Identity Theft Report regarding this matter. I am requesting that you investigate this dispute and remove this fraudulent account from my credit report.

Under the Fair Credit Reporting Act (FCRA), you have 30 days to investigate and respond to this dispute.

Sincerely,
{clientName}
{clientAddress}

Enclosures: Police report, FTC Identity Theft Report, Copy of ID`
    },
    mixed_file: {
      subject: 'Dispute - Mixed Credit File',
      template: `Dear {bureau} Credit Bureau,

I am writing to dispute the following account that appears to belong to another person:

Account Name: {accountName}
Account Number: {accountNumber}

This account does not belong to me and appears to be the result of a mixed credit file. The account information does not match my personal information, credit history, or financial records.

I am requesting that you investigate this matter and remove this account from my credit report as it belongs to another individual.

Under the Fair Credit Reporting Act (FCRA), you have 30 days to investigate and respond to this dispute.

Sincerely,
{clientName}
{clientAddress}

Enclosures: Copy of ID, Proof of Address`
    },
    outdated: {
      subject: 'Dispute - Outdated Information',
      template: `Dear {bureau} Credit Bureau,

I am writing to dispute the following outdated account on my credit report:

Account Name: {accountName}
Account Number: {accountNumber}

This account information is outdated and should be removed from my credit report. According to the Fair Credit Reporting Act, most negative information should be removed after 7 years, and this account exceeds that timeframe.

I am requesting that you investigate this matter and remove this outdated information from my credit report.

Under the Fair Credit Reporting Act (FCRA), you have 30 days to investigate and respond to this dispute.

Sincerely,
{clientName}
{clientAddress}

Enclosures: Account timeline documentation`
    },
    other: {
      subject: 'Credit Report Dispute',
      template: `Dear {bureau} Credit Bureau,

I am writing to dispute the following account on my credit report:

Account Name: {accountName}
Account Number: {accountNumber}

Reason for dispute: {disputeReason}

I am requesting that you investigate this matter and take appropriate action to correct my credit report.

Under the Fair Credit Reporting Act (FCRA), you have 30 days to investigate and respond to this dispute.

Sincerely,
{clientName}
{clientAddress}

Enclosures: Supporting documentation`
    }
  },
  follow_up: {
    template: `Dear {bureau} Credit Bureau,

I am writing to follow up on my previous dispute submitted on {originalDate} regarding:

Account Name: {accountName}
Account Number: {accountNumber}

It has been {daysSinceDispute} days since I submitted my dispute, and I have not received a response. Under the Fair Credit Reporting Act (FCRA), you are required to investigate and respond to disputes within 30 days.

I am requesting an immediate update on the status of my dispute and prompt resolution of this matter.

If this account cannot be verified as accurate, it must be removed from my credit report immediately.

Sincerely,
{clientName}
{clientAddress}

Reference: Original dispute dated {originalDate}`
  },
  escalation: {
    template: `Dear {bureau} Credit Bureau Manager,

I am writing to escalate my dispute regarding the following account:

Account Name: {accountName}
Account Number: {accountNumber}

Despite my previous correspondence dated {originalDate} and follow-up dated {followUpDate}, this matter remains unresolved. This is unacceptable and may constitute a violation of the Fair Credit Reporting Act (FCRA).

I am demanding immediate action to resolve this dispute. If this account cannot be properly verified, it must be removed from my credit report immediately.

Failure to resolve this matter promptly may result in formal complaints being filed with the Consumer Financial Protection Bureau (CFPB) and my state's Attorney General's office.

I expect a written response within 10 business days.

Sincerely,
{clientName}
{clientAddress}

Reference: Original dispute dated {originalDate}
Reference: Follow-up dated {followUpDate}`
  },
  final: {
    template: `Dear {bureau} Credit Bureau,

This is my final attempt to resolve the dispute regarding:

Account Name: {accountName}
Account Number: {accountNumber}

Despite multiple attempts to resolve this matter (original dispute: {originalDate}, follow-up: {followUpDate}, escalation: {escalationDate}), you have failed to properly investigate and resolve this dispute.

This letter serves as notice that I will be filing formal complaints with:
- Consumer Financial Protection Bureau (CFPB)
- Federal Trade Commission (FTC)
- State Attorney General's Office
- Better Business Bureau

Additionally, I may pursue legal action for violations of the Fair Credit Reporting Act (FCRA), which provides for actual damages, punitive damages up to $1,000, and attorney's fees.

You have 10 business days to resolve this matter before I proceed with formal complaints and potential legal action.

Sincerely,
{clientName}
{clientAddress}

Reference: Original dispute dated {originalDate}
Reference: Follow-up dated {followUpDate}
Reference: Escalation dated {escalationDate}`
  }
};

// Bureau-specific addresses and information
const BUREAU_INFO = {
  Experian: {
    name: 'Experian',
    address: 'Experian\nP.O. Box 4500\nAllen, TX 75013',
    disputeAddress: 'Experian\nDispute Department\nP.O. Box 4500\nAllen, TX 75013'
  },
  Equifax: {
    name: 'Equifax',
    address: 'Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374',
    disputeAddress: 'Equifax Information Services LLC\nDispute Department\nP.O. Box 740256\nAtlanta, GA 30374'
  },
  TransUnion: {
    name: 'TransUnion',
    address: 'TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016',
    disputeAddress: 'TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016'
  }
};

class LetterService {
  constructor() {
    this.templates = LETTER_TEMPLATES;
    this.categories = LETTER_CATEGORIES;
  }

  /**
   * Generate a dispute letter with Metro 2® compliance
   */
  async generateLetter(templateId, data) {
    try {
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Prepare data with Rick Jefferson branding
      const enrichedData = this.enrichDataWithBranding(data);
      
      // Generate letter content
      const letterContent = this.replacePlaceholders(template.template, enrichedData);
      
      return {
        id: `LTR-${Date.now()}`,
        content: letterContent,
        template: template.name,
        templateId: templateId,
        category: template.category,
        fcraSection: template.fcraSection,
        date: moment().tz('America/Chicago').format('MMMM DD, YYYY'),
        metadata: {
          templateId,
          clientId: data.clientId,
          disputeId: data.disputeId,
          bureauName: data.bureauName,
          accountNumber: data.accountNumber,
          generatedBy: 'Rick Jefferson Solutions',
          complianceLevel: 'Metro 2® Compliant'
        }
      };
    } catch (error) {
      logger.error('Error generating letter:', error);
      throw error;
    }
  }

  /**
   * Generate bulk letters for multiple disputes
   */
  async generateBulkLetters(disputes, templateOverrides = {}) {
    try {
      const letters = [];
      
      for (const dispute of disputes) {
        const templateId = templateOverrides[dispute.id] || this.recommendTemplate(dispute);
        const letter = await this.generateLetter(templateId, dispute);
        letters.push(letter);
      }
      
      return {
        letters,
        summary: {
          total: letters.length,
          byTemplate: this.groupByTemplate(letters),
          byBureau: this.groupByBureau(letters)
        }
      };
    } catch (error) {
      logger.error('Error generating bulk letters:', error);
      throw error;
    }
  }

  /**
   * Generate a dispute letter based on client and dispute information
   * @param {Object} params - Letter generation parameters
   * @param {Object} params.client - Client information
   * @param {Object} params.dispute - Dispute information
   * @param {string} params.letterType - Type of letter (initial, follow_up, escalation, final)
   * @param {Object} params.previousDates - Previous correspondence dates
   * @returns {string} Generated letter content
   */
  async generateDisputeLetter(params) {
    try {
      const {
        client,
        dispute,
        letterType = 'initial',
        previousDates = {}
      } = params;

      // Validate required parameters
      if (!client || !dispute) {
        throw new Error('Client and dispute information are required');
      }

      // Get the appropriate template
      let template;
      if (letterType === 'initial') {
        template = LETTER_TEMPLATES.initial[dispute.disputeType];
        if (!template) {
          template = LETTER_TEMPLATES.initial.other;
        }
      } else {
        template = LETTER_TEMPLATES[letterType];
        if (!template) {
          throw new Error(`Invalid letter type: ${letterType}`);
        }
      }

      // Prepare client information
      const clientName = `${client.firstName} ${client.lastName}`;
      const clientAddress = this.formatAddress(client.address);

      // Prepare replacement variables
      const variables = {
        bureau: dispute.bureau,
        accountName: dispute.accountName,
        accountNumber: dispute.accountNumber || 'Not provided',
        disputeReason: dispute.disputeReason,
        clientName,
        clientAddress,
        originalDate: previousDates.originalDate || '',
        followUpDate: previousDates.followUpDate || '',
        escalationDate: previousDates.escalationDate || '',
        daysSinceDispute: previousDates.daysSinceDispute || ''
      };

      // Generate letter content
      let letterContent = this.replaceVariables(template.template, variables);

      // Add bureau address
      const bureauInfo = BUREAU_INFO[dispute.bureau];
      if (bureauInfo) {
        letterContent = `${bureauInfo.disputeAddress}\n\n${letterContent}`;
      }

      // Add date
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      letterContent = `${currentDate}\n\n${letterContent}`;

      // Use AI to enhance the letter if available
      try {
        const enhancedContent = await aiService.enhanceDisputeLetter({
          originalContent: letterContent,
          disputeType: dispute.disputeType,
          letterType,
          bureau: dispute.bureau
        });
        
        if (enhancedContent && enhancedContent.length > letterContent.length * 0.8) {
          letterContent = enhancedContent;
        }
      } catch (aiError) {
        logger.warn('AI enhancement failed, using template', {
          error: aiError.message,
          disputeType: dispute.disputeType,
          letterType
        });
      }

      logger.info('Dispute letter generated', {
        disputeType: dispute.disputeType,
        letterType,
        bureau: dispute.bureau,
        contentLength: letterContent.length
      });

      return letterContent;

    } catch (error) {
      logger.error('Letter generation error', {
        error: error.message,
        stack: error.stack,
        params
      });
      throw error;
    }
  }

  /**
   * Generate a follow-up letter with calculated days since original dispute
   * @param {Object} params - Follow-up letter parameters
   * @returns {string} Generated follow-up letter
   */
  async generateFollowUpLetter(params) {
    const { originalDisputeDate } = params;
    
    if (originalDisputeDate) {
      const daysSince = Math.floor(
        (new Date() - new Date(originalDisputeDate)) / (1000 * 60 * 60 * 24)
      );
      
      params.previousDates = {
        ...params.previousDates,
        originalDate: new Date(originalDisputeDate).toLocaleDateString('en-US'),
        daysSinceDispute: daysSince
      };
    }

    return this.generateDisputeLetter({
      ...params,
      letterType: 'follow_up'
    });
  }

  /**
   * Generate an escalation letter with all previous correspondence dates
   * @param {Object} params - Escalation letter parameters
   * @returns {string} Generated escalation letter
   */
  async generateEscalationLetter(params) {
    return this.generateDisputeLetter({
      ...params,
      letterType: 'escalation'
    });
  }

  /**
   * Generate a final demand letter
   * @param {Object} params - Final letter parameters
   * @returns {string} Generated final letter
   */
  async generateFinalLetter(params) {
    return this.generateDisputeLetter({
      ...params,
      letterType: 'final'
    });
  }

  /**
   * Get available letter templates for a dispute type
   * @param {string} disputeType - Type of dispute
   * @returns {Object} Available templates
   */
  getAvailableTemplates(disputeType) {
    const templates = {
      initial: LETTER_TEMPLATES.initial[disputeType] || LETTER_TEMPLATES.initial.other,
      follow_up: LETTER_TEMPLATES.follow_up,
      escalation: LETTER_TEMPLATES.escalation,
      final: LETTER_TEMPLATES.final
    };

    return Object.keys(templates).map(type => ({
      type,
      subject: templates[type].subject || `${type.replace('_', ' ')} Letter`,
      description: this.getLetterDescription(type)
    }));
  }

  /**
   * Get bureau information
   * @param {string} bureau - Bureau name
   * @returns {Object} Bureau information
   */
  getBureauInfo(bureau) {
    return BUREAU_INFO[bureau] || null;
  }

  /**
   * Validate letter content for compliance
   * @param {string} content - Letter content to validate
   * @returns {Object} Validation result
   */
  validateLetterContent(content) {
    const validation = {
      isValid: true,
      warnings: [],
      errors: []
    };

    // Check for required elements
    const requiredElements = [
      'Fair Credit Reporting Act',
      'FCRA',
      '30 days',
      'investigate'
    ];

    requiredElements.forEach(element => {
      if (!content.includes(element)) {
        validation.warnings.push(`Missing reference to: ${element}`);
      }
    });

    // Check for inappropriate language
    const inappropriateWords = [
      'demand', 'require', 'must', 'will sue', 'lawsuit',
      'attorney', 'legal action'
    ];

    inappropriateWords.forEach(word => {
      if (content.toLowerCase().includes(word.toLowerCase())) {
        validation.warnings.push(`Consider softening language: "${word}"`);
      }
    });

    // Check length
    if (content.length < 200) {
      validation.errors.push('Letter content is too short');
      validation.isValid = false;
    }

    if (content.length > 2000) {
      validation.warnings.push('Letter content is quite long, consider condensing');
    }

    return validation;
  }

  /**
   * Replace template variables with actual values
   * @param {string} template - Template string
   * @param {Object} variables - Variables to replace
   * @returns {string} Processed template
   */
  replaceVariables(template, variables) {
    let result = template;
    
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      const value = variables[key] || '';
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }

  /**
   * Format address for letter display
   * @param {string|Object} address - Address to format
   * @returns {string} Formatted address
   */
  formatAddress(address) {
    if (typeof address === 'string') {
      return address;
    }

    if (typeof address === 'object' && address !== null) {
      const parts = [
        address.street,
        address.city && address.state ? `${address.city}, ${address.state}` : address.city || address.state,
        address.zipCode
      ].filter(Boolean);
      
      return parts.join('\n');
    }

    return 'Address not provided';
  }

  /**
   * Get description for letter type
   * @param {string} letterType - Type of letter
   * @returns {string} Description
   */
  getLetterDescription(letterType) {
    const descriptions = {
      initial: 'First dispute letter to credit bureau',
      follow_up: 'Follow-up letter for unresolved disputes',
      escalation: 'Escalation letter to bureau management',
      final: 'Final demand letter before legal action'
    };

    return descriptions[letterType] || 'Custom dispute letter';
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId) {
    return this.templates[templateId] || null;
  }

  /**
   * Enrich data with Rick Jefferson branding
   */
  enrichDataWithBranding(data) {
    return {
      ...data,
      date: moment().tz('America/Chicago').format('MMMM DD, YYYY'),
      consumerSignature: data.consumerName || `${data.firstName} ${data.lastName}`,
      lastFourSSN: data.ssn ? data.ssn.slice(-4) : 'XXXX',
      brandingFooter: 'Rick Jefferson Solutions - THE Credit Repair & Wealth Management Authority'
    };
  }

  /**
   * Replace placeholders in template
   */
  replacePlaceholders(template, data) {
    let result = template;
    
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{${key}}`, 'g');
      result = result.replace(placeholder, data[key] || '');
    });
    
    return result;
  }

  /**
   * Recommend template based on dispute type
   */
  recommendTemplate(dispute) {
    const typeMapping = {
      'inaccurate': 'CRA_DISPUTE_INACCURATE',
      'incomplete': 'CRA_DISPUTE_INCOMPLETE',
      'verification': 'MOV_REQUEST',
      'furnisher': 'FURNISHER_DISPUTE_623',
      'goodwill': 'GOODWILL_DELETION',
      'validation': 'DEBT_VALIDATION',
      'cease': 'CEASE_DESIST'
    };
    
    return typeMapping[dispute.type] || 'CRA_DISPUTE_INACCURATE';
  }

  /**
   * Group letters by template
   */
  groupByTemplate(letters) {
    return letters.reduce((acc, letter) => {
      acc[letter.templateId] = (acc[letter.templateId] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Group letters by bureau
   */
  groupByBureau(letters) {
    return letters.reduce((acc, letter) => {
      const bureau = letter.metadata.bureauName;
      acc[bureau] = (acc[bureau] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Generate PDF letter
   */
  async generatePDF(letterContent, options = {}) {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72
        }
      });

      // Add Rick Jefferson Solutions letterhead
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('RICK JEFFERSON SOLUTIONS', { align: 'center' })
         .fontSize(12)
         .font('Helvetica')
         .text('THE Credit Repair & Wealth Management Authority', { align: 'center' })
         .text('info@rickjeffersonsolutions.com | 877-763-8587', { align: 'center' })
         .moveDown(2);

      // Add letter content
      doc.fontSize(11)
         .font('Helvetica')
         .text(letterContent, {
           align: 'left',
           lineGap: 2
         });

      // Add footer
      doc.fontSize(8)
         .text('This letter was generated by Rick Jefferson Solutions automated system', {
           align: 'center'
         });

      return doc;
    } catch (error) {
      logger.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Get all available templates
   */
  getAllTemplates() {
    return Object.keys(this.templates).map(id => ({
      id,
      ...this.templates[id]
    }));
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category) {
    return this.getAllTemplates().filter(template => 
      template.category === category
    );
  }

  /**
   * Generate letter preview without full content
   * @param {Object} params - Preview parameters
   * @returns {Object} Letter preview
   */
  generateLetterPreview(params) {
    const {
      client,
      dispute,
      letterType = 'initial'
    } = params;

    let template;
    if (letterType === 'initial') {
      template = LETTER_TEMPLATES.initial[dispute.disputeType] || LETTER_TEMPLATES.initial.other;
    } else {
      template = LETTER_TEMPLATES[letterType];
    }

    const clientName = `${client.firstName} ${client.lastName}`;
    const bureauInfo = BUREAU_INFO[dispute.bureau];

    return {
      letterType,
      subject: template?.subject || `${letterType.replace('_', ' ')} Letter`,
      recipient: bureauInfo?.name || dispute.bureau,
      recipientAddress: bureauInfo?.disputeAddress || 'Address not available',
      sender: clientName,
      accountName: dispute.accountName,
      disputeType: dispute.disputeType,
      estimatedLength: template?.template?.length || 0,
      preview: template?.template?.substring(0, 200) + '...' || 'Template not available'
    };
  }
}

module.exports = new LetterService();