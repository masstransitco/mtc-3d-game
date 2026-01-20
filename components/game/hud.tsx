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
      {/* Safe area wrapper for iPhone notch */}
      <div className="absolute inset-0 p-4 pt-safe pb-safe pl-safe pr-safe">
        {/* Top HUD bar - Score, Speed, Time, Combo in unified container */}
        <div className="bg-black/60 backdrop-blur-sm rounded-b-lg flex divide-x divide-white/10">
          {/* Score */}
          <div className="flex-1 px-4 py-2 text-center">
            <div className="text-white/60 text-xs font-mono uppercase tracking-wider">Score</div>
            <div className="text-white text-xl font-mono font-bold tabular-nums">{score.toLocaleString()}</div>
          </div>

          {/* Speed */}
          <div className="flex-1 px-4 py-2 text-center">
            <div className="text-white/60 text-xs font-mono uppercase tracking-wider">Speed</div>
            <div className="text-xl font-mono font-bold tabular-nums text-white whitespace-nowrap">
              {speedKmh} <span className="text-xs text-white/60">km/h</span>
            </div>
          </div>

          {/* Time */}
          <div className="flex-1 px-4 py-2 text-center">
            <div className="text-white/60 text-xs font-mono uppercase tracking-wider">Time</div>
            <div className="text-xl font-mono font-bold tabular-nums text-white">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>

          {/* Combo */}
          <div className="flex-1 px-4 py-2 text-center">
            <div className="text-white/60 text-xs font-mono uppercase tracking-wider">Combo</div>
            <div className={`text-xl font-mono font-bold tabular-nums ${combo > 1 ? "text-cyan-400" : "text-white"}`}>
              x{combo}
            </div>
          </div>
        </div>

        {/* Distance Progress Bar */}
        <div className="mt-3 bg-black/60 backdrop-blur-sm rounded-lg p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white/60 text-xs font-mono uppercase tracking-wider">Lion Rock Tunnel</span>
            <span className="text-white font-mono text-sm tabular-nums">
              {Math.floor(distanceTraveled)}m / {TRACK_LENGTH}m
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Gates/Hits stats - Top left (below progress bar) */}
        <div className="absolute top-36 left-4 flex gap-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-white font-mono text-sm tabular-nums">{passedGates.size}</span>
            <span className="text-white/60 text-xs">gates</span>
          </div>
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-white font-mono text-sm tabular-nums">{collisions.size}</span>
            <span className="text-white/60 text-xs">hits</span>
          </div>
        </div>

        {/* Stop Button - Below progress bar */}
        <button
          onClick={stopGame}
          className="pointer-events-auto absolute top-36 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-white/80 hover:text-white text-sm font-mono uppercase tracking-wider transition-colors"
        >
          ✕ Stop
        </button>

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
