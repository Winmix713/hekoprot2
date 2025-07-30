import type React from "react"

export interface MenuItem {
  id: string
  icon: React.ReactNode
  label: string
  href: string
  isActive?: boolean
  badgeCount?: number
  submenuItems?: SubMenuItem[]
}

export interface SubMenuItem {
  id: string
  label: string
  href: string
  isActive?: boolean
}

export interface UserProfile {
  name: string
  email: string
  avatar: string
  initials: string
}

export interface EarningsData {
  amount: string
  period: string
}
