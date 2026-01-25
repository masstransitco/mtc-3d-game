"use client"

import { useMemo, useRef, useEffect, type ReactNode } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useGame } from "@/lib/game/game-context"
import { generateTrack, type Gate, type Obstacle } from "@/lib/game/track-generator"
import { triggerCollisionHaptic } from "@/lib/game/haptics"

// Physics state for collided objects
type PhysicsState = {
  velocity: { x: number; y: number; z: number }
  angularVelocity: { x: number; y: number; z: number }
  offset: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  active: boolean
}

// Impulse parameters per obstacle type
const impulseConfig = {
  cone: { mass: 2, impulseScale: 1.5, angularScale: 8 },
  bollard: { mass: 15, impulseScale: 0.4, angularScale: 3 },
  barrier: { mass: 25, impulseScale: 0.3, angularScale: 1.5 },
  gate: { mass: 5, impulseScale: 0.8, angularScale: 4 },
}

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
  pole: new THREE.CylinderGeometry(0.08, 0.08, 3, 6),
  topBar: new THREE.BoxGeometry(1, 0.12, 0.12),
  groundMarker: new THREE.ConeGeometry(0.25, 0.5, 3),
}

const obstacleGeometries = {
  coneBody: new THREE.ConeGeometry(0.22, 0.75, 6),
  coneBase: new THREE.CylinderGeometry(0.3, 0.3, 0.08, 6),
  coneStripe: new THREE.CylinderGeometry(0.19, 0.16, 0.12, 6),
  barrierBody: new THREE.BoxGeometry(2, 0.9, 0.25),
  barrierStripe: new THREE.BoxGeometry(0.25, 0.7, 0.02),
  barrierLeg: new THREE.BoxGeometry(0.08, 0.45, 0.15),
  bollardBody: new THREE.CylinderGeometry(0.12, 0.18, 0.9, 8),
  bollardTop: new THREE.SphereGeometry(0.15, 8, 6),
  bollardBase: new THREE.CylinderGeometry(0.22, 0.22, 0.08, 8),
}

// Wrapper that drives a group's transform from physics state each frame
function PhysicsGroup({
  physics,
  basePosition,
  baseRotation,
  children,
}: {
  physics?: PhysicsState
  basePosition: [number, number, number]
  baseRotation?: [number, number, number]
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!ref.current) return
    if (physics?.active) {
      ref.current.position.set(
        basePosition[0] + physics.offset.x,
        basePosition[1] + physics.offset.y,
        basePosition[2] + physics.offset.z
      )
      ref.current.rotation.set(
        (baseRotation?.[0] || 0) + physics.rotation.x,
        (baseRotation?.[1] || 0) + physics.rotation.y,
        (baseRotation?.[2] || 0) + physics.rotation.z
      )
    } else {
      ref.current.position.set(...basePosition)
      ref.current.rotation.set(baseRotation?.[0] || 0, baseRotation?.[1] || 0, baseRotation?.[2] || 0)
    }
  })

  return (
    <group ref={ref} position={basePosition} rotation={baseRotation}>
      {children}
    </group>
  )
}

// Gate component with physics support
function GateElement({
  gate,
  isPassed,
  isMissed,
  physicsLeft,
  physicsRight,
  physicsBar,
}: {
  gate: Gate
  isPassed: boolean
  isMissed: boolean
  physicsLeft?: PhysicsState
  physicsRight?: PhysicsState
  physicsBar?: PhysicsState
}) {
  const material = isPassed ? gateMaterials.passed : isMissed ? gateMaterials.missed : gateMaterials.default
  const topBarScale = useMemo(() => [gate.width + 0.2, 1, 1] as [number, number, number], [gate.width])

  const leftRef = useRef<THREE.Mesh>(null)
  const rightRef = useRef<THREE.Mesh>(null)
  const barRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (leftRef.current && physicsLeft?.active) {
      leftRef.current.position.set(
        -gate.width / 2 + physicsLeft.offset.x,
        1.5 + physicsLeft.offset.y,
        physicsLeft.offset.z
      )
      leftRef.current.rotation.set(physicsLeft.rotation.x, physicsLeft.rotation.y, physicsLeft.rotation.z)
    }
    if (rightRef.current && physicsRight?.active) {
      rightRef.current.position.set(
        gate.width / 2 + physicsRight.offset.x,
        1.5 + physicsRight.offset.y,
        physicsRight.offset.z
      )
      rightRef.current.rotation.set(physicsRight.rotation.x, physicsRight.rotation.y, physicsRight.rotation.z)
    }
    if (barRef.current && physicsBar?.active) {
      barRef.current.position.set(physicsBar.offset.x, 3 + physicsBar.offset.y, physicsBar.offset.z)
      barRef.current.rotation.set(physicsBar.rotation.x, physicsBar.rotation.y, physicsBar.rotation.z)
    }
  })

  return (
    <group position={[gate.x, 0, gate.z]}>
      {/* Left pole */}
      <mesh
        ref={leftRef}
        position={[-gate.width / 2, 1.5, 0]}
        geometry={gateGeometries.pole}
        material={material}
        castShadow
      />

      {/* Right pole */}
      <mesh
        ref={rightRef}
        position={[gate.width / 2, 1.5, 0]}
        geometry={gateGeometries.pole}
        material={material}
        castShadow
      />

      {/* Top bar */}
      <mesh
        ref={barRef}
        position={[0, 3, 0]}
        scale={topBarScale}
        geometry={gateGeometries.topBar}
        material={material}
        castShadow
      />

      {/* Ground markers */}
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

// Traffic cone obstacle with physics
function ConeObstacle({ obstacle, physics }: { obstacle: Obstacle; physics?: PhysicsState }) {
  return (
    <PhysicsGroup physics={physics} basePosition={[obstacle.x, 0, obstacle.z]}>
      <mesh position={[0, 0.4, 0]} geometry={obstacleGeometries.coneBody} material={obstacleMaterials.coneOrange} castShadow />
      <mesh position={[0, 0.04, 0]} geometry={obstacleGeometries.coneBase} material={obstacleMaterials.coneBase} />
      <mesh position={[0, 0.48, 0]} geometry={obstacleGeometries.coneStripe} material={obstacleMaterials.coneStripe} />
    </PhysicsGroup>
  )
}

// Barrier obstacle with physics
function BarrierObstacle({ obstacle, physics }: { obstacle: Obstacle; physics?: PhysicsState }) {
  return (
    <PhysicsGroup
      physics={physics}
      basePosition={[obstacle.x, 0, obstacle.z]}
      baseRotation={[0, obstacle.rotation || 0, 0]}
    >
      <mesh position={[0, 0.5, 0]} geometry={obstacleGeometries.barrierBody} material={obstacleMaterials.barrierRed} castShadow />
      <mesh position={[-0.6, 0.5, 0.13]} geometry={obstacleGeometries.barrierStripe} material={obstacleMaterials.barrierWhite} />
      <mesh position={[0, 0.5, 0.13]} geometry={obstacleGeometries.barrierStripe} material={obstacleMaterials.barrierWhite} />
      <mesh position={[0.6, 0.5, 0.13]} geometry={obstacleGeometries.barrierStripe} material={obstacleMaterials.barrierWhite} />
      <mesh position={[-0.75, 0.22, 0]} geometry={obstacleGeometries.barrierLeg} material={obstacleMaterials.barrierLeg} />
      <mesh position={[0.75, 0.22, 0]} geometry={obstacleGeometries.barrierLeg} material={obstacleMaterials.barrierLeg} />
    </PhysicsGroup>
  )
}

// Bollard obstacle with physics
function BollardObstacle({ obstacle, physics }: { obstacle: Obstacle; physics?: PhysicsState }) {
  return (
    <PhysicsGroup physics={physics} basePosition={[obstacle.x, 0, obstacle.z]}>
      <mesh position={[0, 0.45, 0]} geometry={obstacleGeometries.bollardBody} material={obstacleMaterials.bollardYellow} castShadow />
      <mesh position={[0, 0.92, 0]} geometry={obstacleGeometries.bollardTop} material={obstacleMaterials.bollardTop} />
      <mesh position={[0, 0.04, 0]} geometry={obstacleGeometries.bollardBase} material={obstacleMaterials.bollardBase} />
    </PhysicsGroup>
  )
}

function createPhysicsState(): PhysicsState {
  return {
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { x: 0, y: 0, z: 0 },
    offset: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    active: false,
  }
}

export function TrackSystem() {
  const {
    seed,
    carPosition,
    carVelocity,
    passedGates,
    missedGates,
    collisions,
    addPassedGate,
    addMissedGate,
    addCollision,
  } = useGame()

  const track = useMemo(() => generateTrack(seed), [seed])

  const processedGatesRef = useRef<Set<string>>(new Set())
  const processedObstaclesRef = useRef<Set<string>>(new Set())

  // Physics state for collided obstacles and gate parts
  const physicsRef = useRef<Map<string, PhysicsState>>(new Map())
  // Gate pole hit tracking
  const gateHitsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    processedGatesRef.current.clear()
    processedObstaclesRef.current.clear()
    physicsRef.current.clear()
    gateHitsRef.current.clear()
  }, [seed])

  // Collision detection, physics init, and physics animation
  useFrame((_, delta) => {
    const carZ = carPosition.z
    const carX = carPosition.x
    const carWidth = 1.8
    const carLength = 4
    const speed = Math.sqrt(carVelocity.x ** 2 + carVelocity.z ** 2)

    // Gate passing logic
    const nearGates = track.gates.filter(
      (g) => g.z > carZ - 5 && g.z < carZ + 30 && !processedGatesRef.current.has(g.id)
    )

    nearGates.forEach((gate) => {
      if (passedGates.has(gate.id) || missedGates.has(gate.id)) {
        processedGatesRef.current.add(gate.id)
        return
      }

      if (carZ < gate.z - 1) {
        const gateLeft = gate.x - gate.width / 2
        const gateRight = gate.x + gate.width / 2
        const carLeft = carX - carWidth / 2
        const carRight = carX + carWidth / 2

        if (carLeft > gateLeft && carRight < gateRight) {
          addPassedGate(gate.id)
        } else {
          addMissedGate(gate.id)

          // Gate pole collision: check which pole was hit
          if (!gateHitsRef.current.has(gate.id)) {
            const leftPoleX = gate.x - gate.width / 2
            const rightPoleX = gate.x + gate.width / 2
            const poleRadius = 0.15
            const carR = carWidth / 2

            const hitLeft = Math.abs(carX - leftPoleX) < carR + poleRadius
            const hitRight = Math.abs(carX - rightPoleX) < carR + poleRadius

            if (hitLeft || hitRight) {
              gateHitsRef.current.add(gate.id)
              triggerCollisionHaptic("gate")

              const cfg = impulseConfig.gate
              const dirX = hitLeft ? -1 : 1

              // Hit pole
              const poleKey = `${gate.id}_${hitLeft ? "left" : "right"}`
              const polePhys = createPhysicsState()
              polePhys.active = true
              polePhys.velocity = {
                x: dirX * speed * cfg.impulseScale * 0.5,
                y: speed * cfg.impulseScale * 0.3,
                z: -speed * cfg.impulseScale * 0.2,
              }
              polePhys.angularVelocity = {
                x: -cfg.angularScale * 0.5,
                y: 0,
                z: dirX * cfg.angularScale,
              }
              physicsRef.current.set(poleKey, polePhys)

              // Top bar drops
              const barKey = `${gate.id}_bar`
              const barPhys = createPhysicsState()
              barPhys.active = true
              barPhys.velocity = {
                x: dirX * speed * cfg.impulseScale * 0.2,
                y: speed * cfg.impulseScale * 0.1,
                z: -speed * cfg.impulseScale * 0.1,
              }
              barPhys.angularVelocity = {
                x: cfg.angularScale * 0.3,
                y: dirX * cfg.angularScale * 0.2,
                z: cfg.angularScale * 0.5,
              }
              physicsRef.current.set(barKey, barPhys)
            }
          }
        }
        processedGatesRef.current.add(gate.id)
      }
    })

    // Obstacle collision detection
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

        // Initialize physics for this obstacle
        triggerCollisionHaptic(obstacle.type)
        const cfg = impulseConfig[obstacle.type]
        const dirX = carX < obstacle.x ? 1 : -1

        const phys = createPhysicsState()
        phys.active = true
        phys.velocity = {
          x: dirX * speed * cfg.impulseScale + (Math.random() - 0.5) * 2,
          y: speed * cfg.impulseScale * 0.4 + 1,
          z: -speed * cfg.impulseScale * 0.6,
        }
        phys.angularVelocity = {
          x: (Math.random() - 0.5) * cfg.angularScale,
          y: (Math.random() - 0.5) * cfg.angularScale * 0.5,
          z: dirX * cfg.angularScale,
        }
        physicsRef.current.set(obstacle.id, phys)
      }
    })

    // Animate active physics objects
    physicsRef.current.forEach((phys) => {
      if (!phys.active) return

      // Gravity
      phys.velocity.y -= 9.8 * delta

      // Update position
      phys.offset.x += phys.velocity.x * delta
      phys.offset.y += phys.velocity.y * delta
      phys.offset.z += phys.velocity.z * delta

      // Update rotation
      phys.rotation.x += phys.angularVelocity.x * delta
      phys.rotation.y += phys.angularVelocity.y * delta
      phys.rotation.z += phys.angularVelocity.z * delta

      // Deactivate when fallen off screen
      if (phys.offset.y < -5) {
        phys.active = false
      }
    })
  })

  // Visible range for rendering
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
          physicsLeft={physicsRef.current.get(`${gate.id}_left`)}
          physicsRight={physicsRef.current.get(`${gate.id}_right`)}
          physicsBar={physicsRef.current.get(`${gate.id}_bar`)}
        />
      ))}

      {/* Obstacles */}
      {visibleObstacles.map((obstacle) => {
        const physics = physicsRef.current.get(obstacle.id)
        switch (obstacle.type) {
          case "cone":
            return <ConeObstacle key={obstacle.id} obstacle={obstacle} physics={physics} />
          case "barrier":
            return <BarrierObstacle key={obstacle.id} obstacle={obstacle} physics={physics} />
          case "bollard":
            return <BollardObstacle key={obstacle.id} obstacle={obstacle} physics={physics} />
          default:
            return null
        }
      })}
    </>
  )
}
