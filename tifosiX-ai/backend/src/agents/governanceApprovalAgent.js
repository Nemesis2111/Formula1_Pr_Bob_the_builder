/**
 * Governance Approval Agent
 * Enforces human-in-the-loop governance, blocks unsafe propagation, generates audit logs
 */

import { v4 as uuidv4 } from 'uuid';
import { auditLogger } from '../services/auditLogger.js';

export class GovernanceApprovalAgent {
  constructor() {
    this.name = 'GovernanceApprovalAgent';
    this.version = '1.0.0';
    
    // Governance thresholds
    this.thresholds = {
      highRisk: parseInt(process.env.HIGH_RISK_THRESHOLD) || 80,
      lowRisk: parseInt(process.env.LOW_RISK_THRESHOLD) || 50,
      minConfidence: parseFloat(process.env.MIN_CONFIDENCE_THRESHOLD) || 0.70,
      autoApprovalConfidence: parseFloat(process.env.AUTO_APPROVAL_CONFIDENCE) || 0.85,
    };

    // Pending approvals
    this.pendingApprovals = new Map();
  }

  /**
   * Evaluate if decision requires governance approval
   */
  async evaluate(safetyAnalysis, strategyRecommendation, context = {}) {
    const startTime = Date.now();
    console.log(`⚖️ Governance Approval Agent evaluating decision`);

    try {
      const { risk_score, confidence_score, severity } = safetyAnalysis.analysis;
      const { strategy_id } = strategyRecommendation;

      // Determine governance state
      const governanceDecision = this.determineGovernanceState(
        risk_score,
        confidence_score,
        severity
      );

      // Create approval record
      const approvalRecord = {
        approval_id: uuidv4(),
        event_id: safetyAnalysis.event_id,
        strategy_id,
        risk_score,
        confidence_score,
        severity,
        governance_state: governanceDecision.state,
        approval_status: governanceDecision.approval_status,
        requires_human_approval: governanceDecision.requires_human,
        auto_approved: governanceDecision.auto_approved,
        blocked: governanceDecision.blocked,
        escalation_reason: governanceDecision.escalation_reason,
        approver_required: governanceDecision.approver_required,
        created_at: new Date().toISOString(),
        expires_at: this.calculateExpirationTime(governanceDecision.state),
      };

      // Store pending approval if needed
      if (governanceDecision.requires_human) {
        this.pendingApprovals.set(approvalRecord.approval_id, approvalRecord);
        console.log(`⏳ Approval pending: ${approvalRecord.approval_id}`);
      }

      // Log governance action
      auditLogger.logGovernanceAction('evaluation', {
        event_id: safetyAnalysis.event_id,
        decision_id: approvalRecord.approval_id,
        previous_state: 'none',
        new_state: governanceDecision.state,
        reason: governanceDecision.escalation_reason,
      });

      const result = {
        success: true,
        agent: this.name,
        approval_record: approvalRecord,
        governance_rules_applied: this.getAppliedRules(risk_score, confidence_score),
        next_actions: this.determineNextActions(governanceDecision),
        execution_time_ms: Date.now() - startTime,
      };

      console.log(`✅ Governance Decision: ${governanceDecision.state} | Approval: ${governanceDecision.approval_status}`);
      return result;

    } catch (error) {
      console.error(`❌ Governance Approval Agent error:`, error);
      return {
        success: false,
        agent: this.name,
        error: error.message,
        execution_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Determine governance state based on rules
   */
  determineGovernanceState(riskScore, confidenceScore, severity) {
    let state = 'approved';
    let approval_status = 'approved';
    let requires_human = false;
    let auto_approved = false;
    let blocked = false;
    let escalation_reason = null;
    let approver_required = null;

    // Rule 1: High risk requires human approval
    if (riskScore >= this.thresholds.highRisk) {
      state = 'awaiting_human_approval';
      approval_status = 'pending';
      requires_human = true;
      escalation_reason = `Risk score ${riskScore} exceeds high-risk threshold (${this.thresholds.highRisk})`;
      approver_required = 'team_engineer';
    }
    // Rule 2: Low confidence requires escalation
    else if (confidenceScore < this.thresholds.minConfidence) {
      state = 'awaiting_human_approval';
      approval_status = 'pending';
      requires_human = true;
      escalation_reason = `Confidence score ${confidenceScore} below minimum threshold (${this.thresholds.minConfidence})`;
      approver_required = 'team_engineer';
    }
    // Rule 3: Low risk with high confidence can be auto-approved
    else if (riskScore < this.thresholds.lowRisk && confidenceScore >= this.thresholds.autoApprovalConfidence) {
      state = 'auto_approved';
      approval_status = 'approved';
      requires_human = false;
      auto_approved = true;
      escalation_reason = 'Low risk with high confidence - auto-approved';
    }
    // Rule 4: Medium risk requires review
    else {
      state = 'under_review';
      approval_status = 'pending';
      requires_human = true;
      escalation_reason = 'Medium risk requires human review';
      approver_required = 'race_engineer';
    }

    // Rule 5: Critical severity always blocks until approval
    if (severity === 'critical') {
      blocked = true;
      state = 'blocked_pending_approval';
      approval_status = 'pending';
      requires_human = true;
      approver_required = 'lead_race_engineer';
    }

    return {
      state,
      approval_status,
      requires_human,
      auto_approved,
      blocked,
      escalation_reason,
      approver_required,
    };
  }

  /**
   * Process human approval/rejection
   */
  async processHumanDecision(approvalId, decision) {
    console.log(`👤 Processing human decision for approval: ${approvalId}`);

    const approvalRecord = this.pendingApprovals.get(approvalId);
    if (!approvalRecord) {
      throw new Error(`Approval record not found: ${approvalId}`);
    }

    const { action, approver_name, approver_role, reason, override } = decision;

    // Validate action
    if (!['approve', 'reject', 'defer'].includes(action)) {
      throw new Error(`Invalid approval action: ${action}`);
    }

    // Update approval record
    approvalRecord.approval_status = action === 'approve' ? 'approved' : 
                                     action === 'reject' ? 'rejected' : 'deferred';
    approvalRecord.governance_state = action === 'approve' ? 'approved' : 
                                      action === 'reject' ? 'rejected' : 'deferred';
    approvalRecord.approver_name = approver_name;
    approvalRecord.approver_role = approver_role;
    approvalRecord.approval_reason = reason;
    approvalRecord.approval_timestamp = new Date().toISOString();
    approvalRecord.override_flag = override || false;
    approvalRecord.blocked = false;

    // Log governance action
    auditLogger.logGovernanceAction('human_decision', {
      event_id: approvalRecord.event_id,
      decision_id: approvalId,
      previous_state: 'awaiting_human_approval',
      new_state: approvalRecord.governance_state,
      approver: approver_name,
      reason,
    });

    // Create audit log entry
    auditLogger.logDecision({
      event_id: approvalRecord.event_id,
      strategy_id: approvalRecord.strategy_id,
      pit_stop_id: null,
      risk_score: approvalRecord.risk_score,
      confidence_score: approvalRecord.confidence_score,
      severity: approvalRecord.severity,
      approver_name,
      approver_role,
      approval_timestamp: approvalRecord.approval_timestamp,
      approval_reason: reason,
      approval_status: approvalRecord.approval_status,
      governance_state: approvalRecord.governance_state,
      override_flag: override || false,
      agent_chain: ['SafetyIntelligenceAgent', 'StrategyRecommendationAgent', 'GovernanceApprovalAgent'],
    });

    // Remove from pending if approved or rejected
    if (action !== 'defer') {
      this.pendingApprovals.delete(approvalId);
    }

    console.log(`✅ Human decision processed: ${action.toUpperCase()}`);

    return {
      success: true,
      approval_record: approvalRecord,
      action_taken: action,
    };
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(filters = {}) {
    let approvals = Array.from(this.pendingApprovals.values());

    if (filters.severity) {
      approvals = approvals.filter(a => a.severity === filters.severity);
    }

    if (filters.approver_required) {
      approvals = approvals.filter(a => a.approver_required === filters.approver_required);
    }

    return approvals.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  }

  /**
   * Get approval by ID
   */
  getApproval(approvalId) {
    return this.pendingApprovals.get(approvalId);
  }

  /**
   * Calculate expiration time for approval
   */
  calculateExpirationTime(state) {
    const now = new Date();
    let expirationMinutes = 30; // Default 30 minutes

    if (state === 'blocked_pending_approval') {
      expirationMinutes = 15; // Critical approvals expire faster
    } else if (state === 'awaiting_human_approval') {
      expirationMinutes = 30;
    }

    return new Date(now.getTime() + expirationMinutes * 60000).toISOString();
  }

  /**
   * Get applied governance rules
   */
  getAppliedRules(riskScore, confidenceScore) {
    const rules = [];

    if (riskScore >= this.thresholds.highRisk) {
      rules.push({
        rule: 'high_risk_threshold',
        description: `Risk score ${riskScore} >= ${this.thresholds.highRisk} requires human approval`,
        triggered: true,
      });
    }

    if (confidenceScore < this.thresholds.minConfidence) {
      rules.push({
        rule: 'low_confidence_threshold',
        description: `Confidence ${confidenceScore} < ${this.thresholds.minConfidence} requires escalation`,
        triggered: true,
      });
    }

    if (riskScore < this.thresholds.lowRisk && confidenceScore >= this.thresholds.autoApprovalConfidence) {
      rules.push({
        rule: 'auto_approval_eligible',
        description: `Low risk (${riskScore}) with high confidence (${confidenceScore}) allows auto-approval`,
        triggered: true,
      });
    }

    return rules;
  }

  /**
   * Determine next actions based on governance decision
   */
  determineNextActions(governanceDecision) {
    const actions = [];

    if (governanceDecision.requires_human) {
      actions.push({
        action: 'await_human_approval',
        description: `Waiting for ${governanceDecision.approver_required} approval`,
        priority: 'high',
      });
    }

    if (governanceDecision.blocked) {
      actions.push({
        action: 'block_propagation',
        description: 'Block fan message generation until approval',
        priority: 'critical',
      });
    }

    if (governanceDecision.auto_approved) {
      actions.push({
        action: 'proceed_to_fan_engagement',
        description: 'Auto-approved - proceed with fan message generation',
        priority: 'normal',
      });
    }

    return actions;
  }

  /**
   * Check for expired approvals
   */
  checkExpiredApprovals() {
    const now = new Date();
    const expired = [];

    for (const [id, approval] of this.pendingApprovals.entries()) {
      if (new Date(approval.expires_at) < now) {
        expired.push(approval);
        this.pendingApprovals.delete(id);
        
        console.log(`⏰ Approval expired: ${id}`);
        
        // Log expiration
        auditLogger.logGovernanceAction('approval_expired', {
          event_id: approval.event_id,
          decision_id: id,
          previous_state: approval.governance_state,
          new_state: 'expired',
          reason: 'Approval timeout exceeded',
        });
      }
    }

    return expired;
  }
}

// Export singleton instance
export const governanceApprovalAgent = new GovernanceApprovalAgent();

// Made with Bob
