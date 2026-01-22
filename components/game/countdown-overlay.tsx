"use client"

import { useEffect, useState, useRef } from "react"
import { useGame } from "@/lib/game/game-context"
import { useAudio } from "@/lib/audio"

export function CountdownOverlay() {
  const { startGame } = useGame()
  const { playTick, playGo } = useAudio()
  const [count, setCount] = useState(3)
  const lastPlayedRef = useRef<number | null>(null)

  // Play sound when count changes
  useEffect(() => {
    if (lastPlayedRef.current === count) return
    lastPlayedRef.current = count

    if (count > 0) {
      playTick()
    } else if (count === 0) {
      playGo()
    }
  }, [count, playTick, playGo])

  useEffect(() => {
    if (count === 0) {
      startGame()
      return
    }

    const timer = setTimeout(() => {
      setCount(count - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [count, startGame])

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        {count > 0 ? (
          <div
            key={count}
            className="text-9xl font-bold text-white animate-pulse drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]"
          >
            {count}
          </div>
        ) : (
          <div className="text-6xl font-bold text-cyan-400 animate-pulse drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]">
            GO!
          </div>
        )}
      </div>
    </div>
  )
}
