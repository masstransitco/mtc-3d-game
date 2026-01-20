"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type RunData = {
  timestamp: number
  score: number
  baseScore: number
  timeBonus: number
  gatesCleared: number
  gatesMissed: number
  collisions: number
  maxCombo: number
  duration: number
  seed: number
  interrupted: boolean
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunData[]>([])

  useEffect(() => {
    const savedRuns = JSON.parse(localStorage.getItem("neonSlalomRuns") || "[]")
    setRuns(savedRuns)
  }, [])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all run history?")) {
      localStorage.removeItem("neonSlalomRuns")
      setRuns([])
    }
  }

  return (
    <main className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        {/* MTC Logo */}
        <div className="mb-6">
          <Image
            src="/logos/mtc-logo-2025.svg"
            alt="MTC Logo"
            width={100}
            height={34}
            className="opacity-80"
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Run History</h1>
            <p className="text-white/50 text-sm">Your last {runs.length} MG4 runs</p>
          </div>
          <Link href="/game">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black">Play Now</Button>
          </Link>
        </div>

        {/* Runs list */}
        {runs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/50 mb-4">No runs yet</p>
            <Link href="/game">
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-black">Start Your First Race</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {runs.map((run, index) => (
                <div
                  key={run.timestamp}
                  className={`bg-white/5 rounded-lg p-4 ${run.interrupted ? "border border-yellow-500/30" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-bold text-xl tabular-nums">
                        {run.score.toLocaleString()}
                        {index === 0 && runs.length > 1 && (
                          <span className="ml-2 text-xs text-cyan-400 font-normal">LATEST</span>
                        )}
                      </div>
                      <div className="text-white/50 text-xs">{formatDate(run.timestamp)}</div>
                    </div>
                    {run.interrupted && (
                      <span className="text-yellow-400 text-xs px-2 py-1 bg-yellow-400/10 rounded">Interrupted</span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-white/40">Gates</span>
                      <div className="text-cyan-400 font-mono">{run.gatesCleared}</div>
                    </div>
                    <div>
                      <span className="text-white/40">Combo</span>
                      <div className="text-white font-mono">x{run.maxCombo}</div>
                    </div>
                    <div>
                      <span className="text-white/40">Hits</span>
                      <div className="text-red-400 font-mono">{run.collisions}</div>
                    </div>
                    <div>
                      <span className="text-white/40">Time</span>
                      <div className="text-white font-mono">{Math.floor(run.duration)}s</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear history */}
            <div className="mt-8 text-center">
              <button
                onClick={clearHistory}
                className="text-red-400/50 hover:text-red-400 text-sm underline underline-offset-4"
              >
                Clear History
              </button>
            </div>
          </>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-white/50 hover:text-white text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
