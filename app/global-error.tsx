'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="max-w-md w-full p-8 rounded-lg shadow-lg bg-white border border-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Kritischer Fehler
            </h2>
            <p className="mb-6 text-gray-600">
              {error.message || 'Ein kritischer Fehler ist aufgetreten.'}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

