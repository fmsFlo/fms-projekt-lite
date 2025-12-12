'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

interface CompanySettings {
  id?: string
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string
  companySlogan?: string
  [key: string]: any
}

interface SettingsContextType {
  settings: CompanySettings | null
  loading: boolean
  refresh: () => Promise<void>
  updateSettings: (newSettings: Partial<CompanySettings>) => void
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  refresh: async () => {},
  updateSettings: () => {},
})

// Helper function to convert hex to RGB
function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : null
}

// Helper function to set CSS variables
function setCSSVariables(primaryColor: string, secondaryColor: string) {
  const root = document.documentElement
  
  // Set primary color
  root.style.setProperty('--color-primary', primaryColor)
  const primaryRgb = hexToRgb(primaryColor)
  if (primaryRgb) {
    root.style.setProperty('--color-primary-rgb', primaryRgb)
  }
  
  // Set secondary color
  root.style.setProperty('--color-secondary', secondaryColor)
  const secondaryRgb = hexToRgb(secondaryColor)
  if (secondaryRgb) {
    root.style.setProperty('--color-secondary-rgb', secondaryRgb)
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        
        // Set CSS variables for brand colors
        const primaryColor = data.primaryColor || '#007AFF'
        const secondaryColor = data.secondaryColor || '#5856D6'
        setCSSVariables(primaryColor, secondaryColor)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback((newSettings: Partial<CompanySettings>) => {
    setSettings(prev => {
      if (!prev) return null
      const updated = { ...prev, ...newSettings }
      
      // Update CSS variables if colors changed
      if (newSettings.primaryColor || newSettings.secondaryColor) {
        const primaryColor = updated.primaryColor || '#007AFF'
        const secondaryColor = updated.secondaryColor || '#5856D6'
        setCSSVariables(primaryColor, secondaryColor)
      }
      
      return updated
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}

