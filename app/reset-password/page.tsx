'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()

  async function handleReset(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, newPassword }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        const data = await response.json().catch(() => ({ message: 'Fehler beim Zurücksetzen' }))
        setError(data.message || 'Fehler beim Zurücksetzen des Passworts')
      }
    } catch (err: any) {
      console.error('Reset error:', err)
      setError(err.message || 'Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div>
          <h2 className="text-3xl font-bold text-center" style={{ color: 'var(--color-text-primary)' }}>
            Passwort zurücksetzen
          </h2>
          <p className="mt-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Geben Sie Ihre E-Mail-Adresse und ein neues Passwort ein
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-6" method="post">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', color: 'var(--color-error)' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.3)', color: 'var(--color-success)' }}>
              ✅ Passwort erfolgreich zurückgesetzt! Sie werden weitergeleitet...
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="admin@finance-made-simple.de"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Neues Passwort
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Passwort bestätigen
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Passwort wiederholen"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
              style={{ 
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
              }}
            >
              Zurück
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
            >
              {loading ? 'Zurücksetzen...' : 'Passwort zurücksetzen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
