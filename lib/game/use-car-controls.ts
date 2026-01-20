"use client"

import { useRef, useEffect, useCallback } from "react"

type ControlState = {
  steerInput: number // -1 to 1
  isBraking: boolean
  setBraking: (value: boolean) => void
}

// Use refs for smooth, jitter-free control updates
export function useCarControls(): ControlState {
  // Use refs instead of state to avoid re-renders on every input change
  const steerRef = useRef(0)
  const brakingRef = useRef(false)
  const controlModeRef = useRef<"keyboard" | "touch" | "tilt">("keyboard")
  const keysPressed = useRef<Set<string>>(new Set())
  const touchStartX = useRef<number | null>(null)

  // Function to set braking from external sources (e.g., mobile brake button)
  const setBraking = useCallback((value: boolean) => {
    brakingRef.current = value
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysPressed.current.add(key)

      if (e.key === " ") {
        brakingRef.current = true
      }

      // Update steering immediately on key press
      updateKeyboardSteering()
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysPressed.current.delete(key)

      if (e.key === " ") {
        brakingRef.current = false
      }

      // Update steering immediately on key release
      updateKeyboardSteering()
    }

    const updateKeyboardSteering = () => {
      if (controlModeRef.current !== "keyboard") return

      let newSteer = 0
      if (keysPressed.current.has("a") || keysPressed.current.has("arrowleft")) {
        newSteer -= 1
      }
      if (keysPressed.current.has("d") || keysPressed.current.has("arrowright")) {
        newSteer += 1
      }
      steerRef.current = newSteer
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Touch controls - swipe based
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      controlModeRef.current = "touch"
      touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null) return

      const currentX = e.touches[0].clientX
      const screenWidth = window.innerWidth
      // Use screen-relative delta for consistent sensitivity across devices
      const delta = (currentX - touchStartX.current) / (screenWidth * 0.15)
      steerRef.current = Math.max(-1, Math.min(1, delta))
    }

    const handleTouchEnd = () => {
      touchStartX.current = null
      steerRef.current = 0
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

  // Device orientation (tilt) controls
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null) return

      controlModeRef.current = "tilt"
      // gamma is left/right tilt, -90 to 90
      // Use a dead zone for stability
      const deadZone = 5
      let tilt = e.gamma
      if (Math.abs(tilt) < deadZone) {
        tilt = 0
      } else {
        tilt = tilt - Math.sign(tilt) * deadZone
      }
      const tiltNormalized = tilt / 35 // Adjusted sensitivity
      steerRef.current = Math.max(-1, Math.min(1, tiltNormalized))
    }

    // Request permission on iOS
    const requestPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        // @ts-expect-error - iOS specific
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        try {
          // @ts-expect-error - iOS specific
          const permission = await DeviceOrientationEvent.requestPermission()
          if (permission === "granted") {
            window.addEventListener("deviceorientation", handleOrientation)
          }
        } catch {
          // Permission denied or error
        }
      } else {
        // Non-iOS or no permission needed
        window.addEventListener("deviceorientation", handleOrientation)
      }
    }

    // Only use tilt on mobile devices
    if ("ontouchstart" in window) {
      requestPermission()
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation)
    }
  }, [])

  // Return a getter object that reads from refs
  // This avoids re-renders while still providing current values
  return {
    get steerInput() {
      return steerRef.current
    },
    get isBraking() {
      return brakingRef.current
    },
    setBraking,
  }
}
