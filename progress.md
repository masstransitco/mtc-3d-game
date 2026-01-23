# MTC 3D Game - Development Progress

## Project Overview

A 3D arcade racing game set in Hong Kong's Lion Rock Tunnel, featuring realistic MG4 EV physics, procedural track generation, and performance-optimized rendering for both desktop and mobile.

**Tech Stack**: Next.js 16 + React 19 + React Three Fiber + Three.js + TailwindCSS

---

## Current Implementation Status

### Fully Implemented
- 3D rendering with R3F/Three.js
- Realistic car physics (MG4 EV model)
- Procedural track generation (seeded, deterministic)
- Gate passing/collision detection
- Scoring and combo system
- Performance tiering (low/medium/high)
- Mobile touch + tilt controls
- Keyboard controls
- Countdown & results screens
- Run history tracking (localStorage)
- Post-processing effects (tiered)
- Instanced rendering optimizations
- Camera follow system
- Pedal control UI (mobile)
- Audio/sound effects (Web Audio API)

### Not Yet Implemented
- Particle effects (sparks, tire marks)
- Leaderboards/cloud sync
- Replay system
- Advanced graphics options
- VR support

---

## Architecture

### Core Framework
```
/components/game/
  ├── car.tsx              # MG4 model + physics + lights
  ├── game-canvas.tsx      # R3F canvas setup + performance monitor
  ├── game-loop.tsx        # Timing & game end detection
  ├── camera-controller.tsx # Follow camera
  ├── track-system.tsx     # Gates & obstacles rendering
  ├── scenes/carpark-scene.tsx # Tunnel environment
  ├── hud.tsx              # In-game UI (score, speed, time, combo)
  ├── pedal-controls.tsx   # Mobile throttle/brake sliders
  ├── post-processing.tsx  # Bloom, tone mapping, vignette
  ├── results-screen.tsx   # End screen with stats
  ├── countdown-overlay.tsx # 3-2-1-GO!
  └── start-screen.tsx     # Menu & settings

/lib/game/
  ├── game-context.tsx     # Central state management
  ├── track-generator.ts   # Procedural gate/obstacle placement
  ├── use-car-controls.ts  # Input handling (keyboard, touch, tilt)
  └── use-performance-tier.ts # Device detection & quality

/app/
  ├── page.tsx             # Home/menu
  ├── game/page.tsx        # Game page
  └── history/page.tsx     # Run history
```

### Audio System
```
/lib/audio/
  ├── constants.ts         # Sound paths, engine tier config, volumes
  ├── sound-manager.ts     # Web Audio API singleton (buffers, playback)
  ├── engine-controller.ts # 5-tier engine crossfade (speed-based)
  ├── audio-context.tsx    # React Context provider
  ├── use-audio.ts         # Hooks (useAudio, useEngineSound)
  └── index.ts             # Barrel exports

/public/sounds/
  ├── ui/                  # click, gate_pass, miss, completion, combo
  ├── countdown/           # tick, go
  ├── engine/              # idle, low, medium, high, max (loops)
  ├── collision/           # impactMetal variants (random selection)
  └── ambience/            # wind_loop (unused currently)
```

### State Management
- **GameContext**: Single React Context for all game state
- **AudioContext**: Separate React Context for audio (wraps GameProvider)
- **State Machine**: `ready` → `countdown` → `running` → `finished`
- **Refs for Physics**: Position/velocity use refs to avoid re-renders during game loop
- **Event Logging**: Complete event history for verification

---

## Car Physics (MG4 EV)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Max Speed | 44.44 units/sec | 160 km/h |
| Acceleration | 5.5 units/sec² | Reduced at high speed |
| Brake Decel | 12 units/sec² | ~0.8g realistic braking |
| Air Drag | 0.0003 | Quadratic resistance |
| Engine Braking | 2.0 units/sec² | When coasting |
| Steer Speed | 12 units/sec | Lateral movement |
| Boundaries | ±10 units | Tunnel width |

**Features**:
- Proportional throttle/brake (no auto-accelerate)
- Power curve: acceleration decreases with speed²
- Car body tilts on steering (0.08 rad max)
- Smooth lerp transitions

---

## Controls

### Desktop
| Input | Action |
|-------|--------|
| A/D or ←/→ | Steer left/right |
| Space | Full brake |

### Mobile
| Input | Action |
|-------|--------|
| Swipe left/right | Steering |
| Tilt device | Steering (gyroscope) |
| Throttle slider | Proportional acceleration |
| Brake slider | Proportional braking |

**Touch Implementation**:
- Native event listeners with `{ passive: false }` for preventDefault
- `stopPropagation()` on pedal controls to prevent steering interference
- Spring-back animation on slider release (200ms ease-out)
- iOS permission request for gyroscope

---

## Audio System

### Integration Points

| Event | Component | Sound |
|-------|-----------|-------|
| START RACE click | start-screen.tsx | click_001.ogg + audio unlock |
| Countdown 3,2,1 | countdown-overlay.tsx | tick_001.ogg |
| GO! | countdown-overlay.tsx | go.ogg |
| Engine running | car.tsx | 5-tier crossfade based on speed |
| Gate pass | game-context.tsx | gate_pass.mp3 |
| Gate miss | game-context.tsx | miss.ogg |
| Collision | game-context.tsx | Random impactMetal_*.ogg |
| Race finish | results-screen.tsx | completion.ogg |

### Engine Sound Crossfade

| Speed (km/h) | Sound | Behavior |
|--------------|-------|----------|
| 0-25 | engine_idle.ogg | Full at 0, fade out by 25 |
| 10-55 | engine_low.ogg | Crossfade zone |
| 45-95 | engine_medium.ogg | Crossfade zone |
| 85-135 | engine_high.ogg | Crossfade zone |
| 125+ | engine_max.ogg | Full above 160 |

### Technical Details
- **Web Audio API**: AudioContext with GainNode routing
- **iOS unlock**: Silent buffer + context resume on first user tap
- **Crossfade**: `exponentialRampToValueAtTime` (50ms) for click-free transitions
- **Sound Manager**: Singleton pattern, preloads all buffers at init
- **Settings**: Mute toggle + volume slider in start screen settings panel

---

## Track System

### Lion Rock Tunnel
- **Length**: 1430 meters (real-world accurate)
- **Width**: 24 meters
- **Segments**: 60m streaming chunks

### Gates
- ~32 gates, 25m base spacing (randomized ±5m)
- Progressive difficulty: width narrows 6m → 4m
- Colors: cyan (pending) → green (passed) → red (missed)
- Point lights on pending gates

### Obstacles
- **Types**: Traffic cones, barriers, bollards
- **Placement**: 1-3 per gate segment, mostly on sides
- **Collision**: AABB detection

### Scoring
| Event | Points |
|-------|--------|
| Gate Pass | +10 × combo |
| Gate Miss | -20, combo reset |
| Collision | -15, combo reset |

---

## Rendering

### Performance Tiers

| Tier | Post-Processing | Shadows | Dynamic Lights | Tile Joints |
|------|-----------------|---------|----------------|-------------|
| Low | None | No | No | No |
| Medium | Light bloom | Basic | Limited | Yes |
| High | Full bloom + vignette | Yes | All | Yes |

### Optimizations
- **Instanced rendering**: Ceiling lights, road markings, tile joints
- **Segment streaming**: Only adjacent tunnel segments rendered
- **Visible range culling**: 80m ahead, 15m behind
- **Shared geometries/materials**: Reused across instances
- **Adaptive DPR**: 0.5-2.0 based on frame rate
- **Mobile DPR cap**: Max 1.5

### Lighting
- Ambient + hemisphere light (warm tunnel atmosphere)
- Dynamic lights following car (3 point lights)
- Car headlights (2 white) + taillights (2 red, hidden origin)
- Cyan underglow
- Instanced ceiling fluorescents
- Green emergency exit lights

---

## UI/HUD Layout

### In-Game (Running)
```
┌─────────────────────────────────────────────────────┐
│ [Score] │ [Speed km/h] │ [Time MM:SS] │ [Combo x1] │  ← Unified top bar
├─────────────────────────────────────────────────────┤
│ [────────── Lion Rock Tunnel Progress ──────────]   │  ← Progress bar
├─────────────────────────────────────────────────────┤
│ [●gates] [●hits]                        [✕ Stop]   │  ← Stats & stop
│                                                     │
│                                                     │
│                                    [Pedal Controls] │  ← Mobile only
└─────────────────────────────────────────────────────┘
```

### Screens
- **Start Screen**: Logo, title, controls reference, settings
- **Countdown**: 3-2-1-GO! with pulse animation
- **Results**: Completion status, stats grid, share button
- **History**: Past 20 runs with details

---

## Data Persistence

### localStorage: `lionRockRuns`
```typescript
interface GameRun {
  timestamp: number
  score: number
  gatesCleared: number
  gatesMissed: number
  collisions: number
  maxCombo: number
  duration: number
  distance: number
  completed: boolean
  seed: number
  interrupted: boolean
  eventLog: GameEvent[]
}
```

### Event Types
- `gate_pass`, `gate_miss`, `collision`
- `combo_change`, `start`, `finish`, `stop`

---

## Recent Changes

### Sound System (Jan 2026)
- Added Web Audio API sound system with React Context integration
- Engine sounds: 5-tier crossfade (idle→low→med→high→max) based on car speed
- Event sounds: gate pass, gate miss, collision (random), completion
- Countdown sounds: tick for 3-2-1, go sound at race start
- iOS/Safari audio unlock on first START RACE click
- Settings UI: mute toggle and volume slider in start screen

### HUD Improvements
- Unified top bar with Score, Speed, Time, Combo (equally spaced)
- `whitespace-nowrap` on speed to prevent km/h wrapping
- Gates/hits stats and Stop button moved below progress bar (top-36)
- Top corners of HUD bar are right-angle (rounded-b-lg only)

### Pedal Controls Fix
- Replaced React synthetic touch events with native `addEventListener`
- Using `{ passive: false }` to allow `preventDefault()`
- Added `stopPropagation()` to prevent touch events triggering steering

### Car Lighting
- Tail light origins moved inside car body (z: 2.5 → 1.8, y: 0.7 → 0.4)
- Increased intensity (5 → 8) and distance (8 → 10) to compensate
- Red glow still reflects on ground, but origin dots not visible

---

## Known Issues / TODO

### Bugs
- None currently tracked

### Enhancements
- [x] Add engine/tire sound effects
- [x] Add collision sound effects
- [ ] Particle effects for gate passes
- [ ] Tire marks on hard braking
- [ ] Cloud leaderboards
- [ ] Replay system using event log
- [ ] Multiple tunnel/track options
- [ ] Car customization

### Performance
- [ ] Further mobile optimization if needed
- [ ] Texture compression (KTX2)
- [ ] Model LOD system

---

## Build & Run

```bash
npm install
npm run dev     # Development server
npm run build   # Production build
npm run start   # Production server
```

**Requirements**: Node.js 18+, modern browser with WebGL2

---

## File References

| Feature | Primary File |
|---------|--------------|
| Car physics | `components/game/car.tsx` |
| Game state | `lib/game/game-context.tsx` |
| Track generation | `lib/game/track-generator.ts` |
| Controls | `lib/game/use-car-controls.ts` |
| Tunnel rendering | `components/game/scenes/carpark-scene.tsx` |
| Gates/obstacles | `components/game/track-system.tsx` |
| HUD | `components/game/hud.tsx` |
| Pedal UI | `components/game/pedal-controls.tsx` |
| Post-processing | `components/game/post-processing.tsx` |
| Performance tier | `lib/game/use-performance-tier.ts` |
| Audio manager | `lib/audio/sound-manager.ts` |
| Engine sounds | `lib/audio/engine-controller.ts` |
| Audio React hooks | `lib/audio/audio-context.tsx` |

---

*Last updated: January 2026*
