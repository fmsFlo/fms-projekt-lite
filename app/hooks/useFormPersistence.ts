"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface FormPersistenceOptions<T> {
  /** Eindeutige ID für den Draft (z.B. customerId_formType) */
  draftKey: string
  /** Formular-Daten */
  formData: T
  /** Callback zum Speichern der Daten */
  onSave: (data: T) => Promise<void>
  /** Debounce-Zeit in ms (Standard: 500) */
  debounceMs?: number
  /** Storage-Typ (Standard: localStorage) */
  storageType?: 'localStorage' | 'sessionStorage'
  /** Maximales Alter des Drafts in Stunden (Standard: 24) */
  maxAgeHours?: number
  /** Callback wenn ungespeicherte Änderungen gefunden werden */
  onDraftFound?: (hasDraft: boolean) => void
}

export interface DraftData<T> {
  data: T
  timestamp: number
  version?: string
}

/**
 * Hook für automatische Formular-Persistenz
 * 
 * Features:
 * - Auto-Save mit Debounce
 * - Restore von Draft-Daten
 * - Cleanup nach erfolgreichem Speichern
 * - Warnung beim Tab-Wechsel
 */
export function useFormPersistence<T extends Record<string, any>>({
  draftKey,
  formData,
  onSave,
  debounceMs = 500,
  storageType = 'localStorage',
  maxAgeHours = 24,
  onDraftFound,
}: FormPersistenceOptions<T>) {
  const router = useRouter()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [draftData, setDraftData] = useState<T | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)
  const lastSavedDataRef = useRef<string>('')
  const hasRestoredRef = useRef(false)

  const storage = typeof window !== 'undefined' 
    ? (storageType === 'localStorage' ? localStorage : sessionStorage)
    : null

  /**
   * Generiert den Storage-Key
   */
  const getStorageKey = useCallback(() => {
    return `form_draft_${draftKey}`
  }, [draftKey])

  /**
   * Speichert Draft-Daten im Storage
   */
  const saveDraft = useCallback((data: T) => {
    if (!storage) return

    try {
      const draft: DraftData<T> = {
        data,
        timestamp: Date.now(),
        version: '1.0',
      }
      storage.setItem(getStorageKey(), JSON.stringify(draft))
      setHasUnsavedChanges(true)
    } catch (error) {
      console.error('Fehler beim Speichern des Drafts:', error)
    }
  }, [storage, getStorageKey])

  /**
   * Lädt Draft-Daten aus dem Storage
   */
  const loadDraft = useCallback((): DraftData<T> | null => {
    if (!storage) return null

    try {
      const stored = storage.getItem(getStorageKey())
      if (!stored) return null

      const draft: DraftData<T> = JSON.parse(stored)
      
      // Prüfe ob Draft zu alt ist
      const ageHours = (Date.now() - draft.timestamp) / (1000 * 60 * 60)
      if (ageHours > maxAgeHours) {
        storage.removeItem(getStorageKey())
        return null
      }

      return draft
    } catch (error) {
      console.error('Fehler beim Laden des Drafts:', error)
      return null
    }
  }, [storage, getStorageKey, maxAgeHours])

  /**
   * Löscht Draft-Daten
   */
  const clearDraft = useCallback(() => {
    if (!storage) return

    try {
      storage.removeItem(getStorageKey())
      setHasUnsavedChanges(false)
      setDraftData(null)
    } catch (error) {
      console.error('Fehler beim Löschen des Drafts:', error)
    }
  }, [storage, getStorageKey])

  /**
   * Prüft ob sich Daten geändert haben
   */
  const hasDataChanged = useCallback((newData: T): boolean => {
    const newDataString = JSON.stringify(newData)
    return newDataString !== lastSavedDataRef.current
  }, [])

  /**
   * Auto-Save mit Debounce
   */
  useEffect(() => {
    // Überspringe initiales Laden
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      lastSavedDataRef.current = JSON.stringify(formData)
      return
    }

    // Überspringe wenn bereits wiederhergestellt wurde
    if (hasRestoredRef.current) {
      hasRestoredRef.current = false
      lastSavedDataRef.current = JSON.stringify(formData)
      return
    }

    // Prüfe ob sich Daten geändert haben
    if (!hasDataChanged(formData)) {
      return
    }

    // Debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      saveDraft(formData)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [formData, saveDraft, debounceMs, hasDataChanged])

  /**
   * Prüfe beim Mounten ob Draft existiert
   */
  useEffect(() => {
    const draft = loadDraft()
    if (draft && !hasRestoredRef.current) {
      setDraftData(draft.data)
      setShowRestoreDialog(true)
      if (onDraftFound) {
        onDraftFound(true)
      }
    }
  }, [loadDraft, onDraftFound]) // Nur beim Mounten

  /**
   * Warnung beim Tab-Wechsel
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // Chrome benötigt returnValue
        return ''
      }
    }

    const handleRouteChange = () => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'Sie haben ungespeicherte Änderungen. Wirklich fortfahren?'
        )
        if (!confirmed) {
          router.refresh() // Verhindere Navigation
          throw new Error('Navigation abgebrochen')
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, router])

  /**
   * Wiederherstellen der Draft-Daten
   */
  const restoreDraft = useCallback((data: T) => {
    hasRestoredRef.current = true
    setShowRestoreDialog(false)
    setDraftData(null)
    // Die Daten werden vom Parent-Component übernommen
    return data
  }, [])

  /**
   * Draft verwerfen
   */
  const discardDraft = useCallback(() => {
    clearDraft()
    setShowRestoreDialog(false)
    setDraftData(null)
  }, [clearDraft])

  /**
   * Manuelles Speichern (löscht Draft nach Erfolg)
   */
  const saveAndClearDraft = useCallback(async (data?: T) => {
    try {
      await onSave(data || formData)
      clearDraft()
      lastSavedDataRef.current = JSON.stringify(data || formData)
      setHasUnsavedChanges(false)
    } catch (error) {
      // Bei Fehler Draft behalten
      throw error
    }
  }, [onSave, formData, clearDraft])

  return {
    /** Draft-Daten (falls vorhanden) */
    draftData,
    /** Zeigt Restore-Dialog an */
    showRestoreDialog,
    /** Hat ungespeicherte Änderungen */
    hasUnsavedChanges,
    /** Wiederherstellen der Draft-Daten */
    restoreDraft,
    /** Draft verwerfen */
    discardDraft,
    /** Manuelles Speichern mit Draft-Cleanup */
    saveAndClearDraft,
    /** Draft manuell löschen */
    clearDraft,
  }
}

