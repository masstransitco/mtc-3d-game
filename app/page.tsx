"use client"

import dynamic from "next/dynamic"

const GameCanvas = dynamic(() => import("@/components/game/game-canvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-white text-xl font-mono">Loading...</div>
    </div>
  ),
})

export default function Home() {
  return <GameCanvas />
}
