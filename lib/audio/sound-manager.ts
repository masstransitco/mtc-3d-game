import { SOUNDS, DEFAULT_VOLUMES, AUDIO_CONFIG } from './constants'

type SoundBuffer = {
  buffer: AudioBuffer
  path: string
}

class SoundManager {
  private static instance: SoundManager | null = null
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private buffers: Map<string, AudioBuffer> = new Map()
  private isUnlocked = false
  private isMuted = false
  private volumes = { ...DEFAULT_VOLUMES }

  private constructor() {
    // Singleton - use getInstance()
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  // Initialize the audio context (must be called on user interaction)
  async init(): Promise<boolean> {
    if (this.audioContext) {
      return this.isUnlocked
    }

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

      // Create master gain node
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.volumes.master
      this.masterGain.connect(this.audioContext.destination)

      // Unlock audio on iOS/Safari by playing a silent buffer
      await this.unlock()

      return true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      return false
    }
  }

  // Unlock audio context (required for iOS/Safari)
  private async unlock(): Promise<void> {
    if (!this.audioContext || this.isUnlocked) return

    try {
      // Resume if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Play a silent buffer to unlock on iOS
      const silentBuffer = this.audioContext.createBuffer(1, 1, 22050)
      const source = this.audioContext.createBufferSource()
      source.buffer = silentBuffer
      source.connect(this.audioContext.destination)
      source.start(0)

      this.isUnlocked = true
    } catch (error) {
      console.error('Failed to unlock audio:', error)
    }
  }

  // Ensure audio is ready (call this on user interaction)
  async ensureReady(): Promise<boolean> {
    if (!this.audioContext) {
      return this.init()
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    return this.isUnlocked
  }

  // Load an audio file into a buffer
  async loadSound(path: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(path)) {
      return this.buffers.get(path)!
    }

    if (!this.audioContext) {
      console.warn('Audio context not initialized')
      return null
    }

    try {
      const response = await fetch(path)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      this.buffers.set(path, audioBuffer)
      return audioBuffer
    } catch (error) {
      console.error(`Failed to load sound: ${path}`, error)
      return null
    }
  }

  // Preload all game sounds
  async preloadAll(): Promise<void> {
    const paths: string[] = []

    // Collect all sound paths
    Object.values(SOUNDS.ui).forEach(path => paths.push(path))
    Object.values(SOUNDS.countdown).forEach(path => paths.push(path))
    Object.values(SOUNDS.gates).forEach(path => paths.push(path))
    SOUNDS.collision.forEach(path => paths.push(path))
    Object.values(SOUNDS.engine).forEach(path => paths.push(path))
    paths.push(SOUNDS.completion)

    // Load all sounds in parallel
    await Promise.all(paths.map(path => this.loadSound(path)))
  }

  // Play a one-shot sound
  play(
    path: string,
    options: {
      volume?: number
      loop?: boolean
      playbackRate?: number
    } = {}
  ): AudioBufferSourceNode | null {
    if (!this.audioContext || !this.masterGain || this.isMuted) {
      return null
    }

    const buffer = this.buffers.get(path)
    if (!buffer) {
      console.warn(`Sound not loaded: ${path}`)
      this.loadSound(path) // Try to load it for next time
      return null
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.loop = options.loop ?? false
    source.playbackRate.value = options.playbackRate ?? 1

    const gainNode = this.audioContext.createGain()
    gainNode.gain.value = (options.volume ?? 1) * this.volumes.effects

    source.connect(gainNode)
    gainNode.connect(this.masterGain)

    source.start(0)

    return source
  }

  // Play a random sound from an array
  playRandom(paths: readonly string[], options?: Parameters<typeof this.play>[1]): AudioBufferSourceNode | null {
    const randomIndex = Math.floor(Math.random() * paths.length)
    return this.play(paths[randomIndex], options)
  }

  // Create a looping sound source with its own gain node (for engine sounds)
  createLoopingSource(
    path: string,
    initialGain: number = 0
  ): { source: AudioBufferSourceNode; gain: GainNode } | null {
    if (!this.audioContext || !this.masterGain) {
      return null
    }

    const buffer = this.buffers.get(path)
    if (!buffer) {
      console.warn(`Sound not loaded: ${path}`)
      return null
    }

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const gainNode = this.audioContext.createGain()
    gainNode.gain.value = initialGain

    source.connect(gainNode)
    gainNode.connect(this.masterGain)

    source.start(0)

    return { source, gain: gainNode }
  }

  // Get the audio context for direct manipulation
  getContext(): AudioContext | null {
    return this.audioContext
  }

  // Volume controls
  setMasterVolume(volume: number): void {
    this.volumes.master = Math.max(0, Math.min(1, volume))
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.volumes.master,
        this.audioContext?.currentTime ?? 0,
        AUDIO_CONFIG.crossfadeDuration
      )
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.volumes.master,
        this.audioContext.currentTime,
        AUDIO_CONFIG.crossfadeDuration
      )
    }
  }

  getMuted(): boolean {
    return this.isMuted
  }

  getMasterVolume(): number {
    return this.volumes.master
  }

  // Clean up
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.buffers.clear()
    this.isUnlocked = false
    SoundManager.instance = null
  }
}

export const soundManager = SoundManager.getInstance()
