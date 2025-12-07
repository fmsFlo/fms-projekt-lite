"use client"
export const runtime = "nodejs";


import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    setLoading(true)
    try {
      // Zuerst Server-Side Logout (löscht alle Cookies)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      }).catch(() => {
        // Ignoriere Fehler, falls die Route nicht existiert
      })

      // Dann Client-Side Supabase Session löschen
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
      }

      // Hard redirect zur Login-Seite (um sicherzustellen, dass alle Cookies gelöscht sind)
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout error:', err)
      // Auch bei Fehler zur Login-Seite weiterleiten
      window.location.href = '/login'
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: 'var(--color-error)',
        color: 'white',
        borderRadius: 'var(--radius-pill)'
      }}
    >
      {loading ? 'Logout...' : 'Abmelden'}
    </button>
  )
}

