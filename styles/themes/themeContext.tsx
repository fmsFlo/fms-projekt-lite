"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface BrandColors {
  primary: string
  secondary: string
  accent: string
}

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  brandColors: BrandColors
  setTheme: (theme: Theme) => void
  setBrandColors: (colors: BrandColors) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: '#0071E3', // Apple Blue
  secondary: '#5856D6', // Apple Purple
  accent: '#FF9500' // Apple Orange
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [brandColors, setBrandColorsState] = useState<BrandColors>(DEFAULT_BRAND_COLORS)

  // Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const savedColors = localStorage.getItem('brandColors')
    
    if (savedTheme) {
      setThemeState(savedTheme)
    }
    
    if (savedColors) {
      try {
        setBrandColorsState(JSON.parse(savedColors))
      } catch (e) {
        console.error('Failed to parse brand colors:', e)
      }
    }
  }, [])

  // Resolve system theme
  useEffect(() => {
    const resolveTheme = (): 'light' | 'dark' => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return theme
    }

    setResolvedTheme(resolveTheme())

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        setResolvedTheme(resolveTheme())
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolvedTheme)
  }, [resolvedTheme])

  // Apply brand colors to CSS variables
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', brandColors.primary)
    root.style.setProperty('--color-secondary', brandColors.secondary)
    root.style.setProperty('--color-accent', brandColors.accent)
  }, [brandColors])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const setBrandColors = (colors: BrandColors) => {
    setBrandColorsState(colors)
    localStorage.setItem('brandColors', JSON.stringify(colors))
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, brandColors, setTheme, setBrandColors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}




