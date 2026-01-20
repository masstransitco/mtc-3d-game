"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense, useState, useEffect, useMemo } from "react"
import { GameProvider, useGame } from "@/lib/game/game-context"
import { CarParkScene } from "./scenes/carpark-scene"
import { Car } from "./car"
import { TrackSystem } from "./track-system"
import { GameHUD } from "./hud"
import { ResultsScreen } from "./results-screen"
import { StartScreen } from "./start-screen"
import { CountdownOverlay } from "./countdown-overlay"
import { PostProcessingStack } from "./post-processing"
import { GameLoop } from "./game-loop"
import { CameraController } from "./camera-controller"
import { PerformanceMonitor, AdaptiveDpr, Environment } from "@react-three/drei"
import { usePerformanceTier } from "@/lib/game/use-performance-tier"

function GameContent() {
  const { gameState, performanceTier } = useGame()

  // Mobile-optimized DPR starting point
  const initialDpr = useMemo(() => {
    if (typeof window === "undefined") return 1
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) return Math.min(window.devicePixelRatio, 1.5)
    return Math.min(window.devicePixelRatio, 2)
  }, [])

  const [dpr, setDpr] = useState(initialDpr)

  // GL config optimized for mobile
  const glConfig = useMemo(
    () => ({
      antialias: performanceTier === "high",
      powerPreference: "high-performance" as const,
      stencil: false,
      depth: true,
      alpha: false,
      // Preserve drawing buffer for screenshots but not on mobile
      preserveDrawingBuffer: performanceTier === "high",
    }),
    [performanceTier]
  )

  return (
    <>
      <Canvas
        shadows={performanceTier !== "low"}
        dpr={dpr}
        camera={{ position: [0, 5, 15], fov: 60, near: 0.5, far: 150 }}
        gl={glConfig}
        style={{ background: "#0a0a0a" }}
        frameloop="always"
        flat={performanceTier === "low"}
      >
        <PerformanceMonitor
          onIncline={() => setDpr((prev) => Math.min(2, prev + 0.2))}
          onDecline={() => setDpr((prev) => Math.max(0.5, prev - 0.2))}
          flipflops={3}
          factor={0.5}
        >
          <AdaptiveDpr pixelated />
          <Suspense fallback={null}>
            {/* Environment map for car reflections - warehouse gives good indoor reflections */}
            <Environment preset="warehouse" background={false} environmentIntensity={0.5} />
            <GameLoop />
            <CameraController />
            <CarParkScene />
            {(gameState === "running" || gameState === "countdown") && (
              <>
                <Car />
                <TrackSystem />
              </>
            )}
            <PostProcessingStack />
          </Suspense>
        </PerformanceMonitor>
      </Canvas>

      {/* UI Overlays */}
      {gameState === "ready" && <StartScreen />}
      {gameState === "countdown" && <CountdownOverlay />}
      {gameState === "running" && <GameHUD />}
      {gameState === "finished" && <ResultsScreen />}
    </>
  )
}

export default function GameCanvas() {
  const tier = usePerformanceTier()

  return (
    <div className="w-full h-screen bg-black overflow-hidden touch-none">
      <GameProvider initialTier={tier}>
        <GameContent />
      </GameProvider>
    </div>
  )
}
