'use client'
export const runtime = "nodejs";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('🔍 AuthGuard: Checking authentication...')
        const response = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-store'
        })
        console.log('🔍 AuthGuard: Response status:', response.status)
        if (!response.ok) {
          console.error('❌ AuthGuard: Not authenticated, redirecting to /login')
          router.push('/login')
          return
        }
        const user = await response.json()
        console.log('✅ AuthGuard: User authenticated', user.role, 'isActive:', user.isActive)
        if (!user) {
          console.error('❌ AuthGuard: No user data, redirecting to /login')
          router.push('/login')
          return
        }
        // isActive wird jetzt von /api/user zurückgegeben
        if (user.isActive === false) {
          console.error('❌ AuthGuard: User not active, redirecting to /login')
          router.push('/login')
          return
        }
        setAuthorized(true)
        setLoading(false)
      } catch (error) {
        console.error('❌ AuthGuard: Error:', error)
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}



