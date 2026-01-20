"use client"

import Image from "next/image"
import { useGame } from "@/lib/game/game-context"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function StartScreen() {
  const { startCountdown, setPerformanceTier, performanceTier, setReducedMotion, reducedMotion } = useGame()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="text-center max-w-md px-6">
        {/* MTC Logo */}
        <div className="mb-6">
          <Image
            src="/logos/mtc-logo-2025.svg"
            alt="MTC Logo"
            width={120}
            height={40}
            className="mx-auto"
            priority
          />
        </div>

        {/* Logo/Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">LION ROCK</h1>
        <p className="text-cyan-400 font-mono text-lg mb-8">TUNNEL SPRINT</p>

        {/* Game description */}
        <p className="text-white/70 text-sm mb-8 leading-relaxed">
          Race your MG4 through the 1430m Lion Rock Tunnel. Auto-accelerate, brake to control speed, steer through gates
          and avoid obstacles for the fastest time!
        </p>

        {/* Controls info */}
        <div className="bg-white/5 rounded-lg p-4 mb-8">
          <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">Controls</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-white/50">Desktop:</div>
            <div className="text-white">A/D or Arrow Keys</div>
            <div className="text-white/50">Mobile:</div>
            <div className="text-white">Tilt or Touch</div>
            <div className="text-white/50">Brake:</div>
            <div className="text-white">Space / Tap Button</div>
          </div>
        </div>

        {/* Start button */}
        <Button
          onClick={startCountdown}
          className="w-full h-14 text-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-black mb-4"
        >
          START RACE
        </Button>

        {/* Settings toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-white/50 hover:text-white text-sm underline underline-offset-4"
        >
          {showSettings ? "Hide Settings" : "Settings"}
        </button>

        {/* Settings panel */}
        {showSettings && (
          <div className="mt-4 bg-white/5 rounded-lg p-4 text-left">
            <div className="mb-4">
              <label className="text-white/60 text-xs font-mono uppercase tracking-wider block mb-2">
                Graphics Quality
              </label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setPerformanceTier(tier)}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      performanceTier === tier ? "bg-cyan-500 text-black" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-white text-sm">Reduce Motion</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
