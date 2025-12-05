"use client"
import { useState } from 'react'

export default function ChargeButton({ 
  contractId, 
  hasMandate, 
  mandateStatus,
  defaultAmount 
}: { 
  contractId: string
  hasMandate: boolean
  mandateStatus: string | null
  defaultAmount?: number
}) {
  const [charging, setCharging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [amount, setAmount] = useState(defaultAmount?.toString() || '')
  const [description, setDescription] = useState('')

  async function handleCharge() {
    if (!hasMandate || mandateStatus !== 'active') {
      setError('Kein aktives SEPA-Mandat für diesen Vertrag gefunden.')
      return
    }

    const paymentAmount = parseFloat(amount)
    if (!paymentAmount || paymentAmount <= 0) {
      setError('Bitte geben Sie einen gültigen Betrag ein.')
      return
    }

    setCharging(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/contracts/${contractId}/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'eur',
          description: description || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Zahlung fehlgeschlagen')
      }

      const data = await res.json()
      setSuccess(true)
      setAmount('')
      setDescription('')
      
      // Zeige Erfolg für 5 Sekunden
      setTimeout(() => {
        setSuccess(false)
        window.location.reload()
      }, 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    } finally {
      setCharging(false)
    }
  }

  if (!hasMandate) {
    return (
      <section className="border rounded p-6 space-y-4 bg-gray-50">
        <h2 className="text-lg font-semibold">SEPA-Zahlung initiieren</h2>
        <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p className="text-sm">
            ⚠️ Kein SEPA-Mandat vorhanden. Bitte laden Sie zuerst das unterschriebene Dokument hoch, 
            um automatisch ein SEPA-Mandat in Stripe zu erstellen.
          </p>
        </div>
      </section>
    )
  }

  if (mandateStatus !== 'active') {
    return (
      <section className="border rounded p-6 space-y-4 bg-gray-50">
        <h2 className="text-lg font-semibold">SEPA-Zahlung initiieren</h2>
        <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p className="text-sm">
            ⚠️ SEPA-Mandat ist nicht aktiv. Status: {mandateStatus || 'unbekannt'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="border rounded p-6 space-y-4 bg-white">
      <h2 className="text-lg font-semibold">SEPA-Zahlung initiieren</h2>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ Zahlung erfolgreich initiiert! Die Lastschrift wird innerhalb von 5 Bankarbeitstagen abgebucht.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Betrag (EUR) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="0.00"
            disabled={charging}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Beschreibung (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="z.B. Rechnungsnummer oder Vertragsreferenz"
            disabled={charging}
          />
        </div>

        <button
          onClick={handleCharge}
          disabled={charging || !amount || parseFloat(amount) <= 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {charging ? 'Initiiere Zahlung...' : '💰 SEPA-Lastschrift initiieren'}
        </button>

        <p className="text-xs text-gray-500">
          Die Zahlung wird über Stripe als SEPA Direct Debit eingezogen. 
          Die Abbuchung erfolgt innerhalb von 5 Bankarbeitstagen.
        </p>
      </div>
    </section>
  )
}

