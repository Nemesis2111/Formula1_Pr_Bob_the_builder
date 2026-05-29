# TifosiX AI - Formula 1 Decision Operating System

![TifosiX AI](https://img.shields.io/badge/TifosiX-AI--Native-DC0000?style=for-the-badge&logo=formula1)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

**An AI-Native Formula 1 Decision Operating System** powered by governed multi-agent orchestration, predictive telemetry intelligence, Context Studio ontology reasoning, and real-time fan engagement.

## 📑 Table of Contents

- [What is TifosiX AI?](#️-what-is-tifosix-ai)
- [Core Philosophy](#-core-philosophy)
- [Architecture](#️-architecture)
- [Governance Rules](#-governance-rules)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Frontend Features](#-frontend-features)
- [Example Workflows](#-example-workflows)
- [Security & Compliance](#-security--compliance)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Key Differentiators](#-key-differentiators)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏎️ What is TifosiX AI?

TifosiX AI is **NOT** a chatbot or dashboard application. It is:

> **"An AI-Native Formula 1 Decision Operating System"**

Powered by:
- ✅ Governed multi-agent orchestration
- ✅ Predictive telemetry intelligence
- ✅ Context Studio ontology reasoning
- ✅ Real-time fan engagement
- ✅ Human-in-the-loop governance
- ✅ Explainable AI reasoning

---

## 🎯 Core Philosophy

### AI-Native Architecture

Instead of rigid REST APIs like:
```
❌ POST /risk/analyze
❌ POST /strategy/recommend
❌ POST /fan/notify
❌ POST /governance/approve
```

TifosiX AI exposes **ONE intelligent endpoint**:

```typescript
✅ POST /agent
{
  "prompt": "Telemetry shows FER-16 has high tire wear, abnormal steering vibration, and rising track temperature. Assess safety risk, recommend strategy, request approval if needed, and create a fan-safe update."
}
```

The system:
1. **Understands intent** from natural language
2. **Retrieves ontology context** through MCP (Model Context Protocol)
3. **Routes to specialist agents** based on workflow requirements
4. **Enforces governance** with human-in-the-loop approval gates
5. **Creates audit logs** for compliance and explainability
6. **Generates fan-safe outputs** without exposing raw telemetry
7. **Returns one final governed response**

---

## 🏗️ Architecture

### Multi-Agent System

```
┌─────────────────────────────────────────────────────────────┐
│                  Decision Twin Supervisor Agent              │
│         (Intent Understanding & Workflow Orchestration)      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┬──────────────┐
        │            │            │            │              │
        ▼            ▼            ▼            ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   Safety     │ │ Strategy │ │Governance│ │   Fan    │ │   MCP    │
│Intelligence  │ │Recommend │ │ Approval │ │Engagement│ │  Client  │
│    Agent     │ │  Agent   │ │  Agent   │ │  Agent   │ │          │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Agent Responsibilities

#### 1. **Decision Twin Supervisor Agent**
- Understands user intent from natural language
- Queries Context Studio MCP for ontology context
- Routes requests to specialist agents
- Coordinates multi-step workflows
- Returns final governed response

#### 2. **Safety Intelligence Agent**
- Analyzes telemetry data
- Detects anomalies (tire wear, vibration, temperature)
- Calculates risk scores (0-100)
- Classifies severity (low, medium, high, critical)
- Produces explainable reasoning traces

#### 3. **Strategy Recommendation Agent**
- Recommends pit windows
- Suggests tire compounds (soft, medium, hard)
- Estimates residual risk after strategy execution
- Simulates strategy outcomes
- Provides confidence scores

#### 4. **Governance Approval Agent**
- Enforces approval rules:
  - `risk_score >= 80` → requires human approval
  - `confidence < 0.70` → requires escalation
  - `risk_score < 50 && confidence >= 0.85` → auto-approved
- Blocks unsafe propagation until approval
- Generates immutable audit logs
- Escalates high-risk events

#### 5. **Fan Engagement Agent**
- Generates multilingual fan narratives (EN, ES, IT)
- Creates emotional storytelling
- Removes sensitive telemetry from messages
- Personalizes race insights
- Publishes only approved content

---

## 📊 Governance Rules

### Risk-Based Approval

| Risk Score | Confidence | Action |
|------------|-----------|--------|
| ≥ 80 | Any | **Human approval required** |
| 60-79 | Any | **Human review recommended** |
| < 50 | ≥ 0.85 | **Auto-approved** |
| Any | < 0.70 | **Escalate to human** |

### Fan Safety Rules

Fan-facing messages **MUST NOT** include:
- ❌ Raw telemetry values (e.g., "87% tire wear")
- ❌ Confidential strategy calculations
- ❌ Internal governance decisions
- ❌ Unreleased operational data
- ❌ AI chain-of-thought or tool details

### Audit Requirements

Every governed decision stores:
- `event_id`, `strategy_id`, `pit_stop_id`
- `approver_name`, `approval_timestamp`, `approval_reason`
- `override_flag`, `governance_state`
- Complete agent execution chain
- MCP context retrieval logs

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose (for containerized deployment)
- Context Studio MCP server (optional)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd tifosiX-ai

# Install all dependencies
npm run install:all

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

### Running the Application

#### Option 1: Local Development

```bash
# Start both backend and frontend
npm run dev

# Or run separately:
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:5173
```

#### Option 2: Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

### Backend Only

```bash
cd backend
npm install
npm run dev
```

### Frontend Only

```bash
cd frontend
npm install
npm run dev
```

---

## 🔧 Configuration

### Backend Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Context Studio MCP Configuration
CONTEXT_STUDIO_URL=http://localhost:3000
CONTEXT_ID=ctx_cef8bb69f42f
MCP_API_KEY=your_api_key_here

# Agent Configuration
AGENT_PERSONA=TifosiX_System_Architect

# Governance Thresholds
HIGH_RISK_THRESHOLD=80
LOW_RISK_THRESHOLD=50
MIN_CONFIDENCE_THRESHOLD=0.70
AUTO_APPROVAL_CONFIDENCE=0.85

# Telemetry Simulator
TELEMETRY_INTERVAL_MS=5000
ENABLE_MOCK_TELEMETRY=true

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 📡 API Reference

### Main AI-Native Endpoint

#### `POST /agent`

Single intelligent endpoint for all workflows.

**Request:**
```json
{
  "prompt": "Natural language instruction",
  "context": {
    "telemetryEvent": { /* optional telemetry data */ }
  }
}
```

**Response:**
```json
{
  "success": true,
  "workflow_id": "uuid",
  "agent": "DecisionTwinSupervisorAgent",
  "intent": "telemetry_analysis",
  "result": {
    "workflow_type": "telemetry_analysis",
    "agent_chain": [ /* agent execution results */ ],
    "safety_analysis": { /* risk assessment */ },
    "strategy_recommendation": { /* pit strategy */ },
    "governance_decision": { /* approval status */ },
    "fan_messages": [ /* multilingual messages */ ],
    "requires_human_approval": true,
    "final_state": "awaiting_approval"
  },
  "execution_time_ms": 245
}
```

### Governance Endpoints

#### `GET /governance/approvals`
Get pending approvals.

#### `GET /governance/approvals/:id`
Get specific approval details.

#### `POST /governance/approvals/:id/decide`
Process human approval decision.

**Request:**
```json
{
  "action": "approve",
  "approver_name": "Marco Bellini",
  "approver_role": "Lead Race Engineer",
  "reason": "Critical tire vibration risk validated"
}
```

#### `GET /governance/stats`
Get governance statistics.

### Audit Endpoints

#### `GET /audit/logs`
Get audit logs with optional filters.

#### `GET /audit/trail/:eventId`
Get complete audit trail for an event.

### Telemetry Endpoints

#### `POST /telemetry/start`
Start telemetry simulator.

#### `POST /telemetry/stop`
Stop telemetry simulator.

#### `POST /telemetry/critical`
Generate a critical telemetry event manually.

---

## 🎨 Frontend Features

### Premium Cinematic UI Design

TifosiX AI features a **production-grade, cinematic Formula 1 operating system interface** with:

- **Ferrari + IBM Aesthetics:** Deep black backgrounds with Ferrari red (#DC0000) highlights
- **Glassmorphism Effects:** Premium glass panels with backdrop blur and subtle borders
- **Animated Telemetry:** Real-time charts with glowing lines and neon effects
- **Framer Motion:** Smooth cinematic transitions and micro-interactions
- **Holographic Cards:** Futuristic card designs with animated shine effects
- **Live Status Indicators:** Pulsing indicators for active agents and critical alerts
- **Responsive Grid Layout:** Full-screen dashboard with sidebar navigation
- **Premium Typography:** Titillium Web font family for F1 authenticity

### 1. AI Command Center
- Natural language input with glowing focus effects
- Real-time agent orchestration visualization
- Intent understanding feedback
- Quick action buttons for common workflows
- Animated agent execution timeline

### 2. Race Control Dashboard
- Live telemetry streams with animated charts
- Tire wear indicators with risk-based coloring
- Weather conditions with real-time updates
- Track environment monitoring
- Risk visualization with neon glow effects
- Recharts integration for smooth animations

### 3. Governance Console
- Pending approval queue with priority sorting
- Approval/rejection workflows with one-click actions
- Audit timeline with complete execution traces
- Human override panel with role-based controls
- Immutable audit trail visualization

### 4. Fan Intelligence Hub
- Fan-safe narratives with emotional storytelling
- Multilingual updates (EN, ES, IT)
- Personalized race insights
- Real-time message streaming
- Sentiment-aware content generation

### 5. Virtual Pit Wall Simulator
- Tire strategy simulator with visual predictions
- Pit timing calculator with lap-by-lap analysis
- Overtaking probability estimator
- AI vs human strategy comparison
- Interactive strategy playground

---

## 🧪 Example Workflows

### Workflow 1: Critical Telemetry Analysis

```bash
curl -X POST http://localhost:3001/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Telemetry shows FER-16 has 87% tire wear, 12.4 steering vibration, and 104.5°C engine temperature. Assess safety risk and recommend strategy."
  }'
```

**System Response:**
1. Safety Agent: Detects critical tire wear + steering instability → Risk Score: 91
2. Strategy Agent: Recommends immediate pit stop, medium compound
3. Governance Agent: Blocks propagation, requires human approval
4. Returns: Awaiting approval from Lead Race Engineer

### Workflow 2: Human Approval

```bash
curl -X POST http://localhost:3001/governance/approvals/{approval_id}/decide \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "approver_name": "Marco Bellini",
    "approver_role": "Lead Race Engineer",
    "reason": "Critical tire vibration risk validated against live telemetry"
  }'
```

**System Response:**
1. Governance Agent: Approval granted
2. Fan Agent: Generates multilingual messages
3. Audit Logger: Creates immutable audit trail
4. Returns: Complete workflow result with fan-safe messages

---

## 🔐 Security & Compliance

### Data Protection
- No raw telemetry in fan messages
- Governance-approved content only
- Immutable audit trails
- Role-based access control

### Explainable AI
- Complete reasoning traces
- Agent execution chains
- Confidence scores
- Risk factor breakdowns

### Human Oversight
- Mandatory approval for high-risk decisions
- Override capabilities
- Escalation workflows
- Timeout handling

---

## 📚 Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **WebSocket:** ws
- **MCP Client:** @modelcontextprotocol/sdk
- **Language:** JavaScript (ES Modules)

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Library:** IBM Carbon Design System
- **Animation:** Framer Motion
- **Charts:** Recharts
- **State:** Zustand
- **Build:** Vite

### Architecture
- **Pattern:** Multi-Agent System
- **Protocol:** Model Context Protocol (MCP)
- **Governance:** Human-in-the-Loop
- **Communication:** REST + WebSocket

---

## 📁 Project Structure

```
tifosiX-ai/
├── backend/                          # Backend Node.js application
│   ├── src/
│   │   ├── server.js                # Main server entry point
│   │   ├── agents/                  # Multi-agent system
│   │   │   ├── decisionTwinSupervisorAgent.js
│   │   │   ├── safetyIntelligenceAgent.js
│   │   │   ├── strategyRecommendationAgent.js
│   │   │   ├── governanceApprovalAgent.js
│   │   │   └── fanEngagementAgent.js
│   │   ├── services/                # Core services
│   │   │   ├── auditLogger.js       # Immutable audit trails
│   │   │   └── telemetrySimulator.js # Mock telemetry generator
│   │   └── config/
│   │       └── mcp.config.js        # MCP client configuration
│   ├── Dockerfile                   # Backend container image
│   ├── package.json
│   ├── .env.example                 # Environment template
│   └── .env                         # Local configuration
│
├── frontend/                         # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx                  # Main application component
│   │   ├── components/
│   │   │   └── RaceTrackVisualization.tsx
│   │   ├── assets/                  # Images and logos
│   │   └── main.tsx                 # Application entry point
│   ├── public/                      # Static assets
│   ├── Dockerfile                   # Frontend container image
│   ├── nginx.conf                   # Nginx configuration
│   ├── package.json
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   └── vite.config.ts               # Vite build configuration
│
├── docker-compose.yml               # Multi-container orchestration
├── openshift-deployment.yaml        # Kubernetes/OpenShift deployment
├── package.json                     # Root package scripts
├── README.md                        # This file
├── ARCHITECTURE.md                  # Detailed architecture documentation
└── DEPLOYMENT.md                    # Comprehensive deployment guide
```

### Key Files

- **[`backend/src/server.js`](tifosiX-ai/backend/src/server.js)** - Express server with WebSocket support
- **[`backend/src/agents/`](tifosiX-ai/backend/src/agents/)** - Multi-agent orchestration system
- **[`frontend/src/App.tsx`](tifosiX-ai/frontend/src/App.tsx)** - Main React application
- **[`docker-compose.yml`](tifosiX-ai/docker-compose.yml)** - Docker deployment configuration
- **[`ARCHITECTURE.md`](tifosiX-ai/ARCHITECTURE.md)** - System architecture details
- **[`DEPLOYMENT.md`](tifosiX-ai/DEPLOYMENT.md)** - Deployment guide

---

## 🎯 Key Differentiators

### vs Traditional F1 Systems
| Traditional | TifosiX AI |
|------------|------------|
| Manual dashboard monitoring | AI-native intent understanding |
| Separate tool workflows | Unified agent orchestration |
| Reactive decisions | Predictive intelligence |
| No governance layer | Governed human-in-the-loop |
| Raw data exposure | Fan-safe narratives |

### vs Chatbots
| Chatbots | TifosiX AI |
|----------|------------|
| Conversational only | Operational decision system |
| No workflow execution | Multi-agent orchestration |
| No governance | Enforced approval gates |
| No audit trails | Immutable compliance logs |
| Generic responses | Ontology-driven reasoning |

---

## 🐳 Deployment

### Available Deployment Options

TifosiX AI includes comprehensive deployment configurations for multiple platforms:

#### 1. Docker Deployment

**Files:**
- [`backend/Dockerfile`](tifosiX-ai/backend/Dockerfile) - Backend container configuration
- [`frontend/Dockerfile`](tifosiX-ai/frontend/Dockerfile) - Frontend container with Nginx
- [`docker-compose.yml`](tifosiX-ai/docker-compose.yml) - Multi-container orchestration

**Quick Start:**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services:**
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

#### 2. OpenShift/Kubernetes Deployment

**File:** [`openshift-deployment.yaml`](tifosiX-ai/openshift-deployment.yaml)

Includes:
- ConfigMap for environment variables
- Secret management for API keys
- Backend deployment with resource limits
- Frontend deployment with Nginx
- Service definitions
- OpenShift Route with TLS

**Deploy to OpenShift:**
```bash
# Apply configuration
oc apply -f openshift-deployment.yaml

# Check deployment status
oc get pods
oc get routes
```

#### 3. Detailed Deployment Guide

**File:** [`DEPLOYMENT.md`](tifosiX-ai/DEPLOYMENT.md)

Comprehensive guide covering:
- Local development setup
- Environment configuration
- Testing workflows
- Production deployment strategies
- Docker deployment
- Cloud deployment (AWS, Azure, GCP)
- Troubleshooting
- Performance monitoring
- Backup and recovery
- Security checklist

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer / Route                 │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   Frontend   │          │   Backend    │
│   (Nginx)    │◄────────►│  (Node.js)   │
│   Port 8080  │          │  Port 3001   │
└──────────────┘          └──────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │   MCP    │  │  Audit   │  │Telemetry │
            │  Server  │  │  Logger  │  │Simulator │
            └──────────┘  └──────────┘  └──────────┘
```

### Environment Variables

**Backend (.env):**
```env
PORT=3001
NODE_ENV=production
CONTEXT_STUDIO_URL=http://localhost:3000
CONTEXT_ID=ctx_cef8bb69f42f
MCP_API_KEY=your_api_key_here
HIGH_RISK_THRESHOLD=80
LOW_RISK_THRESHOLD=50
MIN_CONFIDENCE_THRESHOLD=0.70
AUTO_APPROVAL_CONFIDENCE=0.85
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env.docker):**
```env
VITE_API_URL=/api
VITE_WS_URL=/ws
```

### Production Considerations

For production deployment, ensure:

1. ✅ **Security:** Enable HTTPS, configure CORS, use secrets management
2. ✅ **Scalability:** Configure horizontal pod autoscaling
3. ✅ **Monitoring:** Set up logging, metrics, and alerting
4. ✅ **Backup:** Implement audit log backup strategy
5. ✅ **High Availability:** Deploy multiple replicas
6. ✅ **Resource Limits:** Configure CPU/memory limits
7. ✅ **Health Checks:** Implement liveness and readiness probes

---

## 🤝 Contributing

This is a demonstration project for the Bob-a-thon hackathon. For production use, consider:

1. Implementing actual MCP server integration
2. Adding authentication & authorization
3. Implementing persistent database storage
4. Adding comprehensive test coverage
5. Implementing production-grade error handling
6. Adding monitoring & observability
7. Implementing rate limiting & throttling

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🏁 Acknowledgments

- **Context Studio** for ontology-driven reasoning
- **IBM Carbon Design System** for enterprise UI components
- **Formula 1** for inspiration
- **Ferrari** for the iconic red

---

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.

**Project Documentation:** [View on SharePoint](https://ibm-my.sharepoint.com/:b:/p/kali_johari/IQCuxa4Iz1oIToA-oNLRPIeDAcqWQjv9USMoD9rfK3HdMwk?e=YooP1J)

---

**Built with ❤️ for the Bob-a-thon Hackathon**

*"AI assists humans in making earlier, safer decisions."*
