# TifosiX AI - System Architecture

## Table of Contents
1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Multi-Agent Architecture](#multi-agent-architecture)
4. [Data Flow](#data-flow)
5. [Governance Framework](#governance-framework)
6. [Context Studio Integration](#context-studio-integration)
7. [Frontend Architecture](#frontend-architecture)
8. [Security & Compliance](#security--compliance)

---

## Overview

TifosiX AI is an **AI-Native Formula 1 Decision Operating System** that demonstrates enterprise-grade AI governance, multi-agent orchestration, and real-time decision intelligence.

### Core Principles

1. **AI-Native First:** Single intelligent endpoint instead of rigid REST APIs
2. **Governed by Design:** Human-in-the-loop approval gates for high-risk decisions
3. **Explainable AI:** Complete reasoning traces and audit trails
4. **Ontology-Driven:** Context Studio MCP integration for semantic reasoning
5. **Fan-Safe:** Sanitized outputs that protect sensitive telemetry

---

## Design Philosophy

### Traditional Approach (❌)

```
User Request → /risk/analyze → Risk Service
            → /strategy/recommend → Strategy Service
            → /fan/notify → Fan Service
            → /governance/approve → Governance Service
```

**Problems:**
- Rigid API contracts
- No intent understanding
- Manual workflow orchestration
- No unified governance
- Separate audit trails

### TifosiX AI Approach (✅)

```
User Request → POST /agent → Decision Twin Supervisor
                          → Intent Understanding
                          → MCP Context Retrieval
                          → Multi-Agent Orchestration
                          → Unified Governance
                          → Single Governed Response
```

**Benefits:**
- Natural language understanding
- Automatic workflow routing
- Unified governance layer
- Complete audit trails
- Explainable reasoning

---

## Multi-Agent Architecture

### Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                 Decision Twin Supervisor Agent                   │
│                                                                   │
│  Responsibilities:                                                │
│  • Understand natural language intent                            │
│  • Query Context Studio MCP for ontology context                 │
│  • Route to specialist agents based on workflow type             │
│  • Coordinate multi-step workflows                               │
│  • Aggregate results and return final governed response          │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬────────────────┬───────────────┐
        │                │                │                │               │
        ▼                ▼                ▼                ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Safety     │  │  Strategy    │  │ Governance   │  │     Fan      │  │     MCP      │
│Intelligence  │  │Recommendation│  │   Approval   │  │ Engagement   │  │   Client     │
│    Agent     │  │    Agent     │  │    Agent     │  │    Agent     │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Agent Specifications

#### 1. Decision Twin Supervisor Agent

**File:** `backend/src/agents/decisionTwinSupervisorAgent.js`

**Capabilities:**
- Intent classification (telemetry_analysis, strategy_planning, fan_update, etc.)
- MCP context retrieval via hybrid queries
- Workflow orchestration
- Result aggregation
- Error handling and fallback strategies

**Intent Types:**
```javascript
{
  telemetry_analysis: "Analyze telemetry and assess risk",
  strategy_planning: "Recommend pit strategy",
  fan_update: "Generate fan-safe messages",
  governance_review: "Review pending approvals",
  full_workflow: "Complete end-to-end workflow"
}
```

#### 2. Safety Intelligence Agent

**File:** `backend/src/agents/safetyIntelligenceAgent.js`

**Capabilities:**
- Anomaly detection (tire wear, vibration, temperature)
- Risk score calculation (0-100 scale)
- Severity classification (low, medium, high, critical)
- Explainable reasoning generation
- Predictive factor analysis

**Risk Calculation:**
```javascript
risk_score = (
  tire_wear_factor * 0.35 +
  vibration_factor * 0.30 +
  temperature_factor * 0.20 +
  weather_factor * 0.15
) * 100
```

**Severity Thresholds:**
- Critical: risk_score >= 80
- High: 60 <= risk_score < 80
- Medium: 40 <= risk_score < 60
- Low: risk_score < 40

#### 3. Strategy Recommendation Agent

**File:** `backend/src/agents/strategyRecommendationAgent.js`

**Capabilities:**
- Pit window calculation
- Tire compound selection (soft, medium, hard)
- Residual risk estimation
- Strategy outcome simulation
- Confidence scoring

**Strategy Logic:**
```javascript
if (risk_score >= 80) {
  action: "immediate_pit_stop"
  urgency: "critical"
} else if (risk_score >= 60) {
  action: "pit_within_3_laps"
  urgency: "high"
} else {
  action: "monitor_and_plan"
  urgency: "normal"
}
```

#### 4. Governance Approval Agent

**File:** `backend/src/agents/governanceApprovalAgent.js`

**Capabilities:**
- Risk-based approval routing
- Confidence-based escalation
- Pending approval management
- Human decision processing
- Audit log generation

**Approval Rules:**
```javascript
if (risk_score >= 80) {
  return "REQUIRES_APPROVAL";
} else if (confidence < 0.70) {
  return "REQUIRES_ESCALATION";
} else if (risk_score < 50 && confidence >= 0.85) {
  return "AUTO_APPROVED";
} else {
  return "REVIEW_RECOMMENDED";
}
```

#### 5. Fan Engagement Agent

**File:** `backend/src/agents/fanEngagementAgent.js`

**Capabilities:**
- Multilingual message generation (EN, ES, IT)
- Emotional storytelling
- Telemetry sanitization
- Personalized narratives
- Sentiment-aware content

**Fan Safety Rules:**
- ❌ No raw telemetry values
- ❌ No confidential strategy details
- ❌ No internal governance decisions
- ✅ Emotional, engaging narratives
- ✅ Context-aware storytelling

---

## Data Flow

### Complete Workflow Example

```
1. User Input
   ↓
   POST /agent
   {
     "prompt": "Telemetry shows FER-16 has high tire wear and steering vibration"
   }

2. Decision Twin Supervisor
   ↓
   • Classifies intent: "telemetry_analysis"
   • Queries MCP for context
   • Routes to Safety Agent

3. Safety Intelligence Agent
   ↓
   • Analyzes telemetry
   • Calculates risk_score: 91
   • Classifies severity: "critical"
   • Returns reasoning trace

4. Strategy Recommendation Agent
   ↓
   • Recommends immediate pit stop
   • Suggests medium compound
   • Estimates residual risk: 15
   • Returns confidence: 0.92

5. Governance Approval Agent
   ↓
   • Evaluates risk_score: 91 >= 80
   • Decision: REQUIRES_APPROVAL
   • Creates pending approval
   • Blocks fan message propagation

6. Response to User
   ↓
   {
     "requires_human_approval": true,
     "approval_id": "uuid",
     "final_state": "awaiting_approval"
   }

7. Human Approval (Separate Request)
   ↓
   POST /governance/approvals/{id}/decide
   {
     "action": "approve",
     "approver_name": "Marco Bellini",
     "reason": "Critical tire vibration validated"
   }

8. Post-Approval Flow
   ↓
   • Governance Agent: Approval granted
   • Fan Agent: Generates multilingual messages
   • Audit Logger: Creates immutable trail
   • WebSocket: Broadcasts to connected clients

9. Final Response
   ↓
   {
     "governance_decision": "approved",
     "fan_messages": [
       { "language": "en", "message": "..." },
       { "language": "es", "message": "..." },
       { "language": "it", "message": "..." }
     ],
     "audit_trail": { ... }
   }
```

---

## Governance Framework

### Risk-Based Approval Matrix

| Risk Score | Confidence | Action | Approver Required |
|------------|-----------|--------|-------------------|
| ≥ 80 | Any | Human Approval | Lead Race Engineer |
| 60-79 | Any | Human Review | Race Engineer |
| < 50 | ≥ 0.85 | Auto-Approved | None |
| Any | < 0.70 | Escalate | Technical Director |

### Approval Workflow States

```javascript
{
  PENDING: "Awaiting human decision",
  APPROVED: "Approved by authorized personnel",
  REJECTED: "Rejected with reason",
  EXPIRED: "Approval timeout exceeded",
  DEFERRED: "Deferred for additional review"
}
```

### Audit Trail Structure

```javascript
{
  event_id: "uuid",
  timestamp: "ISO 8601",
  workflow_type: "telemetry_analysis",
  agent_chain: [
    {
      agent: "SafetyIntelligenceAgent",
      execution_time_ms: 45,
      result: { ... }
    },
    // ... other agents
  ],
  governance_decision: {
    state: "approved",
    approver_name: "Marco Bellini",
    approver_role: "Lead Race Engineer",
    approval_timestamp: "ISO 8601",
    approval_reason: "Critical tire vibration validated"
  },
  mcp_context: {
    query: "...",
    results: [ ... ]
  }
}
```

---

## Context Studio Integration

### MCP Client Configuration

**File:** `backend/src/config/mcp.config.js`

```javascript
{
  serverName: "context-studio",
  transport: {
    type: "sse",
    url: process.env.CONTEXT_STUDIO_URL,
    headers: {
      "x-api-key": process.env.MCP_API_KEY
    }
  }
}
```

### Query Types

#### 1. Hybrid Query (Recommended)
Combines semantic similarity + graph relationships

```javascript
await mcpClient.useTool("context-broker-hybrid-query", {
  context_id: "ctx_cef8bb69f42f",
  AgentPersona: "TifosiX_System_Architect",
  query: "tire wear safety thresholds and pit strategy",
  sources: ["graph", "vector"],
  semantic_weight: 0.5,
  graph_weight: 0.5
});
```

#### 2. Vector Query
Pure semantic similarity search

```javascript
await mcpClient.useTool("context-broker-vector-query", {
  context_id: "ctx_cef8bb69f42f",
  AgentPersona: "TifosiX_System_Architect",
  query: "steering vibration anomaly detection",
  top_k: 5
});
```

#### 3. Graph Query
Relationship traversal

```javascript
await mcpClient.useTool("context-broker-graph-query", {
  context_id: "ctx_cef8bb69f42f",
  AgentPersona: "TifosiX_System_Architect",
  query: "tire compound recommendations",
  max_depth: 1,
  limit: 5
});
```

---

## Frontend Architecture

### Component Structure

```
frontend/src/
├── App.tsx                 # Main application component
├── index.css              # Global styles with premium effects
├── main.tsx               # Application entry point
└── assets/                # Static assets
```

### State Management

**Local State (useState):**
- UI interactions
- Form inputs
- Modal visibility

**WebSocket State:**
- Real-time telemetry
- Agent execution updates
- Governance notifications

### Real-Time Communication

```typescript
// WebSocket connection
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'telemetry':
      updateTelemetryState(data.payload);
      break;
    case 'agent_execution':
      updateAgentTimeline(data.payload);
      break;
    case 'governance_update':
      updateApprovalQueue(data.payload);
      break;
  }
};
```

### UI Design System

**Color Palette:**
```css
--ferrari-red: #DC0000
--deep-black: #000000
--glass-bg: rgba(13, 13, 13, 0.7)
--neon-green: #22c55e
--neon-cyan: #06b6d4
--neon-purple: #a855f7
```

**Animation Library:**
- Framer Motion for component transitions
- CSS keyframes for continuous animations
- Recharts for data visualizations

**Key Effects:**
- Glassmorphism panels
- Neon glow borders
- Holographic card shine
- Telemetry stream animations
- Risk indicator pulses

---

## Security & Compliance

### Data Protection

1. **Telemetry Sanitization:**
   - Fan messages never contain raw values
   - Sensitive data filtered before display
   - Governance-approved content only

2. **Access Control:**
   - Role-based approval requirements
   - Audit trail for all decisions
   - Immutable log storage

3. **API Security:**
   - CORS configuration
   - Rate limiting (production)
   - Input validation
   - Error sanitization

### Explainable AI

Every decision includes:
- Complete reasoning trace
- Agent execution chain
- Confidence scores
- Risk factor breakdown
- MCP context sources

### Compliance Features

- **Audit Trails:** Immutable logs of all governed decisions
- **Human Oversight:** Mandatory approval for high-risk events
- **Traceability:** Complete workflow execution history
- **Transparency:** Explainable AI reasoning at every step

---

## Performance Considerations

### Backend Optimization

- **Async/Await:** Non-blocking agent execution
- **Event-Driven:** Telemetry simulator uses EventEmitter
- **Caching:** MCP context results (future enhancement)
- **Connection Pooling:** WebSocket connection management

### Frontend Optimization

- **Code Splitting:** Vite automatic chunking
- **Lazy Loading:** Components loaded on demand
- **Memoization:** React.memo for expensive renders
- **Virtual Scrolling:** For large telemetry datasets (future)

### Scalability

**Current Architecture:**
- Single Node.js process
- In-memory state management
- WebSocket for real-time updates

**Production Recommendations:**
- Redis for distributed state
- PostgreSQL for persistent storage
- Message queue (RabbitMQ/Kafka) for event streaming
- Load balancer for horizontal scaling
- Kubernetes for container orchestration

---

## Deployment Architecture

### Development

```
┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │
│  (Vite Dev) │     │  (Node.js)  │
│  Port 5173  │     │  Port 3001  │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Context   │
                    │   Studio    │
                    │     MCP     │
                    └─────────────┘
```

### Production (Recommended)

```
┌──────────────┐
│  Load        │
│  Balancer    │
└──────┬───────┘
       │
       ├─────────────┬─────────────┐
       ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Backend  │  │ Backend  │  │ Backend  │
│ Instance │  │ Instance │  │ Instance │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┼─────────────┘
                   ▼
            ┌─────────────┐
            │   Redis     │
            │   Cluster   │
            └─────────────┘
                   │
                   ▼
            ┌─────────────┐
            │ PostgreSQL  │
            │   Cluster   │
            └─────────────┘
```

---

## Future Enhancements

1. **Persistent Storage:**
   - PostgreSQL for audit logs
   - Redis for session management
   - S3 for telemetry archives

2. **Advanced Analytics:**
   - Machine learning for risk prediction
   - Historical trend analysis
   - Predictive maintenance

3. **Enhanced Governance:**
   - Multi-level approval workflows
   - Delegation capabilities
   - Automated escalation rules

4. **Real-Time Collaboration:**
   - Multi-user approval coordination
   - Live strategy discussion
   - Shared decision workspace

5. **Mobile Experience:**
   - Native mobile apps
   - Push notifications
   - Offline capability

---

**Built for the Bob-a-thon Hackathon**

*"AI assists humans in making earlier, safer decisions."*