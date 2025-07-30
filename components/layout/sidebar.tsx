"use client"

import { memo } from "react"
import { BarChart3, Home, Plus, Moon, Sun, Target, Brain, Settings, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSidebar } from "./hooks/use-sidebar"
import { SidebarMenuItem } from "./components/sidebar-menu-item"
import { SidebarUserProfile } from "./components/sidebar-user-profile"
import { SidebarEarningsCard } from "./components/sidebar-earnings-card"
import type { MenuItem, UserProfile, EarningsData } from "./types/sidebar"

interface PremiumSidebarProps {
  className?: string
  menuItems?: MenuItem[]
  user?: UserProfile
  earnings?: EarningsData
  onLogout?: () => void
  onWithdraw?: () => void
  onAddClick?: () => void
}

// Football prediction admin menu items
const defaultMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    icon: <Home className="h-6 w-6" />,
    label: "Dashboard",
    href: "/",
    isActive: true,
  },
  {
    id: "matches",
    icon: <Target className="h-6 w-6" />,
    label: "Matches",
    href: "/matches",
    submenuItems: [
      { id: "upcoming", label: "Upcoming", href: "/matches?tab=upcoming" },
      { id: "live", label: "Live", href: "/matches?tab=live" },
      { id: "results", label: "Results", href: "/matches?tab=results" },
    ],
  },
  {
    id: "predictions",
    icon: <Brain className="h-6 w-6" />,
    label: "Predictions",
    href: "/predictions",
    badgeCount: 12,
  },
  {
    id: "models",
    icon: <TrendingUp className="h-6 w-6" />,
    label: "Models",
    href: "/models",
  },
  {
    id: "statistics",
    icon: <BarChart3 className="h-6 w-6" />,
    label: "Statistics",
    href: "/statistics",
  },
  {
    id: "settings",
    icon: <Settings className="h-6 w-6" />,
    label: "Settings",
    href: "/settings",
  },
]

const defaultUser: UserProfile = {
  name: "Football Admin",
  email: "admin@footballpredictions.com",
  avatar: "/placeholder.svg?height=48&width=48",
  initials: "FA",
}

const defaultEarnings: EarningsData = {
  amount: "$12,450.00",
  period: "PREDICTIONS THIS MONTH",
}

export default memo(function PremiumSidebar({
  className,
  menuItems = defaultMenuItems,
  user = defaultUser,
  earnings = defaultEarnings,
  onLogout,
  onWithdraw,
  onAddClick,
}: PremiumSidebarProps) {
  const { isDarkMode, toggleTheme, toggleSubmenu, isSubmenuExpanded } = useSidebar()

  return (
    <div
      className={cn(
        "flex flex-col w-80 h-[904px] rounded-[32px] transition-colors duration-300 overflow-hidden",
        isDarkMode ? "bg-[#1a1a1a]" : "bg-[#fcfcfc]",
        className,
      )}
      role="navigation"
      aria-label="Main sidebar navigation"
    >
      {/* Header Section */}
      <div className="flex flex-col p-6 space-y-6">
        {/* Logo and Controls */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div
              className={cn(
                "absolute w-10 h-10 rounded-lg transition-colors duration-300",
                isDarkMode ? "bg-[#404040]" : "bg-[#727272]",
              )}
            />
            <div className="absolute w-10 h-10 bg-gradient-to-br from-[#779DFF] to-[#2D68FF] rounded-lg shadow-[0px_4px_12px_rgba(45,104,255,0.3)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  "w-8 h-8 rounded transform rotate-[-90deg] transition-colors duration-300",
                  isDarkMode
                    ? "bg-gradient-to-br from-[#e0e0e0] to-[#404040]"
                    : "bg-gradient-to-br from-[#231F20] to-white",
                )}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              onClick={toggleTheme}
              className={cn(
                "w-8 h-8 rounded-full border-0 transition-colors duration-300",
                isDarkMode
                  ? "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e0e0e0]"
                  : "bg-[#f0f0f0] hover:bg-[#e8e8e8] text-[#1e1e1e]",
              )}
              aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              size="icon"
              onClick={onAddClick}
              className={cn(
                "w-10 h-10 rounded-full border-0 transition-colors duration-300",
                isDarkMode
                  ? "bg-[#2a2a2a] hover:bg-[#3a3a3a] shadow-[0px_4px_16px_rgba(0,0,0,0.3),0px_2px_4px_rgba(0,0,0,0.4)]"
                  : "bg-[#fcfcfc] hover:bg-[#f8f8f8] shadow-[0px_4px_16px_rgba(0,0,0,0.04),0px_2px_4px_rgba(0,0,0,0.1)]",
              )}
              aria-label="Add new item"
            >
              <Plus
                className={cn(
                  "h-4 w-4 transition-colors duration-300",
                  isDarkMode ? "text-[#e0e0e0]" : "text-[#1e1e1e]",
                )}
              />
            </Button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1" role="menu">
          {menuItems.map((item) => (
            <SidebarMenuItem
              key={item.id}
              item={item}
              isDarkMode={isDarkMode}
              isExpanded={isSubmenuExpanded(item.id)}
              onToggleSubmenu={toggleSubmenu}
            />
          ))}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Section */}
      <div className="space-y-6">
        {/* Earnings Card */}
        <div className="px-6">
          <SidebarEarningsCard earnings={earnings} isDarkMode={isDarkMode} onWithdraw={onWithdraw} />
        </div>

        {/* Billing Toggle */}
        <div className="px-6">
          <div className="w-full space-y-4">
            {/* Model Status Display */}
            <div className="w-[160px] h-[109px] mx-auto rounded-[20px] overflow-hidden border-none relative bg-white shadow-lg">
              <div className="absolute w-[64px] h-[32px] left-[16px] top-[16px]">
                <div className="absolute w-[64px] h-[32px] left-0 top-0 bg-[#202020] backdrop-blur-[16px] rounded-[16px]"></div>
                <div className="absolute w-[24px] h-[24px] left-[4px] top-[4px] bg-[linear-gradient(180deg,rgba(235,235,235,0.1)_-27.27%,rgba(196,196,196,0.15)_127.27%)] border-[1.5px] border-[rgba(168,168,168,0.1)] rounded-[16px]">
                  <div className="absolute w-[4px] h-[4px] left-[calc(50%-2px)] top-[calc(50%-2px)] bg-[#F1F1F1] opacity-[0.2] rounded-[2px]"></div>
                </div>
              </div>
              <Badge className="absolute left-[97px] top-[25px] bg-[rgba(45,104,255,0.05)] border-[rgba(45,104,255,0.15)] text-[#2D68FF] text-[8px] font-mono font-semibold">
                default
              </Badge>
              <div className="absolute w-[64px] h-[32px] left-[16px] top-[61px]">
                <div className="absolute w-[64px] h-[32px] left-0 top-0 bg-[linear-gradient(180deg,#779DFF_0%,#2D68FF_100%)] backdrop-blur-[16px] rounded-[16px]"></div>
                <div className="absolute w-[24px] h-[24px] left-[36px] top-[4px] bg-[linear-gradient(180deg,#EBEBEB_-27.27%,#FDFDFD_127.27%)] border-[1.5px] border-[rgba(168,168,168,0.1)] rounded-[16px]">
                  <div className="absolute w-[4px] h-[4px] left-[calc(50%-2px)] top-[calc(50%-2px)] bg-[#2D68FF] rounded-[2px]"></div>
                </div>
              </div>
              <Badge className="absolute left-[97px] top-[70px] bg-[rgba(0,166,86,0.1)] border-[rgba(0,166,86,0.15)] text-[#00A656] text-[8px] font-mono font-semibold">
                active
              </Badge>
            </div>

            {/* Model Toggle */}
            <div className="flex flex-row items-center p-1 w-full h-[56px] bg-[rgba(18,18,18,0.4)] rounded-[100px]">
              <div className="flex w-full h-full items-center justify-center gap-1">
                <button
                  type="button"
                  className="flex justify-center items-center p-[14px_24px] gap-2 w-[159.5px] min-w-[128px] h-[48px] rounded-[100px] flex-grow border-none transition-all duration-300 bg-[rgba(248,248,248,0.05)] shadow-[0px_8px_16px_-4px_rgba(18,18,18,0.2),inset_0px_4px_4px_rgba(255,255,255,0.05)]"
                >
                  <span className="font-semibold text-[14px] leading-[20px] transition-colors duration-300 text-[rgba(248,248,248,0.95)]">
                    Auto Training
                  </span>
                </button>
                <button
                  type="button"
                  className="flex justify-center items-center p-[14px_24px] gap-2 w-[159.5px] min-w-[128px] h-[48px] rounded-[100px] flex-grow border-none transition-all duration-300 bg-transparent hover:bg-[rgba(248,248,248,0.03)]"
                >
                  <span className="font-semibold text-[14px] leading-[20px] transition-colors duration-300 text-[rgba(248,248,248,0.7)] opacity-[0.8]">
                    Manual Mode
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <SidebarUserProfile user={user} isDarkMode={isDarkMode} onLogout={onLogout} />
      </div>
    </div>
  )
})
