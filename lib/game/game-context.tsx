"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import { soundManager, SOUNDS } from "@/lib/audio"

export type GameState = "ready" | "countdown" | "running" | "finished"
export type PerformanceTier = "low" | "medium" | "high"

// Lion Rock Tunnel = 1430 meters
export const TRACK_LENGTH = 1430

export type GameEvent = {
  type: "gate_pass" | "gate_miss" | "collision" | "combo_change" | "start" | "finish" | "stop"
  timestamp: number
  data?: Record<string, unknown>
}

type GameContextType = {
  // Game state
  gameState: GameState
  seed: number
  elapsedTime: number
  wasInterrupted: boolean

  // Distance tracking (Lion Rock Tunnel)
  distanceTraveled: number
  trackLength: number
  currentSpeed: number

  // Scoring
  score: number
  combo: number
  maxCombo: number

  // Track progress
  passedGates: Set<string>
  missedGates: Set<string>
  collisions: Set<string>

  // Car state - using getter for ref-based position
  carPosition: { x: number; y: number; z: number }
  carVelocity: { x: number; y: number; z: number }

  // Performance
  performanceTier: PerformanceTier
  reducedMotion: boolean

  // Event log for verification
  eventLog: GameEvent[]

  // Controls - pedal positions (0-1) and steering (-1 to 1)
  throttlePosition: number
  brakePosition: number
  mobileSteerInput: number

  // Actions
  startCountdown: () => void
  startGame: () => void
  endGame: () => void
  stopGame: () => void
  resetGame: () => void
  updateCarPosition: (pos: { x: number; y: number; z: number }, vel: { x: number; y: number; z: number }) => void
  updateDistance: (distance: number) => void
  updateSpeed: (speed: number) => void
  setThrottlePosition: (pos: number) => void
  setBrakePosition: (pos: number) => void
  setMobileSteerInput: (value: number) => void
  addPassedGate: (gateId: string) => void
  addMissedGate: (gateId: string) => void
  addCollision: (obstacleId: string) => void
  setPerformanceTier: (tier: PerformanceTier) => void
  setReducedMotion: (reduced: boolean) => void
  updateElapsedTime: (time: number) => void
}

const GameContext = createContext<GameContextType | null>(null)

function generateSeed() {
  return Math.floor(Math.random() * 1000000)
}

export function GameProvider({
  children,
  initialTier,
}: {
  children: ReactNode
  initialTier: PerformanceTier
}) {
  const [gameState, setGameState] = useState<GameState>("ready")
  const [seed, setSeed] = useState(generateSeed)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [wasInterrupted, setWasInterrupted] = useState(false)

  // Distance tracking for Lion Rock Tunnel
  const [distanceTraveled, setDistanceTraveled] = useState(0)
  const [currentSpeed, setCurrentSpeed] = useState(0)

  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(1)
  const [maxCombo, setMaxCombo] = useState(1)

  const [passedGates, setPassedGates] = useState<Set<string>>(new Set())
  const [missedGates, setMissedGates] = useState<Set<string>>(new Set())
  const [collisions, setCollisions] = useState<Set<string>>(new Set())

  // Use refs for high-frequency updates (car position) to avoid re-renders
  const carPositionRef = useRef({ x: 0, y: 0.15, z: 0 })
  const carVelocityRef = useRef({ x: 0, y: 0, z: 0 })

  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>(initialTier)
  const [reducedMotion, setReducedMotion] = useState(false)

  // UI pedal controls (0-1 position values) and mobile steering (-1 to 1)
  const throttlePositionRef = useRef(0)
  const brakePositionRef = useRef(0)
  const mobileSteerInputRef = useRef(0)

  const eventLogRef = useRef<GameEvent[]>([])

  // Handle visibility change for pause detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === "running") {
        setWasInterrupted(true)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [gameState])

  const logEvent = useCallback((event: Omit<GameEvent, "timestamp">) => {
    eventLogRef.current.push({
      ...event,
      timestamp: Date.now(),
    })
  }, [])

  const startCountdown = useCallback(() => {
    setSeed(generateSeed())
    setGameState("countdown")
    setElapsedTime(0)
    setDistanceTraveled(0)
    setCurrentSpeed(0)
    setScore(0)
    setCombo(1)
    setMaxCombo(1)
    setPassedGates(new Set())
    setMissedGates(new Set())
    setCollisions(new Set())
    carPositionRef.current = { x: 0, y: 0.15, z: 0 }
    carVelocityRef.current = { x: 0, y: 0, z: 0 }
    throttlePositionRef.current = 0
    brakePositionRef.current = 0
    mobileSteerInputRef.current = 0
    setWasInterrupted(false)
    eventLogRef.current = []
  }, [])

  const startGame = useCallback(() => {
    setGameState("running")
    logEvent({ type: "start" })
  }, [logEvent])

  const endGame = useCallback(() => {
    setGameState("finished")
    logEvent({ type: "finish" })
  }, [logEvent])

  const stopGame = useCallback(() => {
    setGameState("ready")
    logEvent({ type: "stop" })
  }, [logEvent])

  const resetGame = useCallback(() => {
    setGameState("ready")
  }, [])

  // Update car position using refs - no re-renders
  const updateCarPosition = useCallback(
    (pos: { x: number; y: number; z: number }, vel: { x: number; y: number; z: number }) => {
      carPositionRef.current = pos
      carVelocityRef.current = vel
    },
    []
  )

  const updateElapsedTime = useCallback((time: number) => {
    setElapsedTime(time)
  }, [])

  const updateDistance = useCallback((distance: number) => {
    setDistanceTraveled(distance)
  }, [])

  const updateSpeed = useCallback((speed: number) => {
    setCurrentSpeed(speed)
  }, [])

  const setThrottlePosition = useCallback((pos: number) => {
    throttlePositionRef.current = Math.max(0, Math.min(1, pos))
  }, [])

  const setBrakePosition = useCallback((pos: number) => {
    brakePositionRef.current = Math.max(0, Math.min(1, pos))
  }, [])

  const setMobileSteerInput = useCallback((value: number) => {
    mobileSteerInputRef.current = Math.max(-1, Math.min(1, value))
  }, [])

  const addPassedGate = useCallback(
    (gateId: string) => {
      setPassedGates((prev) => new Set([...prev, gateId]))

      // Play gate pass sound
      soundManager.play(SOUNDS.gates.pass, { volume: 0.7 })

      // Scoring: base points + combo
      const points = 10 * combo
      setScore((prev) => prev + points)

      // Increment combo
      setCombo((prev) => {
        const newCombo = prev + 1
        setMaxCombo((max) => Math.max(max, newCombo))
        logEvent({ type: "combo_change", data: { combo: newCombo } })
        return newCombo
      })

      logEvent({ type: "gate_pass", data: { gateId, points } })
    },
    [combo, logEvent]
  )

  const addMissedGate = useCallback(
    (gateId: string) => {
      setMissedGates((prev) => new Set([...prev, gateId]))

      // Play gate miss sound
      soundManager.play(SOUNDS.gates.miss, { volume: 0.6 })

      // Penalty
      setScore((prev) => Math.max(0, prev - 20))

      // Reset combo
      if (combo > 1) {
        logEvent({ type: "combo_change", data: { combo: 1 } })
      }
      setCombo(1)

      logEvent({ type: "gate_miss", data: { gateId } })
    },
    [combo, logEvent]
  )

  const addCollision = useCallback(
    (obstacleId: string) => {
      setCollisions((prev) => new Set([...prev, obstacleId]))

      // Play random collision sound
      soundManager.playRandom(SOUNDS.collision, { volume: 0.7 })

      // Penalty
      setScore((prev) => Math.max(0, prev - 15))

      // Reset combo
      if (combo > 1) {
        logEvent({ type: "combo_change", data: { combo: 1 } })
      }
      setCombo(1)

      logEvent({ type: "collision", data: { obstacleId } })
    },
    [combo, logEvent]
  )

  // Create a context value with getters for ref-based values
  const contextValue: GameContextType = {
    gameState,
    seed,
    elapsedTime,
    wasInterrupted,
    // Distance tracking
    distanceTraveled,
    trackLength: TRACK_LENGTH,
    currentSpeed,
    // Scoring
    score,
    combo,
    maxCombo,
    passedGates,
    missedGates,
    collisions,
    // Use getters to always return current ref value
    get carPosition() {
      return carPositionRef.current
    },
    get carVelocity() {
      return carVelocityRef.current
    },
    performanceTier,
    reducedMotion,
    eventLog: eventLogRef.current,
    // Controls - pedal positions and mobile steering
    get throttlePosition() {
      return throttlePositionRef.current
    },
    get brakePosition() {
      return brakePositionRef.current
    },
    get mobileSteerInput() {
      return mobileSteerInputRef.current
    },
    startCountdown,
    startGame,
    endGame,
    stopGame,
    resetGame,
    updateCarPosition,
    updateDistance,
    updateSpeed,
    setThrottlePosition,
    setBrakePosition,
    setMobileSteerInput,
    addPassedGate,
    addMissedGate,
    addCollision,
    setPerformanceTier,
    setReducedMotion,
    updateElapsedTime,
  }

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
