'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface PrivacyContextType {
  privacyMode: boolean
  togglePrivacyMode: () => void
  activeClientId: string | null
  setActiveClientId: (id: string | null) => void
}

const PrivacyContext = createContext<PrivacyContextType>({
  privacyMode: false,
  togglePrivacyMode: () => {},
  activeClientId: null,
  setActiveClientId: () => {},
})

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(false)
  const [activeClientId, setActiveClientId] = useState<string | null>(null)

  const togglePrivacyMode = () => {
    setPrivacyMode(!privacyMode)
    // Wenn Privacy Mode ausgeschaltet wird, aktive Client-ID zurücksetzen
    if (privacyMode) {
      setActiveClientId(null)
    }
  }

  return (
    <PrivacyContext.Provider value={{
      privacyMode,
      togglePrivacyMode,
      activeClientId,
      setActiveClientId,
    }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export const usePrivacy = () => useContext(PrivacyContext)

