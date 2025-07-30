"use client"

import type React from "react"

import { memo } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MenuItem } from "../types/sidebar"

interface SidebarMenuItemProps {
  item: MenuItem
  isDarkMode: boolean
  isExpanded?: boolean
  onToggleSubmenu?: (menuId: string) => void
}

export const SidebarMenuItem = memo(function SidebarMenuItem({
  item,
  isDarkMode,
  isExpanded = false,
  onToggleSubmenu,
}: SidebarMenuItemProps) {
  const hasSubmenu = item.submenuItems && item.submenuItems.length > 0

  const handleSubmenuToggle = () => {
    if (hasSubmenu && onToggleSubmenu) {
      onToggleSubmenu(item.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleSubmenuToggle()
    }
  }

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center gap-3 p-3 relative w-full transition-all duration-200 rounded-lg group",
          item.isActive && [
            "border border-solid",
            isDarkMode
              ? "bg-[#2a2a2a] border-[#404040] shadow-[0px_14px_40.7px_-9px_rgba(0,0,0,0.3),inset_0px_0px_0px_2px_rgba(255,255,255,0.1)]"
              : "bg-[#f6f6f6] border-[#eeeeee] shadow-[0px_14px_40.7px_-9px_rgba(0,0,0,0.12),inset_0px_0px_0px_2px_#ffffff]",
          ],
          !item.isActive && "hover:bg-opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800",
        )}
      >
        <div className={cn("h-6 w-6 transition-colors duration-200", isDarkMode ? "text-[#e0e0e0]" : "text-[#1e1e1e]")}>
          {item.icon}
        </div>

        <a
          href={item.href}
          className={cn(
            "flex-1 font-semibold text-[15px] leading-6 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded",
            isDarkMode ? "text-[#e0e0e0]" : "text-[#1e1e1e]",
          )}
          aria-label={`Navigate to ${item.label}`}
        >
          {item.label}
        </a>

        <div className="flex items-center gap-2">
          {item.badgeCount && (
            <Badge
              className={cn(
                "h-6 w-6 flex items-center justify-center rounded-md border-0 transition-colors duration-200 text-xs",
                isDarkMode
                  ? "bg-[#6b46c1] text-[#e0e0e0] hover:bg-[#7c3aed]"
                  : "bg-[#edbfff] text-[#1e1e1e] hover:bg-[#edbfff]",
              )}
              aria-label={`${item.badgeCount} items`}
            >
              {item.badgeCount}
            </Badge>
          )}

          {hasSubmenu && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSubmenuToggle}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-8 h-8 transition-transform duration-200",
                isDarkMode ? "hover:bg-[#3a3a3a]" : "hover:bg-[#f0f0f0]",
              )}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.label} submenu`}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Submenu with smooth animation */}
      {hasSubmenu && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="ml-9 mt-2 space-y-1">
            {item.submenuItems?.map((subItem) => (
              <a
                key={subItem.id}
                href={subItem.href}
                className={cn(
                  "block px-3 py-2 text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  isDarkMode
                    ? "text-[#b0b0b0] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]"
                    : "text-[#666666] hover:text-[#1e1e1e] hover:bg-[#f0f0f0]",
                  subItem.isActive && "font-medium",
                )}
                aria-label={`Navigate to ${subItem.label}`}
              >
                {subItem.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
