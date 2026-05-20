/**
 * Audit Logger Service
 * Provides immutable audit trails for all governed decisions
 */

import { v4 as uuidv4 } from 'uuid';

class AuditLogger {
  constructor() {
    this.auditLog = [];
  }

  /**
   * Log a governed decision
   */
  logDecision(data) {
    const auditEntry = {
      audit_id: uuidv4(),
      timestamp: new Date().toISOString(),
      event_id: data.event_id,
      strategy_id: data.strategy_id,
      pit_stop_id: data.pit_stop_id,
      risk_score: data.risk_score,
      confidence_score: data.confidence_score,
      severity: data.severity,
      approver_name: data.approver_name || null,
      approver_role: data.approver_role || null,
      approval_timestamp: data.approval_timestamp || null,
      approval_reason: data.approval_reason || null,
      approval_status: data.approval_status,
      governance_state: data.governance_state,
      override_flag: data.override_flag || false,
      agent_chain: data.agent_chain || [],
      reasoning_trace: data.reasoning_trace || [],
      context_retrieved: data.context_retrieved || false,
      mcp_query_count: data.mcp_query_count || 0,
    };

    this.auditLog.push(auditEntry);
    console.log(`📝 Audit Log Entry Created: ${auditEntry.audit_id}`);
    
    return auditEntry;
  }

  /**
   * Log agent execution
   */
  logAgentExecution(agentName, input, output, duration) {
    const logEntry = {
      log_id: uuidv4(),
      timestamp: new Date().toISOString(),
      agent_name: agentName,
      input_summary: this.summarizeInput(input),
      output_summary: this.summarizeOutput(output),
      execution_duration_ms: duration,
      success: output.success !== false,
    };

    console.log(`🤖 Agent Execution: ${agentName} (${duration}ms)`);
    return logEntry;
  }

  /**
   * Log governance action
   */
  logGovernanceAction(action, data) {
    const logEntry = {
      log_id: uuidv4(),
      timestamp: new Date().toISOString(),
      action_type: action,
      event_id: data.event_id,
      decision_id: data.decision_id,
      previous_state: data.previous_state,
      new_state: data.new_state,
      approver: data.approver,
      reason: data.reason,
    };

    this.auditLog.push(logEntry);
    console.log(`⚖️ Governance Action: ${action}`);
    
    return logEntry;
  }

  /**
   * Log fan message generation
   */
  logFanMessage(messageData) {
    const logEntry = {
      log_id: uuidv4(),
      timestamp: new Date().toISOString(),
      message_id: messageData.message_id,
      event_id: messageData.event_id,
      fan_id: messageData.fan_id,
      language: messageData.language,
      content_length: messageData.content?.length || 0,
      contains_telemetry: this.checkForTelemetry(messageData.content),
      approval_status: messageData.approval_status,
      delivery_status: messageData.delivery_status,
    };

    if (logEntry.contains_telemetry) {
      console.warn('⚠️ Fan message contains potential telemetry data!');
    }

    this.auditLog.push(logEntry);
    return logEntry;
  }

  /**
   * Get audit trail for an event
   */
  getAuditTrail(eventId) {
    return this.auditLog.filter(entry => entry.event_id === eventId);
  }

  /**
   * Get all audit logs
   */
  getAllAuditLogs(filters = {}) {
    let logs = [...this.auditLog];

    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }

    if (filters.severity) {
      logs = logs.filter(log => log.severity === filters.severity);
    }

    if (filters.approval_status) {
      logs = logs.filter(log => log.approval_status === filters.approval_status);
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get governance statistics
   */
  getGovernanceStats() {
    const total = this.auditLog.length;
    const approved = this.auditLog.filter(log => log.approval_status === 'approved').length;
    const rejected = this.auditLog.filter(log => log.approval_status === 'rejected').length;
    const pending = this.auditLog.filter(log => log.approval_status === 'pending').length;
    const autoApproved = this.auditLog.filter(log => log.governance_state === 'auto_approved').length;

    return {
      total_decisions: total,
      approved_count: approved,
      rejected_count: rejected,
      pending_count: pending,
      auto_approved_count: autoApproved,
      approval_rate: total > 0 ? (approved / total * 100).toFixed(2) : 0,
      human_intervention_rate: total > 0 ? ((approved + rejected - autoApproved) / total * 100).toFixed(2) : 0,
    };
  }

  /**
   * Helper: Summarize input for logging
   */
  summarizeInput(input) {
    if (typeof input === 'string') {
      return input.substring(0, 100);
    }
    return JSON.stringify(input).substring(0, 100);
  }

  /**
   * Helper: Summarize output for logging
   */
  summarizeOutput(output) {
    if (typeof output === 'string') {
      return output.substring(0, 100);
    }
    if (output.message) {
      return output.message.substring(0, 100);
    }
    return JSON.stringify(output).substring(0, 100);
  }

  /**
   * Helper: Check if content contains telemetry data
   */
  checkForTelemetry(content) {
    if (!content) return false;
    
    const telemetryPatterns = [
      /\d+\.\d+\s*(kmh|km\/h|mph)/i,
      /tire.*\d+%/i,
      /temperature.*\d+/i,
      /vibration.*\d+/i,
      /steering.*\d+/i,
      /risk.*score.*\d+/i,
    ];

    return telemetryPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Clear audit logs (for testing only)
   */
  clearLogs() {
    this.auditLog = [];
    console.log('🗑️ Audit logs cleared');
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Made with Bob
