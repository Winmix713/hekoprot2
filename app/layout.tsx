import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import PremiumSidebar from "@/components/layout/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Football Prediction Admin",
  description: "AI-powered football prediction management system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <PremiumSidebar />
          <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
