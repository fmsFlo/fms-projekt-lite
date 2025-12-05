"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteInvoiceButton({ contractId }: { contractId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Möchten Sie die Rechnungsreferenz wirklich löschen? Sie können danach eine neue Rechnung erstellen. Die Rechnung bleibt in Sevdesk bestehen.')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}/delete-invoice`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Fehler beim Löschen')
      }

      // Seite neu laden
      router.refresh()
    } catch (err: any) {
      alert(`Fehler: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
    >
      {deleting ? 'Löschen...' : 'Rechnung löschen (neu erstellen)'}
    </button>
  )
}



