"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './logout-button'
import ThemeToggle from '@/components/settings/ThemeToggle'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUser(user)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profile)
      setLoading(false)
    }
    
    getUser()

    // Höre auf Auth-Änderungen (z.B. nach Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        getUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  if (!user || !profile || loading) {
    return null // Nichts anzeigen während loading
  }

  const userRole = profile.role === 'admin' ? 'admin' : 'advisor'

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

