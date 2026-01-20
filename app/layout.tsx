import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MTC Neon Slalom - Hong Kong Racing",
  description:
    "Race your MG4 through neon-lit Hong Kong carparks in this high-speed slalom challenge. Steer through gates, avoid obstacles, and set the highest score.",
  icons: {
    icon: [
      {
        url: "/logos/mtc-logo-2025-square-lightbg.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logos/mtc-logo-2025-square-darkbg.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logos/mtc-logo-2025.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/logos/mtc-logo-2025-square-darkbg.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-black">
      <body className={`font-sans antialiased bg-black`}>{children}</body>
    </html>
  )
}
