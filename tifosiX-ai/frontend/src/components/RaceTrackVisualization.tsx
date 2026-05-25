import ferrariLogo from '../assets/LogoTifosix-ai.png'
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
const DRIVER_GIFS: Record<string, string> = {
  'Charles Leclerc': '/charles-leclerc.gif',
  'Carlos Sainz': '/carlos-sainz.gif',
  'Lewis Hamilton': '/lewis-hamilton.gif',
  'Max Verstappen': '/max-verstappen.gif',
  'Lando Norris': '/lando-norris.gif'
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
  let newState: Driver['state'] = 'normal'

  if (driver.id === telemetryData.vehicle.vehicle_id) {
    if (telemetryData.risk_analysis?.risk_score >= 80) {
      newState = 'high_risk'
    }

    const strategyStage = orchestrationStages.find(
      s => s.name === 'Strategy Recommendation' && s.status === 'complete'
    )

    if (strategyStage?.data?.recommended_pit_window) {
      newState = 'pit_incoming'
    }

    return {
      ...driver,
      riskScore: telemetryData.risk_analysis?.risk_score ?? driver.riskScore,
      tireWear: telemetryData.vehicle.tire_wear_percent ?? driver.tireWear,
      speed: telemetryData.vehicle.speed_kmh ?? driver.speed,
      lap: telemetryData.lap ?? driver.lap,
      tireCompound: telemetryData.vehicle.tire_compound ?? driver.tireCompound,
      engineTemp: telemetryData.vehicle.engine_temperature ?? driver.engineTemp,
      steeringVibration: telemetryData.vehicle.steering_vibration ?? driver.steeringVibration,
      state: newState
    }
  }

  // Animate ALL OTHER DRIVERS TOO
  return {
    ...driver,
    speed: Math.max(
      275,
      Math.min(
        316,
        driver.speed + (Math.random() * 6 - 3)
      )
    ),
    tireWear: Math.min(
      100,
      driver.tireWear + Math.random() * 0.4
    ),
    riskScore: Number(
  Math.max(
    5,
    Math.min(
      100,
      driver.riskScore + (Math.random() * 4 - 2)
    )
  ).toFixed(0)
)
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
<div
  className="
    relative
    flex
    h-32
    w-32
    shrink-0
    items-center
    justify-center
    overflow-hidden
    rounded-[28px]
    border
    border-red-500/20
    bg-gradient-to-br
    from-[#170000]
    via-[#090000]
    to-black
  "
  style={{
    boxShadow:
      '0 0 45px rgba(220,0,0,0.35), inset 0 0 25px rgba(255,0,0,0.10)'
  }}
>
  <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,0,0,0.15),transparent_72%)]" />

  <img
    src={ferrariLogo}
    alt="Ferrari Logo"
    className="
      relative
      z-10
      h-[115%]
      w-[115%]
      object-contain
      scale-[1.65]
      drop-shadow-[0_0_22px_rgba(255,0,0,0.85)]
    "
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
              <div className="mb-2 flex items-center justify-between">
  <div className="flex items-center gap-4">
    <div
      className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black"
      style={{
        backgroundColor: TEAM_COLORS[selectedDriver.team],
        color: selectedDriver.team === 'Haas' ? '#000' : '#fff',
        boxShadow: `0 0 20px ${TEAM_COLORS[selectedDriver.team]}`
      }}
    >
      {selectedDriver.position}
    </div>

    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-black text-white">
          {selectedDriver.name}
        </h3>

        <motion.span
          className="text-red-500 text-lg"
          animate={{
            opacity: [1, 0.4, 1],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity
          }}
        >
          ♥
        </motion.span>
      </div>

      <p className="text-xs text-gray-400">
        {selectedDriver.team}
      </p>

      <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-red-400">
        Ferrari Driver Focus
      </div>
    </div>
  </div>

  <motion.img
     src={DRIVER_GIFS[selectedDriver.name] || '/default-driver.gif'}
     alt={selectedDriver.name}
    className=" mr-8 h-16 w-16 rounded-2xl object-cover border border-red-500/30"
    style={{
      boxShadow: '0 0 30px rgba(220,0,0,0.45)'
    }}
    animate={{
      scale: [1, 1.05, 1],
      rotate: [0, 1, -1, 0]
    }}
    transition={{
      duration: 2.5,
      repeat: Infinity
    }}
  />
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
