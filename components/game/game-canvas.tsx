"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense, useState, useEffect, useMemo } from "react"
import { GameProvider, useGame } from "@/lib/game/game-context"
import { AudioProvider } from "@/lib/audio"
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

  // Detect mobile device
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 'ontouchstart' in window
  }, [])

  // Mobile-optimized DPR starting point
  const initialDpr = useMemo(() => {
    if (typeof window === "undefined") return 1
    // More aggressive DPR reduction on mobile for performance
    if (isMobile) return Math.min(window.devicePixelRatio, 1.25)
    return Math.min(window.devicePixelRatio, 2)
  }, [isMobile])

  const [dpr, setDpr] = useState(initialDpr)

  // GL config optimized for mobile/iOS
  const glConfig = useMemo(
    () => ({
      antialias: !isMobile && performanceTier === "high",
      powerPreference: "high-performance" as const,
      stencil: false,
      depth: true,
      alpha: false,
      // Disable preserveDrawingBuffer on mobile for better performance
      preserveDrawingBuffer: !isMobile && performanceTier === "high",
      // WebGL 2 for better performance where available
      failIfMajorPerformanceCaveat: false,
    }),
    [performanceTier, isMobile]
  )

  // Environment intensity based on device
  const envIntensity = isMobile ? 0.3 : 0.5

  return (
    <>
      <Canvas
        shadows={performanceTier !== "low"}
        dpr={dpr}
        camera={{ position: [0, 5, 15], fov: 60, near: 0.5, far: 150 }}
        gl={glConfig}
        style={{
          background: "#0a0a0a",
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
        }}
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
            <Environment preset="warehouse" background={false} environmentIntensity={envIntensity} />
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
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div
      className="bg-black overflow-hidden touch-none"
      style={{
        position: 'fixed',
        top: 0,
        left: isPortrait ? '100vw' : 0,
        width: isPortrait ? '100vh' : '100vw',
        height: isPortrait ? '100vw' : '100vh',
        margin: 0,
        padding: 0,
        transform: isPortrait ? 'rotate(90deg)' : undefined,
        transformOrigin: 'top left',
      }}
    >
      <AudioProvider>
        <GameProvider initialTier={tier}>
          <GameContent />
        </GameProvider>
      </AudioProvider>
    </div>
  )
}
