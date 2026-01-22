"use client"

import { useRef, useEffect, useMemo } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { useGame } from "@/lib/game/game-context"
import { useCarControls } from "@/lib/game/use-car-controls"
import { useEngineSound } from "@/lib/audio"

// Preload the MG4 model with Draco compression
useGLTF.preload("/MG4-draco.glb")

function MG4Model({ bodyRef }: { bodyRef: React.RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF("/MG4-draco.glb")
  const modelRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (scene) {
      // Clone the scene to avoid issues with multiple instances
      const clonedScene = scene.clone()

      // Traverse and enhance materials for realistic car reflections
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true

          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material = child.material.clone()

            // Detect material type by color/name for appropriate settings
            const mat = child.material
            const color = mat.color.getHex()
            const name = child.name.toLowerCase()

            // Car body paint - highly reflective
            if (name.includes('body') || name.includes('paint') || name.includes('hood') ||
                name.includes('door') || name.includes('fender') || name.includes('bumper') ||
                (color < 0x333333 && mat.metalness < 0.5)) {
              mat.metalness = 0.9
              mat.roughness = 0.15
              mat.envMapIntensity = 2.5
            }
            // Windows/glass - reflective and slightly transparent
            else if (name.includes('glass') || name.includes('window') || name.includes('windshield')) {
              mat.metalness = 0.1
              mat.roughness = 0.05
              mat.envMapIntensity = 3
              mat.transparent = true
              mat.opacity = 0.4
            }
            // Chrome/metal trim
            else if (name.includes('chrome') || name.includes('trim') || name.includes('handle')) {
              mat.metalness = 1.0
              mat.roughness = 0.1
              mat.envMapIntensity = 3
            }
            // Default - moderate reflection
            else {
              mat.envMapIntensity = 2
              mat.metalness = Math.max(mat.metalness, 0.3)
              mat.roughness = Math.min(mat.roughness, 0.5)
            }

            mat.needsUpdate = true
          }
        }
      })

      if (modelRef.current) {
        // Clear existing children
        while (modelRef.current.children.length > 0) {
          modelRef.current.remove(modelRef.current.children[0])
        }
        modelRef.current.add(clonedScene)
      }
    }
  }, [scene])

  return (
    <group ref={bodyRef}>
      <group
        ref={modelRef}
        scale={[4.8, 4.8, 4.8]} // 3x previous scale (1.6 * 3)
        rotation={[0, Math.PI, 0]} // Face forward (negative Z direction)
        position={[0, 0, 0]}
      />

      {/* Headlights - two point lights at front of car (car faces -Z direction) */}
      <pointLight
        position={[-0.6, 0.8, -2.8]}
        intensity={15}
        distance={40}
        color="#ffffee"
        decay={2}
      />
      <pointLight
        position={[0.6, 0.8, -2.8]}
        intensity={15}
        distance={40}
        color="#ffffee"
        decay={2}
      />

      {/* Tail lights - red glow at rear of car (positioned inside body so origin isn't visible) */}
      <pointLight
        position={[-0.6, 0.4, 1.8]}
        intensity={8}
        distance={10}
        color="#ff2200"
        decay={2}
      />
      <pointLight
        position={[0.6, 0.4, 1.8]}
        intensity={8}
        distance={10}
        color="#ff2200"
        decay={2}
      />

      {/* Subtle underglow for neon aesthetic */}
      <pointLight
        position={[0, 0.15, 0]}
        intensity={2}
        distance={5}
        color="#00ffff"
        decay={2}
      />

      {/* Fill light from above to illuminate car body */}
      <pointLight
        position={[0, 4, 0]}
        intensity={8}
        distance={12}
        color="#f5f0e6"
        decay={2}
      />

      {/* Rim light from behind for depth */}
      <pointLight
        position={[0, 2, 4]}
        intensity={4}
        distance={10}
        color="#ffeedd"
        decay={2}
      />
    </group>
  )
}

export function Car() {
  const carRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)

  // Use refs for position to avoid state updates every frame
  // Y position adjusted for scaled car (4.8x scale)
  const positionRef = useRef({ x: 0, y: 0.465, z: 0 })
  const velocityRef = useRef({ x: 0, y: 0, z: 0 })
  const tiltRef = useRef(0)

  // Realistic MG4 EV physics
  const speedRef = useRef(0)
  const smoothedSpeedRef = useRef(0)
  const MAX_SPEED = 44.44     // 160 km/h in units/sec
  const ACCELERATION = 5.5    // Base acceleration (reduced at high speed)
  const BRAKE_DECEL = 12      // Realistic braking (~0.8g)
  const DRAG_FACTOR = 0.0003  // Air resistance (equilibrium at ~95% max speed)

  const gameContext = useGame()
  const { updateCarPosition, updateDistance, updateSpeed, gameState, mobileSteerInput } = gameContext
  const controls = useCarControls()
  const engineSound = useEngineSound()
  const engineStartedRef = useRef(false)

  // Start/stop engine based on game state
  useEffect(() => {
    if (gameState === "running" && !engineStartedRef.current) {
      engineSound.start()
      engineStartedRef.current = true
    } else if (gameState !== "running" && engineStartedRef.current) {
      engineSound.stop()
      engineStartedRef.current = false
    }
  }, [gameState, engineSound])

  useFrame((state, delta) => {
    if (!carRef.current || gameState !== "running") return

    // Clamp delta to prevent large jumps (e.g., after tab switch)
    const clampedDelta = Math.min(delta, 0.1)

    // Get pedal inputs (0-1 range) - keyboard brake overrides to full
    const throttleInput = gameContext.throttlePosition
    const brakeInput = controls.isBraking ? 1.0 : gameContext.brakePosition

    // Current speed ratio for power curve calculations
    const speedRatio = speedRef.current / MAX_SPEED

    // Dead zone threshold
    const DEAD_ZONE = 0.05
    const ENGINE_BRAKING = 2.0 // Gentle deceleration when coasting

    if (brakeInput > DEAD_ZONE) {
      // Proportional braking based on pedal position
      const brakeForce = BRAKE_DECEL * brakeInput * (1 + speedRatio * 0.5)
      speedRef.current = Math.max(0, speedRef.current - brakeForce * clampedDelta)
    } else if (throttleInput > DEAD_ZONE) {
      // Proportional acceleration - no auto-accelerate, requires throttle input
      const effectiveAccel = ACCELERATION * throttleInput * (1 - speedRatio * speedRatio)

      // Air drag increases with speed² (realistic aerodynamic resistance)
      const dragDecel = speedRef.current * speedRef.current * DRAG_FACTOR

      // Net acceleration (accel minus drag)
      const netAccel = effectiveAccel - dragDecel
      speedRef.current = Math.max(0, Math.min(MAX_SPEED, speedRef.current + netAccel * clampedDelta))
    } else {
      // No throttle input - apply engine braking (gradual slowdown)
      speedRef.current = Math.max(0, speedRef.current - ENGINE_BRAKING * clampedDelta)
    }

    // Smooth speed changes with lerp to reduce jitter
    smoothedSpeedRef.current = THREE.MathUtils.lerp(smoothedSpeedRef.current, speedRef.current, 0.15)
    const currentSpeed = smoothedSpeedRef.current

    // Update position with clamped delta
    const newZ = positionRef.current.z - currentSpeed * clampedDelta
    const steerSpeed = 12
    const maxX = 10 // Boundaries within tunnel (slightly wider)

    // Combine keyboard steering with mobile button steering (mobile takes priority if active)
    const effectiveSteerInput = mobileSteerInput !== 0 ? mobileSteerInput : controls.steerInput

    // Apply steering with smoothing
    let newX = positionRef.current.x + effectiveSteerInput * steerSpeed * clampedDelta
    newX = Math.max(-maxX, Math.min(maxX, newX))

    // Update position ref
    positionRef.current.x = newX
    positionRef.current.z = newZ

    // Update velocity ref for collision detection
    velocityRef.current.x = effectiveSteerInput * steerSpeed
    velocityRef.current.z = -currentSpeed

    // Update car mesh position directly (no state)
    carRef.current.position.set(newX, 0.3, newZ)

    // Car tilt based on steering - smooth with lerp
    if (bodyRef.current) {
      const targetTilt = -effectiveSteerInput * 0.08
      tiltRef.current = THREE.MathUtils.lerp(tiltRef.current, targetTilt, 0.15)
      bodyRef.current.rotation.z = tiltRef.current
    }

    // Calculate distance traveled (positive value from negative z)
    const distance = Math.abs(newZ)

    // Update context for position, distance and speed
    updateCarPosition(
      { x: newX, y: 0.45, z: newZ },
      { x: velocityRef.current.x, y: 0, z: velocityRef.current.z }
    )
    updateDistance(distance)
    updateSpeed(currentSpeed)

    // Update engine sound based on current speed
    engineSound.update(currentSpeed)
  })

  return (
    <group ref={carRef} position={[0, 0.45, 0]}>
      <MG4Model bodyRef={bodyRef} />
    </group>
  )
}
