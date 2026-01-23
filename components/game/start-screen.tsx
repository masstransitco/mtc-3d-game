"use client"

import Image from "next/image"
import Link from "next/link"
import { useGame } from "@/lib/game/game-context"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAudio } from "@/lib/audio"

export function StartScreen() {
  const { startCountdown, setPerformanceTier, performanceTier, setReducedMotion, reducedMotion } = useGame()
  const { initAudio, playClick, isMuted, setMuted, masterVolume, setMasterVolume } = useAudio()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-auto">
      {/* Landscape layout: side by side | Portrait layout: stacked */}
      <div className="flex flex-col landscape:flex-row landscape:items-center landscape:gap-8 max-w-4xl w-full">

        {/* Left side: Logo and title */}
        <div className="text-center landscape:text-left landscape:flex-1 mb-4 landscape:mb-0">
          {/* MTC Logo */}
          <div className="mb-3 landscape:mb-4">
            <Image
              src="/logos/mtc-logo-2025.svg"
              alt="MTC Logo"
              width={100}
              height={33}
              className="mx-auto landscape:mx-0"
              priority
            />
          </div>

          {/* Title */}
          <h1 className="text-3xl landscape:text-4xl font-bold text-white mb-1 tracking-tight">LION ROCK</h1>
          <p className="text-cyan-400 font-mono text-base landscape:text-lg mb-3">TUNNEL SPRINT</p>

          {/* Game description - hidden on very small landscape */}
          <p className="text-white/70 text-sm leading-relaxed hidden landscape:block">
            Race through the 1430m Lion Rock Tunnel. Steer through gates and avoid obstacles!
          </p>
        </div>

        {/* Right side: Controls and button */}
        <div className="landscape:flex-1 landscape:max-w-sm">
          {/* Controls info - compact */}
          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-2">Controls</h3>

            <div className="flex gap-4 text-xs">
              {/* Desktop */}
              <div className="flex-1">
                <div className="text-cyan-400/80 font-mono mb-1">Desktop</div>
                <div className="text-white/70">A/D or ← → to steer</div>
                <div className="text-white/70">Space to brake</div>
              </div>

              {/* Mobile */}
              <div className="flex-1">
                <div className="text-cyan-400/80 font-mono mb-1">Mobile</div>
                <div className="text-white/70">Left: Steer buttons</div>
                <div className="text-white/70">Right: Pedals</div>
              </div>
            </div>
          </div>

          {/* Start button */}
          <Button
            onClick={async () => {
              await initAudio()
              playClick()
              startCountdown()
            }}
            className="w-full h-12 text-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-black mb-3"
          >
            START RACE
          </Button>

          {/* Settings & History */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-white/50 hover:text-white text-sm underline underline-offset-4"
            >
              {showSettings ? "Hide Settings" : "Settings"}
            </button>
            <Link
              href="/history"
              className="text-white/50 hover:text-white text-sm underline underline-offset-4"
            >
              Run History
            </Link>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="mt-3 bg-white/5 rounded-lg p-3 text-left">
              <div className="mb-3">
                <label className="text-white/60 text-xs font-mono uppercase tracking-wider block mb-2">
                  Graphics
                </label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setPerformanceTier(tier)}
                      className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                        performanceTier === tier ? "bg-cyan-500 text-black" : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-white text-xs">Reduce Motion</span>
              </label>

              {/* Sound settings */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={!isMuted}
                    onChange={(e) => setMuted(!e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-white text-xs">Sound Effects</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-xs">Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    disabled={isMuted}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
