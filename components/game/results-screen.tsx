"use client"

import Image from "next/image"
import { useGame, TRACK_LENGTH } from "@/lib/game/game-context"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export function ResultsScreen() {
  const {
    score,
    passedGates,
    missedGates,
    collisions,
    maxCombo,
    elapsedTime,
    distanceTraveled,
    wasInterrupted,
    resetGame,
    eventLog,
    seed,
  } = useGame()

  // Calculate final score (no time bonus, just raw score from gates)
  const finalScore = score
  const completedTrack = distanceTraveled >= TRACK_LENGTH

  // Format time as MM:SS.ms
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  // Save run to local storage
  useEffect(() => {
    const runData = {
      timestamp: Date.now(),
      score: finalScore,
      gatesCleared: passedGates.size,
      gatesMissed: missedGates.size,
      collisions: collisions.size,
      maxCombo,
      duration: elapsedTime,
      distance: distanceTraveled,
      completed: completedTrack,
      seed,
      interrupted: wasInterrupted,
      eventLog,
    }

    const existingRuns = JSON.parse(localStorage.getItem("lionRockRuns") || "[]")
    const updatedRuns = [runData, ...existingRuns].slice(0, 20) // Keep last 20 runs
    localStorage.setItem("lionRockRuns", JSON.stringify(updatedRuns))
  }, [
    finalScore,
    passedGates.size,
    missedGates.size,
    collisions.size,
    maxCombo,
    elapsedTime,
    distanceTraveled,
    completedTrack,
    seed,
    wasInterrupted,
    eventLog,
  ])

  const handlePlayAgain = () => {
    resetGame()
  }

  const handleShare = () => {
    const shareText = completedTrack
      ? `I completed the Lion Rock Tunnel in ${formatTime(elapsedTime)}! Score: ${finalScore.toLocaleString()} | Gates: ${passedGates.size} | Max Combo: x${maxCombo}`
      : `I reached ${Math.floor(distanceTraveled)}m in the Lion Rock Tunnel! Score: ${finalScore.toLocaleString()}`

    if (navigator.share) {
      navigator.share({
        title: "MTC Lion Rock Tunnel Sprint",
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert("Score copied to clipboard!")
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="max-w-md w-full mx-4 text-center">
        {/* MTC Logo */}
        <div className="mb-4">
          <Image
            src="/logos/mtc-logo-2025.svg"
            alt="MTC Logo"
            width={100}
            height={34}
            className="mx-auto opacity-80"
          />
        </div>

        {/* Header */}
        <h2 className="text-3xl font-bold text-white mb-2">
          {wasInterrupted ? "RUN STOPPED" : completedTrack ? "TUNNEL COMPLETE!" : "RUN ENDED"}
        </h2>
        {wasInterrupted && <p className="text-yellow-400 text-sm mb-4">Run stopped early</p>}
        {!completedTrack && !wasInterrupted && (
          <p className="text-white/60 text-sm mb-4">Reached {Math.floor(distanceTraveled)}m of {TRACK_LENGTH}m</p>
        )}

        {/* Main Metric - Time for completed, Distance for incomplete */}
        <div className="bg-gradient-to-b from-cyan-500/20 to-transparent rounded-2xl p-6 mb-6">
          {completedTrack ? (
            <>
              <div className="text-white/60 text-sm font-mono uppercase tracking-wider mb-1">Completion Time</div>
              <div className="text-5xl font-bold text-white tabular-nums">{formatTime(elapsedTime)}</div>
              <div className="text-cyan-400 text-sm mt-2">Score: {finalScore.toLocaleString()}</div>
            </>
          ) : (
            <>
              <div className="text-white/60 text-sm font-mono uppercase tracking-wider mb-1">Distance</div>
              <div className="text-5xl font-bold text-white tabular-nums">{Math.floor(distanceTraveled)}m</div>
              <div className="text-white/60 text-sm mt-2">Score: {finalScore.toLocaleString()}</div>
            </>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/50 text-xs font-mono uppercase">Gates Cleared</div>
            <div className="text-2xl font-bold text-cyan-400 tabular-nums">{passedGates.size}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/50 text-xs font-mono uppercase">Max Combo</div>
            <div className="text-2xl font-bold text-white tabular-nums">x{maxCombo}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/50 text-xs font-mono uppercase">Collisions</div>
            <div className="text-2xl font-bold text-red-400 tabular-nums">{collisions.size}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/50 text-xs font-mono uppercase">Time</div>
            <div className="text-2xl font-bold text-white tabular-nums">{formatTime(elapsedTime)}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handlePlayAgain}
            className="w-full h-12 text-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-black"
          >
            PLAY AGAIN
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="w-full h-12 text-lg font-medium border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            SHARE SCORE
          </Button>
        </div>

        {/* Seed display for deterministic verification */}
        <div className="mt-4 text-white/30 text-xs font-mono">Seed: {seed}</div>
      </div>
    </div>
  )
}
