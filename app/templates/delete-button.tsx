"use client"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteTemplateButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onDelete() {
    if (!confirm(`Template "${name}" wirklich löschen?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Fehler beim Löschen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="px-3 py-1.5 text-sm rounded-md text-white hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
      style={{ 
        backgroundColor: 'var(--color-error)',
        borderRadius: 'var(--radius-pill)'
      }}
    >
      {loading ? 'Lösche…' : 'Löschen'}
    </button>
  )
}

