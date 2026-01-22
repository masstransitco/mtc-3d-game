// Sound file paths
export const SOUNDS = {
  // UI sounds
  ui: {
    click: '/sounds/ui/click_001.ogg',
    select: '/sounds/ui/select_001.ogg',
    confirmation: '/sounds/ui/confirmation_001.ogg',
    error: '/sounds/ui/error_001.ogg',
  },

  // Countdown sounds
  countdown: {
    tick: '/sounds/countdown/tick_001.ogg',
    go: '/sounds/countdown/go.ogg',
  },

  // Gate/checkpoint sounds
  gates: {
    pass: '/sounds/ui/gate_pass.mp3',
    miss: '/sounds/ui/miss.ogg',
    combo: '/sounds/ui/combo.ogg',
  },

  // Collision sounds (array for random selection)
  collision: [
    '/sounds/collision/impactMetal_heavy_000.ogg',
    '/sounds/collision/impactMetal_heavy_001.ogg',
    '/sounds/collision/impactMetal_medium_000.ogg',
    '/sounds/collision/impactMetal_medium_001.ogg',
  ],

  // Engine sounds for different speed tiers
  engine: {
    idle: '/sounds/engine/engine_idle.ogg',
    low: '/sounds/engine/engine_low.ogg',
    medium: '/sounds/engine/engine_medium.ogg',
    high: '/sounds/engine/engine_high.ogg',
    max: '/sounds/engine/engine_max.ogg',
  },

  // Race completion
  completion: '/sounds/ui/completion.ogg',
} as const

// Engine speed tiers for crossfade (km/h)
// Each tier has a min/max speed range where it's active
// Overlapping ranges create smooth crossfades
export const ENGINE_TIERS = {
  idle: { min: 0, max: 25, fadeStart: 0, fadeEnd: 20 },
  low: { min: 10, max: 55, fadeStart: 15, fadeEnd: 50 },
  medium: { min: 45, max: 95, fadeStart: 50, fadeEnd: 90 },
  high: { min: 85, max: 135, fadeStart: 90, fadeEnd: 130 },
  max: { min: 125, max: 200, fadeStart: 130, fadeEnd: 160 },
} as const

export type EngineTier = keyof typeof ENGINE_TIERS
export type SoundCategory = keyof typeof SOUNDS

// Volume levels
export const DEFAULT_VOLUMES: {
  master: number
  engine: number
  ui: number
  effects: number
} = {
  master: 0.7,
  engine: 0.5,
  ui: 0.8,
  effects: 0.7,
}

// Audio settings
export const AUDIO_CONFIG = {
  crossfadeDuration: 0.05, // 50ms crossfade to prevent clicks
  poolSize: 4, // Number of audio sources to pool for one-shot sounds
} as const
