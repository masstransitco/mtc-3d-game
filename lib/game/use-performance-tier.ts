"use client"

import { useState, useEffect } from "react"
import type { PerformanceTier } from "./game-context"

export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>("medium")

  useEffect(() => {
    // Check device capabilities
    const checkPerformance = () => {
      // Check for mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      // Check for low memory (if available)
      // @ts-expect-error - deviceMemory is not in types
      const memory = navigator.deviceMemory

      // Check GPU capabilities via WebGL
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl")

      if (!gl) {
        setTier("low")
        return
      }

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ""

      // Detect low-end GPUs
      const isLowEndGPU = /Intel|Mali-4|Mali-T6|Adreno 3|Adreno 4|PowerVR/i.test(renderer)
      const isHighEndGPU = /NVIDIA|Radeon|Apple M|Adreno 6|Mali-G7/i.test(renderer)

      if (isMobile) {
        if (isHighEndGPU) {
          setTier("medium")
        } else {
          setTier("low")
        }
      } else {
        if (isLowEndGPU) {
          setTier("medium")
        } else if (isHighEndGPU) {
          setTier("high")
        } else {
          setTier("medium")
        }
      }

      // Override based on memory if available
      if (memory && memory < 4) {
        setTier("low")
      }
    }

    checkPerformance()
  }, [])

  return tier
}
