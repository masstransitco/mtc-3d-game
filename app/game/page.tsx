"use client"

import dynamic from "next/dynamic"
import { PortraitWarning } from "@/components/game/portrait-warning"

// Dynamic import to prevent SSR issues with Three.js
const GameCanvas = dynamic(() => import("@/components/game/game-canvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-white text-xl font-mono">Loading...</div>
    </div>
  ),
})

export default function GamePage() {
  return (
    <>
      <PortraitWarning />
      <GameCanvas />
    </>
  )
}
