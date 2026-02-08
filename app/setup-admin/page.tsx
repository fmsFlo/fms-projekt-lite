'use client'

import { useState } from 'react'

export default function SetupAdminPage() {
  const [email, setEmail] = useState('admin@financemadesimple.de')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      setResult({ ...data, status: response.status })
    } catch (error: any) {
      setResult({ error: error.message, status: 500 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Admin User Setup
        </h1>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mindestens 6 Zeichen
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Wird eingerichtet...' : 'User verknüpfen'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-md ${
            result.status === 200 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h2 className={`font-semibold mb-2 ${
              result.status === 200 ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.status === 200 ? '✓ Erfolg' : '✗ Fehler'}
            </h2>

            {result.message && (
              <p className="text-sm text-gray-700 mb-2">{result.message}</p>
            )}

            {result.error && (
              <p className="text-sm text-red-700 mb-2">{result.error}</p>
            )}

            {result.canLogin && (
              <div className="mt-4 pt-4 border-t border-green-300">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Sie können sich jetzt einloggen:
                </p>
                <p className="text-sm text-gray-700">Email: {email}</p>
                <p className="text-sm text-gray-700">Passwort: {password}</p>
                <a
                  href="/login"
                  className="inline-block mt-4 text-sm text-blue-600 hover:underline"
                >
                  → Zum Login
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
