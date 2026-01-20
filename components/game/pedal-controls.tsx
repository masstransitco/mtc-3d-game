"use client"

import { useRef, useCallback, useEffect, useState } from "react"
import { useGame } from "@/lib/game/game-context"

interface PedalSliderProps {
  type: "throttle" | "brake"
  position: number
  onPositionChange: (position: number) => void
}

function PedalSlider({ type, position, onPositionChange }: PedalSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)
  const sliderHeightRef = useRef(0)

  const isThrottle = type === "throttle"
  const label = isThrottle ? "GO" : "STOP"
  const accentColor = isThrottle ? "bg-emerald-400" : "bg-red-400"
  const glowColor = isThrottle ? "shadow-emerald-400/50" : "shadow-red-400/50"

  const handleStart = useCallback((clientY: number) => {
    if (!sliderRef.current) return
    isDraggingRef.current = true
    const rect = sliderRef.current.getBoundingClientRect()
    sliderHeightRef.current = rect.height
    startYRef.current = rect.bottom
  }, [])

  const handleMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return
    // Invert Y: dragging up increases value
    const relativeY = startYRef.current - clientY
    const newPosition = Math.max(0, Math.min(1, relativeY / sliderHeightRef.current))
    onPositionChange(newPosition)
  }, [onPositionChange])

  const handleEnd = useCallback(() => {
    isDraggingRef.current = false
    onPositionChange(0)
  }, [onPositionChange])

  // Mouse event handlers for desktop testing
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientY)
    handleMove(e.clientY)
  }, [handleStart, handleMove])

  // Native touch event listeners with { passive: false }
  useEffect(() => {
    const element = sliderRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleStart(e.touches[0].clientY)
      handleMove(e.touches[0].clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleMove(e.touches[0].clientY)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleEnd()
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handleStart, handleMove, handleEnd])

  // Mouse event listeners for desktop testing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY)
    }

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        handleEnd()
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMove, handleEnd])

  const percentage = Math.round(position * 100)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Percentage indicator */}
      <span className={`text-xs font-medium tabular-nums transition-opacity duration-150 ${position > 0 ? 'text-white' : 'text-white/30'}`}>
        {percentage}%
      </span>

      {/* Vertical slider track */}
      <div
        ref={sliderRef}
        className="relative w-14 h-32 rounded-full bg-white/5 border border-white/10 cursor-pointer touch-none overflow-hidden"
        onMouseDown={onMouseDown}
      >
        {/* Fill bar - grows from bottom */}
        <div
          className={`absolute bottom-0 left-0 right-0 ${accentColor} transition-all duration-75 rounded-full`}
          style={{ height: `${position * 100}%` }}
        />

        {/* Thumb indicator line */}
        <div
          className={`absolute left-1 right-1 h-1 rounded-full bg-white transition-all duration-75 ${position > 0 ? `shadow-lg ${glowColor}` : ''}`}
          style={{ bottom: `calc(${position * 100}% - 2px)`, opacity: position > 0 ? 1 : 0.3 }}
        />

        {/* Subtle tick marks */}
        <div className="absolute inset-0 flex flex-col justify-between py-3 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-full flex justify-center">
              <div className="w-4 h-px bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Label */}
      <span className={`text-[10px] font-medium tracking-widest ${isThrottle ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
        {label}
      </span>
    </div>
  )
}

export function PedalControls() {
  const { setThrottlePosition, setBrakePosition } = useGame()

  const [localThrottle, setLocalThrottle] = useState(0)
  const [localBrake, setLocalBrake] = useState(0)

  const throttleAnimRef = useRef<number | null>(null)
  const brakeAnimRef = useRef<number | null>(null)

  const handleThrottleChange = useCallback((pos: number) => {
    if (throttleAnimRef.current) {
      cancelAnimationFrame(throttleAnimRef.current)
      throttleAnimRef.current = null
    }

    if (pos === 0 && localThrottle > 0) {
      const startValue = localThrottle
      const startTime = performance.now()
      const duration = 150

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        const newValue = startValue * (1 - eased)

        setLocalThrottle(newValue)
        setThrottlePosition(newValue)

        if (progress < 1) {
          throttleAnimRef.current = requestAnimationFrame(animate)
        } else {
          setLocalThrottle(0)
          setThrottlePosition(0)
        }
      }

      throttleAnimRef.current = requestAnimationFrame(animate)
    } else {
      setLocalThrottle(pos)
      setThrottlePosition(pos)
    }
  }, [localThrottle, setThrottlePosition])

  const handleBrakeChange = useCallback((pos: number) => {
    if (brakeAnimRef.current) {
      cancelAnimationFrame(brakeAnimRef.current)
      brakeAnimRef.current = null
    }

    if (pos === 0 && localBrake > 0) {
      const startValue = localBrake
      const startTime = performance.now()
      const duration = 150

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        const newValue = startValue * (1 - eased)

        setLocalBrake(newValue)
        setBrakePosition(newValue)

        if (progress < 1) {
          brakeAnimRef.current = requestAnimationFrame(animate)
        } else {
          setLocalBrake(0)
          setBrakePosition(0)
        }
      }

      brakeAnimRef.current = requestAnimationFrame(animate)
    } else {
      setLocalBrake(pos)
      setBrakePosition(pos)
    }
  }, [localBrake, setBrakePosition])

  useEffect(() => {
    return () => {
      if (throttleAnimRef.current) cancelAnimationFrame(throttleAnimRef.current)
      if (brakeAnimRef.current) cancelAnimationFrame(brakeAnimRef.current)
    }
  }, [])

  return (
    <div className="flex gap-4 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5">
      <PedalSlider
        type="throttle"
        position={localThrottle}
        onPositionChange={handleThrottleChange}
      />
      <PedalSlider
        type="brake"
        position={localBrake}
        onPositionChange={handleBrakeChange}
      />
    </div>
  )
}
