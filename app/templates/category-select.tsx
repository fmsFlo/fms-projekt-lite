"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  templateId: string
  currentCategory: string | null
  categories: string[]
}

export default function TemplateCategorySelect({ templateId, currentCategory, categories }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentCategory || '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const allCategories = Array.from(new Set(['Honorarberatung', 'Kundenverwaltung (Kündigungen, Beitragsfreistellungen etc.)', 'Sonstige', ...categories])).sort()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCategory = e.target.value || null
    setSelected(newCategory || '')
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/templates/${templateId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: newCategory || undefined }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json?.message || 'Kategorie konnte nicht aktualisiert werden')
        }
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Aktualisierung fehlgeschlagen')
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={selected}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-md px-3 py-1.5 text-xs focus:outline-none transition-all"
        style={{
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
          minWidth: '200px'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--color-primary-rgb, 0, 113, 227), 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <option value="">(Keine Kategorie)</option>
        {allCategories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      {isPending && <span className="text-[10px]" style={{ color: 'var(--color-primary)' }}>Aktualisiere…</span>}
      {error && <span className="text-[10px]" style={{ color: 'var(--color-error)' }}>{error}</span>}
    </div>
  )
}

