"use client"

import { useEffect, useRef } from 'react'
import { useAudio } from './audio-context'

// Hook for engine sound management in car.tsx
export function useEngineSound() {
  const { startEngine, updateEngineSpeed, stopEngine, isInitialized } = useAudio()
  const isEngineRunningRef = useRef(false)

  // Start engine when component mounts and audio is ready
  const start = () => {
    if (isInitialized && !isEngineRunningRef.current) {
      startEngine()
      isEngineRunningRef.current = true
    }
  }

  // Update engine speed
  const update = (speedMs: number) => {
    if (isEngineRunningRef.current) {
      updateEngineSpeed(speedMs)
    }
  }

  // Stop engine
  const stop = () => {
    if (isEngineRunningRef.current) {
      stopEngine()
      isEngineRunningRef.current = false
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isEngineRunningRef.current) {
        stopEngine()
        isEngineRunningRef.current = false
      }
    }
  }, [stopEngine])

  return {
    start,
    update,
    stop,
    isRunning: isEngineRunningRef.current,
  }
}

// Hook for countdown sounds
export function useCountdownSounds() {
  const { playTick, playGo, isInitialized } = useAudio()
  const lastCountRef = useRef<number | null>(null)

  const playForCount = (count: number) => {
    if (!isInitialized) return

    // Avoid playing the same sound twice
    if (lastCountRef.current === count) return
    lastCountRef.current = count

    if (count > 0) {
      playTick()
    } else if (count === 0) {
      playGo()
    }
  }

  return { playForCount }
}

// Re-export useAudio for convenience
export { useAudio } from './audio-context'
