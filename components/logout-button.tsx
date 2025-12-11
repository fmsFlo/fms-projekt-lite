"use client"
export const runtime = "nodejs";

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Hard redirect zur Login-Seite (um sicherzustellen, dass alle Cookies gelöscht sind)
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

