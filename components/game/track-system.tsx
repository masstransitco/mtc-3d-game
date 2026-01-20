"use client"

import { useMemo, useRef, useEffect } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useGame } from "@/lib/game/game-context"
import { generateTrack, type Gate, type Obstacle } from "@/lib/game/track-generator"

// Shared materials - created once
const gateMaterials = {
  default: new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 1,
    toneMapped: false,
  }),
  passed: new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00ff88,
    emissiveIntensity: 2,
    toneMapped: false,
  }),
  missed: new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0xff4444,
    emissiveIntensity: 1.5,
    toneMapped: false,
  }),
}

const obstacleMaterials = {
  coneOrange: new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.6 }),
  coneBase: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }),
  coneStripe: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.3,
    roughness: 0.3,
  }),
  barrierRed: new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.7 }),
  barrierWhite: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.2,
  }),
  barrierLeg: new THREE.MeshStandardMaterial({ color: 0x333333 }),
  bollardYellow: new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    roughness: 0.5,
    metalness: 0.3,
  }),
  bollardTop: new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  }),
  bollardBase: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }),
}

// Shared geometries - optimized segment counts for mobile
const gateGeometries = {
  pole: new THREE.CylinderGeometry(0.08, 0.08, 3, 6), // Reduced from 8 to 6 segments
  topBar: new THREE.BoxGeometry(1, 0.12, 0.12),
  groundMarker: new THREE.ConeGeometry(0.25, 0.5, 3), // Triangle for accessibility
}

const obstacleGeometries = {
  // Cone - simplified
  coneBody: new THREE.ConeGeometry(0.22, 0.75, 6), // Reduced segments
  coneBase: new THREE.CylinderGeometry(0.3, 0.3, 0.08, 6),
  coneStripe: new THREE.CylinderGeometry(0.19, 0.16, 0.12, 6),
  // Barrier - simplified
  barrierBody: new THREE.BoxGeometry(2, 0.9, 0.25),
  barrierStripe: new THREE.BoxGeometry(0.25, 0.7, 0.02),
  barrierLeg: new THREE.BoxGeometry(0.08, 0.45, 0.15),
  // Bollard - simplified
  bollardBody: new THREE.CylinderGeometry(0.12, 0.18, 0.9, 8),
  bollardTop: new THREE.SphereGeometry(0.15, 8, 6),
  bollardBase: new THREE.CylinderGeometry(0.22, 0.22, 0.08, 8),
}

// Gate component with visual feedback - optimized
function GateElement({
  gate,
  isPassed,
  isMissed,
}: {
  gate: Gate
  isPassed: boolean
  isMissed: boolean
}) {
  const material = isPassed ? gateMaterials.passed : isMissed ? gateMaterials.missed : gateMaterials.default

  // Dynamic top bar width
  const topBarScale = useMemo(() => [gate.width + 0.2, 1, 1] as [number, number, number], [gate.width])

  return (
    <group position={[gate.x, 0, gate.z]}>
      {/* Left pole */}
      <mesh
        position={[-gate.width / 2, 1.5, 0]}
        geometry={gateGeometries.pole}
        material={material}
        castShadow
      />

      {/* Right pole */}
      <mesh
        position={[gate.width / 2, 1.5, 0]}
        geometry={gateGeometries.pole}
        material={material}
        castShadow
      />

      {/* Top bar - scaled to gate width */}
      <mesh
        position={[0, 3, 0]}
        scale={topBarScale}
        geometry={gateGeometries.topBar}
        material={material}
        castShadow
      />

      {/* Ground markers - triangles pointing inward */}
      <mesh
        position={[-gate.width / 2, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        geometry={gateGeometries.groundMarker}
        material={material}
      />
      <mesh
        position={[gate.width / 2, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        geometry={gateGeometries.groundMarker}
        material={material}
      />

      {/* Gate glow - only for pending gates */}
      {!isPassed && !isMissed && (
        <pointLight position={[0, 2, 0]} intensity={4} distance={6} color={0x00ffff} decay={2} />
      )}
    </group>
  )
}

// Traffic cone obstacle - refined detail
function ConeObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <group position={[obstacle.x, 0, obstacle.z]}>
      {/* Cone body */}
      <mesh
        position={[0, 0.4, 0]}
        geometry={obstacleGeometries.coneBody}
        material={obstacleMaterials.coneOrange}
        castShadow
      />
      {/* Base */}
      <mesh
        position={[0, 0.04, 0]}
        geometry={obstacleGeometries.coneBase}
        material={obstacleMaterials.coneBase}
      />
      {/* Reflective stripe */}
      <mesh
        position={[0, 0.48, 0]}
        geometry={obstacleGeometries.coneStripe}
        material={obstacleMaterials.coneStripe}
      />
    </group>
  )
}

// Barrier obstacle - refined detail
function BarrierObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <group position={[obstacle.x, 0, obstacle.z]} rotation={[0, obstacle.rotation || 0, 0]}>
      {/* Main barrier body */}
      <mesh
        position={[0, 0.5, 0]}
        geometry={obstacleGeometries.barrierBody}
        material={obstacleMaterials.barrierRed}
        castShadow
      />
      {/* White stripes */}
      <mesh position={[-0.6, 0.5, 0.13]} geometry={obstacleGeometries.barrierStripe} material={obstacleMaterials.barrierWhite} />
      <mesh position={[0, 0.5, 0.13]} geometry={obstacleGeometries.barrierStripe} material={obstacleMaterials.barrierWhite} />
      <mesh position={[0.6, 0.5, 0.13]} geometry={obstacleGeometries.barrierStripe} material={obstacleMaterials.barrierWhite} />
      {/* Support legs */}
      <mesh position={[-0.75, 0.22, 0]} geometry={obstacleGeometries.barrierLeg} material={obstacleMaterials.barrierLeg} />
      <mesh position={[0.75, 0.22, 0]} geometry={obstacleGeometries.barrierLeg} material={obstacleMaterials.barrierLeg} />
    </group>
  )
}

// Bollard obstacle - refined detail
function BollardObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <group position={[obstacle.x, 0, obstacle.z]}>
      {/* Bollard body */}
      <mesh
        position={[0, 0.45, 0]}
        geometry={obstacleGeometries.bollardBody}
        material={obstacleMaterials.bollardYellow}
        castShadow
      />
      {/* Reflective top */}
      <mesh
        position={[0, 0.92, 0]}
        geometry={obstacleGeometries.bollardTop}
        material={obstacleMaterials.bollardTop}
      />
      {/* Base */}
      <mesh
        position={[0, 0.04, 0]}
        geometry={obstacleGeometries.bollardBase}
        material={obstacleMaterials.bollardBase}
      />
    </group>
  )
}

export function TrackSystem() {
  const {
    seed,
    carPosition,
    passedGates,
    missedGates,
    collisions,
    addPassedGate,
    addMissedGate,
    addCollision,
  } = useGame()

  // Generate track based on seed - memoized
  const track = useMemo(() => generateTrack(seed), [seed])

  // Refs for tracking processed gates/obstacles to avoid repeated checks
  const processedGatesRef = useRef<Set<string>>(new Set())
  const processedObstaclesRef = useRef<Set<string>>(new Set())

  // Reset processed sets when seed changes
  useEffect(() => {
    processedGatesRef.current.clear()
    processedObstaclesRef.current.clear()
  }, [seed])

  // Collision detection and gate passing - optimized
  useFrame(() => {
    const carZ = carPosition.z
    const carX = carPosition.x
    const carWidth = 1.8
    const carLength = 4

    // Only check gates within range
    const nearGates = track.gates.filter(
      (g) => g.z > carZ - 5 && g.z < carZ + 30 && !processedGatesRef.current.has(g.id)
    )

    nearGates.forEach((gate) => {
      if (passedGates.has(gate.id) || missedGates.has(gate.id)) {
        processedGatesRef.current.add(gate.id)
        return
      }

      // Check if car has passed the gate's Z position
      if (carZ < gate.z - 1) {
        const gateLeft = gate.x - gate.width / 2
        const gateRight = gate.x + gate.width / 2
        const carLeft = carX - carWidth / 2
        const carRight = carX + carWidth / 2

        if (carLeft > gateLeft && carRight < gateRight) {
          addPassedGate(gate.id)
        } else {
          addMissedGate(gate.id)
        }
        processedGatesRef.current.add(gate.id)
      }
    })

    // Only check obstacles within range
    const nearObstacles = track.obstacles.filter(
      (o) => o.z > carZ - 5 && o.z < carZ + 20 && !processedObstaclesRef.current.has(o.id)
    )

    nearObstacles.forEach((obstacle) => {
      if (collisions.has(obstacle.id)) {
        processedObstaclesRef.current.add(obstacle.id)
        return
      }

      const dx = Math.abs(carX - obstacle.x)
      const dz = Math.abs(carZ - obstacle.z)
      const obstacleRadius = obstacle.type === "barrier" ? 1.2 : 0.4
      const carRadius = carWidth / 2

      if (dx < carRadius + obstacleRadius && dz < carLength / 2 + 0.5) {
        addCollision(obstacle.id)
        processedObstaclesRef.current.add(obstacle.id)
      }
    })
  })

  // Visible range for rendering - tighter for mobile performance
  const visibleRange = 80
  const behindRange = 15

  const visibleGates = useMemo(() => {
    return track.gates.filter(
      (g) => g.z > carPosition.z - behindRange && g.z < carPosition.z + visibleRange
    )
  }, [track.gates, carPosition.z, visibleRange, behindRange])

  const visibleObstacles = useMemo(() => {
    return track.obstacles.filter(
      (o) => o.z > carPosition.z - behindRange && o.z < carPosition.z + visibleRange
    )
  }, [track.obstacles, carPosition.z, visibleRange, behindRange])

  // Cleanup geometries and materials on unmount
  useEffect(() => {
    return () => {
      Object.values(gateGeometries).forEach((g) => g.dispose())
      Object.values(obstacleGeometries).forEach((g) => g.dispose())
      Object.values(gateMaterials).forEach((m) => m.dispose())
      Object.values(obstacleMaterials).forEach((m) => m.dispose())
    }
  }, [])

  return (
    <>
      {/* Gates */}
      {visibleGates.map((gate) => (
        <GateElement
          key={gate.id}
          gate={gate}
          isPassed={passedGates.has(gate.id)}
          isMissed={missedGates.has(gate.id)}
        />
      ))}

      {/* Obstacles */}
      {visibleObstacles.map((obstacle) => {
        switch (obstacle.type) {
          case "cone":
            return <ConeObstacle key={obstacle.id} obstacle={obstacle} />
          case "barrier":
            return <BarrierObstacle key={obstacle.id} obstacle={obstacle} />
          case "bollard":
            return <BollardObstacle key={obstacle.id} obstacle={obstacle} />
          default:
            return null
        }
      })}
    </>
  )
}
