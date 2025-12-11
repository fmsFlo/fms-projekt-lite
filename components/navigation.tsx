"use client"
export const runtime = "nodejs";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './logout-button'
import ThemeToggle from '@/components/settings/ThemeToggle'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-store'
        })
        if (!response.ok) {
          console.error('❌ Navigation: /api/user returned', response.status)
          setLoading(false)
          return
        }
        const data = await response.json()
        console.log('✅ Navigation: User loaded', data.role, 'isActive:', data.isActive)
        setUser(data)
        setLoading(false)
      } catch (error) {
        console.error('❌ Navigation: Error fetching user:', error)
        setLoading(false)
      }
    }
    
    // Nur EINMAL beim Mount aufrufen - KEIN Interval mehr!
    getUser()
  }, [])

  // Zeige immer etwas an, auch wenn User nicht geladen ist
  if (loading) {
    return <div className="text-sm text-[var(--color-text-secondary)]">Lädt...</div>
  }
  
  // Wenn kein User, zeige nur Login-Link
  if (!user) {
    return (
      <nav className="flex items-center gap-4 text-sm">
        <Link 
          href="/login" 
          className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          Anmelden
        </Link>
      </nav>
    )
  }

  const userRole = user.role === 'admin' ? 'admin' : 'advisor'

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link 
        href="/dashboard" 
        className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
      >
        Dashboard
      </Link>
      <Link 
        href="/clients"
        className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
      >
        Clients
      </Link>
      {userRole === 'admin' && (
        <>
          <Link 
            href="/templates"
            className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            Templates
          </Link>
          <Link 
            href="/settings"
            className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            Einstellungen
          </Link>
          <Link 
            href="/sales-dashboard"
            className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            Sales Dashboard
          </Link>
        </>
      )}
      {(userRole === 'advisor' || loading) && (
        <Link 
          href="/templates"
          className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          Templates
        </Link>
      )}
      <ThemeToggle />
      <LogoutButton />
    </nav>
  )
}

