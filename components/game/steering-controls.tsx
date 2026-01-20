"use client"

import { useRef, useCallback, useEffect } from "react"
import { useGame } from "@/lib/game/game-context"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SteeringButtonProps {
  direction: "left" | "right"
  onSteerChange: (value: number) => void
}

function SteeringButton({ direction, onSteerChange }: SteeringButtonProps) {
  const isPressedRef = useRef(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const steerValue = direction === "left" ? -1 : 1
  const Icon = direction === "left" ? ChevronLeft : ChevronRight

  const handleStart = useCallback(() => {
    isPressedRef.current = true
    onSteerChange(steerValue)
  }, [onSteerChange, steerValue])

  const handleEnd = useCallback(() => {
    isPressedRef.current = false
    onSteerChange(0)
  }, [onSteerChange])

  // Native touch event listeners with { passive: false }
  useEffect(() => {
    const element = buttonRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleStart()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      handleEnd()
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handleStart, handleEnd])

  return (
    <button
      ref={buttonRef}
      className={`
        w-20 h-20 rounded-2xl
        bg-white/10 active:bg-cyan-500/30
        border border-white/20 active:border-cyan-400/50
        flex items-center justify-center
        touch-none select-none
        transition-colors duration-75
      `}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <Icon className="w-10 h-10 text-white/70" strokeWidth={3} />
    </button>
  )
}

export function SteeringControls() {
  const { setMobileSteerInput } = useGame()
  const activeDirectionRef = useRef<"left" | "right" | null>(null)

  const handleSteerChange = useCallback((direction: "left" | "right", value: number) => {
    if (value !== 0) {
      activeDirectionRef.current = direction
      setMobileSteerInput(value)
    } else if (activeDirectionRef.current === direction) {
      // Only reset if this direction was the active one
      activeDirectionRef.current = null
      setMobileSteerInput(0)
    }
  }, [setMobileSteerInput])

  return (
    <div className="flex flex-col gap-3 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5">
      <SteeringButton
        direction="left"
        onSteerChange={(v) => handleSteerChange("left", v)}
      />
      <SteeringButton
        direction="right"
        onSteerChange={(v) => handleSteerChange("right", v)}
      />
    </div>
  )
}
