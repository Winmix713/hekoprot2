"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { EarningsData } from "../types/sidebar"

interface SidebarEarningsCardProps {
  earnings: EarningsData
  isDarkMode: boolean
  onWithdraw?: () => void
}

export const SidebarEarningsCard = memo(function SidebarEarningsCard({
  earnings,
  isDarkMode,
  onWithdraw,
}: SidebarEarningsCardProps) {
  return (
    <Card
      className={cn(
        "w-full rounded-[32px] overflow-hidden border-0 transition-all duration-300",
        isDarkMode
          ? "shadow-[0px_32px_32px_-12px_rgba(0,0,0,0.4),0px_16px_32px_-13px_rgba(0,0,0,0.6),0px_2px_4px_rgba(0,0,0,0.5),inset_0px_0px_0px_3px_rgba(255,255,255,0.1)] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]"
          : "shadow-[0px_32px_32px_-12px_rgba(0,0,0,0.1),0px_16px_32px_-13px_rgba(39,39,39,0.25),0px_2px_4px_rgba(194,194,194,0.34),inset_0px_0px_0px_3px_rgba(255,255,255,0.4)] bg-gradient-to-br from-[#f7f7f7] to-[#fefefe]",
      )}
    >
      <CardContent className="p-6">
        <div className="space-y-1">
          <div
            className={cn(
              "font-bold text-[10px] leading-4 uppercase tracking-wide transition-colors duration-200",
              isDarkMode ? "text-[#b0b0b0]" : "text-[#1e1e1e]",
            )}
          >
            {earnings.period}
          </div>
          <div
            className={cn(
              "font-semibold text-4xl leading-9 tracking-[-0.08em] transition-colors duration-200",
              isDarkMode ? "text-[#e0e0e0]" : "text-[#1e1e1e]",
            )}
          >
            {earnings.amount}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          onClick={onWithdraw}
          className={cn(
            "w-full h-12 rounded-[48px] border-[1.25px] transition-all duration-200 font-semibold text-sm",
            isDarkMode
              ? "border-[#404040] shadow-[0px_4px_4px_-3px_rgba(0,0,0,0.5),inset_0px_2px_0px_rgba(255,255,255,0.1)] bg-gradient-to-r from-[#4a4a4a] to-[#2a2a2a] text-[#f5f5f5] hover:opacity-90"
              : "border-[#515151] shadow-[0px_4px_4px_-3px_rgba(0,0,0,0.25),inset_0px_2px_0px_rgba(255,255,255,0.19)] bg-gradient-to-r from-[#3a3a3a] to-[#a0a0a0] text-[#f5f5f5] hover:opacity-90",
          )}
          aria-label={`Withdraw ${earnings.amount}`}
        >
          Withdraw
        </Button>
      </CardFooter>
    </Card>
  )
})
