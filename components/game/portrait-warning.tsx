"use client"

import { useState, useEffect } from "react"
import { RotateCw } from "lucide-react"

export function PortraitWarning() {
  const [isPortrait, setIsPortrait] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window && window.innerWidth < 1024)
    }

    // Check orientation
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }

    // Try to lock screen orientation to landscape
    const lockOrientation = async () => {
      if (screen.orientation && 'lock' in screen.orientation) {
        try {
          await screen.orientation.lock('landscape')
        } catch {
          // Orientation lock not supported or denied
        }
      }
    }

    checkMobile()
    checkOrientation()
    lockOrientation()

    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  // Only show on mobile devices in portrait mode
  if (!isMobile || !isPortrait) return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8">
      <RotateCw className="w-16 h-16 text-cyan-400 mb-6 animate-pulse" />
      <h2 className="text-white text-2xl font-bold mb-4 text-center">
        Rotate Your Device
      </h2>
      <p className="text-white/60 text-center max-w-xs">
        This game is best played in landscape mode. Please rotate your device to continue.
      </p>
    </div>
  )
}
