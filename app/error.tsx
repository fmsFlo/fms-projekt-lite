'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-md w-full p-8 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Etwas ist schiefgelaufen
        </h2>
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}

