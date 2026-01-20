export type Gate = {
  id: string
  x: number
  z: number
  width: number
}

export type Obstacle = {
  id: string
  type: "cone" | "barrier" | "bollard"
  x: number
  z: number
  rotation?: number
}

export type Track = {
  gates: Gate[]
  obstacles: Obstacle[]
  length: number
}

// Seeded random number generator for deterministic tracks
function createSeededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

export function generateTrack(seed: number): Track {
  const random = createSeededRandom(seed)

  const gates: Gate[] = []
  const obstacles: Obstacle[] = []

  const trackLength = 800 // Total track length
  const gateSpacing = 25 // Base spacing between gates
  const minGateWidth = 4
  const maxGateWidth = 6

  let currentZ = -30 // Start position

  // Generate gates with progressive difficulty
  let gateIndex = 0
  while (currentZ > -trackLength) {
    // Gate width decreases slightly over time (difficulty ramp)
    const progressRatio = Math.abs(currentZ) / trackLength
    const widthRange = maxGateWidth - minGateWidth
    const baseWidth = maxGateWidth - widthRange * progressRatio * 0.5
    const width = baseWidth + (random() - 0.5) * 1

    // Gate position varies laterally
    const maxOffset = 5 - width / 2
    const x = (random() - 0.5) * 2 * maxOffset

    gates.push({
      id: `gate-${gateIndex}`,
      x,
      z: currentZ,
      width: Math.max(minGateWidth, Math.min(maxGateWidth, width)),
    })

    // Add obstacles between gates
    const obstacleCount = Math.floor(random() * 3) + 1
    for (let i = 0; i < obstacleCount; i++) {
      const obstacleZ = currentZ + gateSpacing * 0.3 + random() * gateSpacing * 0.4

      // Avoid placing obstacles directly in the gate path
      let obstacleX: number
      const side = random() > 0.5 ? 1 : -1

      if (random() > 0.3) {
        // Place to the side of likely path
        obstacleX = x + side * (width / 2 + 1 + random() * 3)
      } else {
        // Random placement
        obstacleX = (random() - 0.5) * 14
      }

      // Clamp to track bounds
      obstacleX = Math.max(-7, Math.min(7, obstacleX))

      // Choose obstacle type
      const typeRoll = random()
      let type: "cone" | "barrier" | "bollard"
      if (typeRoll < 0.5) {
        type = "cone"
      } else if (typeRoll < 0.8) {
        type = "bollard"
      } else {
        type = "barrier"
      }

      obstacles.push({
        id: `obstacle-${gateIndex}-${i}`,
        type,
        x: obstacleX,
        z: obstacleZ,
        rotation: type === "barrier" ? random() * 0.3 - 0.15 : undefined,
      })
    }

    // Spacing decreases slightly over time (difficulty ramp)
    const spacingReduction = progressRatio * 5
    currentZ -= gateSpacing - spacingReduction + (random() - 0.5) * 5

    gateIndex++
  }

  return {
    gates,
    obstacles,
    length: trackLength,
  }
}
