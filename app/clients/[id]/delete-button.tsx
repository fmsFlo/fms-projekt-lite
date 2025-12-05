"use client"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteClientButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function onDelete() {
    if (!confirm('Diesen Kunden wirklich löschen? Alle zugehörigen Verträge werden ebenfalls gelöscht.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Löschen fehlgeschlagen' }))
        throw new Error(error.message || error.error || 'Löschen fehlgeschlagen')
      }
      router.push('/clients')
      router.refresh()
    } catch (err: any) {
      alert(`❌ Fehler: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  return (
    <button 
      onClick={onDelete} 
      disabled={loading}
      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Lösche…' : 'Löschen'}
    </button>
  )
}

