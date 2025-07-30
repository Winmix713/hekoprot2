"use client"

import { Sun, Moon } from "lucide-react"

interface ThemeToggleProps {
  isDark: boolean
  setIsDark: (isDark: boolean) => void
}

export function ThemeToggle({ isDark, setIsDark }: ThemeToggleProps) {
  return (
    <button
      onClick={() => {
        setIsDark(!isDark)
        localStorage.setItem("theme", !isDark ? "dark" : "light")
      }}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-all hover:bg-[#7C3AED]/20 focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
      aria-label="Téma váltása"
    >
      {isDark ? <Sun className="size-4 text-[#A1A1A1]" /> : <Moon className="size-4 text-[#6B7280]" />}
    </button>
  )
}
