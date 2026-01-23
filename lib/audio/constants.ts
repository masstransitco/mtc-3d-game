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

  // Race completion
  completion: '/sounds/ui/completion.ogg',
} as const

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
