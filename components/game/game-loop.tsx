"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGame, TRACK_LENGTH } from "@/lib/game/game-context"

export function GameLoop() {
  const { gameState, distanceTraveled, updateElapsedTime, endGame } = useGame()
  const elapsedRef = useRef(0)

  useFrame((_, delta) => {
    if (gameState === "running") {
      elapsedRef.current += delta
      updateElapsedTime(elapsedRef.current)

      // End game when distance is reached (Lion Rock Tunnel completion)
      if (distanceTraveled >= TRACK_LENGTH) {
        endGame()
      }
    } else if (gameState === "countdown") {
      // Reset elapsed time when countdown starts
      elapsedRef.current = 0
    }
  })

  return null
}
