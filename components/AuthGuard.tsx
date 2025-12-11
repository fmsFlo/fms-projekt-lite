'use client'
export const runtime = "nodejs";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let isMounted = true
    
    async function checkAuth() {
      try {
        // Timeout nach 10 Sekunden
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.error('❌ AuthGuard: Timeout - redirecting to /login')
            setLoading(false)
            router.push('/login')
          }
        }, 10000)
        
        const response = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-store'
        })
        
        clearTimeout(timeoutId)
        
        if (!isMounted) return
        
        if (!response.ok) {
          setLoading(false)
          router.push('/login')
          return
        }
        
        const user = await response.json()
        if (!isMounted) return
        
        if (!user || user.isActive === false) {
          setLoading(false)
          router.push('/login')
          return
        }
        
        setAuthorized(true)
        setLoading(false)
      } catch (error) {
        clearTimeout(timeoutId)
        if (isMounted) {
          console.error('❌ AuthGuard: Error:', error)
          setLoading(false)
          router.push('/login')
        }
      }
    }
    
    checkAuth()
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
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



