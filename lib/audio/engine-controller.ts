import { DEFAULT_VOLUMES, AUDIO_CONFIG } from './constants'
import { soundManager } from './sound-manager'

export class EngineController {
  private isRunning = false
  private currentSpeed = 0
  private engineVolume = DEFAULT_VOLUMES.engine

  // Oscillator nodes for EV sound synthesis
  private motorOsc: OscillatorNode | null = null
  private motorGain: GainNode | null = null
  private whineOsc: OscillatorNode | null = null
  private whineGain: GainNode | null = null
  private subOsc: OscillatorNode | null = null
  private subGain: GainNode | null = null

  async start(): Promise<void> {
    if (this.isRunning) return

    const ctx = soundManager.getContext()
    if (!ctx) return

    const dest = soundManager.getMasterGain()
    if (!dest) return

    // Sub bass hum — low frequency motor vibration
    this.subOsc = ctx.createOscillator()
    this.subGain = ctx.createGain()
    this.subOsc.type = 'sine'
    this.subOsc.frequency.value = 40
    this.subGain.gain.value = 0.001
    this.subOsc.connect(this.subGain)
    this.subGain.connect(dest)
    this.subOsc.start()

    // Motor hum — primary EV tone
    this.motorOsc = ctx.createOscillator()
    this.motorGain = ctx.createGain()
    this.motorOsc.type = 'sine'
    this.motorOsc.frequency.value = 80
    this.motorGain.gain.value = 0.001
    this.motorOsc.connect(this.motorGain)
    this.motorGain.connect(dest)
    this.motorOsc.start()

    // High-pitched whine — characteristic EV sound
    this.whineOsc = ctx.createOscillator()
    this.whineGain = ctx.createGain()
    this.whineOsc.type = 'sawtooth'
    this.whineOsc.frequency.value = 200
    this.whineGain.gain.value = 0.001
    this.whineOsc.connect(this.whineGain)
    this.whineGain.connect(dest)
    this.whineOsc.start()

    this.isRunning = true
    this.updateSpeed(0)
  }

  updateSpeed(speedMs: number): void {
    if (!this.isRunning) return

    const ctx = soundManager.getContext()
    if (!ctx) return

    const speedKmh = speedMs * 3.6
    this.currentSpeed = speedKmh
    const t = Math.min(speedKmh / 180, 1) // normalize 0-180 km/h to 0-1

    const now = ctx.currentTime
    const ramp = AUDIO_CONFIG.crossfadeDuration

    // Sub bass: 40-80 Hz, quiet
    if (this.subOsc && this.subGain) {
      this.subOsc.frequency.setTargetAtTime(40 + t * 40, now, ramp)
      const subVol = (0.06 + t * 0.08) * this.engineVolume
      this.subGain.gain.setTargetAtTime(subVol, now, ramp)
    }

    // Motor hum: 80-400 Hz, moderate volume
    if (this.motorOsc && this.motorGain) {
      this.motorOsc.frequency.setTargetAtTime(80 + t * 320, now, ramp)
      const motorVol = (0.04 + t * 0.12) * this.engineVolume
      this.motorGain.gain.setTargetAtTime(motorVol, now, ramp)
    }

    // Whine: 200-2000 Hz, builds with speed
    if (this.whineOsc && this.whineGain) {
      this.whineOsc.frequency.setTargetAtTime(200 + t * 1800, now, ramp)
      const whineVol = (t * t * 0.08) * this.engineVolume
      this.whineGain.gain.setTargetAtTime(whineVol, now, ramp)
    }
  }

  setVolume(volume: number): void {
    this.engineVolume = Math.max(0, Math.min(1, volume))
    if (this.isRunning) {
      this.updateSpeed(this.currentSpeed / 3.6)
    }
  }

  stop(): void {
    if (!this.isRunning) return

    const ctx = soundManager.getContext()
    const now = ctx?.currentTime ?? 0
    const fadeOut = 0.1

    const nodes = [
      { osc: this.subOsc, gain: this.subGain },
      { osc: this.motorOsc, gain: this.motorGain },
      { osc: this.whineOsc, gain: this.whineGain },
    ]

    for (const { osc, gain } of nodes) {
      if (gain && ctx) {
        gain.gain.setTargetAtTime(0.001, now, fadeOut)
      }
      if (osc) {
        setTimeout(() => { try { osc.stop() } catch {} }, 200)
      }
    }

    this.motorOsc = null
    this.motorGain = null
    this.whineOsc = null
    this.whineGain = null
    this.subOsc = null
    this.subGain = null
    this.isRunning = false
  }

  getIsRunning(): boolean {
    return this.isRunning
  }
}
