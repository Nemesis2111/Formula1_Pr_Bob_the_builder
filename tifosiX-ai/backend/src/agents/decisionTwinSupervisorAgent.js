/**
 * Decision Twin Supervisor Agent
 * Orchestrates multi-agent workflows, understands intent, retrieves MCP context, coordinates specialists
 */

import { v4 as uuidv4 } from 'uuid';
import { mcpClient } from '../config/mcp.config.js';
import { safetyIntelligenceAgent } from './safetyIntelligenceAgent.js';
import { strategyRecommendationAgent } from './strategyRecommendationAgent.js';
import { governanceApprovalAgent } from './governanceApprovalAgent.js';
import { fanEngagementAgent } from './fanEngagementAgent.js';
import { auditLogger } from '../services/auditLogger.js';

export class DecisionTwinSupervisorAgent {
  constructor() {
    this.name = 'DecisionTwinSupervisorAgent';
    this.version = '1.0.0';
    this.activeWorkflows = new Map();
  }

  /**
   * Process natural language prompt and orchestrate workflow
   */
  async process(prompt, context = {}) {
    const workflowId = uuidv4();
    const startTime = Date.now();
    
    console.log(`\n🎭 Decision Twin Supervisor Agent starting workflow: ${workflowId}`);
    console.log(`📝 Prompt: "${prompt}"`);

    try {
      // Step 1: Understand intent
      const intent = this.understandIntent(prompt);
      console.log(`🧠 Intent: ${intent.type}`);

      // Step 2: Retrieve MCP context if needed
      let mcpContext = null;
      if (intent.requires_context) {
        mcpContext = await this.retrieveMCPContext(prompt, intent);
        console.log(`📚 MCP Context retrieved: ${mcpContext ? 'Yes' : 'No'}`);
      }

      // Step 3: Route to appropriate workflow
      let result;
      switch (intent.type) {
        case 'telemetry_analysis':
          result = await this.handleTelemetryAnalysis(intent, context, mcpContext);
          break;
        case 'strategy_recommendation':
          result = await this.handleStrategyRecommendation(intent, context, mcpContext);
          break;
        case 'governance_query':
          result = await this.handleGovernanceQuery(intent, context);
          break;
        case 'fan_message_generation':
          result = await this.handleFanMessageGeneration(intent, context);
          break;
        case 'approval_action':
          result = await this.handleApprovalAction(intent, context);
          break;
        default:
          result = await this.handleGenericQuery(intent, context, mcpContext);
      }

      // Step 4: Create final response
      const response = {
        success: true,
        workflow_id: workflowId,
        agent: this.name,
        intent: intent.type,
        result,
        mcp_context_used: mcpContext !== null,
        execution_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      console.log(`✅ Workflow complete: ${workflowId} (${Date.now() - startTime}ms)\n`);
      return response;

    } catch (error) {
      console.error(`❌ Decision Twin Supervisor error:`, error);
      return {
        success: false,
        workflow_id: workflowId,
        agent: this.name,
        error: error.message,
        execution_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Understand user intent from natural language
   */
  understandIntent(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Telemetry analysis patterns
    if (lowerPrompt.includes('telemetry') || 
        lowerPrompt.includes('tire wear') || 
        lowerPrompt.includes('vibration') ||
        lowerPrompt.includes('assess') ||
        lowerPrompt.includes('analyze')) {
      return {
        type: 'telemetry_analysis',
        requires_context: true,
        confidence: 0.9,
      };
    }

    // Strategy recommendation patterns
    if (lowerPrompt.includes('strategy') || 
        lowerPrompt.includes('pit stop') || 
        lowerPrompt.includes('recommend') ||
        lowerPrompt.includes('tire compound')) {
      return {
        type: 'strategy_recommendation',
        requires_context: true,
        confidence: 0.85,
      };
    }

    // Governance query patterns
    if (lowerPrompt.includes('approval') || 
        lowerPrompt.includes('pending') || 
        lowerPrompt.includes('governance') ||
        lowerPrompt.includes('audit')) {
      return {
        type: 'governance_query',
        requires_context: false,
        confidence: 0.9,
      };
    }

    // Approval action patterns
    if (lowerPrompt.includes('approve') || 
        lowerPrompt.includes('reject') || 
        lowerPrompt.includes('defer')) {
      return {
        type: 'approval_action',
        requires_context: false,
        confidence: 0.95,
      };
    }

    // Fan message patterns
    if (lowerPrompt.includes('fan') || 
        lowerPrompt.includes('message') || 
        lowerPrompt.includes('notify') ||
        lowerPrompt.includes('update')) {
      return {
        type: 'fan_message_generation',
        requires_context: false,
        confidence: 0.8,
      };
    }

    // Default to generic query
    return {
      type: 'generic_query',
      requires_context: true,
      confidence: 0.6,
    };
  }

  /**
   * Retrieve context from MCP
   */
  async retrieveMCPContext(prompt, intent) {
    try {
      const context = await mcpClient.hybridQuery(prompt, {
        sources: ['graph', 'vector'],
        graphTopK: 5,
        vectorTopK: 5,
        maxDepth: 1,
      });
      return context;
    } catch (error) {
      console.warn('⚠️ MCP context retrieval failed:', error.message);
      return null;
    }
  }

  /**
   * Handle telemetry analysis workflow
   */
  async handleTelemetryAnalysis(intent, context, mcpContext) {
    console.log('🔄 Executing telemetry analysis workflow...');

    const { telemetryEvent } = context;
    if (!telemetryEvent) {
      throw new Error('Telemetry event required for analysis');
    }

    // Agent chain execution
    const agentChain = [];

    // 1. Safety Intelligence Agent
    const safetyResult = await safetyIntelligenceAgent.analyze(telemetryEvent, mcpContext);
    agentChain.push({ agent: 'SafetyIntelligenceAgent', result: safetyResult });

    // 2. Strategy Recommendation Agent
    const strategyResult = await strategyRecommendationAgent.recommend(
      safetyResult,
      telemetryEvent,
      mcpContext
    );
    agentChain.push({ agent: 'StrategyRecommendationAgent', result: strategyResult });

    // 3. Governance Approval Agent
    const governanceResult = await governanceApprovalAgent.evaluate(
      safetyResult,
      strategyResult,
      mcpContext
    );
    agentChain.push({ agent: 'GovernanceApprovalAgent', result: governanceResult });

    // 4. Fan Engagement Agent (if approved)
    let fanResult = null;
    if (governanceResult.approval_record.approval_status === 'approved') {
      fanResult = await fanEngagementAgent.generateMessage(
        safetyResult,
        strategyResult,
        governanceResult,
        telemetryEvent,
        context
      );
      agentChain.push({ agent: 'FanEngagementAgent', result: fanResult });
    }

    return {
      workflow_type: 'telemetry_analysis',
      agent_chain: agentChain,
      safety_analysis: safetyResult.analysis,
      strategy_recommendation: strategyResult.recommendation,
      governance_decision: governanceResult.approval_record,
      fan_messages: fanResult?.messages || null,
      requires_human_approval: governanceResult.approval_record.requires_human_approval,
      final_state: this.determineFinalState(governanceResult),
    };
  }

  /**
   * Handle strategy recommendation workflow
   */
  async handleStrategyRecommendation(intent, context, mcpContext) {
    console.log('🔄 Executing strategy recommendation workflow...');

    const { telemetryEvent } = context;
    if (!telemetryEvent) {
      throw new Error('Telemetry event required for strategy recommendation');
    }

    // Execute safety analysis first
    const safetyResult = await safetyIntelligenceAgent.analyze(telemetryEvent, mcpContext);
    
    // Then strategy recommendation
    const strategyResult = await strategyRecommendationAgent.recommend(
      safetyResult,
      telemetryEvent,
      mcpContext
    );

    return {
      workflow_type: 'strategy_recommendation',
      safety_context: safetyResult.analysis,
      recommendation: strategyResult.recommendation,
      confidence: strategyResult.recommendation.strategy_confidence,
    };
  }

  /**
   * Handle governance query workflow
   */
  async handleGovernanceQuery(intent, context) {
    console.log('🔄 Executing governance query workflow...');

    const pendingApprovals = governanceApprovalAgent.getPendingApprovals();
    const stats = auditLogger.getGovernanceStats();

    return {
      workflow_type: 'governance_query',
      pending_approvals: pendingApprovals,
      governance_statistics: stats,
      total_pending: pendingApprovals.length,
    };
  }

  /**
   * Handle approval action workflow
   */
  async handleApprovalAction(intent, context) {
    console.log('🔄 Executing approval action workflow...');

    const { approval_id, action, approver_name, approver_role, reason } = context;

    if (!approval_id || !action) {
      throw new Error('Approval ID and action required');
    }

    const result = await governanceApprovalAgent.processHumanDecision(approval_id, {
      action,
      approver_name: approver_name || 'Unknown',
      approver_role: approver_role || 'Engineer',
      reason: reason || 'Manual approval',
      override: false,
    });

    return {
      workflow_type: 'approval_action',
      approval_result: result,
      action_taken: action,
    };
  }

  /**
   * Handle fan message generation workflow
   */
  async handleFanMessageGeneration(intent, context) {
    console.log('🔄 Executing fan message generation workflow...');

    const { safetyAnalysis, strategyRecommendation, governanceResult, telemetryEvent } = context;

    if (!safetyAnalysis || !strategyRecommendation || !governanceResult || !telemetryEvent) {
      throw new Error('Complete analysis context required for fan message generation');
    }

    const fanResult = await fanEngagementAgent.generateMessage(
      safetyAnalysis,
      strategyRecommendation,
      governanceResult,
      telemetryEvent,
      context
    );

    return {
      workflow_type: 'fan_message_generation',
      messages: fanResult.messages,
      safety_validation: fanResult.safety_validation,
    };
  }

  /**
   * Handle generic query workflow
   */
  async handleGenericQuery(intent, context, mcpContext) {
    console.log('🔄 Executing generic query workflow...');

    return {
      workflow_type: 'generic_query',
      message: 'Query processed. Please provide more specific instructions for telemetry analysis, strategy recommendations, or governance actions.',
      available_workflows: [
        'telemetry_analysis',
        'strategy_recommendation',
        'governance_query',
        'approval_action',
        'fan_message_generation',
      ],
      mcp_context: mcpContext,
    };
  }

  /**
   * Determine final workflow state
   */
  determineFinalState(governanceResult) {
    const { approval_record } = governanceResult;

    if (approval_record.approval_status === 'approved') {
      return 'completed';
    } else if (approval_record.requires_human_approval) {
      return 'awaiting_approval';
    } else if (approval_record.blocked) {
      return 'blocked';
    }
    return 'in_progress';
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId) {
    return this.activeWorkflows.get(workflowId);
  }
}

// Export singleton instance
export const decisionTwinSupervisorAgent = new DecisionTwinSupervisorAgent();

// Made with Bob
