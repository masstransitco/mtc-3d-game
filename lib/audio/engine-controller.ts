import { SOUNDS, ENGINE_TIERS, EngineTier, AUDIO_CONFIG, DEFAULT_VOLUMES } from './constants'
import { soundManager } from './sound-manager'

type EngineSource = {
  source: AudioBufferSourceNode
  gain: GainNode
  tier: EngineTier
}

export class EngineController {
  private sources: Map<EngineTier, EngineSource> = new Map()
  private isRunning = false
  private currentSpeed = 0
  private engineVolume = DEFAULT_VOLUMES.engine

  // Initialize all engine sound sources
  async start(): Promise<void> {
    if (this.isRunning) return

    const ctx = soundManager.getContext()
    if (!ctx) {
      console.warn('Audio context not available for engine sounds')
      return
    }

    // Create looping sources for each tier
    const tiers: EngineTier[] = ['idle', 'low', 'medium', 'high', 'max']

    for (const tier of tiers) {
      const path = SOUNDS.engine[tier]
      const result = soundManager.createLoopingSource(path, 0)

      if (result) {
        this.sources.set(tier, {
          source: result.source,
          gain: result.gain,
          tier,
        })
      }
    }

    this.isRunning = true
    // Start with idle sound at full volume
    this.updateSpeed(0)
  }

  // Update engine sounds based on current speed (in m/s, will convert to km/h)
  updateSpeed(speedMs: number): void {
    if (!this.isRunning) return

    const ctx = soundManager.getContext()
    if (!ctx) return

    // Convert m/s to km/h
    const speedKmh = speedMs * 3.6
    this.currentSpeed = speedKmh

    const currentTime = ctx.currentTime
    const crossfadeDuration = AUDIO_CONFIG.crossfadeDuration

    // Calculate gain for each tier based on speed
    for (const [tier, engineSource] of this.sources) {
      const tierConfig = ENGINE_TIERS[tier]
      const targetGain = this.calculateTierGain(speedKmh, tierConfig) * this.engineVolume

      // Use exponentialRampToValueAtTime for smooth crossfades
      // Clamp to minimum value to avoid exponential issues with 0
      const safeGain = Math.max(0.001, targetGain)

      engineSource.gain.gain.cancelScheduledValues(currentTime)
      engineSource.gain.gain.setValueAtTime(
        Math.max(0.001, engineSource.gain.gain.value),
        currentTime
      )
      engineSource.gain.gain.exponentialRampToValueAtTime(
        safeGain,
        currentTime + crossfadeDuration
      )
    }
  }

  // Calculate the gain for a specific tier based on current speed
  private calculateTierGain(
    speed: number,
    tierConfig: typeof ENGINE_TIERS[EngineTier]
  ): number {
    const { min, max, fadeStart, fadeEnd } = tierConfig

    // Outside the tier's active range
    if (speed < min || speed > max) {
      return 0
    }

    // Within the full volume zone (between fadeStart and fadeEnd for this tier)
    if (speed >= fadeStart && speed <= fadeEnd) {
      // Calculate where we are in the tier's main range
      const midpoint = (fadeStart + fadeEnd) / 2

      if (speed <= midpoint) {
        // Fading in from min to midpoint
        const fadeInStart = min
        const fadeInEnd = fadeStart
        if (speed <= fadeInEnd) {
          return this.smoothstep(speed, fadeInStart, fadeInEnd)
        }
        return 1
      } else {
        // In the stable zone or fading out
        const fadeOutStart = fadeEnd
        const fadeOutEnd = max
        if (speed >= fadeOutStart) {
          return 1 - this.smoothstep(speed, fadeOutStart, fadeOutEnd)
        }
        return 1
      }
    }

    // In fade-in zone (between min and fadeStart)
    if (speed >= min && speed < fadeStart) {
      return this.smoothstep(speed, min, fadeStart)
    }

    // In fade-out zone (between fadeEnd and max)
    if (speed > fadeEnd && speed <= max) {
      return 1 - this.smoothstep(speed, fadeEnd, max)
    }

    return 0
  }

  // Smooth interpolation using smoothstep
  private smoothstep(value: number, min: number, max: number): number {
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
    return t * t * (3 - 2 * t)
  }

  // Set the overall engine volume
  setVolume(volume: number): void {
    this.engineVolume = Math.max(0, Math.min(1, volume))
    // Update all gains with new volume
    if (this.isRunning) {
      this.updateSpeed(this.currentSpeed / 3.6) // Convert back to m/s
    }
  }

  // Stop all engine sounds
  stop(): void {
    if (!this.isRunning) return

    const ctx = soundManager.getContext()
    const currentTime = ctx?.currentTime ?? 0

    // Fade out all sources
    for (const [, engineSource] of this.sources) {
      engineSource.gain.gain.cancelScheduledValues(currentTime)
      engineSource.gain.gain.setValueAtTime(
        engineSource.gain.gain.value,
        currentTime
      )
      engineSource.gain.gain.exponentialRampToValueAtTime(
        0.001,
        currentTime + 0.1
      )

      // Stop the source after fade out
      setTimeout(() => {
        try {
          engineSource.source.stop()
        } catch {
          // Source may already be stopped
        }
      }, 150)
    }

    this.sources.clear()
    this.isRunning = false
  }

  // Check if engine is running
  getIsRunning(): boolean {
    return this.isRunning
  }
}
