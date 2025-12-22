"use client"

import { X, RotateCcw, Trash2 } from 'lucide-react'

interface DraftRestoreDialogProps {
  isOpen: boolean
  onRestore: () => void
  onDiscard: () => void
  draftAge?: number // Alter in Stunden
  draftTimestamp?: number // Timestamp des Drafts
}

export default function DraftRestoreDialog({
  isOpen,
  onRestore,
  onDiscard,
  draftAge,
  draftTimestamp,
}: DraftRestoreDialogProps) {
  if (!isOpen) return null

  const formatAge = (hours?: number, timestamp?: number) => {
    if (timestamp) {
      const hoursFromTimestamp = (Date.now() - timestamp) / (1000 * 60 * 60)
      if (hoursFromTimestamp < 1) return 'vor weniger als einer Stunde'
      if (hoursFromTimestamp < 24) return `vor ${Math.round(hoursFromTimestamp)} Stunden`
      const days = Math.floor(hoursFromTimestamp / 24)
      return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`
    }
    if (!hours) return 'vor kurzem'
    if (hours < 1) return 'vor weniger als einer Stunde'
    if (hours < 24) return `vor ${Math.round(hours)} Stunden`
    const days = Math.floor(hours / 24)
    return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ungespeicherte Änderungen gefunden
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {draftAge !== undefined || draftTimestamp !== undefined 
                  ? `Gespeichert ${formatAge(draftAge, draftTimestamp)}`
                  : 'Ungespeicherte Änderungen gefunden'}
              </p>
            </div>
          </div>
          <button
            onClick={onDiscard}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Es wurden ungespeicherte Änderungen gefunden. Möchten Sie diese wiederherstellen?
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onRestore}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Wiederherstellen
            </button>
            <button
              onClick={onDiscard}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Verwerfen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

