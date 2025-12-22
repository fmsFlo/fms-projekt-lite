'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, FileText, Save, Check } from 'lucide-react'
import VergleichsCard from '@/app/components/empfehlungen/VergleichsCard'
import GesamtUebersicht from '@/app/components/empfehlungen/GesamtUebersicht'
import EmpfehlungEditModal from '@/app/components/empfehlungen/EmpfehlungEditModal'
import type { Empfehlung, EmpfehlungsCheck } from '@/app/components/empfehlungen/types'
import { BEISPIEL_EMPFEHLUNGEN } from '@/app/components/empfehlungen/constants'
import { groupByKategorie } from '@/app/components/empfehlungen/utils'
import { KATEGORIE_INFO } from '@/app/components/empfehlungen/constants'

export default function EmpfehlungenPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [empfehlungen, setEmpfehlungen] = useState<Empfehlung[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingEmpfehlung, setEditingEmpfehlung] = useState<Empfehlung | null>(null)
  const [selectedKategorie, setSelectedKategorie] = useState<string>('alle')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Lade Daten aus Backend oder localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Versuche zuerst Backend
        const res = await fetch(`/api/clients/${clientId}/empfehlungen`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.empfehlungen && Array.isArray(data.empfehlungen) && data.empfehlungen.length > 0) {
            console.log('✅ Daten aus Backend geladen:', data.empfehlungen.length)
            setEmpfehlungen(data.empfehlungen)
            setLoading(false)
            return
          }
        }
        
        // Fallback: localStorage
        console.log('⚠️ Backend leer, prüfe localStorage...')
        const stored = localStorage.getItem(`empfehlungen-${clientId}`)
        if (stored) {
          try {
            const data = JSON.parse(stored)
            if (data.empfehlungen && Array.isArray(data.empfehlungen) && data.empfehlungen.length > 0) {
              console.log('✅ Daten aus localStorage geladen:', data.empfehlungen.length)
              setEmpfehlungen(data.empfehlungen)
              setLoading(false)
              return
            }
          } catch (parseErr) {
            console.error('❌ Fehler beim Parsen von localStorage:', parseErr)
          }
        }
        
        // Keine Daten gefunden - Beispiel-Daten
        console.log('ℹ️ Keine gespeicherten Daten gefunden, verwende Beispiel-Daten')
        setEmpfehlungen(BEISPIEL_EMPFEHLUNGEN)
      } catch (err) {
        console.error('❌ Fehler beim Laden:', err)
        // Fallback: localStorage
        try {
          const stored = localStorage.getItem(`empfehlungen-${clientId}`)
          if (stored) {
            const data = JSON.parse(stored)
            if (data.empfehlungen) {
              setEmpfehlungen(data.empfehlungen)
              setLoading(false)
              return
            }
          }
        } catch (localErr) {
          console.error('❌ Auch localStorage Fehler:', localErr)
        }
        setEmpfehlungen(BEISPIEL_EMPFEHLUNGEN)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clientId])

  // Speichere Daten im Backend
  const saveData = async (newEmpfehlungen: Empfehlung[], showFeedback: boolean = false) => {
    if (showFeedback) {
      setSaving(true)
      setSaved(false)
    }

    try {
      const { calculateGesamtErgebnis } = await import('@/app/components/empfehlungen/utils')
      const ergebnis = calculateGesamtErgebnis(newEmpfehlungen)

      const data: EmpfehlungsCheck = {
        clientId,
        empfehlungen: newEmpfehlungen,
        gesamtEinsparungMonatlich: ergebnis.gesamtEinsparungMonatlich,
        gesamtEinsparungJaehrlich: ergebnis.gesamtEinsparungJaehrlich,
        anzahlOptimierungen: ergebnis.anzahlOptimierungen,
      }

      // IMMER zuerst in localStorage speichern (sofortige Persistenz)
      try {
        localStorage.setItem(`empfehlungen-${clientId}`, JSON.stringify(data))
        console.log('💾 In localStorage gespeichert (sofort)')
      } catch (localErr) {
        console.error('⚠️ localStorage Fehler:', localErr)
      }

      const res = await fetch(`/api/clients/${clientId}/empfehlungen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const result = await res.json()
        
        // Prüfe ob Fallback verwendet wurde
        if (result.fallback) {
          console.log('💾 Fallback: Nur localStorage verwendet')
        } else {
          console.log('✅ Empfehlungen in Datenbank gespeichert')
        }
        
        setEmpfehlungen(newEmpfehlungen)
        if (showFeedback) {
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        }
        return true
      } else {
        const errorText = await res.text()
        console.error('❌ Fehler beim Speichern:', errorText)
        // Fallback: localStorage als Backup
        try {
          localStorage.setItem(`empfehlungen-${clientId}`, JSON.stringify(data))
          console.log('💾 Fallback: In localStorage gespeichert')
          if (showFeedback) {
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
          }
          setEmpfehlungen(newEmpfehlungen)
          return true
        } catch (localErr) {
          console.error('❌ Auch localStorage Fehler:', localErr)
          return false
        }
      }
    } catch (err) {
      console.error('❌ Fehler beim Speichern:', err)
      // Fallback: localStorage als Backup
      try {
        const { calculateGesamtErgebnis } = await import('@/app/components/empfehlungen/utils')
        const ergebnis = calculateGesamtErgebnis(newEmpfehlungen)
        const data: EmpfehlungsCheck = {
          clientId,
          empfehlungen: newEmpfehlungen,
          gesamtEinsparungMonatlich: ergebnis.gesamtEinsparungMonatlich,
          gesamtEinsparungJaehrlich: ergebnis.gesamtEinsparungJaehrlich,
          anzahlOptimierungen: ergebnis.anzahlOptimierungen,
        }
        localStorage.setItem(`empfehlungen-${clientId}`, JSON.stringify(data))
        console.log('💾 Fallback: In localStorage gespeichert')
        setEmpfehlungen(newEmpfehlungen)
        if (showFeedback) {
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        }
        return true
      } catch (localErr) {
        console.error('❌ Auch localStorage Fehler:', localErr)
        return false
      }
    } finally {
      if (showFeedback) {
        setSaving(false)
      }
    }
  }

  const handleAdd = () => {
    setEditingEmpfehlung(null)
    setEditModalOpen(true)
  }

  const handleEdit = (empfehlung: Empfehlung) => {
    setEditingEmpfehlung(empfehlung)
    setEditModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Möchten Sie diese Empfehlung wirklich löschen?')) {
      const newEmpfehlungen = empfehlungen.filter((e) => e.id !== id)
      saveData(newEmpfehlungen, false)
    }
  }

  const handleSaveEmpfehlung = async (empfehlung: Empfehlung) => {
    let newEmpfehlungen: Empfehlung[]
    if (editingEmpfehlung) {
      // Bearbeiten
      newEmpfehlungen = empfehlungen.map((e) => (e.id === empfehlung.id ? empfehlung : e))
    } else {
      // Neu hinzufügen
      newEmpfehlungen = [...empfehlungen, empfehlung]
    }
    
    // Sofort im State aktualisieren
    setEmpfehlungen(newEmpfehlungen)
    
    // Dann speichern
    await saveData(newEmpfehlungen, false) // Kein Feedback, da automatisch beim Schließen
    
    setEditModalOpen(false)
    setEditingEmpfehlung(null)
  }

  const handleManualSave = async () => {
    await saveData(empfehlungen, true) // Mit Feedback
  }

  const grouped = groupByKategorie(empfehlungen)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p style={{ color: 'var(--color-text-secondary)' }}>Lade Empfehlungen...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/clients/${clientId}`}
            className="p-2 rounded hover:opacity-80"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Ihre persönlichen Optimierungsempfehlungen
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Vorher-Nachher-Vergleich Ihrer Finanzprodukte
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleManualSave}
            disabled={saving}
            className="px-4 py-2 rounded font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: saved ? '#10B981' : 'var(--color-primary)',
              color: 'white',
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Speichere...</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Gespeichert!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Speichern</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="px-4 py-2 rounded font-medium"
            style={{
              backgroundColor: isEditMode ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
              color: isEditMode ? 'white' : 'var(--color-text-primary)',
              border: isEditMode ? 'none' : '1px solid var(--color-border)',
            }}
          >
            {isEditMode ? 'Bearbeitungsmodus' : 'Bearbeiten'}
          </button>
          {isEditMode && (
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded font-medium flex items-center gap-2"
              style={{ backgroundColor: '#10B981', color: 'white' }}
            >
              <Plus className="w-4 h-4" />
              Neue Empfehlung
            </button>
          )}
        </div>
      </div>

      {/* Gesamtübersicht */}
      {empfehlungen.length > 0 && <GesamtUebersicht empfehlungen={empfehlungen} />}

      {/* Filter für Kategorien */}
      {empfehlungen.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Kategorie filtern:
          </label>
          <select
            value={selectedKategorie}
            onChange={(e) => setSelectedKategorie(e.target.value)}
            className="px-4 py-2 rounded border"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="alle">Alle Kategorien</option>
            {Object.entries(KATEGORIE_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Empfehlungen nach Kategorie */}
      {empfehlungen.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center border"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Noch keine Empfehlungen vorhanden
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Klicken Sie auf "Bearbeiten" und dann auf "Neue Empfehlung", um eine Empfehlung
            hinzuzufügen.
          </p>
          {isEditMode && (
            <button
              onClick={handleAdd}
              className="px-6 py-3 rounded font-medium inline-flex items-center gap-2"
              style={{ backgroundColor: '#10B981', color: 'white' }}
            >
              <Plus className="w-5 h-5" />
              Erste Empfehlung hinzufügen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped)
            .filter(([kategorie]) => selectedKategorie === 'alle' || kategorie === selectedKategorie)
            .map(([kategorie, kategorieEmpfehlungen]) => {
              const kategorieInfo = KATEGORIE_INFO[kategorie as keyof typeof KATEGORIE_INFO] || KATEGORIE_INFO.sonstige
              return (
              <div key={kategorie} className="space-y-4">
                <h2
                  className="text-xl font-semibold flex items-center gap-2"
                  style={{ color: kategorieInfo.color }}
                >
                  <span>{kategorieInfo.name}</span>
                  <span className="text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>
                    ({kategorieEmpfehlungen.length})
                  </span>
                </h2>
                <div className="space-y-4">
                  {kategorieEmpfehlungen.map((empfehlung) => (
                    <VergleichsCard
                      key={empfehlung.id}
                      empfehlung={empfehlung}
                      isEditing={isEditMode}
                      onEdit={() => handleEdit(empfehlung)}
                      onDelete={() => handleDelete(empfehlung.id)}
                    />
                  ))}
                </div>

                {/* Call-to-Action pro Kategorie */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="https://calendly.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded font-medium inline-flex items-center gap-2 hover:opacity-80"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    <Calendar className="w-4 h-4" />
                    Beratungstermin vereinbaren
                  </a>
                  <button
                    className="px-4 py-2 rounded font-medium inline-flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                    }}
                    onClick={() => window.print()}
                  >
                    <FileText className="w-4 h-4" />
                    Details als PDF
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      <EmpfehlungEditModal
        empfehlung={editingEmpfehlung}
        isOpen={editModalOpen}
        clientId={clientId}
        onClose={() => {
          setEditModalOpen(false)
          setEditingEmpfehlung(null)
        }}
        onSave={handleSaveEmpfehlung}
      />
    </div>
  )
}

