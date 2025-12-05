"use client"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteContractButton({ contractId }: { contractId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Möchten Sie diesen Vertrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Löschen fehlgeschlagen')
      }

      window.location.reload()
    } catch (err: any) {
      alert('Fehler beim Löschen: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
    >
      {deleting ? 'Löscht...' : '🗑️ Löschen'}
    </button>
  )
}

