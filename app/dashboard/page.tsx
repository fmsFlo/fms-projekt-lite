"use client"
export const runtime = "nodejs";


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'

export default function DashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'admin' | 'advisor' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserRole() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-store'
        })
        if (!response.ok) {
          console.error('❌ Dashboard: /api/user returned', response.status)
          router.push('/login')
          return
        }
        const user = await response.json()
        console.log('✅ Dashboard: User loaded', user.role)
        setUserRole(user.role === 'admin' ? 'admin' : 'advisor')
        setLoading(false)
      } catch (error) {
        console.error('❌ Dashboard: Error loading user role:', error)
        router.push('/login')
      }
    }
    // Warte kurz, damit AuthGuard zuerst prüft
    const timer = setTimeout(getUserRole, 100)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <AuthGuard>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Lade Dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-8" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Willkommen bei qapix</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>Ihr zentrales System für Kundenverwaltung, Verträge und Analysen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Clients */}
        <Link
          href="/clients"
          className="card block p-6 rounded-lg transition-all duration-300"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          }}
        >
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">👥</div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Kunden</h2>
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Kunden verwalten, anlegen und bearbeiten
          </p>
        </Link>

        {/* Templates */}
        <Link
          href="/templates"
          className="card block p-6 rounded-lg transition-all duration-300"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          }}
        >
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-4">📄</div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Vorlagen</h2>
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Vertragsvorlagen verwalten und bearbeiten
          </p>
        </Link>

        {/* Sales Dashboard - nur für Admins */}
        {userRole === 'admin' && (
          <Link
            href="/sales-dashboard"
            className="card block p-6 rounded-lg transition-all duration-300"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4">📊</div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Sales Dashboard</h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Analysen für Telefonie, Calendly und mehr
            </p>
          </Link>
        )}

        {/* Settings - nur für Admins */}
        {userRole === 'admin' && (
          <Link
            href="/settings"
            className="card block p-6 rounded-lg transition-all duration-300"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
          >
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4">⚙️</div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Einstellungen</h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Systemeinstellungen und Benutzerverwaltung
            </p>
          </Link>
        )}
      </div>
    </div>
      )}
    </AuthGuard>
  )
}
