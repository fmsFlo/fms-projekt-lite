'use client'
export const runtime = "nodejs";


import { useEffect, useState } from 'react'

export default function TestConnection() {
  const [status, setStatus] = useState('Testing connection...')
  const [details, setDetails] = useState<any>(null)

  useEffect(() => {
    async function test() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
          cache: 'no-store'
        })
        
        if (!response.ok) throw new Error('Not authenticated')
        
        const user = await response.json()
        setStatus('✅ Connection Successful!')
        setDetails({ message: 'Database is accessible', user: user.email, timestamp: new Date().toISOString() })
      } catch (error: any) {
        setStatus('❌ Connection Error')
        setDetails({ error: error.message })
      }
    }
    test()
  }, [])

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Connection Test</h1>
        <div className="p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
          <p className="text-xl mb-4" style={{ color: 'var(--color-text-primary)' }}>{status}</p>
          {details && (
            <pre className="p-4 rounded text-sm overflow-auto" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
              {JSON.stringify(details, null, 2)}
            </pre>
          )}
        </div>
        <div className="mt-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <p>Next steps:</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Check your .env.local file has correct values</li>
            <li>Ensure DATABASE_URL is set correctly</li>
            <li>Try logging in at /login</li>
          </ol>
        </div>
      </div>
    </div>
  )
}



