/**
 * Rick Jefferson Solutions - Automated Dispute Engine
 * 10 Step Total Enforcement Chain™ Implementation
 * Metro 2® Compliant Dispute Processing
 */

const { Pool } = require('pg');
const winston = require('winston');
const letterService = require('./letterService');
const aiService = require('./aiService');
const metro2Service = require('./metro2Service');
const moment = require('moment-timezone');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

/**
 * 10 Step Total Enforcement Chain™ Workflow
 */
const ENFORCEMENT_STEPS = {
  STEP_1: 'credit_analysis',
  STEP_2: 'dispute_preparation', 
  STEP_3: 'bureau_disputes',
  STEP_4: 'furnisher_disputes',
  STEP_5: 'verification_challenges',
  STEP_6: 'legal_escalation',
  STEP_7: 'compliance_enforcement',
  STEP_8: 'score_optimization',
  STEP_9: 'credit_building',
  STEP_10: 'wealth_protection'
};

/**
 * Metro 2® Compliant Dispute Types
 */
const METRO2_DISPUTE_CODES = {
  '01': 'Account information disputed by consumer',
  '02': 'Account closed by consumer',
  '03': 'Account closed by credit grantor',
  '04': 'Refinanced',
  '05': 'Voluntarily surrendered',
  '06': 'Returned to dealer',
  '07': 'Early termination by consumer',
  '08': 'Transferred to recovery department',
  '09': 'Skip',
  '10': 'Transferred to another office',
  '11': 'Transferred to attorney',
  '12': 'Bankruptcy Chapter 7',
  '13': 'Bankruptcy Chapter 11',
  '14': 'Bankruptcy Chapter 12',
  '15': 'Bankruptcy Chapter 13',
  '16': 'Deceased',
  '17': 'Foreclosure proceedings started',
  '18': 'Foreclosure completed',
  '19': 'Deed in lieu of foreclosure',
  '20': 'Short sale'
};

class DisputeEngine {
  constructor() {
    this.timezone = 'America/Chicago'; // Rick Jefferson Solutions CST
  }

  /**
   * Initialize automated dispute process for a client
   * @param {string} clientId - Client UUID
   * @param {Object} options - Dispute options
   */
  async initializeDisputeProcess(clientId, options = {}) {
    try {
      logger.info('Initializing dispute process', { clientId, options });

      // Step 1: Credit Analysis
      const analysisResult = await this.performCreditAnalysis(clientId);
      
      // Step 2: Dispute Preparation
      const disputeItems = await this.prepareDisputeItems(clientId, analysisResult);
      
      // Step 3: Create dispute workflow
      const workflow = await this.createDisputeWorkflow(clientId, disputeItems, options);
      
      return {
        success: true,
        workflowId: workflow.id,
        totalItems: disputeItems.length,
        estimatedCompletion: workflow.estimatedCompletion,
        nextStep: ENFORCEMENT_STEPS.STEP_3
      };
    } catch (error) {
      logger.error('Failed to initialize dispute process', { error: error.message, clientId });
      throw error;
    }
  }

  /**
   * Step 1: Perform comprehensive credit analysis
   * @param {string} clientId - Client UUID
   */
  async performCreditAnalysis(clientId) {
    try {
      // Get client's credit reports
      const creditReports = await this.getCreditReports(clientId);
      
      // Analyze negative items
      const negativeItems = await this.analyzeNegativeItems(creditReports);
      
      // Calculate dispute priority scores
      const prioritizedItems = await this.prioritizeDisputeItems(negativeItems);
      
      // Metro 2® compliance check
      const complianceResults = await this.checkMetro2Compliance(prioritizedItems);
      
      return {
        creditReports,
        negativeItems,
        prioritizedItems,
        complianceResults,
        analysisDate: moment().tz(this.timezone).format()
      };
    } catch (error) {
      logger.error('Credit analysis failed', { error: error.message, clientId });
      throw error;
    }
  }

  /**
   * Step 2: Prepare dispute items with Metro 2® compliance
   * @param {string} clientId - Client UUID
   * @param {Object} analysisResult - Credit analysis results
   */
  async prepareDisputeItems(clientId, analysisResult) {
    try {
      const disputeItems = [];
      
      for (const item of analysisResult.prioritizedItems) {
        // Check Metro 2® field compliance
        const metro2Check = await metro2Service.validateItem(item);
        
        if (metro2Check.hasViolations) {
          const disputeItem = {
            clientId,
            bureau: item.bureau,
            accountName: item.creditorName,
            accountNumber: item.accountNumber,
            disputeType: this.determineDisputeType(item, metro2Check),
            disputeReason: this.generateDisputeReason(item, metro2Check),
            metro2Violations: metro2Check.violations,
            priority: item.priorityScore,
            enforcementStep: ENFORCEMENT_STEPS.STEP_3,
            successProbability: await this.calculateSuccessProbability(item, metro2Check)
          };
          
          disputeItems.push(disputeItem);
        }
      }
      
      return disputeItems;
    } catch (error) {
      logger.error('Dispute preparation failed', { error: error.message, clientId });
      throw error;
    }
  }

  /**
   * Step 3: Execute bureau disputes with automated letter generation
   * @param {string} workflowId - Dispute workflow ID
   */
  async executeBureauDisputes(workflowId) {
    try {
      const workflow = await this.getDisputeWorkflow(workflowId);
      const disputes = await this.getWorkflowDisputes(workflowId);
      
      for (const dispute of disputes) {
        if (dispute.enforcementStep === ENFORCEMENT_STEPS.STEP_3) {
          // Generate Metro 2® compliant dispute letter
          const letter = await this.generateDisputeLetter(dispute, 'initial');
          
          // Submit dispute to bureau
          await this.submitBureauDispute(dispute.id, letter);
          
          // Schedule follow-up
          await this.scheduleFollowUp(dispute.id, 30); // 30-day FCRA timeline
          
          // Log enforcement action
          await this.logEnforcementAction(dispute.id, ENFORCEMENT_STEPS.STEP_3, {
            action: 'bureau_dispute_submitted',
            letter_id: letter.id,
            submission_date: moment().tz(this.timezone).format()
          });
        }
      }
      
      return { success: true, disputesSubmitted: disputes.length };
    } catch (error) {
      logger.error('Bureau dispute execution failed', { error: error.message, workflowId });
      throw error;
    }
  }

  /**
   * Step 4: Execute furnisher disputes for unresolved items
   * @param {string} workflowId - Dispute workflow ID
   */
  async executeFurnisherDisputes(workflowId) {
    try {
      const unresolvedDisputes = await this.getUnresolvedDisputes(workflowId);
      
      for (const dispute of unresolvedDisputes) {
        // Generate Section 623 furnisher dispute letter
        const letter = await this.generateDisputeLetter(dispute, 'furnisher');
        
        // Submit to original creditor
        await this.submitFurnisherDispute(dispute.id, letter);
        
        // Update enforcement step
        await this.updateEnforcementStep(dispute.id, ENFORCEMENT_STEPS.STEP_4);
        
        // Schedule follow-up
        await this.scheduleFollowUp(dispute.id, 30);
      }
      
      return { success: true, furnisherDisputesSubmitted: unresolvedDisputes.length };
    } catch (error) {
      logger.error('Furnisher dispute execution failed', { error: error.message, workflowId });
      throw error;
    }
  }

  /**
   * Step 5: Method of verification challenges
   * @param {string} workflowId - Dispute workflow ID
   */
  async executeVerificationChallenges(workflowId) {
    try {
      const disputes = await this.getDisputesForVerificationChallenge(workflowId);
      
      for (const dispute of disputes) {
        // Generate method of verification request
        const movLetter = await this.generateMovLetter(dispute);
        
        // Submit MOV challenge
        await this.submitMovChallenge(dispute.id, movLetter);
        
        // Update enforcement step
        await this.updateEnforcementStep(dispute.id, ENFORCEMENT_STEPS.STEP_5);
      }
      
      return { success: true, movChallengesSubmitted: disputes.length };
    } catch (error) {
      logger.error('Verification challenge execution failed', { error: error.message, workflowId });
      throw error;
    }
  }

  /**
   * Generate Metro 2® compliant dispute letter
   * @param {Object} dispute - Dispute object
   * @param {string} letterType - Type of letter (initial, follow_up, furnisher, mov)
   */
  async generateDisputeLetter(dispute, letterType) {
    try {
      const client = await this.getClientDetails(dispute.clientId);
      
      const letterData = {
        client,
        dispute,
        letterType,
        metro2Violations: dispute.metro2Violations,
        enforcementStep: dispute.enforcementStep,
        brandInfo: {
          company: 'Rick Jefferson Solutions',
          tagline: 'Your Credit Freedom Starts Here',
          method: '10 Step Total Enforcement Chain™',
          contact: {
            email: 'info@rickjeffersonsolutions.com',
            phone: '877-763-8587',
            website: 'rickjeffersonsolutions.com'
          }
        }
      };
      
      const letterContent = await letterService.generateMetro2CompliantLetter(letterData);
      
      // Save letter to database
      const letterQuery = `
        INSERT INTO letters (dispute_id, letter_type, content, status, created_at)
        VALUES ($1, $2, $3, 'generated', NOW())
        RETURNING id, letter_type, status, created_at
      `;
      
      const result = await pool.query(letterQuery, [
        dispute.id,
        letterType,
        letterContent
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Letter generation failed', { error: error.message, disputeId: dispute.id });
      throw error;
    }
  }

  /**
   * Calculate dispute success probability using AI
   * @param {Object} item - Credit report item
   * @param {Object} metro2Check - Metro 2® compliance check results
   */
  async calculateSuccessProbability(item, metro2Check) {
    try {
      const factors = {
        metro2Violations: metro2Check.violations.length,
        accountAge: item.accountAge,
        lastActivity: item.lastActivity,
        disputeHistory: item.disputeHistory || [],
        creditorType: item.creditorType,
        accountStatus: item.accountStatus,
        paymentHistory: item.paymentHistory
      };
      
      const probability = await aiService.predictDisputeSuccess(factors);
      return Math.round(probability * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      logger.error('Success probability calculation failed', { error: error.message });
      return 0.5; // Default 50% probability
    }
  }

  /**
   * Check Metro 2® compliance for credit report items
   * @param {Array} items - Credit report items
   */
  async checkMetro2Compliance(items) {
    try {
      const complianceResults = [];
      
      for (const item of items) {
        const violations = await metro2Service.checkCompliance(item);
        complianceResults.push({
          itemId: item.id,
          violations,
          complianceScore: this.calculateComplianceScore(violations)
        });
      }
      
      return complianceResults;
    } catch (error) {
      logger.error('Metro 2® compliance check failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create dispute workflow for client
   * @param {string} clientId - Client UUID
   * @param {Array} disputeItems - Items to dispute
   * @param {Object} options - Workflow options
   */
  async createDisputeWorkflow(clientId, disputeItems, options) {
    try {
      const workflowQuery = `
        INSERT INTO dispute_workflows (
          client_id, total_items, current_step, status, 
          estimated_completion, created_at
        )
        VALUES ($1, $2, $3, 'active', $4, NOW())
        RETURNING id, estimated_completion
      `;
      
      const estimatedCompletion = moment()
        .tz(this.timezone)
        .add(120, 'days') // 4-month typical completion
        .format();
      
      const workflowResult = await pool.query(workflowQuery, [
        clientId,
        disputeItems.length,
        ENFORCEMENT_STEPS.STEP_1,
        estimatedCompletion
      ]);
      
      const workflow = workflowResult.rows[0];
      
      // Create individual disputes
      for (const item of disputeItems) {
        await this.createDispute({
          ...item,
          workflowId: workflow.id
        });
      }
      
      return workflow;
    } catch (error) {
      logger.error('Workflow creation failed', { error: error.message, clientId });
      throw error;
    }
  }

  /**
   * Process dispute responses and advance workflow
   * @param {string} disputeId - Dispute UUID
   * @param {Object} response - Bureau/furnisher response
   */
  async processDisputeResponse(disputeId, response) {
    try {
      const dispute = await this.getDispute(disputeId);
      
      if (response.status === 'deleted' || response.status === 'updated') {
        // Success - mark as resolved
        await this.resolveDispute(disputeId, response);
      } else if (response.status === 'verified') {
        // Advance to next enforcement step
        await this.advanceEnforcementStep(disputeId);
      }
      
      // Log response
      await this.logDisputeResponse(disputeId, response);
      
      return { success: true };
    } catch (error) {
      logger.error('Response processing failed', { error: error.message, disputeId });
      throw error;
    }
  }

  /**
   * Get dispute workflow status
   * @param {string} workflowId - Workflow UUID
   */
  async getWorkflowStatus(workflowId) {
    try {
      const statusQuery = `
        SELECT 
          dw.*,
          COUNT(d.id) as total_disputes,
          COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_disputes,
          COUNT(CASE WHEN d.status = 'pending' THEN 1 END) as pending_disputes,
          ROUND(AVG(d.success_probability), 2) as avg_success_probability
        FROM dispute_workflows dw
        LEFT JOIN disputes d ON dw.id = d.workflow_id
        WHERE dw.id = $1
        GROUP BY dw.id
      `;
      
      const result = await pool.query(statusQuery, [workflowId]);
      
      if (result.rows.length === 0) {
        throw new Error('Workflow not found');
      }
      
      const workflow = result.rows[0];
      
      // Calculate progress percentage
      const progressPercentage = workflow.total_disputes > 0 
        ? Math.round((workflow.resolved_disputes / workflow.total_disputes) * 100)
        : 0;
      
      return {
        ...workflow,
        progressPercentage,
        currentStepName: this.getStepName(workflow.current_step)
      };
    } catch (error) {
      logger.error('Get workflow status failed', { error: error.message, workflowId });
      throw error;
    }
  }

  /**
   * Helper method to get step name
   * @param {string} stepCode - Enforcement step code
   */
  getStepName(stepCode) {
    const stepNames = {
      [ENFORCEMENT_STEPS.STEP_1]: 'Credit Analysis',
      [ENFORCEMENT_STEPS.STEP_2]: 'Dispute Preparation',
      [ENFORCEMENT_STEPS.STEP_3]: 'Bureau Disputes',
      [ENFORCEMENT_STEPS.STEP_4]: 'Furnisher Disputes',
      [ENFORCEMENT_STEPS.STEP_5]: 'Verification Challenges',
      [ENFORCEMENT_STEPS.STEP_6]: 'Legal Escalation',
      [ENFORCEMENT_STEPS.STEP_7]: 'Compliance Enforcement',
      [ENFORCEMENT_STEPS.STEP_8]: 'Score Optimization',
      [ENFORCEMENT_STEPS.STEP_9]: 'Credit Building',
      [ENFORCEMENT_STEPS.STEP_10]: 'Wealth Protection'
    };
    
    return stepNames[stepCode] || 'Unknown Step';
  }

  // Additional helper methods would be implemented here...
  // (getCreditReports, analyzeNegativeItems, prioritizeDisputeItems, etc.)
}

module.exports = new DisputeEngine();