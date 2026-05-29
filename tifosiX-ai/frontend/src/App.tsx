import ibmLogo from './assets/IBM-LOGO.png'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Zap, Shield, Target, Users, AlertTriangle,
  CheckCircle, Clock, Wind, Thermometer, Radio, Send,
  Sparkles, Brain, Eye, ChevronRight, Play, Pause
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts'
import RaceTrackVisualization from './components/RaceTrackVisualization'
import './App.css'

const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://tifosix-backend-zenith.bobathon-us-south-1-bx2-1-eed9cf6127dd1cc2309a78aba5f4061d-0000.us-south.containers.appdomain.cloud'

interface TelemetryEvent {
  event_id: string
  lap: number
  vehicle: {
    vehicle_id: string
    driver_name: string
    team_name: string
    tire_wear_percent: number
    steering_vibration: number
    engine_temperature: number
    speed_kmh: number
    tire_compound: string
  }
  risk_analysis: {
    risk_score: number
    severity: string
    event_type: string
  }
  track_environment: {
    track_temperature: number
    surface_grip_level: string
  }
  weather_condition: {
    temperature_celsius: number
    wind_speed_kmh: number
  }
}

interface OrchestrationStage {
  id: string
  name: string
  status: 'pending' | 'running' | 'complete' | 'error'
  timestamp?: string
  data?: any
}

function buildAgentDataMap(agentChain: any[]): Record<string, any> {
  const map: Record<string, any> = {}

  agentChain.forEach((entry: any) => {
    if (entry.agent === 'SafetyIntelligenceAgent') {
      map['safety_intelligence'] = {
        risk_score: entry.result?.analysis?.risk_score,
        severity: entry.result?.analysis?.severity,
        anomaly_detected: entry.result?.analysis?.anomaly_detected || 'Assessed',
        confidence_score: entry.result?.analysis?.confidence_score,
      }
    }
    
    if (entry.agent === 'StrategyRecommendationAgent') {
      map['strategy_recommendation'] = {
        recommended_pit_window: entry.result?.recommendation?.pit_window || 'Calculated',
        recommended_tire: entry.result?.recommendation?.compound || 'Medium compound',
        residual_risk: entry.result?.recommendation?.residual_risk || 'Moderate',
        strategy_reasoning: entry.result?.recommendation?.reasoning || 'Immediate defensive pit stop recommended.',
      }
    }

    if (entry.agent === 'GovernanceApprovalAgent') {
      const rec = entry.result?.approval_record
      map['governance_approval'] = {
        approval_state: rec?.approval_status,
        approval_required: rec?.requires_human_approval,
        escalation_state: rec?.requires_human_approval ? 'critical_review' : 'none',
        approver_name: rec?.requires_human_approval
          ? 'Awaiting race engineer approval'
          : 'System (auto-approved)',
      }
    }

    if (entry.agent === 'FanEngagementAgent') {
      map['fan_engagement'] = {
        fan_narrative: entry.result?.messages
          ? 'Fan-safe race update generated and published.'
          : 'Pending approval — narrative staged.',
        multilingual_status: 'EN, IT, ES, HI',
        telemetry_redaction: true,
        publication_timestamp: new Date().toISOString(),
      }
    }
  })

  return map
}

function animatePipeline(
  agentChain: any[],
  setOrchestrationStages: React.Dispatch<React.SetStateAction<OrchestrationStage[]>>,
  includeFanEngagement = false
) {
  const stageIds = includeFanEngagement
    ? [
        'safety_intelligence',
        'strategy_recommendation',
        'fan_engagement',
      ]
    : [
        'safety_intelligence',
        'strategy_recommendation',
        'governance_approval',
      ]

  const dataMap = buildAgentDataMap(agentChain)

  if (includeFanEngagement) {
    dataMap['fan_engagement'] = {
      fan_narrative: 'Fan-safe race update generated and published.',
      multilingual_status: 'EN, IT, ES, HI',
      telemetry_redaction: true,
      publication_timestamp: new Date().toISOString(),
    }
  }

  stageIds.forEach((id, i) => {
    const runAt = (i + 1) * 800
    const completeAt = runAt + 600

    setTimeout(() => {
      setOrchestrationStages(prev =>
        prev.map(s =>
          s.id === id
            ? { ...s, status: 'running', timestamp: new Date().toISOString() }
            : s
        )
      )
    }, runAt)

    setTimeout(() => {
      setOrchestrationStages(prev =>
        prev.map(s =>
          s.id === id
            ? {
                ...s,
                status: 'complete',
                timestamp: new Date().toISOString(),
                data: dataMap[id] || {},
              }
            : s
        )
      )
    }, completeAt)
  })
}

const DEFAULT_STAGES: OrchestrationStage[] = [
  { id: 'telemetry_received', name: 'Telemetry Received', status: 'pending', data: {} },
  { id: 'safety_intelligence', name: 'Safety Intelligence Agent', status: 'pending', data: {} },
  { id: 'strategy_recommendation', name: 'Strategy Recommendation Agent', status: 'pending', data: {} },
  { id: 'governance_approval', name: 'Governance Approval Agent', status: 'pending', data: {} },
 { id: 'fan_engagement', name: 'Fan Engagement Agent', status: 'pending', data: {} },
]

function App() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [telemetry, setTelemetry] = useState<TelemetryEvent | null>(null)
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const [orchestrationStages, setOrchestrationStages] = useState<OrchestrationStage[]>([])
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [fanMessages, setFanMessages] = useState<any[]>([])
  const [generatingFanMessage, setGeneratingFanMessage] = useState(false)

  const isSimulatorRunningRef = useRef(false)
  isSimulatorRunningRef.current = isSimulatorRunning

const appendFanMessages = useCallback((newMsgs: any[]) => {
  setFanMessages(prev => {
    const existingIds = new Set(prev.map((m: any) => m.message_id));
    const dedupedNew = newMsgs.filter((m: any) => !existingIds.has(m.message_id));
    return [...dedupedNew, ...prev].slice(0, 20);
  });
}, []);

  const initializeStages = useCallback((currentTelemetry: TelemetryEvent | null) => {
    setOrchestrationStages(
      DEFAULT_STAGES.map(s =>
        s.id === 'telemetry_received'
          ? {
              ...s,
              status: currentTelemetry ? 'complete' : 'running',
              timestamp: new Date().toISOString(),
              data: currentTelemetry ? {
                vehicle_id: currentTelemetry.vehicle.vehicle_id,
                steering_vibration: currentTelemetry.vehicle.steering_vibration,
                tire_wear: currentTelemetry.vehicle.tire_wear_percent,
                track_temperature: currentTelemetry.track_environment.track_temperature,
              } : {}
            }
          : s
      )
    )
  }, [])

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

const wsUrl =
  window.location.hostname === 'localhost'
    ? 'ws://localhost:3001'
    : `${wsProtocol}//tifosix-backend-zenith.bobathon-us-south-1-bx2-1-eed9cf6127dd1cc2309a78aba5f4061d-0000.us-south.containers.appdomain.cloud`

const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('✅ WebSocket connected')
      setWsConnected(true)
    }

    websocket.onclose = () => {
      console.log('🔌 WebSocket closed')
      setWsConnected(false)
    }

    websocket.onerror = () => {
      setWsConnected(false)
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)

if (
  (data.event === 'telemetry' ||
    data.event === 'auto_analysis' ||
    data.event === 'pipeline_start') &&
  !isSimulatorRunningRef.current
) {
  return
}

      if (data.event === 'telemetry') {
        const td: TelemetryEvent = data.data
        setTelemetry(td)

        setTelemetryHistory(prev => [
          ...prev.slice(-20),
          {
            lap: td.lap,
            risk: td.risk_analysis.risk_score,
            tire: td.vehicle.tire_wear_percent,
            temp: td.vehicle.engine_temperature,
          }
        ])

        setOrchestrationStages(prev => {
          const stage: OrchestrationStage = {
            id: 'telemetry_received',
            name: 'Telemetry Received',
            status: 'complete',
            timestamp: new Date().toISOString(),
            data: {
              vehicle_id: td.vehicle.vehicle_id,
              steering_vibration: td.vehicle.steering_vibration,
              tire_wear: td.vehicle.tire_wear_percent,
              track_temperature: td.track_environment.track_temperature,
            }
          }

          const exists = prev.some(s => s.id === 'telemetry_received')
          return exists
            ? prev.map(s => s.id === 'telemetry_received' ? stage : s)
            : [stage, ...DEFAULT_STAGES.filter(s => s.id !== 'telemetry_received')]
        })
      }

      if (data.event === 'pipeline_start') {
        setTelemetry(prev => {
          initializeStages(prev)
          return prev
        })
      }

      if (data.event === 'auto_analysis') {
        const result = data.data
        setResponse(result)

const autoMessage = 
          result?.chat_answer ||
          result?.summary ||
          result?.result?.recommendation?.reasoning ||
          '⚠️ High-risk telemetry detected. Auto-analysis executed.';

        setChatHistory(prev => [
          ...prev,
          { role: 'assistant', message: `[SYSTEM ALERT] ${autoMessage}` }
        ]);

        const agentChain: any[] =
          result?.result?.agent_chain ||
          result?.agent_chain ||
          []

        setOrchestrationStages(prev =>
          prev.length === 0 ? [...DEFAULT_STAGES] : prev
        )

        animatePipeline(agentChain, setOrchestrationStages, false)
        
              }

      if (data.event === 'fan_messages') {
        const newMessages = (data.data.messages || []).map((msg: any) => ({
  ...msg,
  source: msg.source || 'command_center',
  timestamp: data.data.timestamp || new Date().toISOString(),
  status: 'published',
  delivery_status: msg.delivery_status || 'published'
}))

        appendFanMessages(newMessages)
        setGeneratingFanMessage(false)
      }

      if (data.event === 'approval_decision') {
        if (data.data.fan_messages?.length) {
          const newMessages = data.data.fan_messages.map((msg: any) => ({
  ...msg,
  source: msg.source || 'governance_approval',
  timestamp: new Date().toISOString(),
  status: 'published',
  delivery_status: msg.delivery_status || 'published'
}))

          appendFanMessages(newMessages)
        }

        setGeneratingFanMessage(false)
      }
    }

    return () => websocket.close()
  }, [])

  useEffect(() => {
    if (!isSimulatorRunning) {
      setPendingApprovals([])
      return
    }

    const fetchApprovals = async () => {
      try {
        const res = await fetch(
  `${API_URL}/governance/approvals`,
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }
)
console.log('approval response:', await res.clone().text())
        const data = await res.json()
        if (data.success) setPendingApprovals(data.approvals)
      } catch (error) {
        console.error('Error fetching approvals:', error)
      }
    }

   // fetchApprovals()
    fetchApprovals()
const interval = setInterval(fetchApprovals, 2000)

   return () => clearInterval(interval)
  }, [isSimulatorRunning])

// const createPromptFanMessages = (userPrompt: string, answer: string) => {
//   const driverName = telemetry?.vehicle?.driver_name || 'Ferrari Driver'
//   const timestamp = new Date().toISOString()

//   return [
//     {
//       message_id: `prompt_fan_${Date.now()}_en`,
//       language: 'en',
//       message_title: `💬 AI Command Center Update`,
//       message_content: answer || `Fan-safe update generated for: ${userPrompt}`,
//       emotional_tone: 'informative',
//       message_type: 'chat_prompt',
//       timestamp,
//       status: 'published'
//     },
//     {
//       message_id: `prompt_fan_${Date.now()}_hi`,
//       language: 'hi',
//       message_title: `🇮🇳 AI कमांड सेंटर अपडेट`,
//       message_content: `${driverName} के लिए फैन-सेफ अपडेट तैयार किया गया है: ${answer || userPrompt}`,
//       emotional_tone: 'fan-friendly',
//       message_type: 'chat_prompt',
//       timestamp,
//       status: 'published'
//     }
//   ]
// }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) return

    setLoading(true)
    setResponse(null)

    const currentTelemetry = telemetry
    initializeStages(currentTelemetry)

    try {
      const res = await fetch(`${API_URL}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: currentTelemetry
            ? { telemetryEvent: currentTelemetry, languages: ['en', 'it', 'es', 'hi'] }
            : { languages: ['en', 'it', 'es', 'hi'] }
        })
      })

      const data = await res.json()
      setResponse(data)

      const assistantMessage =
  data?.chat_answer ||                                    // ← new clean field
  data?.fan_messages?.[0]?.message_content ||
  data?.result?.result?.recommendation?.reasoning ||
  data?.summary ||
  'AI workflow completed';

      setChatHistory(prev => [
        ...prev,
        { role: 'user', message: prompt },
        { role: 'assistant', message: assistantMessage }
      ])

      setPrompt('')

      const generatedMessages =
  data?.fan_messages ||
  data?.messages ||
  data?.result?.fan_messages ||
  data?.result?.messages ||
  []

if (generatedMessages.length > 0) {
  const formattedMessages = generatedMessages.map((msg: any) => ({
    ...msg,
    source: msg.source || 'command_center',
    timestamp: new Date().toISOString(),
    status: 'published',
    delivery_status: msg.delivery_status || 'published'
  }))

  appendFanMessages(formattedMessages)
}

      const agentChain: any[] =
        data?.result?.result?.agent_chain ||
        data?.result?.agent_chain ||
        []

      if (agentChain.length > 0) {
        animatePipeline(agentChain, setOrchestrationStages, true)
//         setTimeout(() => {
//   fetch(`${API_URL}/governance/approvals`)
//     .then(res => res.json())
//     .then(data => {
//       if (data.success) {
//         setPendingApprovals(data.approvals)
//       }
//     })
//     .catch(error => {
//       console.error('Error fetching approvals:', error)
//     })
// }, 3200)
      } else {
        const riskScore = currentTelemetry?.risk_analysis.risk_score ?? 50
        const severity = currentTelemetry?.risk_analysis.severity ?? 'moderate'

        const fallbackMap: Record<string, any> = {
  safety_intelligence: {
    risk_score: riskScore,
    severity,
    anomaly_detected: 'Assessed from telemetry',
    confidence_score: 0.91,
  },
  strategy_recommendation: {
    recommended_pit_window: 'Lap 25–26',
    recommended_tire: 'Medium compound',
    residual_risk: 'Moderate',
    strategy_reasoning: 'Defensive pit stop recommended.',
  },
  governance_approval: {
    approval_state: 'auto_approved',
    approval_required: false,
    escalation_state: 'none',
    approver_name: 'System',
  },
  fan_engagement: {
    fan_narrative: 'Fan-safe race update generated and published.',
    multilingual_status: 'EN, IT, ES, HI',
    telemetry_redaction: true,
    publication_timestamp: new Date().toISOString(),
  },
}

    const fallbackStageIds = [
  'safety_intelligence',
  'strategy_recommendation',
  'governance_approval',
  'fan_engagement'
]

        fallbackStageIds.forEach((id, i) => {
          setTimeout(() => {
            setOrchestrationStages(prev =>
              prev.map(s =>
                s.id === id
                  ? { ...s, status: 'running', timestamp: new Date().toISOString() }
                  : s
              )
            )
          }, (i + 1) * 800)

          setTimeout(() => {
            setOrchestrationStages(prev =>
              prev.map(s =>
                s.id === id
                  ? {
                      ...s,
                      status: 'complete',
                      timestamp: new Date().toISOString(),
                      data: fallbackMap[id] || {}
                    }
                  : s
              )
            )
          }, (i + 1) * 800 + 600)
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setResponse({ success: false, error: 'Failed to connect to backend' })
      setOrchestrationStages(prev =>
        prev.map(stage =>
          stage.status === 'running'
            ? { ...stage, status: 'error' }
            : stage
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const toggleSimulator = async () => {
    try {
      if (isSimulatorRunning) {
        await fetch(`${API_URL}/telemetry/stop`, { method: 'POST' })
        setIsSimulatorRunning(false)
        setTelemetry(null)
        setTelemetryHistory([])
        setOrchestrationStages([])
        setPendingApprovals([])
        setFanMessages([])
        setGeneratingFanMessage(false)
        setResponse(null)
        setChatHistory([])
      } else {
        await fetch(`${API_URL}/telemetry/start`, { method: 'POST' })
        setIsSimulatorRunning(true)
        initializeStages(null)
      }
    } catch (error) {
      console.error('Error toggling simulator:', error)
    }
  }

  const generateCritical = async () => {
  try {
    const res = await fetch(`${API_URL}/telemetry/critical`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Critical event API failed:', res.status, errorText)
      return
    }

    const data = await res.json()
    console.log('Critical event generated:', data)

  } catch (error) {
    console.error('Error generating critical event:', error)
  }
}
 

  const handleApproval = async (approvalId: string, action: string) => {
    try {
      if (action === 'approve') setGeneratingFanMessage(true)

      const res = await fetch(`${API_URL}/governance/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          approver_name: 'Marco Bellini',
          approver_role: 'Lead Race Engineer',
          reason: action === 'approve'
            ? 'Decision validated against live telemetry'
            : 'Risk assessment requires additional validation',
          languages: ['en', 'it', 'es', 'hi']
        })
      })

      const data = await res.json()

      setPendingApprovals(prev =>
        prev.filter(a => a.approval_id !== approvalId)
      )

      if (action === 'approve') {
        setOrchestrationStages(prev =>
          prev.map(stage => {
            if (stage.id === 'fan_engagement') {
              return {
                ...stage,
                status: 'running',
                timestamp: new Date().toISOString(),
                data: { status: 'Generating multilingual narratives' }
              }
            }

            return stage
          })
        )

        const backendMessages = data.fan_messages || data.messages || []

        if (backendMessages.length > 0) {
          const newMessages = backendMessages.map((msg: any) => ({
  ...msg,
  source: msg.source || 'governance_approval',
  timestamp: new Date().toISOString(),
  status: 'published',
  delivery_status: msg.delivery_status || 'published'
}))

          appendFanMessages(newMessages)
        } else {
          const approval = pendingApprovals.find(a => a.approval_id === approvalId)
          const driverName = approval?.vehicle?.driver_name || telemetry?.vehicle?.driver_name || 'the driver'
          const timestamp = new Date().toISOString()

          const fallbackMessages = [
            {
               message_id: `fan_${Date.now()}_en_1`,
  language: 'en',
  source: 'governance_approval',
  delivery_status: 'published',
  message_title: '🚨 Ferrari Strategy Alert',
              message_content: `Ferrari calls ${driverName} into the pits after signs of elevated tire stress.`,
              emotional_tone: 'urgent',
              timestamp,
              status: 'published'
            },
            {
              message_id: `fan_${Date.now()}_it_1`,
              language: 'it',
              source: 'governance_approval',
  delivery_status: 'published',
              message_title: '🇮🇹 Aggiornamento Ferrari',
              message_content: `Ferrari richiama ${driverName} ai box dopo segnali di stress elevato sugli pneumatici.`,
              emotional_tone: 'dramatic',
              timestamp,
              status: 'published'
            },
            {
              message_id: `fan_${Date.now()}_es_1`,
              language: 'es',
              source: 'governance_approval',
  delivery_status: 'published',
              message_title: '🇪🇸 Alerta Estratégica Ferrari',
              message_content: `Ferrari llama a ${driverName} a boxes tras señales de estrés elevado en los neumáticos.`,
              emotional_tone: 'strategic',
              timestamp,
              status: 'published'
            },
            {
              message_id: `fan_${Date.now()}_hi_1`,
              language: 'hi',
              source: 'governance_approval',
  delivery_status: 'published',
              message_title: '🇮🇳 Ferrari अपडेट',
              message_content: `Ferrari ${driverName} को पिट में बुला रही है टायर स्ट्रेस के संकेतों के बाद।`,
              emotional_tone: 'fan-friendly',
              timestamp,
              status: 'published'
            },
          ]

          appendFanMessages(fallbackMessages)
        }

        setOrchestrationStages(prev =>
  prev.map(stage => {
    if (stage.id === 'governance_approval') {
      return {
        ...stage,
        status: 'complete',
        timestamp: new Date().toISOString(),
        data: {
          approval_state: 'approved',
          approval_required: false,
          escalation_state: 'resolved',
          approver_name: 'Marco Bellini',
        }
      }
    }

    if (stage.id === 'fan_engagement') {
      return {
        ...stage,
        status: 'complete',
        timestamp: new Date().toISOString(),
        data: {
          fan_narrative: 'Fan-safe race update generated',
          multilingual: 'EN, IT, ES, HI'
        }
      }
    }

    return stage
  })
)
      }

      setGeneratingFanMessage(false)
    } catch (error) {
      console.error('Error processing approval:', error)
      setGeneratingFanMessage(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500'
    if (score >= 60) return 'text-orange-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-green-400'
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ferrari-red/5 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(220,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(220,0,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 flex h-screen">
        <aside className="w-72 border-r border-ferrari-red/20 bg-black/50 backdrop-blur-xl flex flex-col">
          <div className="p-6 border-b border-ferrari-red/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ferrari-red to-red-700 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">TifosiX AI</h1>
                <p className="text-xs text-gray-500">Decision Operating System</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 border-b border-ferrari-red/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Race Session</span>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">LIVE</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Telemetry</span>
              <button
                onClick={toggleSimulator}
                className={`text-xs px-3 py-1 rounded-full ${
                  isSimulatorRunning
                    ? 'bg-ferrari-red/20 text-ferrari-red'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {isSimulatorRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">WebSocket</span>
              <span className={`text-xs ${wsConnected && isSimulatorRunning ? 'text-green-400' : 'text-red-400'}`}>
                {wsConnected && isSimulatorRunning ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-auto">
            <h3 className="text-sm font-semibold mb-4 tracking-[0.2em] text-gray-500">ACTIVE AGENTS</h3>

            <div className="space-y-3">
              {[
                { name: 'Safety Intelligence', icon: Shield, color: 'text-blue-400' },
                { name: 'Strategy AI', icon: Target, color: 'text-purple-400' },
                { name: 'Governance', icon: Eye, color: 'text-yellow-400' },
                { name: 'Fan Engagement', icon: Users, color: 'text-green-400' }
              ].map((agent) => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  key={agent.name}
                  className="group flex items-center gap-3 rounded-2xl border border-gray-800 bg-gradient-to-r from-gray-900/70 to-black/40 p-4 transition-all hover:border-ferrari-red/40 hover:shadow-[0_0_20px_rgba(220,0,0,0.15)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-700 bg-black/50">
                    <agent.icon className={`h-5 w-5 ${agent.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{agent.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500">AI Agent Active</div>
                  </div>
                  <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-green-400 blur-sm opacity-60" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-ferrari-red/20 bg-gradient-to-br from-ferrari-red/10 via-black/40 to-black/80 p-5 shadow-[0_0_35px_rgba(220,0,0,0.15)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Active Driver</span>
                <span className="rounded-full bg-green-500/20 px-2 py-1 text-[10px] font-bold text-green-400">PUSH</span>
              </div>
              <div className="text-xl font-black tracking-wide text-white">
                {telemetry?.vehicle?.driver_name || 'No Driver'}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {telemetry?.vehicle?.team_name || 'Unknown Team'}
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '74%' }}
                  transition={{ duration: 1.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Attack Mode</span>
                <span>74%</span>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">AI Confidence</span>
                <span className="text-lg font-black text-cyan-400">94%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '94%' }}
                  transition={{ duration: 1.4 }}
                  className="h-full rounded-full bg-cyan-400"
                />
              </div>
              <div className="mt-3 text-xs text-gray-500">Strategy recommendation confidence</div>
            </div>

            <div className="mt-5 rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5">
              <div className="mb-4 text-[10px] uppercase tracking-[0.3em] text-yellow-300">Tire Compound</div>
              <div className="flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-yellow-400" />
                  <div className="absolute inset-2 rounded-full border border-yellow-300/30" />
                </div>
                <div>
                  <div className="font-bold text-white">Medium</div>
                  <div className="text-xs text-gray-500">Optimal Window: 6 laps</div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-black/40 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Radio className="h-4 w-4 animate-pulse text-green-400" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-green-300">Pit Wall Radio</span>
              </div>
              <div className="space-y-3 text-xs text-gray-300">
                <motion.div
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="rounded-xl border border-white/5 bg-black/30 px-3 py-2"
                >
                  "Push now, push now."
                </motion.div>
                <div className="rounded-xl border border-white/5 bg-black/30 px-3 py-2">"Box this lap."</div>
                <div className="rounded-xl border border-white/5 bg-black/30 px-3 py-2">"Tire degradation increasing."</div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-black/40 p-5 backdrop-blur-xl">
              <div className="flex justify-center mb-4">
                <img src={ibmLogo} alt="IBM" className="h-10 object-contain opacity-90" />
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/70">Powered By</p>
                <h3 className="text-lg font-bold text-white mt-2">IBM watsonx</h3>
                <p className="text-xs text-gray-500 mt-1">Enterprise AI Intelligence Platform</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b border-ferrari-red/20 bg-black/30 backdrop-blur-xl">
            <div className="px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="w-5 h-5 text-ferrari-red animate-pulse" />
                  Lap {isSimulatorRunning ? (telemetry?.lap ?? 0) : 0}/53
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  {telemetry?.track_environment?.track_temperature?.toFixed(0) ?? '--'}°C Track
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  {telemetry?.weather_condition?.wind_speed_kmh?.toFixed(0) ?? '--'} km/h Wind
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-ferrari-red/10 border border-ferrari-red/30 rounded-lg">
                  <Shield className="w-4 h-4 text-ferrari-red" />
                  <span className="text-sm font-semibold">Governance Active</span>
                </div>
                <button
  onClick={generateCritical}
  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-ferrari-red to-red-800 border border-red-500 shadow-[0_0_18px_rgba(220,0,0,0.45)] hover:scale-[1.02] transition-all"
>
  Generate Critical Event
</button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-8 space-y-6">
            <section className="glass-panel p-8 rounded-2xl border border-ferrari-red/20">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-6 h-6 text-ferrari-red" />
                <div>
                  <h2 className="text-2xl font-bold gradient-text">AI Command Center</h2>
                  <p className="text-sm text-gray-400">Natural language orchestration interface</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Telemetry shows FER-16 has high tire wear and steering vibration. Assess safety risk, recommend strategy, request approval if needed, and create fan-safe update."
                  className="w-full px-6 py-4 bg-black/50 border-2 border-gray-800 rounded-xl focus:outline-none focus:border-ferrari-red resize-none text-sm placeholder-gray-600"
                  rows={3}
                  disabled={!isSimulatorRunning || !wsConnected || loading}
                />

                <button
                  type="submit"
                  disabled={loading || !prompt.trim() || !isSimulatorRunning || !wsConnected}
                  className="group relative w-full overflow-hidden rounded-2xl border border-ferrari-red/30 bg-gradient-to-r from-ferrari-red via-red-700 to-red-900 px-8 py-5 text-lg font-black tracking-wide text-white shadow-[0_0_25px_rgba(220,0,0,0.35)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_45px_rgba(220,0,0,0.65)] hover:border-ferrari-red/80 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <Sparkles className="w-6 h-6 animate-spin" />
                        <span className="animate-pulse">Processing AI Workflow...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                        <span>Execute AI Workflow</span>
                      </>
                    )}
                  </div>
                </button>

                <div className="mt-6 flex flex-wrap gap-3">
                  {[
                    'Should Ferrari pit now?',
                    'Assess current tire degradation risk',
                    'Predict safest pit window',
                    'Recommend aggressive strategy',
                    'Recommend conservative strategy',
                    'How risky is current steering vibration?',
                    'Summarize current telemetry status',
                    'Generate race engineer recommendation',
                  ].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setPrompt(sample)}
                      className="px-4 py-2 rounded-full bg-black/40 border border-ferrari-red/20 text-sm text-gray-300 hover:text-white hover:border-ferrari-red/60 hover:bg-ferrari-red/10 transition-all"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </form>
            </section>

            <section className="glass-panel rounded-2xl border border-ferrari-red/20 overflow-hidden">
              <RaceTrackVisualization
                telemetryData={telemetry}
                orchestrationStages={orchestrationStages}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="glass-panel p-6 rounded-2xl border border-ferrari-red/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <Activity className="w-5 h-5 text-ferrari-red animate-pulse" />
                    Live Telemetry
                  </h3>
                  <span className="text-xs text-gray-400 flex items-center gap-2">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Streaming
                  </span>
                </div>

                {telemetry ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-gradient-to-br from-ferrari-red/10 to-transparent border border-ferrari-red/30 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold">{telemetry.vehicle.vehicle_id}</div>
                          <div className="text-sm text-gray-400">{telemetry.vehicle.driver_name}</div>
                        </div>
                        <div className={`text-4xl font-bold ${getRiskColor(telemetry.risk_analysis.risk_score)}`}>
                          {telemetry.risk_analysis.risk_score}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {telemetry.risk_analysis.severity} Risk
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Metric label="Tire Wear" value={`${telemetry.vehicle.tire_wear_percent.toFixed(1)}%`} color="text-orange-400" sub={telemetry.vehicle.tire_compound} />
                      <Metric label="Vibration" value={telemetry.vehicle.steering_vibration.toFixed(1)} color="text-red-400" sub="steering" />
                      <Metric label="Engine Temp" value={`${telemetry.vehicle.engine_temperature.toFixed(0)}°C`} color="text-yellow-400" />
                      <Metric label="Speed" value={telemetry.vehicle.speed_kmh.toFixed(0)} color="text-cyan-400" sub="km/h" />
                    </div>

                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={telemetryHistory}>
                          <defs>
                            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#DC0000" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#DC0000" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="lap" stroke="#666" fontSize={10} />
                          <YAxis stroke="#666" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #DC0000' }} />
                          <Area type="monotone" dataKey="risk" stroke="#DC0000" fill="url(#riskGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={<Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />} text="Waiting for telemetry stream..." />
                )}
              </section>

              <section className="glass-panel p-6 rounded-2xl border border-ferrari-red/20">
                <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Orchestration Pipeline
                </h3>

                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2">
                  {orchestrationStages.length > 0
                    ? orchestrationStages.map(stage => (
                        <StageCard key={stage.id} stage={stage} getRiskColor={getRiskColor} />
                      ))
                    : <EmptyState icon={<Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />} text="Execute an AI workflow to see the pipeline" />
                  }
                </div>
              </section>

              <section className="glass-panel p-6 rounded-2xl border border-ferrari-red/20">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-xl font-bold">Governance Console</h3>
                  {pendingApprovals.length > 0 && (
                    <span className="ml-auto px-3 py-1 bg-ferrari-red/20 text-ferrari-red rounded-full text-xs font-semibold">
                      {pendingApprovals.length} Pending
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {pendingApprovals.length > 0
                    ? pendingApprovals.map(approval => (
                        <div key={approval.approval_id} className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="text-sm font-semibold mb-1">
                                Risk Score: {approval.risk_score}
                              </div>
                              <div className="text-xs text-gray-400">
                                {approval.severity} severity
                              </div>
                            </div>
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproval(approval.approval_id, 'approve')}
                              className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproval(approval.approval_id, 'reject')}
                              className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    : <EmptyState icon={<CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />} text="No pending approvals" />
                  }
                </div>
              </section>

              <section className="glass-panel p-6 rounded-2xl border border-ferrari-red/20">
                <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                  <Users className="w-5 h-5 text-green-400" />
                  Fan Intelligence Hub
                </h3>

                {generatingFanMessage && (
                  <div className="p-4 mb-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                    Generating multilingual fan-safe narratives...
                  </div>
                )}

                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-2">
                  {fanMessages.length > 0
                    ? fanMessages.map(msg => (
                        <motion.div
                          key={msg.message_id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">
                                {msg.message_title || msg.title || 'Fan Race Update'}
                              </div>
                              <div className="text-xs text-gray-500">
  {msg.emotional_tone || 'strategic'}
</div>

{msg.delivery_status === 'draft' && (
  <span className="text-xs text-yellow-500/70 mt-1 block">
    ⏳ Pending approval
  </span>
)}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
  {msg.source && (
    <span
      className={`text-xs px-2 py-1 rounded-full border ${
        msg.source === 'governance_approval'
          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20'
          : 'bg-blue-500/20 text-blue-300 border-blue-500/20'
      }`}
    >
      {msg.source === 'governance_approval' ? 'GOV' : 'CMD'}
    </span>
  )}

  <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/20">
    {(msg.language || 'en').toUpperCase()}
  </span>
</div>
                          </div>

                          <p className="text-sm text-gray-300 leading-relaxed">
                              {msg.message_content || msg.content || msg.text || msg.message || 'Fan update generated.'}
                          </p>
                        </motion.div>
                      ))
                    : <EmptyState icon={<Users className="w-12 h-12 mx-auto mb-4 opacity-50" />} text="Awaiting governance approval to generate fan messages" />
                  }
                </div>
              </section>
            </div>

            <section className="glass-panel p-6 rounded-2xl border border-ferrari-red/20">
              <h3 className="text-xl font-bold mb-4">AI Command Chat</h3>

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {chatHistory.length > 0
                  ? chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl ${
                          msg.role === 'user'
                            ? 'bg-ferrari-red/10 border border-ferrari-red/30 ml-12'
                            : 'bg-cyan-500/10 border border-cyan-500/30 mr-12'
                        }`}
                      >
                        <div className="text-xs text-gray-500 mb-2 uppercase">
                          {msg.role === 'user' ? 'Race Engineer' : 'TifosiX AI'}
                        </div>
                        <div className="text-sm text-gray-300">
                          {msg.message}
                        </div>
                      </div>
                    ))
                  : <EmptyState icon={<Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />} text="Ask TifosiX AI anything" />
                }
              </div>
            </section>

            <AnimatePresence>
              {response && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-panel p-6 rounded-2xl border border-ferrari-red/20"
                >
                  <h3 className="text-xl font-bold mb-4">Workflow Response</h3>
                  <pre className="bg-black/50 p-4 rounded-lg overflow-auto text-xs text-gray-400 max-h-96">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

function Metric({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="p-3 bg-black/50 rounded-lg border border-gray-800">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-gray-600">
      <div className="text-center">
        {icon}
        <p>{text}</p>
      </div>
    </div>
  )
}

function StageCard({ stage, getRiskColor }: { stage: OrchestrationStage; getRiskColor: (s: number) => string }) {
  return (
    <div className={`p-4 rounded-xl border transition-all duration-500 ${
      stage.status === 'complete' ? 'bg-green-500/5 border-green-500/30'
      : stage.status === 'running' ? 'bg-ferrari-red/10 border-ferrari-red/40 animate-pulse'
      : stage.status === 'error' ? 'bg-red-500/10 border-red-500/30'
      : 'bg-gray-900/30 border-gray-800/50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {stage.status === 'complete' && <CheckCircle className="w-5 h-5 text-green-400" />}
          {stage.status === 'running' && <Sparkles className="w-5 h-5 text-ferrari-red animate-spin" />}
          {stage.status === 'pending' && <Clock className="w-5 h-5 text-gray-600" />}
          {stage.status === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}

          <div>
            <div className="text-sm font-bold">{stage.name}</div>
            {stage.timestamp && (
              <div className="text-xs text-gray-500">
                {new Date(stage.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-600" />
      </div>

      {stage.data && Object.keys(stage.data).length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-gray-800/50">
          {Object.entries(stage.data).map(([key, value]) => (
            <div key={key} className="p-2 bg-black/30 rounded col-span-1">
              <div className="text-gray-500 mb-1">
                {key.replace(/_/g, ' ')}
              </div>
              <div className={`font-semibold ${
                key === 'risk_score'
                  ? getRiskColor(Number(value))
                  : 'text-gray-300'
              }`}>
                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App

// Made with Bob