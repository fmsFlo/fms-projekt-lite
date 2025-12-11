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
          credentials: 'include'
        })
        if (!response.ok) {
          setLoading(false)
          return
        }
        const data = await response.json()
        setUser(data)
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }
    
    // Nur EINMAL beim Mount aufrufen - KEIN Interval mehr!
    getUser()
  }, [])

  if (!user || loading) {
    return null // Nichts anzeigen während loading
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

