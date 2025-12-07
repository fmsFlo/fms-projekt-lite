export const runtime = "nodejs";
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'

export default function SalesDashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          setLoading(false)
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile error:', profileError)
          setLoading(false)
          return
        }

        if (profile) {
          if (profile.role !== 'admin') {
            router.push('/dashboard')
            setLoading(false)
            return
          }
          setUserRole('admin')
        }
        setLoading(false)
      } catch (error) {
        console.error('Error loading user role:', error)
        setLoading(false)
      }
    }
    
    getUserRole()

    // Höre auf Auth-Änderungen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        getUserRole()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <AuthGuard>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Lade Dashboard...</p>
          </div>
        </div>
      ) : userRole !== 'admin' ? null : (
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>📊 Sales Dashboard</h1>
              <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>Analysen für Telefonie, Calendly und mehr</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Telefonie Dashboard */}
              <Link
                href="/sales-dashboard/telefonie"
                className="block p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">📞</div>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Telefonie</h2>
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Anrufstatistiken, Erreichbarkeit, Conversion-Funnel und mehr
                </p>
              </Link>

              {/* Calendly Dashboard */}
              <Link
                href="/sales-dashboard/calendly"
                className="block p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">📅</div>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Calendly</h2>
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Terminanalysen, Absage-Raten, Team-Performance
                </p>
              </Link>

              {/* Analyse Dashboard */}
              <Link
                href="/sales-dashboard/analyse"
                className="block p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">📊</div>
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Analyse</h2>
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Kombinierte Analysen und Reports
                </p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}
