"use client"

import { useGame, TRACK_LENGTH } from "@/lib/game/game-context"
import { useState, useEffect } from "react"
import { PedalControls } from "./pedal-controls"
import { SteeringControls } from "./steering-controls"

export function GameHUD() {
  const {
    score,
    combo,
    elapsedTime,
    passedGates,
    collisions,
    distanceTraveled,
    currentSpeed,
    stopGame
  } = useGame()

  // Detect touch device for showing pedal controls
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  // Format time as MM:SS
  const minutes = Math.floor(elapsedTime / 60)
  const seconds = Math.floor(elapsedTime % 60)

  // Convert speed to km/h (1 unit/sec ≈ 3.6 km/h for visualization)
  const speedKmh = Math.floor(currentSpeed * 3.6)

  // Progress percentage
  const progressPercent = Math.min(100, (distanceTraveled / TRACK_LENGTH) * 100)

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <div className="absolute inset-0 pb-safe pl-safe pr-safe">
        {/* Top HUD bar - Score, Speed, Time, Combo */}
        <div className="bg-black/60 backdrop-blur-sm flex divide-x divide-white/10">
          <div className="flex-1 px-3 py-1.5 text-center">
            <div className="text-white/60 text-[10px] font-mono uppercase">Score</div>
            <div className="text-white text-base font-mono font-bold tabular-nums">{score.toLocaleString()}</div>
          </div>
          <div className="flex-1 px-3 py-1.5 text-center">
            <div className="text-white/60 text-[10px] font-mono uppercase">Speed</div>
            <div className="text-base font-mono font-bold tabular-nums text-white whitespace-nowrap">
              {speedKmh} <span className="text-[10px] text-white/60">km/h</span>
            </div>
          </div>
          <div className="flex-1 px-3 py-1.5 text-center">
            <div className="text-white/60 text-[10px] font-mono uppercase">Time</div>
            <div className="text-base font-mono font-bold tabular-nums text-white">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>
          <div className="flex-1 px-3 py-1.5 text-center">
            <div className="text-white/60 text-[10px] font-mono uppercase">Combo</div>
            <div className={`text-base font-mono font-bold tabular-nums ${combo > 1 ? "text-cyan-400" : "text-white"}`}>
              x{combo}
            </div>
          </div>
        </div>

        {/* Progress bar + stats row */}
        <div className="bg-black/60 backdrop-blur-sm flex items-center gap-2 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-white font-mono text-xs tabular-nums">{passedGates.size}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-white font-mono text-xs tabular-nums">{collisions.size}</span>
          </div>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden mx-2">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-white/60 font-mono text-xs tabular-nums whitespace-nowrap">
            {Math.floor(distanceTraveled)}m
          </span>
          <button
            onClick={stopGame}
            className="pointer-events-auto text-white/60 hover:text-white text-xs font-mono ml-1"
          >
            ✕
          </button>
        </div>

        {/* Mobile Controls (touch devices only) */}
        {isTouchDevice && (
          <>
            {/* Steering Controls - Bottom left */}
            <div className="pointer-events-auto absolute bottom-8 left-4">
              <SteeringControls />
            </div>

            {/* Pedal Controls - Bottom right */}
            <div className="pointer-events-auto absolute bottom-8 right-4">
              <PedalControls />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
