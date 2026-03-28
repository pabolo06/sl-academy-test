import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

// Disable static prerendering for pages that use dynamic data and auth context
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "SL Academy Platform",
  description: "B2B Hospital Education and Management Platform",
  manifest: "/manifest.json",
}

// themeColor and viewport must be exported separately in Next.js 14+
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
