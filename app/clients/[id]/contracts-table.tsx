"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import DeleteContractButton from './delete-contract-button'

type ContractRow = {
  id: string
  createdAt: string
  templateSlug: string
  sevdeskInvoiceId?: string | null
  sevdeskInvoiceNumber?: string | null
}

export default function ContractsTable({ contracts }: { contracts: ContractRow[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const headerCheckboxRef = useRef<HTMLInputElement>(null)

  const contractMap = useMemo(() => {
    return new Map(contracts.map((contract) => [contract.id, contract]))
  }, [contracts])

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => contractMap.has(id)))
  }, [contractMap])

  useEffect(() => {
    if (!headerCheckboxRef.current) return
    headerCheckboxRef.current.indeterminate =
      selectedIds.length > 0 && selectedIds.length < contracts.length
  }, [selectedIds, contracts.length])

  const allSelected =
    contracts.length > 0 && selectedIds.length === contracts.length

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(contracts.map((contract) => contract.id))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]
    )
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0 || bulkDeleting) return

    const confirmText =
      selectedIds.length === 1
        ? 'Soll der ausgewählte Eintrag wirklich gelöscht werden?'
        : `Sollen die ${selectedIds.length} ausgewählten Einträge wirklich gelöscht werden?`

    if (!confirm(confirmText)) return

    setBulkDeleting(true)
    try {
      const res = await fetch('/api/contracts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Löschen fehlgeschlagen')
      }

      window.location.reload()
    } catch (err: any) {
      alert(`Fehler beim Löschen: ${err.message || err}`)
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 py-2 border-b" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {contracts.length === 0
            ? 'Keine Einträge vorhanden'
            : `${contracts.length} Einträge`}
          {selectedIds.length > 0 && (
            <span className="ml-2" style={{ color: 'var(--color-primary)' }}>
              ({selectedIds.length} ausgewählt)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0 || bulkDeleting}
            className="px-3 py-1.5 text-sm rounded-md text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            {bulkDeleting
              ? 'Lösche…'
              : selectedIds.length <= 1
              ? 'Ausgewählten löschen'
              : `Ausgewählte löschen (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
            <tr>
              <th className="w-10 p-2">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded focus:ring-2"
                  style={{ 
                    accentColor: 'var(--color-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                />
              </th>
              <th className="p-2" style={{ color: 'var(--color-text-secondary)' }}>Erstellt</th>
              <th className="p-2" style={{ color: 'var(--color-text-secondary)' }}>Template</th>
              <th className="p-2" style={{ color: 'var(--color-text-secondary)' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody style={{ borderColor: 'var(--color-border)' }}>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  Keine Verträge
                </td>
              </tr>
            ) : (
              contracts.map((contract, idx) => {
                const isChecked = selectedIds.includes(contract.id)
                return (
                  <tr 
                    key={contract.id} 
                    className="border-t transition-colors"
                    style={{ 
                      backgroundColor: idx % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)'
                    }}
                  >
                    <td className="p-2 align-top">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(contract.id)}
                        className="w-4 h-4 rounded focus:ring-2"
                        style={{ 
                          accentColor: 'var(--color-primary)',
                          borderColor: 'var(--color-border)'
                        }}
                      />
                    </td>
                    <td className="p-2 align-top" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(contract.createdAt).toLocaleString('de-DE')}
                    </td>
                    <td className="p-2 align-top">
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{contract.templateSlug}</div>
                      {contract.sevdeskInvoiceNumber && (
                        <div className="text-xs mt-1" style={{ color: 'var(--color-success)' }}>
                          💰 Rechnung: {contract.sevdeskInvoiceNumber}
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      <div className="flex items-center gap-2">
                        <a
                          className="text-sm hover:underline"
                          href={`/contracts/${contract.id}`}
                          style={{ color: 'var(--color-primary)' }}
                        >
                          Details
                        </a>
                        <span style={{ color: 'var(--color-border)' }}>|</span>
                        <a
                          className="text-sm hover:underline"
                          href={`/api/contracts/${contract.id}/pdf`}
                          style={{ color: 'var(--color-primary)' }}
                        >
                          PDF
                        </a>
                        {contract.sevdeskInvoiceId && (
                          <>
                            <span style={{ color: 'var(--color-border)' }}>|</span>
                            <a
                              className="text-sm hover:underline"
                              href={`https://my.sevdesk.de/#/Invoice/${contract.sevdeskInvoiceId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              Sevdesk
                            </a>
                          </>
                        )}
                        <span style={{ color: 'var(--color-border)' }}>|</span>
                        <DeleteContractButton contractId={contract.id} />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 p-3">
        {contracts.length === 0 ? (
          <div className="p-4 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            Keine Verträge
          </div>
        ) : (
          contracts.map((contract, idx) => {
            const isChecked = selectedIds.includes(contract.id)
            return (
              <div
                key={contract.id}
                className="border rounded-lg p-3 space-y-2"
                style={{
                  backgroundColor: idx % 2 === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(contract.id)}
                      className="w-4 h-4 rounded shrink-0"
                      style={{ 
                        accentColor: 'var(--color-primary)',
                        borderColor: 'var(--color-border)'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm break-words" style={{ color: 'var(--color-text-primary)' }}>
                        {contract.templateSlug}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(contract.createdAt).toLocaleString('de-DE')}
                      </div>
                      {contract.sevdeskInvoiceNumber && (
                        <div className="text-xs mt-1" style={{ color: 'var(--color-success)' }}>
                          💰 Rechnung: {contract.sevdeskInvoiceNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <a
                    className="text-sm hover:underline px-2 py-1 rounded"
                    href={`/contracts/${contract.id}`}
                    style={{ 
                      color: 'var(--color-primary)',
                      backgroundColor: 'rgba(var(--color-primary-rgb, 0, 113, 227), 0.1)'
                    }}
                  >
                    Details
                  </a>
                  <a
                    className="text-sm hover:underline px-2 py-1 rounded"
                    href={`/api/contracts/${contract.id}/pdf`}
                    style={{ 
                      color: 'var(--color-primary)',
                      backgroundColor: 'rgba(var(--color-primary-rgb, 0, 113, 227), 0.1)'
                    }}
                  >
                    PDF
                  </a>
                  {contract.sevdeskInvoiceId && (
                    <a
                      className="text-sm hover:underline px-2 py-1 rounded"
                      href={`https://my.sevdesk.de/#/Invoice/${contract.sevdeskInvoiceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: 'var(--color-primary)',
                        backgroundColor: 'rgba(var(--color-primary-rgb, 0, 113, 227), 0.1)'
                      }}
                    >
                      Sevdesk
                    </a>
                  )}
                  <DeleteContractButton contractId={contract.id} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}








