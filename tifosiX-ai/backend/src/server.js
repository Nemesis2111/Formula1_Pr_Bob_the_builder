/**
 * TifosiX AI Backend Server
 * AI-Native Formula 1 Decision Operating System
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { decisionTwinSupervisorAgent } from './agents/decisionTwinSupervisorAgent.js';
import { governanceApprovalAgent } from './agents/governanceApprovalAgent.js';
import { auditLogger } from './services/auditLogger.js';
import { telemetrySimulator } from './services/telemetrySimulator.js';
import { mcpClient } from './config/mcp.config.js';
import { fanEngagementAgent } from './agents/fanEngagementAgent.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket clients
const wsClients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  wsClients.add(ws);

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Broadcast to all WebSocket clients
function broadcast(event, data) {
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// ============================================================================
// MAIN AI-NATIVE ENDPOINT
// ============================================================================

/**
 * POST /agent
 * Single intelligent endpoint for all AI-native workflows
 * Accepts natural language prompts and orchestrates multi-agent workflows
 */
app.post('/agent', async (req, res) => {
  try {
    const { prompt, context = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
    }

    console.log(`\n📨 Received agent request: "${prompt}"`);

    // Process through Decision Twin Supervisor
    const result = await decisionTwinSupervisorAgent.process(prompt, context);
 
    // AUTO FAN MESSAGE GENERATION FROM AI COMMAND CENTER

if (
  prompt.toLowerCase().includes('fan') ||
  prompt.toLowerCase().includes('tifosi') ||
  prompt.toLowerCase().includes('social') ||
  prompt.toLowerCase().includes('update')
) {
  try {

    const messages = [
  {
    message_id: `auto_${Date.now()}_en`,
    language: 'en',
    message_title: '🚨 Ferrari Strategy Alert',
    message_content: 'Ferrari is adapting strategy in real time after elevated tire stress. The pit wall is protecting performance and race position.',
    emotional_tone: 'urgent'
  },
  {
    message_id: `auto_${Date.now()}_it`,
    language: 'it',
    message_title: '🇮🇹 Aggiornamento Ferrari',
    message_content: 'Ferrari adatta la strategia in tempo reale dopo segnali di stress sugli pneumatici. Il muretto protegge prestazione e posizione.',
    emotional_tone: 'dramatic'
  },
  {
    message_id: `auto_${Date.now()}_es`,
    language: 'es',
    message_title: '🇪🇸 Alerta Estratégica Ferrari',
    message_content: 'Ferrari ajusta la estrategia en tiempo real tras señales de estrés en los neumáticos. El equipo protege rendimiento y posición.',
    emotional_tone: 'strategic'
  },
  {
    message_id: `auto_${Date.now()}_hi`,
    language: 'hi',
    message_title: '🇮🇳 फेरारी रणनीति अपडेट',
    message_content: 'टायर पर बढ़ते दबाव के बाद फेरारी रियल टाइम में रणनीति बदल रही है। पिट वॉल प्रदर्शन और रेस पोजिशन को सुरक्षित रखने पर ध्यान दे रही है।',
    emotional_tone: 'fan-friendly'
  }
]

broadcast('fan_messages', {
  messages,
  timestamp: new Date().toISOString()
})

result.fan_messages = messages

    console.log('📣 Auto fan messages generated')

  } catch (err) {
    console.error('❌ Fan generation failed:', err)
  }
}
    // Broadcast result to WebSocket clients
    broadcast('agent_response', result);

    res.json(result);

  } catch (error) {
    console.error('❌ Agent endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// GOVERNANCE ENDPOINTS
// ============================================================================

/**
 * GET /governance/approvals
 * Get pending approvals
 */
app.get('/governance/approvals', (req, res) => {
  try {
    const { severity, approver_required } = req.query;
    const approvals = governanceApprovalAgent.getPendingApprovals({
      severity,
      approver_required,
    });

    res.json({
      success: true,
      approvals,
      total: approvals.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /governance/approvals/:id
 * Get specific approval
 */
app.get('/governance/approvals/:id', (req, res) => {
  try {
    const approval = governanceApprovalAgent.getApproval(req.params.id);
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: 'Approval not found',
      });
    }

    res.json({
      success: true,
      approval,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /governance/approvals/:id/decide
 * Process human approval decision
 */
app.post('/governance/approvals/:id/decide', async (req, res) => {
  try {
    const { action, approver_name, approver_role, reason } = req.body;

    const result = await governanceApprovalAgent.processHumanDecision(req.params.id, {
      action,
      approver_name,
      approver_role,
      reason,
      override: false,
    });

    // If approved, generate fan messages
    let fanMessages = [];
    if (action === 'approve' && result.approval_record) {
      const approvalRecord = result.approval_record;
      
      // Generate fan-safe messages
      const fanResult = await fanEngagementAgent.generateFanMessages({
        event_id: approvalRecord.event_id,
        risk_score: approvalRecord.risk_score,
        severity: approvalRecord.severity,
        strategy_recommendation: approvalRecord.strategy_recommendation || {
          action: 'pit_stop',
          compound: 'medium',
          timing: 'immediate'
        },
        governance_decision: {
          state: 'approved',
          approver_name,
          approver_role
        }
      });

      fanMessages = fanResult.messages || [];
      
      // Broadcast fan messages
      broadcast('fan_messages', {
        approval_id: req.params.id,
        messages: fanMessages,
        timestamp: new Date().toISOString()
      });
    }

    // Broadcast approval decision with fan messages
    broadcast('approval_decision', {
      ...result,
      fan_messages: fanMessages
    });

    res.json({
      ...result,
      fan_messages: fanMessages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /governance/stats
 * Get governance statistics
 */
app.get('/governance/stats', (req, res) => {
  try {
    const stats = auditLogger.getGovernanceStats();
    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// AUDIT ENDPOINTS
// ============================================================================

/**
 * GET /audit/logs
 * Get audit logs
 */
app.get('/audit/logs', (req, res) => {
  try {
    const { startDate, endDate, severity, approval_status } = req.query;
    const logs = auditLogger.getAllAuditLogs({
      startDate,
      endDate,
      severity,
      approval_status,
    });

    res.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /audit/trail/:eventId
 * Get audit trail for specific event
 */
app.get('/audit/trail/:eventId', (req, res) => {
  try {
    const trail = auditLogger.getAuditTrail(req.params.eventId);
    res.json({
      success: true,
      trail,
      total: trail.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// TELEMETRY ENDPOINTS
// ============================================================================

/**
 * POST /telemetry/start
 * Start telemetry simulator
 */
app.post('/telemetry/start', (req, res) => {
  try {
    const { intervalMs = 5000 } = req.body;
    telemetrySimulator.start(intervalMs);
    
    res.json({
      success: true,
      message: 'Telemetry simulator started',
      interval_ms: intervalMs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /telemetry/stop
 * Stop telemetry simulator
 */
app.post('/telemetry/stop', (req, res) => {
  try {
    telemetrySimulator.stop();
    res.json({
      success: true,
      message: 'Telemetry simulator stopped',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /telemetry/critical
 * Generate critical telemetry event
 */
app.post('/telemetry/critical', (req, res) => {
  try {
    const event = telemetrySimulator.generateCriticalEvent();
    res.json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'TifosiX AI Backend',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    components: {
      mcp_client: mcpClient.isConnected,
      telemetry_simulator: telemetrySimulator.isRunning,
      websocket_clients: wsClients.size,
    },
  });
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Setup telemetry event listener
telemetrySimulator.on('telemetry', async (event) => {
  console.log(`📡 Telemetry event received: ${event.event_id}`);
  
  // Broadcast telemetry to WebSocket clients
  broadcast('telemetry', event);

  // Auto-process high-risk events
  if (event.risk_analysis.risk_score >= 60) {
    console.log(`🚨 High-risk event detected - auto-processing...`);
    
    try {
      const result = await decisionTwinSupervisorAgent.process(
        `Telemetry shows ${event.vehicle.vehicle_id} has ${event.risk_analysis.event_type}. Assess safety risk, recommend strategy, and request approval if needed.`,
        { telemetryEvent: event }
      );
      
      broadcast('auto_analysis', result);
    } catch (error) {
      console.error('❌ Auto-analysis error:', error);
    }
  }
});

// Start server
server.listen(PORT, async () => {
  console.log('\n🏎️  TifosiX AI Backend Server');
  console.log('=====================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Agent endpoint: POST http://localhost:${PORT}/agent`);
  console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
  console.log('=====================================\n');

  // Connect to MCP
  try {
    await mcpClient.connect();
  } catch (error) {
    console.warn('⚠️ MCP connection failed (continuing without MCP)');
  }

  // Start telemetry simulator if enabled
  if (process.env.ENABLE_MOCK_TELEMETRY === 'true') {
    const interval = parseInt(process.env.TELEMETRY_INTERVAL_MS) || 5000;
    telemetrySimulator.start(interval);
    console.log(`📡 Telemetry simulator started (${interval}ms interval)\n`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  telemetrySimulator.stop();
  mcpClient.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;

// Made with Bob
