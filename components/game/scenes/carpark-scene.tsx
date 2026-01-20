"use client"

import { useRef, useMemo, useEffect } from "react"
import * as THREE from "three"
import { useFrame, useLoader } from "@react-three/fiber"
import { useGame, TRACK_LENGTH } from "@/lib/game/game-context"
import { TextureLoader } from "three"

// Constants for the Lion Rock Tunnel
const SEGMENT_LENGTH = 60
const VISIBLE_SEGMENTS = 5
const TUNNEL_WIDTH = 24
const TUNNEL_HEIGHT = 6

// Calculate needed instance counts for 1430m track + buffer
// At max speed 35 units/sec, we need to see far ahead
const REQUIRED_DISTANCE = TRACK_LENGTH + 200 // 1630m total with buffer

// Reusable materials - Hong Kong tunnel aesthetic
const materials = {
  // Floor - dark asphalt
  floor: new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.85,
    metalness: 0.05,
  }),

  // Walls - cream/beige tile panels (like Hong Kong tunnels)
  wallTile: new THREE.MeshStandardMaterial({
    color: 0xd4c8a8,
    roughness: 0.6,
    metalness: 0.1,
  }),

  // Wall lower section - darker
  wallLower: new THREE.MeshStandardMaterial({
    color: 0x8a8070,
    roughness: 0.7,
    metalness: 0.1,
  }),

  // Ceiling - very dark with slight structure
  ceiling: new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.95,
    metalness: 0,
  }),

  // Ceiling lights - bright white rectangular (fluorescent style)
  ceilingLight: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffee,
    emissiveIntensity: 2.5,
    toneMapped: false,
  }),

  // Center lane line - white dashed
  centerLine: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.3,
  }),

  // Edge lines - solid yellow
  edgeLine: new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    emissive: 0xffcc00,
    emissiveIntensity: 0.2,
  }),

  // Emergency lights - green
  emergencyLight: new THREE.MeshStandardMaterial({
    color: 0x00ff44,
    emissive: 0x00ff44,
    emissiveIntensity: 1.5,
    toneMapped: false,
  }),

  // Wall horizontal lines (tile joints)
  tileJoint: new THREE.MeshStandardMaterial({
    color: 0x9a9080,
    roughness: 0.8,
    metalness: 0.05,
  }),
}

// Reusable geometries
const geometries = {
  floor: new THREE.PlaneGeometry(TUNNEL_WIDTH, SEGMENT_LENGTH),
  wall: new THREE.PlaneGeometry(SEGMENT_LENGTH, 5),
  wallLower: new THREE.PlaneGeometry(SEGMENT_LENGTH, 1),
  ceiling: new THREE.PlaneGeometry(TUNNEL_WIDTH, SEGMENT_LENGTH),
  // Ceiling lights - rectangular panels (two rows)
  ceilingLight: new THREE.BoxGeometry(1.5, 0.1, 4),
  // Center dashes - white
  centerLine: new THREE.PlaneGeometry(0.15, 3),
  // Edge lines - longer for solid appearance
  edgeLine: new THREE.PlaneGeometry(0.12, 8),
  // Emergency exit lights - small boxes
  emergencyLight: new THREE.BoxGeometry(0.3, 0.3, 0.1),
  // Tile joint lines
  tileJoint: new THREE.BoxGeometry(SEGMENT_LENGTH, 0.02, 0.02),
}

// Endless floor with scrolling and textured concrete
function EndlessFloor() {
  const { carPosition } = useGame()
  const groupRef = useRef<THREE.Group>(null)

  // Load the concrete texture
  const concreteTexture = useLoader(TextureLoader, "/textures/concrete-road.jpg")

  // Configure texture for tiling
  const floorMaterial = useMemo(() => {
    concreteTexture.wrapS = THREE.RepeatWrapping
    concreteTexture.wrapT = THREE.RepeatWrapping
    // Tile the texture: 4 times across width (24m), 10 times along length (60m)
    concreteTexture.repeat.set(4, 10)
    concreteTexture.colorSpace = THREE.SRGBColorSpace

    return new THREE.MeshStandardMaterial({
      map: concreteTexture,
      roughness: 0.85,
      metalness: 0.05,
    })
  }, [concreteTexture])

  useFrame(() => {
    if (!groupRef.current) return
    const offset = carPosition.z % SEGMENT_LENGTH
    groupRef.current.position.z = carPosition.z - offset
  })

  return (
    <group ref={groupRef}>
      {[-1, 0, 1, 2].map((i) => (
        <mesh
          key={i}
          geometry={geometries.floor}
          material={floorMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, -i * SEGMENT_LENGTH]}
          receiveShadow
        />
      ))}
    </group>
  )
}

// Endless walls - textured cream tiles with lower darker section
function EndlessWalls() {
  const { carPosition } = useGame()
  const groupRef = useRef<THREE.Group>(null)

  // Load the wall panel texture
  const wallTexture = useLoader(TextureLoader, "/textures/tunnel-wall-v2.jpg")

  // Configure texture for tiling on walls - tall vertical panels
  const wallMaterial = useMemo(() => {
    wallTexture.wrapS = THREE.RepeatWrapping
    wallTexture.wrapT = THREE.RepeatWrapping
    // Tile: 15 times along length (60m), 1 time for height (5m) = tall vertical panels
    wallTexture.repeat.set(15, 1)
    wallTexture.colorSpace = THREE.SRGBColorSpace

    return new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.6,
      metalness: 0.1,
    })
  }, [wallTexture])

  useFrame(() => {
    if (!groupRef.current) return
    const offset = carPosition.z % SEGMENT_LENGTH
    groupRef.current.position.z = carPosition.z - offset
  })

  return (
    <group ref={groupRef}>
      {[-1, 0, 1, 2].map((i) => (
        <group key={i} position={[0, 0, -i * SEGMENT_LENGTH]}>
          {/* Left wall - upper (textured tiles) */}
          <mesh
            geometry={geometries.wall}
            material={wallMaterial}
            position={[-12, 3.5, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
          />
          {/* Left wall - lower (darker) */}
          <mesh
            geometry={geometries.wallLower}
            material={materials.wallLower}
            position={[-12, 0.5, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
          />
          {/* Right wall - upper (textured tiles) */}
          <mesh
            geometry={geometries.wall}
            material={wallMaterial}
            position={[12, 3.5, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            receiveShadow
          />
          {/* Right wall - lower (darker) */}
          <mesh
            geometry={geometries.wallLower}
            material={materials.wallLower}
            position={[12, 0.5, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            receiveShadow
          />
        </group>
      ))}
    </group>
  )
}

// Endless ceiling
function EndlessCeiling() {
  const { carPosition } = useGame()
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current) return
    const offset = carPosition.z % SEGMENT_LENGTH
    groupRef.current.position.z = carPosition.z - offset
  })

  return (
    <group ref={groupRef}>
      {[-1, 0, 1, 2].map((i) => (
        <mesh
          key={i}
          geometry={geometries.ceiling}
          material={materials.ceiling}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, TUNNEL_HEIGHT, -i * SEGMENT_LENGTH]}
        />
      ))}
    </group>
  )
}

// Instanced ceiling lights - TWO ROWS of rectangular fluorescent lights
function InstancedCeilingLights() {
  const { carPosition, performanceTier } = useGame()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const LIGHT_SPACING = performanceTier === "low" ? 12 : 8
  // Need enough lights to cover visible distance ahead
  const LIGHTS_PER_ROW = Math.ceil(REQUIRED_DISTANCE / LIGHT_SPACING) + 10
  const LIGHT_COUNT = LIGHTS_PER_ROW * 2 // Two rows

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!meshRef.current) return

    const baseZ = Math.floor(carPosition.z / LIGHT_SPACING) * LIGHT_SPACING

    for (let i = 0; i < LIGHT_COUNT; i++) {
      const row = i < LIGHTS_PER_ROW ? -1 : 1 // Left row (-3) or right row (+3)
      const index = i % LIGHTS_PER_ROW
      // Extend far ahead and some behind
      const z = baseZ - (index - 5) * LIGHT_SPACING

      dummy.position.set(row * 3, 5.9, z)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometries.ceilingLight, materials.ceilingLight, LIGHT_COUNT]}
    />
  )
}

// Instanced center lane lines - white dashed
function InstancedCenterLines() {
  const { carPosition } = useGame()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const LINE_SPACING = 8
  const LINE_COUNT = Math.ceil(REQUIRED_DISTANCE / LINE_SPACING) + 15

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!meshRef.current) return

    const baseZ = Math.floor(carPosition.z / LINE_SPACING) * LINE_SPACING

    for (let i = 0; i < LINE_COUNT; i++) {
      const z = baseZ - (i - 8) * LINE_SPACING
      dummy.position.set(0, 0.01, z)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometries.centerLine, materials.centerLine, LINE_COUNT]}
    />
  )
}

// Instanced edge lines - solid yellow on both sides
function InstancedEdgeLines() {
  const { carPosition } = useGame()
  const leftRef = useRef<THREE.InstancedMesh>(null)
  const rightRef = useRef<THREE.InstancedMesh>(null)
  const LINE_SPACING = 8
  const LINE_COUNT = Math.ceil(REQUIRED_DISTANCE / LINE_SPACING) + 15

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!leftRef.current || !rightRef.current) return

    const baseZ = Math.floor(carPosition.z / LINE_SPACING) * LINE_SPACING

    for (let i = 0; i < LINE_COUNT; i++) {
      const z = baseZ - (i - 8) * LINE_SPACING

      // Left edge
      dummy.position.set(-10.5, 0.01, z)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.updateMatrix()
      leftRef.current.setMatrixAt(i, dummy.matrix)

      // Right edge
      dummy.position.set(10.5, 0.01, z)
      dummy.updateMatrix()
      rightRef.current.setMatrixAt(i, dummy.matrix)
    }
    leftRef.current.instanceMatrix.needsUpdate = true
    rightRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={leftRef} args={[geometries.edgeLine, materials.edgeLine, LINE_COUNT]} />
      <instancedMesh ref={rightRef} args={[geometries.edgeLine, materials.edgeLine, LINE_COUNT]} />
    </>
  )
}

// Instanced emergency lights - green lights on walls
function InstancedEmergencyLights() {
  const { carPosition } = useGame()
  const leftRef = useRef<THREE.InstancedMesh>(null)
  const rightRef = useRef<THREE.InstancedMesh>(null)
  const LIGHT_SPACING = 30
  const LIGHT_COUNT = Math.ceil(REQUIRED_DISTANCE / LIGHT_SPACING) + 10

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!leftRef.current || !rightRef.current) return

    const baseZ = Math.floor(carPosition.z / LIGHT_SPACING) * LIGHT_SPACING

    for (let i = 0; i < LIGHT_COUNT; i++) {
      const z = baseZ - (i - 5) * LIGHT_SPACING

      // Left wall emergency light
      dummy.position.set(-11.9, 2.5, z)
      dummy.rotation.set(0, Math.PI / 2, 0)
      dummy.updateMatrix()
      leftRef.current.setMatrixAt(i, dummy.matrix)

      // Right wall emergency light
      dummy.position.set(11.9, 2.5, z)
      dummy.rotation.set(0, -Math.PI / 2, 0)
      dummy.updateMatrix()
      rightRef.current.setMatrixAt(i, dummy.matrix)
    }
    leftRef.current.instanceMatrix.needsUpdate = true
    rightRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={leftRef} args={[geometries.emergencyLight, materials.emergencyLight, LIGHT_COUNT]} />
      <instancedMesh ref={rightRef} args={[geometries.emergencyLight, materials.emergencyLight, LIGHT_COUNT]} />
    </>
  )
}

// Instanced tile joint lines on walls (horizontal lines for tile pattern)
function InstancedTileJoints() {
  const { carPosition } = useGame()
  const leftRef = useRef<THREE.InstancedMesh>(null)
  const rightRef = useRef<THREE.InstancedMesh>(null)
  const JOINT_COUNT_PER_SEGMENT = 4 // horizontal lines per segment height
  const SEGMENTS_VISIBLE = Math.ceil(REQUIRED_DISTANCE / SEGMENT_LENGTH) + 5
  const JOINT_COUNT = SEGMENTS_VISIBLE * JOINT_COUNT_PER_SEGMENT

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!leftRef.current || !rightRef.current) return

    const baseZ = Math.floor(carPosition.z / SEGMENT_LENGTH) * SEGMENT_LENGTH

    for (let i = 0; i < JOINT_COUNT; i++) {
      const segmentIndex = Math.floor(i / JOINT_COUNT_PER_SEGMENT)
      const jointIndex = i % JOINT_COUNT_PER_SEGMENT
      const z = baseZ - (segmentIndex - 2) * SEGMENT_LENGTH
      const y = 1.5 + jointIndex * 1.2 // Heights: 1.5, 2.7, 3.9, 5.1

      // Left wall joint
      dummy.position.set(-11.95, y, z)
      dummy.rotation.set(0, Math.PI / 2, 0)
      dummy.updateMatrix()
      leftRef.current.setMatrixAt(i, dummy.matrix)

      // Right wall joint
      dummy.position.set(11.95, y, z)
      dummy.rotation.set(0, -Math.PI / 2, 0)
      dummy.updateMatrix()
      rightRef.current.setMatrixAt(i, dummy.matrix)
    }
    leftRef.current.instanceMatrix.needsUpdate = true
    rightRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={leftRef} args={[geometries.tileJoint, materials.tileJoint, JOINT_COUNT]} />
      <instancedMesh ref={rightRef} args={[geometries.tileJoint, materials.tileJoint, JOINT_COUNT]} />
    </>
  )
}

// Dynamic lights that follow the car
function DynamicLights() {
  const { carPosition, performanceTier } = useGame()
  const groupRef = useRef<THREE.Group>(null)

  // Skip extra lights on low performance
  if (performanceTier === "low") return null

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.position.z = carPosition.z
  })

  return (
    <group ref={groupRef}>
      {/* Warm fluorescent-style lighting */}
      <pointLight position={[0, 5.5, 0]} intensity={8} distance={15} decay={2} color="#f5f0e6" />
      <pointLight position={[0, 5.5, -15]} intensity={6} distance={12} decay={2} color="#f5f0e6" />
      <pointLight position={[0, 5.5, 15]} intensity={6} distance={12} decay={2} color="#f5f0e6" />
    </group>
  )
}

export function CarParkScene() {
  const { performanceTier } = useGame()

  // Cleanup geometries and materials on unmount
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((g) => g.dispose())
      Object.values(materials).forEach((m) => m.dispose())
    }
  }, [])

  return (
    <>
      {/* Ambient and main lighting */}
      <ambientLight intensity={0.25} color="#f0e6d2" />
      <hemisphereLight args={["#e0d0b0", "#202020", 0.5]} />

      {/* Endless environment segments */}
      <EndlessFloor />
      <EndlessWalls />
      <EndlessCeiling />

      {/* Instanced elements */}
      <InstancedCeilingLights />
      <InstancedCenterLines />
      <InstancedEdgeLines />
      <InstancedEmergencyLights />
      {performanceTier !== "low" && <InstancedTileJoints />}

      {/* Dynamic lights that follow car */}
      <DynamicLights />

      {/* Fog for depth - adjusted for tunnel feel */}
      <fog attach="fog" args={["#0a0a0a", 20, 100]} />
    </>
  )
}
