'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

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
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  refresh: async () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
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

