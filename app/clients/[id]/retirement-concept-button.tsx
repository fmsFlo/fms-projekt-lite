"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RetirementConceptButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/retirement-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Fehler beim Erstellen')
      }

      const concept = await res.json()
      router.push(`/clients/${clientId}/retirement-concept/${concept.id}`)
      router.refresh()
    } catch (err: any) {
      alert(`Fehler: ${err.message}`)
      console.error('Fehler beim Erstellen des Rentenkonzepts:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="inline-flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed gap-2"
      style={{
        padding: '10px 24px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--weight-medium)',
        backgroundColor: 'var(--color-primary)'
      }}
    >
      💰 Rentenkonzept erstellen
    </button>
  )
}


