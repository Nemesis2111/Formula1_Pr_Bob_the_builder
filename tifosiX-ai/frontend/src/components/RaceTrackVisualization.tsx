import ferrariLogo from '../assets/ferrari-logo.png'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gauge,
  Zap,
  AlertTriangle,
  Clock,
  Thermometer,
  Radio,
  TrendingUp,
  Shield,
  Activity,
  X,
  HeartPulse
} from 'lucide-react'

interface Driver {
  id: string
  name: string
  team: string
  position: number
  lapProgress: number
  state: 'normal' | 'high_risk' | 'pit_incoming' | 'in_pit' | 'governance_escalation'
  riskScore: number
  tireWear: number
  speed: number
  lap: number
  tireCompound: string
  engineTemp: number
  steeringVibration: number
  governanceState?: string
  strategyRecommendation?: string
  reasoningSummary?: string
}

interface RaceTrackVisualizationProps {
  telemetryData?: any
  orchestrationStages?: any[]
}

const TEAM_COLORS: Record<string, string> = {
  Ferrari: '#DC0000',
  Mercedes: '#00D2BE',
  'Red Bull': '#0600EF',
  McLaren: '#FF8700',
  'Aston Martin': '#006F62',
  Alpine: '#0090FF',
  Williams: '#005AFF',
  'Alfa Romeo': '#900000',
  Haas: '#FFFFFF',
  AlphaTauri: '#2B4562'
}

const CIRCUIT_PATH = `
  M 100 400
  L 200 400
  Q 250 400 250 350
  L 250 150
  Q 250 100 300 100
  L 500 100
  Q 550 100 550 150
  L 550 250
  Q 550 300 600 300
  L 700 300
  Q 750 300 750 350
  L 750 450
  Q 750 500 700 500
  L 300 500
  Q 250 500 250 450
  L 250 430
  Q 250 420 240 420
  L 150 420
  Q 100 420 100 400
  Z
`

const PIT_LANE_PATH = `
  M 100 440
  L 240 440
  L 240 460
  L 100 460
  Z
`

const recalculatePositions = (drivers: Driver[]) => {
  const ranked = [...drivers].sort((a, b) => {
    if (b.lap !== a.lap) return b.lap - a.lap
    return b.lapProgress - a.lapProgress
  })
  const positionMap = new Map<string, number>()
  ranked.forEach((driver, index) => {
    positionMap.set(driver.id, index + 1)
  })
  return drivers.map(driver => ({
    ...driver,
    position: positionMap.get(driver.id) || driver.position
  }))
}

const calculateWinPredictions = (drivers: Driver[]) => {
  const scores = drivers.map(driver => {
    const positionScore = (drivers.length + 1 - driver.position) * 38
    const progressScore = (driver.lap + driver.lapProgress) * 22
    const speedScore = driver.speed * 0.42
    const riskPenalty = driver.riskScore * 1.25
    const tirePenalty = driver.tireWear * 0.85
    return {
      id: driver.id,
      score: Math.max(positionScore + progressScore + speedScore - riskPenalty - tirePenalty, 1)
    }
  })
  const totalScore = scores.reduce((sum, item) => sum + item.score, 0)
  return new Map(scores.map(item => [item.id, Math.round((item.score / totalScore) * 100)]))
}

export default function RaceTrackVisualization({
  telemetryData,
  orchestrationStages = []
}: RaceTrackVisualizationProps) {
  const [drivers, setDrivers] = useState<Driver[]>(
    recalculatePositions([
      { id: 'FER-16', name: 'Charles Leclerc', team: 'Ferrari', position: 1, lapProgress: 0.25, state: 'normal', riskScore: 15, tireWear: 12, speed: 305, lap: 1, tireCompound: 'soft', engineTemp: 98, steeringVibration: 2.1 },
      { id: 'FER-55', name: 'Carlos Sainz', team: 'Ferrari', position: 2, lapProgress: 0.2, state: 'normal', riskScore: 18, tireWear: 15, speed: 302, lap: 1, tireCompound: 'medium', engineTemp: 96, steeringVibration: 2.3 },
      { id: 'MER-44', name: 'Lewis Hamilton', team: 'Mercedes', position: 3, lapProgress: 0.18, state: 'normal', riskScore: 12, tireWear: 10, speed: 300, lap: 1, tireCompound: 'medium', engineTemp: 95, steeringVibration: 1.8 },
      { id: 'RBR-1', name: 'Max Verstappen', team: 'Red Bull', position: 4, lapProgress: 0.15, state: 'normal', riskScore: 10, tireWear: 8, speed: 298, lap: 1, tireCompound: 'hard', engineTemp: 94, steeringVibration: 1.5 },
      { id: 'MCL-4', name: 'Lando Norris', team: 'McLaren', position: 5, lapProgress: 0.12, state: 'normal', riskScore: 14, tireWear: 11, speed: 296, lap: 1, tireCompound: 'soft', engineTemp: 97, steeringVibration: 2.0 }
    ])
  )

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [currentLap, setCurrentLap] = useState(1)
  const [totalLaps] = useState(58)
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = useState(0)

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength())
  }, [])

  useEffect(() => {
    if (!telemetryData?.vehicle) return
    setDrivers(prev => {
      const updated = prev.map(driver => {
        if (driver.id !== telemetryData.vehicle.vehicle_id) return driver
        let newState: Driver['state'] = 'normal'
        if (telemetryData.risk_analysis?.risk_score >= 80) newState = 'high_risk'
        const strategyStage = orchestrationStages.find(s => s.name === 'Strategy Recommendation' && s.status === 'complete')
        if (strategyStage?.data?.recommended_pit_window) newState = 'pit_incoming'
        const governanceStage = orchestrationStages.find(s => s.name === 'Governance Approval' && s.data?.escalation_state === 'escalated')
        if (governanceStage) newState = 'governance_escalation'
        return {
          ...driver,
          riskScore: telemetryData.risk_analysis?.risk_score ?? driver.riskScore,
          tireWear: telemetryData.vehicle.tire_wear_percent ?? driver.tireWear,
          speed: telemetryData.vehicle.speed_kmh ?? driver.speed,
          lap: telemetryData.lap ?? driver.lap,
          tireCompound: telemetryData.vehicle.tire_compound ?? driver.tireCompound,
          engineTemp: telemetryData.vehicle.engine_temperature ?? driver.engineTemp,
          steeringVibration: telemetryData.vehicle.steering_vibration ?? driver.steeringVibration,
          state: newState,
          strategyRecommendation: strategyStage?.data?.strategy_reasoning,
          reasoningSummary: orchestrationStages.find(s => s.name === 'Safety Intelligence')?.data?.reasoning_summary,
          governanceState: governanceStage?.data?.approval_state
        }
      })
      return recalculatePositions(updated)
    })
    setCurrentLap(telemetryData.lap || currentLap)
  }, [telemetryData, orchestrationStages])

  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prev => {
        const updated = prev.map(driver => {
          const speedFactor = Math.max(driver.speed, 250) / 300
          let newProgress = driver.lapProgress + 0.002 * speedFactor
          let newLap = driver.lap
          if (newProgress >= 1) { newProgress = newProgress - 1; newLap += 1 }
          return { ...driver, lapProgress: newProgress, lap: newLap }
        })
        return recalculatePositions(updated)
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const getPositionOnPath = (progress: number) => {
    if (!pathRef.current || pathLength === 0) return { x: 0, y: 0 }
    const point = pathRef.current.getPointAtLength(progress * pathLength)
    return { x: point.x, y: point.y }
  }

  const getDriverColor = (driver: Driver) => {
    switch (driver.state) {
      case 'high_risk': return '#EF4444'
      case 'pit_incoming': return '#EAB308'
      case 'in_pit': return '#FFFFFF'
      case 'governance_escalation': return '#7C3AED'
      default: return TEAM_COLORS[driver.team] || '#FFFFFF'
    }
  }

  const getDriverGlow = (driver: Driver) => {
    switch (driver.state) {
      case 'high_risk': return 'drop-shadow(0 0 10px rgba(239,68,68,0.95))'
      case 'pit_incoming': return 'drop-shadow(0 0 10px rgba(234,179,8,0.95))'
      case 'in_pit': return 'drop-shadow(0 0 10px rgba(255,255,255,0.95))'
      case 'governance_escalation': return 'drop-shadow(0 0 14px rgba(124,58,237,1))'
      default: return `drop-shadow(0 0 8px ${TEAM_COLORS[driver.team] || '#FFFFFF'})`
    }
  }

  const sortedDrivers = [...drivers].sort((a, b) => a.position - b.position)
  const winPredictions = calculateWinPredictions(drivers)

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-red-500/30 bg-[#050508]"
      style={{ boxShadow: '0 0 80px rgba(220,0,0,0.2)' }}
    >
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,0,0,0.18),transparent_36%),radial-gradient(circle_at_75%_70%,rgba(220,0,0,0.12),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,0,0,0.03)_1px,transparent_1px),linear-gradient(rgba(255,0,0,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="relative z-10 flex flex-col gap-4 p-4">

        {/* ── Single Header ── */}
        <div className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-black/70 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {/* Ferrari shield SVG logo placeholder */}
<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-black/20 p-2 shadow-[0_0_25px_rgba(220,0,0,0.35)]">
  <img
    src="data:image/png;base64,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"
    alt="Ferrari Logo"
    className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(220,0,0,0.6)]"
    onError={(e) => {
      e.currentTarget.style.display = 'none'
    }}
  />
</div>
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-red-500" />
              <div>
                <h1 className="text-3xl font-black italic tracking-tight leading-none">
                  <span className="text-red-500">LIVE</span>{' '}
                  <span className="text-white">RACE</span>{' '}
                  <span className="text-red-500">INTELLIGENCE</span>
                </h1>
                <p className="mt-1 text-sm text-gray-400">Monza Circuit · AI-Powered Formula 1 Mission Control</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-500/25 bg-black/50 px-6 py-3 text-right">
            <p className="text-[10px] uppercase tracking-[0.4em] text-red-300/80">Scuderia Mode</p>
            <p className="mt-1 text-sm font-black text-white">Ferrari AI Race Intelligence</p>
          </div>
        </div>

        {/* ── Main content: timing + track ── */}
        <div className="grid grid-cols-[400px_1fr] gap-4">

          {/* Left: Live Timing */}
          <div className="flex flex-col rounded-2xl border border-red-500/30 bg-black/60 p-4 backdrop-blur-xl" style={{ boxShadow: '0 0 50px rgba(220,0,0,0.2)' }}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.25em] text-white">Live Timing</h3>
                <p className="mt-1 text-[11px] text-red-300/70">Ferrari AI Race Intelligence</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-red-400">Live</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '560px' }}>
              {sortedDrivers.map(driver => {
                const winChance = winPredictions.get(driver.id) || 0
                const teamColor = TEAM_COLORS[driver.team] || '#FFFFFF'
                return (
                  <motion.div
                    key={driver.id}
                    layout
                    whileHover={{ scale: 1.01, y: -1 }}
                    className="relative cursor-pointer overflow-hidden rounded-xl border border-white/5 backdrop-blur-xl transition-all duration-300"
                    style={{
                      background: driver.team === 'Ferrari'
                        ? 'linear-gradient(135deg, rgba(220,0,0,0.25), rgba(20,8,8,0.85))'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'
                    }}
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at top right, ${teamColor}55, transparent 60%)` }} />
                    <div className="relative flex items-center gap-3 p-3">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg font-black"
                        style={{ background: teamColor, color: driver.team === 'Haas' ? '#000' : '#fff', boxShadow: `0 0 20px ${teamColor}60` }}
                      >
                        {driver.position}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-sm font-black text-white">{driver.name}</h4>
                          {driver.team === 'Ferrari' && (
                            <span className="rounded-full border border-red-500/25 bg-red-500/20 px-2 py-0.5 text-[9px] text-red-200">TIFOSI</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{driver.team}</p>
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-[10px]">
                            <span className="font-bold text-cyan-300">Win Probability</span>
                            <span className="font-black text-cyan-400">{winChance}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${teamColor}, #22d3ee)` }}
                              animate={{ width: `${winChance}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-base font-black text-white">{Math.round(driver.speed)}</div>
                        <div className="text-[10px] uppercase text-gray-500">km/h</div>
                        <div className={`mt-2 text-xs font-black ${driver.riskScore >= 80 ? 'text-red-400' : driver.riskScore >= 60 ? 'text-orange-400' : 'text-green-400'}`}>
                          Risk {driver.riskScore}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Team legend */}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-red-500/15 bg-black/50 px-3 py-2 text-[11px] text-gray-300">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-600" />Ferrari</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />Mercedes</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-700" />Red Bull</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />McLaren</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gray-500" />Others</span>
            </div>
          </div>

          {/* Right: Track Map */}
          <div className="flex flex-col rounded-2xl border border-red-500/20 bg-black/50 backdrop-blur-xl overflow-hidden" style={{ boxShadow: '0 0 50px rgba(220,0,0,0.15)' }}>
            {/* Track top bar */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0">
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-black/60 px-4 py-3 backdrop-blur-xl">
                <Radio className="h-4 w-4 animate-pulse text-red-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-red-300">Live Race</p>
                  <p className="text-sm font-black text-white">Monza Circuit</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-black/60 px-5 py-3 backdrop-blur-xl">
                <Clock className="h-5 w-5 text-cyan-400" />
                <div>
                  <div className="text-[10px] uppercase text-gray-400">LAP</div>
                  <div className="text-2xl font-black text-white leading-none">
                    {currentLap}<span className="text-gray-500 text-base"> / {totalLaps}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Track */}
            <div className="flex-1 relative flex items-center justify-center">
              <svg
                viewBox="0 0 850 600"
                className="h-[88%] w-[88%] mx-auto my-auto"
                style={{ filter: 'drop-shadow(0 0 30px rgba(220,0,0,0.5))' }}
              >
                <defs>
                  <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(70,55,55,0.95)" />
                    <stop offset="50%" stopColor="rgba(88,70,70,0.92)" />
                    <stop offset="100%" stopColor="rgba(50,40,40,0.95)" />
                  </linearGradient>
                  <linearGradient id="pitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(234,179,8,0.25)" />
                    <stop offset="50%" stopColor="rgba(234,179,8,0.65)" />
                    <stop offset="100%" stopColor="rgba(234,179,8,0.25)" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                <path d={CIRCUIT_PATH} fill="none" stroke="rgba(220,0,0,0.30)" strokeWidth="54" filter="url(#glow)" />
                <path ref={pathRef} d={CIRCUIT_PATH} fill="none" stroke="url(#trackGradient)" strokeWidth="44" strokeLinecap="round" strokeLinejoin="round" />
                <path d={CIRCUIT_PATH} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="12 13" />
                <path d={PIT_LANE_PATH} fill="url(#pitGradient)" stroke="rgba(234,179,8,0.75)" strokeWidth="2" />

                {/* Pit Lane label */}
                <text x="170" y="435" textAnchor="middle" fill="rgba(234,179,8,0.9)" fontSize="10" fontWeight="bold">PIT LANE</text>

                {/* Sector markers */}
                {[0.33, 0.66].map((sector, i) => {
                  const pos = getPositionOnPath(sector)
                  return (
                    <g key={i}>
                      <circle cx={pos.x} cy={pos.y} r="9" fill="rgba(220,0,0,0.55)" stroke="rgba(255,80,80,0.9)" strokeWidth="2" />
                      <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">S{i + 2}</text>
                    </g>
                  )
                })}

                {/* Start/Finish line */}
                <line x1="100" y1="390" x2="100" y2="430" stroke="white" strokeWidth="4" strokeDasharray="4 4" />
                <text x="80" y="538" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">START /</text>
                <text x="80" y="552" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">FINISH</text>

                {/* Drivers */}
                {sortedDrivers.map((driver, index) => {
                  const pos = getPositionOnPath(driver.lapProgress)
                  const color = getDriverColor(driver)
                  const winChance = winPredictions.get(driver.id) || 0
                  return (
                    <motion.g
                      key={driver.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <motion.circle
                        cx={pos.x} cy={pos.y}
                        r={driver.state === 'governance_escalation' ? 17 : 13}
                        fill={color}
                        style={{ filter: getDriverGlow(driver) }}
                        animate={
                          driver.state === 'high_risk' || driver.state === 'governance_escalation'
                            ? { scale: [1, 1.22, 1], opacity: [1, 0.82, 1] }
                            : driver.state === 'pit_incoming' ? { opacity: [1, 0.5, 1] } : {}
                        }
                        transition={{ duration: driver.state === 'governance_escalation' ? 0.8 : 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {driver.state === 'governance_escalation' && (
                        <motion.circle cx={pos.x} cy={pos.y} r={22} fill="none" stroke="#7C3AED" strokeWidth="2" animate={{ scale: [1, 1.5], opacity: [1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      )}
                      <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" style={{ pointerEvents: 'none' }}>{driver.position}</text>
                      <text x={pos.x} y={pos.y - 37} textAnchor="middle" fill="#22d3ee" fontSize="10" fontWeight="900" style={{ pointerEvents: 'none', textShadow: '0 0 6px rgba(0,0,0,1)' }}>{winChance}%</text>
                      <text x={pos.x} y={pos.y - 22} textAnchor="middle" fill="white" fontSize="11" fontWeight="800" style={{ pointerEvents: 'none', textShadow: '0 0 6px rgba(0,0,0,1)' }}>{driver.name.split(' ')[1]}</text>
                    </motion.g>
                  )
                })}
              </svg>
            </div>

            {/* State legend bar at bottom */}
            <div className="flex items-center justify-center gap-6 border-t border-red-500/15 bg-black/60 px-6 py-3 shrink-0">
              {[
                { color: '#22C55E', label: 'NORMAL' },
                { color: '#EAB308', label: 'PIT INCOMING' },
                { color: '#EF4444', label: 'HIGH RISK' },
                { color: '#7C3AED', label: 'GOVERNANCE ESCALATION' },
                { color: '#FFFFFF', label: 'IN PIT' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Driver Detail Panel */}
      <AnimatePresence>
        {selectedDriver && (
          <motion.div
            initial={{ opacity: 0, x: 420 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 420 }}
            className="absolute bottom-4 right-4 top-24 z-50 w-88 overflow-y-auto rounded-2xl border border-red-500/25 bg-black/92 p-5 backdrop-blur-2xl"
            style={{ width: '360px', boxShadow: '0 0 60px rgba(220,0,0,0.35)' }}
          >
            <button onClick={() => setSelectedDriver(null)} className="absolute right-3 top-3 rounded-lg p-1.5 transition-colors hover:bg-white/10">
              <X className="h-4 w-4 text-white" />
            </button>

            <div className="mb-5">
              <div className="mb-2 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black"
                  style={{ backgroundColor: TEAM_COLORS[selectedDriver.team], color: selectedDriver.team === 'Haas' ? '#000' : '#fff', boxShadow: `0 0 20px ${TEAM_COLORS[selectedDriver.team]}` }}
                >
                  {selectedDriver.position}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedDriver.name}</h3>
                  <p className="text-xs text-gray-400">{selectedDriver.team}</p>
                </div>
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500">{selectedDriver.id} · Lap {selectedDriver.lap}</div>
            </div>

            <div className="mb-4 rounded-xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 to-transparent p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-400">Live Win Prediction</span>
                <TrendingUp className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mb-2 text-3xl font-black text-white">{winPredictions.get(selectedDriver.id) || 0}<span className="text-base text-gray-400">%</span></div>
              <div className="h-2 w-full rounded-full bg-gray-800">
                <motion.div className="h-2 rounded-full bg-cyan-400" initial={{ width: 0 }} animate={{ width: `${winPredictions.get(selectedDriver.id) || 0}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-red-500/25 bg-gradient-to-br from-red-500/15 to-transparent p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-400">Risk Score</span>
                <Shield className="h-4 w-4 text-red-400" />
              </div>
              <div className="mb-2 text-3xl font-black text-white">{selectedDriver.riskScore}<span className="text-base text-gray-400">/100</span></div>
              <div className="h-2 w-full rounded-full bg-gray-800">
                <motion.div
                  className="h-2 rounded-full"
                  style={{ background: selectedDriver.riskScore >= 80 ? 'linear-gradient(90deg,#EF4444,#DC2626)' : selectedDriver.riskScore >= 60 ? 'linear-gradient(90deg,#F97316,#EA580C)' : 'linear-gradient(90deg,#22C55E,#16A34A)' }}
                  initial={{ width: 0 }} animate={{ width: `${selectedDriver.riskScore}%` }} transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                { icon: <Gauge className="h-4 w-4 text-cyan-400" />, label: 'Speed', value: `${Math.round(selectedDriver.speed)} km/h` },
                { icon: <Activity className="h-4 w-4 text-orange-400" />, label: 'Tire Wear', value: `${Math.round(selectedDriver.tireWear)}%` },
                { icon: <Thermometer className="h-4 w-4 text-red-400" />, label: 'Engine Temp', value: `${Math.round(selectedDriver.engineTemp)}°C` },
                { icon: <Zap className="h-4 w-4 text-yellow-400" />, label: 'Vibration', value: selectedDriver.steeringVibration.toFixed(1) },
              ].map(({ icon, label, value }) => (
                <div key={label} className="rounded-xl border border-white/8 bg-white/5 p-3">
                  <div className="mb-1 flex items-center gap-1.5">{icon}<span className="text-xs text-gray-400">{label}</span></div>
                  <div className="text-base font-bold text-white">{value}</div>
                </div>
              ))}
            </div>

            {selectedDriver.strategyRecommendation && (
              <div className="mb-4 rounded-xl border border-yellow-500/25 bg-gradient-to-br from-yellow-500/15 to-transparent p-4">
                <div className="mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-yellow-400" /><span className="text-xs font-semibold text-yellow-400">Strategy</span></div>
                <p className="text-xs leading-relaxed text-gray-300">{selectedDriver.strategyRecommendation}</p>
              </div>
            )}
            {selectedDriver.reasoningSummary && (
              <div className="mb-4 rounded-xl border border-white/8 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-400" /><span className="text-xs font-semibold text-white">Analysis</span></div>
                <p className="text-xs leading-relaxed text-gray-300">{selectedDriver.reasoningSummary}</p>
              </div>
            )}
            {selectedDriver.governanceState && (
              <div className="rounded-xl border border-red-500/25 bg-gradient-to-br from-red-500/15 to-transparent p-4">
                <div className="mb-2 flex items-center gap-2"><Shield className="h-4 w-4 text-red-400" /><span className="text-xs font-semibold text-red-400">Governance</span></div>
                <p className="text-xs capitalize text-gray-300">{selectedDriver.governanceState.replace(/_/g, ' ')}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
