type ObstacleType = "cone" | "barrier" | "bollard" | "gate"

const patterns: Record<ObstacleType, number[]> = {
  cone: [30],
  bollard: [50],
  barrier: [80],
  gate: [40],
}

export function triggerCollisionHaptic(type: ObstacleType) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return
  navigator.vibrate(patterns[type])
}
