# TifosiX AI - Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Environment Configuration](#environment-configuration)
3. [Running the Application](#running-the-application)
4. [Testing Workflows](#testing-workflows)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js:** Version 18 or higher
- **npm:** Version 9 or higher (comes with Node.js)
- **Git:** For version control
- **VS Code:** Recommended IDE (optional)

### Verify Installation

```bash
node --version  # Should be v18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

---

## Environment Configuration

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd tifosiX-ai
```

### Step 2: Install Dependencies

#### Option A: Install All at Once (Recommended)

```bash
npm run install:all
```

This will install dependencies for both backend and frontend.

#### Option B: Install Separately

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 3: Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

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

### Step 4: Configure MCP Connection (Optional)

If you have a Context Studio MCP server running, update the MCP configuration:

**File:** `backend/src/config/mcp.config.js`

```javascript
export const mcpConfig = {
  serverName: 'context-studio',
  transport: {
    type: 'sse',
    url: process.env.CONTEXT_STUDIO_URL || 'http://localhost:3000',
    headers: {
      'x-api-key': process.env.MCP_API_KEY || ''
    }
  }
};
```

---

## Running the Application

### Option 1: Run Both Services Together (Recommended)

From the root `tifosiX-ai` directory:

```bash
npm run dev
```

This will start:
- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

### Option 2: Run Services Separately

#### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

Backend will start on http://localhost:3001

#### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Frontend will start on http://localhost:5173

### Verify Services are Running

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-15T10:30:00.000Z",
     "uptime": 123.456
   }
   ```

2. **Frontend:**
   Open http://localhost:5173 in your browser
   You should see the TifosiX AI dashboard

3. **WebSocket Connection:**
   The frontend should automatically connect to the WebSocket server
   Check browser console for: `"WebSocket connected"`

---

## Testing Workflows

### 1. Test Telemetry Simulator

The telemetry simulator starts automatically when the backend launches.

**Start Simulator:**
```bash
curl -X POST http://localhost:3001/telemetry/start
```

**Stop Simulator:**
```bash
curl -X POST http://localhost:3001/telemetry/stop
```

**Generate Critical Event:**
```bash
curl -X POST http://localhost:3001/telemetry/critical
```

### 2. Test AI Agent Endpoint

#### Example 1: Telemetry Analysis

```bash
curl -X POST http://localhost:3001/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Telemetry shows FER-16 has 87% tire wear, 12.4 steering vibration, and 104.5°C engine temperature. Assess safety risk and recommend strategy."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "workflow_id": "uuid",
  "agent": "DecisionTwinSupervisorAgent",
  "intent": "telemetry_analysis",
  "result": {
    "workflow_type": "telemetry_analysis",
    "safety_analysis": {
      "risk_score": 91,
      "severity": "critical",
      "reasoning": "..."
    },
    "strategy_recommendation": {
      "action": "immediate_pit_stop",
      "compound": "medium",
      "confidence": 0.92
    },
    "governance_decision": {
      "state": "requires_approval",
      "approval_id": "uuid"
    },
    "requires_human_approval": true
  }
}
```

#### Example 2: Strategy Planning

```bash
curl -X POST http://localhost:3001/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Plan optimal pit strategy for next 10 laps with current tire wear at 65%"
  }'
```

#### Example 3: Fan Update

```bash
curl -X POST http://localhost:3001/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Generate fan update about current race situation"
  }'
```

### 3. Test Governance Workflow

#### Get Pending Approvals

```bash
curl http://localhost:3001/governance/approvals
```

#### Approve a Decision

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

#### Reject a Decision

```bash
curl -X POST http://localhost:3001/governance/approvals/{approval_id}/decide \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "approver_name": "Marco Bellini",
    "approver_role": "Lead Race Engineer",
    "reason": "Risk assessment requires additional sensor validation"
  }'
```

### 4. Test Audit Logs

#### Get All Audit Logs

```bash
curl http://localhost:3001/audit/logs
```

#### Get Audit Trail for Specific Event

```bash
curl http://localhost:3001/audit/trail/{event_id}
```

#### Get Governance Statistics

```bash
curl http://localhost:3001/governance/stats
```

---

## Production Deployment

### Docker Deployment (Recommended)

#### Step 1: Create Dockerfile for Backend

**File:** `backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

#### Step 2: Create Dockerfile for Frontend

**File:** `frontend/Dockerfile`

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Step 3: Create docker-compose.yml

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - CONTEXT_STUDIO_URL=${CONTEXT_STUDIO_URL}
      - CONTEXT_ID=${CONTEXT_ID}
      - MCP_API_KEY=${MCP_API_KEY}
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

#### Step 4: Deploy with Docker Compose

```bash
docker-compose up -d
```

### Cloud Deployment Options

#### AWS Deployment

1. **Backend:** AWS Elastic Beanstalk or ECS
2. **Frontend:** S3 + CloudFront
3. **Database:** RDS PostgreSQL
4. **Cache:** ElastiCache Redis
5. **Load Balancer:** Application Load Balancer

#### Azure Deployment

1. **Backend:** Azure App Service
2. **Frontend:** Azure Static Web Apps
3. **Database:** Azure Database for PostgreSQL
4. **Cache:** Azure Cache for Redis
5. **Load Balancer:** Azure Load Balancer

#### Google Cloud Deployment

1. **Backend:** Cloud Run or GKE
2. **Frontend:** Cloud Storage + Cloud CDN
3. **Database:** Cloud SQL PostgreSQL
4. **Cache:** Memorystore for Redis
5. **Load Balancer:** Cloud Load Balancing

### Environment Variables for Production

```env
# Production Backend .env
NODE_ENV=production
PORT=3001

# Database (if using persistent storage)
DATABASE_URL=postgresql://user:password@host:5432/tifosix

# Redis (if using distributed cache)
REDIS_URL=redis://host:6379

# Context Studio MCP
CONTEXT_STUDIO_URL=https://context-studio.production.com
CONTEXT_ID=ctx_cef8bb69f42f
MCP_API_KEY=production_api_key

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=https://tifosix.production.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### 2. WebSocket Connection Failed

**Error:** `WebSocket connection to 'ws://localhost:3001' failed`

**Solution:**
- Ensure backend is running
- Check CORS configuration in `backend/src/server.js`
- Verify WebSocket server is initialized

#### 3. MCP Connection Error

**Error:** `Failed to connect to Context Studio MCP`

**Solution:**
- Verify `CONTEXT_STUDIO_URL` in `.env`
- Check `MCP_API_KEY` is correct
- Ensure Context Studio server is running
- Test connection: `curl http://localhost:3000/health`

#### 4. Frontend Build Errors

**Error:** `Cannot find module 'lucide-react'`

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 5. Backend Crashes on Startup

**Error:** `Cannot find module './agents/...'`

**Solution:**
- Verify all agent files exist in `backend/src/agents/`
- Check file paths in import statements
- Ensure ES module syntax is correct

### Debug Mode

Enable detailed logging:

```bash
# Backend
DEBUG=* npm run dev

# Or set in .env
LOG_LEVEL=debug
```

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Check telemetry simulator status
curl http://localhost:3001/telemetry/status

# Check governance stats
curl http://localhost:3001/governance/stats
```

### Log Files

Logs are written to console by default. For production, configure log aggregation:

```javascript
// backend/src/utils/logger.js
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## Performance Monitoring

### Metrics to Track

1. **Agent Execution Time:** Average time per agent workflow
2. **Approval Queue Length:** Number of pending approvals
3. **WebSocket Connections:** Active real-time connections
4. **Telemetry Event Rate:** Events processed per second
5. **MCP Query Latency:** Time to retrieve context

### Monitoring Tools

- **Application Performance:** New Relic, Datadog
- **Error Tracking:** Sentry
- **Log Aggregation:** ELK Stack, Splunk
- **Uptime Monitoring:** Pingdom, UptimeRobot

---

## Backup and Recovery

### Data to Backup

1. **Audit Logs:** Complete decision history
2. **Approval Records:** Governance decisions
3. **Telemetry Archives:** Historical race data
4. **Configuration:** Environment variables and secrets

### Backup Strategy

```bash
# Backup audit logs (if using file storage)
tar -czf audit-logs-$(date +%Y%m%d).tar.gz backend/data/audit-logs/

# Backup database (if using PostgreSQL)
pg_dump -U postgres tifosix > backup-$(date +%Y%m%d).sql
```

---

## Security Checklist

- [ ] Change default API keys
- [ ] Enable HTTPS in production
- [ ] Configure rate limiting
- [ ] Set up authentication
- [ ] Enable CORS restrictions
- [ ] Sanitize user inputs
- [ ] Implement audit logging
- [ ] Set up monitoring alerts
- [ ] Regular security updates
- [ ] Backup strategy in place

---

## Support

For issues or questions:

1. Check this deployment guide
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Check [README.md](./README.md)
4. Open a GitHub issue
5. Contact the development team

---

**Built for the Bob-a-thon Hackathon**

*"AI assists humans in making earlier, safer decisions."*