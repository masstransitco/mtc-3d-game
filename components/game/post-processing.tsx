"use client"

import { useGame } from "@/lib/game/game-context"
import { EffectComposer, Bloom, ToneMapping, Vignette } from "@react-three/postprocessing"
import { ToneMappingMode, BlendFunction } from "postprocessing"

export function PostProcessingStack() {
  const { performanceTier, reducedMotion } = useGame()

  // No post-processing on low tier - critical for mobile performance
  if (performanceTier === "low") {
    return null
  }

  // Minimal effects for medium tier
  if (performanceTier === "medium") {
    return (
      <EffectComposer multisampling={0} frameBufferType={undefined}>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    )
  }

  // Full effects only for high tier desktop
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.6}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.5} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  )
}
