"use client"

import { memo } from "react"
import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { UserProfile } from "../types/sidebar"

interface SidebarUserProfileProps {
  user: UserProfile
  isDarkMode: boolean
  onLogout?: () => void
}

export const SidebarUserProfile = memo(function SidebarUserProfile({
  user,
  isDarkMode,
  onLogout,
}: SidebarUserProfileProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-8 py-6 border-t transition-colors duration-200",
        isDarkMode ? "border-[#404040]" : "border-[#f0f0f0]",
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <Avatar className="w-12 h-12">
          <AvatarImage
            src={user.avatar || "/placeholder.svg"}
            alt={`${user.name} profile picture`}
            className="w-full h-full rounded-full object-cover"
          />
          <AvatarFallback
            className={cn(
              "transition-colors duration-200",
              isDarkMode ? "bg-[#404040] text-[#e0e0e0]" : "bg-[#f0f0f0] text-[#1e1e1e]",
            )}
          >
            {user.initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col flex-1 min-w-0">
          <div
            className={cn(
              "font-semibold text-[15px] leading-5 truncate transition-colors duration-200",
              isDarkMode ? "text-[#e0e0e0]" : "text-[#1e1e1e]",
            )}
          >
            {user.name}
          </div>
          <div
            className={cn(
              "font-medium text-xs leading-3 truncate transition-colors duration-200",
              isDarkMode ? "text-[#888888]" : "text-[#989898]",
            )}
          >
            {user.email}
          </div>
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={onLogout}
        className={cn(
          "w-8 h-8 transition-colors duration-200",
          isDarkMode ? "hover:bg-[#3a3a3a]" : "hover:bg-[#f0f0f0]",
        )}
        aria-label="Log out"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  )
})
