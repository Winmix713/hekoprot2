"use client"

import { useState, useCallback } from "react"

export function useSidebar() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev)
  }, [])

  const toggleSubmenu = useCallback((menuId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(menuId)) {
        newSet.delete(menuId)
      } else {
        newSet.add(menuId)
      }
      return newSet
    })
  }, [])

  const isSubmenuExpanded = useCallback(
    (menuId: string) => {
      return expandedMenus.has(menuId)
    },
    [expandedMenus],
  )

  return {
    isDarkMode,
    toggleTheme,
    toggleSubmenu,
    isSubmenuExpanded,
  }
}
