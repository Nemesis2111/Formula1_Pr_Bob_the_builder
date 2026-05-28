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

let latestTelemetryEvent = null;
 
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

    // Process through AI supervisor
    const telemetryEvent =
      context?.telemetryEvent ||
      latestTelemetryEvent ||
      null;

    broadcast('pipeline_start', {
      event_id:
        telemetryEvent?.event_id ||
        `manual_${Date.now()}`,

      vehicle_id:
        telemetryEvent?.vehicle?.vehicle_id ||
        'FER-16',

      risk_score:
        telemetryEvent?.risk_analysis?.risk_score ||
        50,

      severity:
        telemetryEvent?.risk_analysis?.severity ||
        'moderate',
    });

    const result =
      await decisionTwinSupervisorAgent.process(
        prompt,
        {
          telemetryEvent,
          languages: ['en', 'it', 'es', 'hi'],
        }
      );

   // ==========================
// DIRECT FAN MESSAGE GENERATION FOR CHAT
// ==========================

let fanMessages = [];

const fanResult = await fanEngagementAgent.generateMessage(
  {
    event_id: telemetryEvent?.event_id || `manual_${Date.now()}`,
    analysis: {
      risk_score: telemetryEvent?.risk_analysis?.risk_score || 50,
      severity: telemetryEvent?.risk_analysis?.severity || 'moderate',
    },
  },
  {
  strategy_id: `strategy_${Date.now()}`,
  recommendation: {
    user_prompt: prompt,
    fan_instruction: `Create a fan-safe answer specifically for this user question: "${prompt}"`,
    pit_window: {
      action: prompt,
    },
    reasoning: prompt,
  },
},
  {
  approval_record: {
    blocked: false,
    approval_status: 'approved',
    user_prompt: prompt,
  },
},
  {
    event_id: telemetryEvent?.event_id || `manual_${Date.now()}`,
    vehicle: {
      vehicle_id: telemetryEvent?.vehicle?.vehicle_id || 'FER-16',
      driver_name: telemetryEvent?.vehicle?.driver_name || 'Unknown Driver',
      team_name: telemetryEvent?.vehicle?.team_name || 'Ferrari',
    },
  },
  {
    languages: ['en', 'it', 'es', 'hi'],
  }
);

fanMessages = fanResult.messages || [];

broadcast('fan_messages', {
  messages: fanMessages,
  timestamp: new Date().toISOString(),
});

broadcast('agent_response', result);

return res.json({
  success: true,
  summary:
    result?.summary ||
    result?.result?.summary ||
    'AI workflow completed',
  result,
  fan_messages: fanMessages,
  telemetry_context: telemetryEvent,
});

  } catch (error) {
    console.error(
      '❌ Agent endpoint error:',
      error
    );

    return res.status(500).json({
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
const fanResult =
  await fanEngagementAgent.generateMessage(
    {
      event_id: approvalRecord.event_id,
      analysis: {
        risk_score: approvalRecord.risk_score,
        severity: approvalRecord.severity
      }
    },
    {
      strategy_id: approvalRecord.strategy_id,
      recommendation: {
        pit_window: {
          action: 'immediate_pit_stop'
        }
      }
    },
    {
      approval_record: {
        blocked: false,
        approval_status: 'approved'
      }
    },
    {
  event_id: approvalRecord.event_id,
  vehicle: {
    vehicle_id:
      latestTelemetryEvent?.vehicle?.vehicle_id || 'FER-16',

    driver_name:
      latestTelemetryEvent?.vehicle?.driver_name ||
      'Unknown Driver',

    team_name:
      latestTelemetryEvent?.vehicle?.team_name ||
      'Unknown Team'
  }
},
    {
      languages: ['en', 'es', 'it', 'hi']
    }
  );
 
      fanMessages = fanResult.messages || [];

      console.log(
  'Fan languages:',
  fanMessages.map(m => m.language)
);
 
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

  latestTelemetryEvent = event;

  console.log(`📡 Telemetry event received: ${event.event_id}`);
 
  // Broadcast raw telemetry to WebSocket clients first

  broadcast('telemetry', event);

  // Auto-process high-risk events
  if (event.risk_analysis.risk_score >= 60) {

    console.log(`🚨 High-risk event detected - auto-processing...`);

    try {

      broadcast('pipeline_start', {
        event_id: event.event_id,
        vehicle_id: event.vehicle.vehicle_id,
        risk_score: event.risk_analysis.risk_score,
        severity: event.risk_analysis.severity,
      });

      const result =
        await decisionTwinSupervisorAgent.process(
          `Telemetry shows ${event.vehicle.vehicle_id}
          has ${event.risk_analysis.event_type}.
          Assess safety risk, recommend strategy, and request approval if needed.`,
          { telemetryEvent: event }
        );

      broadcast('auto_analysis', result);

    } catch (error) {
      console.error('❌ Auto-analysis error:', error);
    }
  }
 
  // Auto-process high-risk events

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
 