"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { soundManager } from './sound-manager'
import { EngineController } from './engine-controller'
import { SOUNDS } from './constants'

type AudioContextType = {
  // State
  isInitialized: boolean
  isMuted: boolean
  masterVolume: number

  // Actions
  initAudio: () => Promise<boolean>
  setMuted: (muted: boolean) => void
  setMasterVolume: (volume: number) => void

  // Sound playback
  playClick: () => void
  playTick: () => void
  playGo: () => void
  playGatePass: () => void
  playGateMiss: () => void
  playCollision: () => void
  playCompletion: () => void

  // Engine sounds
  startEngine: () => void
  updateEngineSpeed: (speedMs: number) => void
  stopEngine: () => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [masterVolume, setMasterVolumeState] = useState(0.7)

  const engineControllerRef = useRef<EngineController | null>(null)

  // Initialize audio on user interaction
  const initAudio = useCallback(async () => {
    const success = await soundManager.init()
    if (success) {
      await soundManager.preloadAll()
      setIsInitialized(true)
    }
    return success
  }, [])

  // Mute control
  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted)
    soundManager.setMuted(muted)
  }, [])

  // Master volume control
  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume)
    soundManager.setMasterVolume(volume)
  }, [])

  // One-shot sound playback functions
  const playClick = useCallback(() => {
    soundManager.play(SOUNDS.ui.click, { volume: 0.8 })
  }, [])

  const playTick = useCallback(() => {
    soundManager.play(SOUNDS.countdown.tick, { volume: 0.9 })
  }, [])

  const playGo = useCallback(() => {
    soundManager.play(SOUNDS.countdown.go, { volume: 1.0 })
  }, [])

  const playGatePass = useCallback(() => {
    soundManager.play(SOUNDS.gates.pass, { volume: 0.7 })
  }, [])

  const playGateMiss = useCallback(() => {
    soundManager.play(SOUNDS.gates.miss, { volume: 0.6 })
  }, [])

  const playCollision = useCallback(() => {
    soundManager.playRandom(SOUNDS.collision, { volume: 0.7 })
  }, [])

  const playCompletion = useCallback(() => {
    soundManager.play(SOUNDS.completion, { volume: 0.9 })
  }, [])

  // Engine sound controls
  const startEngine = useCallback(() => {
    if (!engineControllerRef.current) {
      engineControllerRef.current = new EngineController()
    }
    engineControllerRef.current.start()
  }, [])

  const updateEngineSpeed = useCallback((speedMs: number) => {
    engineControllerRef.current?.updateSpeed(speedMs)
  }, [])

  const stopEngine = useCallback(() => {
    engineControllerRef.current?.stop()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineControllerRef.current?.stop()
    }
  }, [])

  const contextValue: AudioContextType = {
    isInitialized,
    isMuted,
    masterVolume,
    initAudio,
    setMuted,
    setMasterVolume,
    playClick,
    playTick,
    playGo,
    playGatePass,
    playGateMiss,
    playCollision,
    playCompletion,
    startEngine,
    updateEngineSpeed,
    stopEngine,
  }

  return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
