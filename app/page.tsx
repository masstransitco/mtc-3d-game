import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* MTC Logo */}
        <div className="mb-8">
          <Image
            src="/logos/mtc-logo-2025.svg"
            alt="MTC Logo"
            width={160}
            height={54}
            className="mx-auto"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">NEON SLALOM</h1>
        <p className="text-cyan-400 font-mono text-xl mb-4">MG4 SPRINT</p>

        {/* Tagline */}
        <p className="text-white/60 text-lg mb-8">Race your MG4 through the neon-lit carparks of Hong Kong</p>

        {/* Decorative element with MG4 silhouette hint */}
        <div className="relative w-full h-32 mb-8 overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-white to-pink-400" />
          <div className="absolute top-4 left-4 w-2 h-16 bg-cyan-400/50" />
          <div className="absolute top-4 right-4 w-2 h-16 bg-pink-400/50" />
          {/* Bolt icon representing EV */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Image
              src="/logos/bolt.svg"
              alt="EV"
              width={32}
              height={32}
              className="opacity-50"
            />
          </div>
        </div>

        {/* CTA Button */}
        <Link href="/game">
          <Button size="lg" className="w-full h-14 text-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-black">
            ENTER GAME
          </Button>
        </Link>

        {/* History link */}
        <Link
          href="/history"
          className="block mt-4 text-white/50 hover:text-white text-sm underline underline-offset-4"
        >
          View Run History
        </Link>
      </div>
    </main>
  )
}
