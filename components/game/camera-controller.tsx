"use client"

import { useRef, useEffect } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { useGame } from "@/lib/game/game-context"

export function CameraController() {
  const { camera } = useThree()
  const { gameState, carPosition } = useGame()

  // Camera smoothing refs
  const currentPosition = useRef(new THREE.Vector3(0, 5, 15))
  const currentLookAt = useRef(new THREE.Vector3(0, 1, -10))

  // Initialize camera on mount
  useEffect(() => {
    camera.position.set(0, 5, 15)
    camera.lookAt(0, 1, -10)
    currentPosition.current.set(0, 5, 15)
    currentLookAt.current.set(0, 1, -10)
  }, [camera])

  useFrame((_, delta) => {
    // Clamp delta to avoid huge jumps
    const dt = Math.min(delta, 0.1)

    const cameraHeight = 4
    const cameraDistance = 12 // How far behind the car
    const lookAheadDistance = 15 // How far ahead to look

    // Target position: behind and above the car
    // Car moves in -Z direction, so camera should be at car.z + cameraDistance
    const targetPosition = new THREE.Vector3(
      carPosition.x * 0.3, // Slight lateral follow
      cameraHeight, // Fixed height above ground
      carPosition.z + cameraDistance, // Behind the car (positive offset since car goes -Z)
    )

    // Look at point: ahead of the car (more negative Z)
    const targetLookAt = new THREE.Vector3(carPosition.x * 0.5, 1, carPosition.z - lookAheadDistance)

    // Smooth follow with lerp
    const positionLerpFactor = gameState === "running" ? 0.08 : 0.05
    const lookAtLerpFactor = gameState === "running" ? 0.1 : 0.05

    currentPosition.current.lerp(targetPosition, positionLerpFactor)
    currentLookAt.current.lerp(targetLookAt, lookAtLerpFactor)

    // Apply to camera
    camera.position.copy(currentPosition.current)
    camera.lookAt(currentLookAt.current)
  })

  return null
}
