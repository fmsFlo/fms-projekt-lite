"use client"
import { useState } from 'react'

export default function UploadSignedForm({ contractId, signedPdfFileName }: { contractId: string, signedPdfFileName: string | null }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [signedFile, setSignedFile] = useState<string | null>(signedPdfFileName)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File | null

    if (!file) {
      setError('Bitte wählen Sie eine PDF-Datei aus')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const res = await fetch(`/api/contracts/${contractId}/upload-signed`, {
        method: 'POST',
        body: uploadFormData
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Upload fehlgeschlagen')
      }

      const data = await res.json()
      setSignedFile(data.filePath || signedFile)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      // Seite neu laden, um aktuelle Daten zu zeigen
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Möchten Sie das unterschriebene Dokument wirklich löschen?')) return

    try {
      const res = await fetch(`/api/contracts/${contractId}/delete-file?type=signed`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Löschen fehlgeschlagen')
      }

      setSignedFile(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <section className="border rounded p-6 space-y-4 bg-white">
      <h2 className="text-lg font-semibold">Unterschriebenes Dokument</h2>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ Aktion erfolgreich!
        </div>
      )}

      {signedFile ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Unterschriebenes Dokument vorhanden</p>
              <p className="text-sm text-gray-600">{signedFile}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={signedFile}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                📄 Anzeigen
              </a>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                🗑️ Löschen
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Unterschriebenes PDF hochladen
            </label>
            <input
              type="file"
              name="file"
              accept="application/pdf,.pdf"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Laden Sie das vom Kunden unterschriebene PDF-Dokument hoch.
            </p>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Lädt hoch...' : '📤 Hochladen'}
          </button>
        </form>
      )}
    </section>
  )
}

