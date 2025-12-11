'use client'
export const runtime = "nodejs";

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
      style={{
        backgroundColor: 'var(--color-error)',
        color: 'white',
        borderRadius: 'var(--radius-pill)'
      }}
    >
      Abmelden
    </button>
  )
}



