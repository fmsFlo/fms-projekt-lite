import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-md w-full p-8 rounded-lg shadow-lg text-center" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          404
        </h2>
        <p className="mb-6 text-lg" style={{ color: 'var(--color-text-secondary)' }}>
          Seite nicht gefunden
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Zurück zum Dashboard
        </Link>
      </div>
    </div>
  )
}

