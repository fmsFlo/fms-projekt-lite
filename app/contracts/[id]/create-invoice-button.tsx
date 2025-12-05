"use client"
import { useState } from 'react'

interface InvoiceFormData {
  invoiceDate: string
  deliveryDate: string
  paymentTerms: string
  positions: Array<{
    description: string
    subDescription?: string
    quantity: number
    unitPrice: number
    discount?: number
    taxRate: number
  }>
  subject?: string  // ✅ NEU: Betreff
  header?: string   // ✅ Kopftext (Haupttext)
  footText?: string
}

export default function CreateInvoiceButton({ 
  contractId,
  hasSevdeskToken,
  defaultAmount,
  clientName,
  contractVariables
}: { 
  contractId: string
  hasSevdeskToken: boolean
  defaultAmount?: number
  clientName?: string
  contractVariables?: Record<string, any>
}) {
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Formular-Daten
  // Parse contract variables für Auto-Fill
  const productProvider = contractVariables?.productProvider || ''
  const productDescription = contractVariables?.productDescription || ''
  const totalAmount = contractVariables?.totalAmount || contractVariables?.amountEUR || defaultAmount || 0
  
  // Erstelle automatische Zusatzbeschreibung aus Vertragsvariablen
  const autoSubDescription = clientName && productDescription 
    ? `${clientName} für Honorarpolice - ${productDescription}${productProvider ? ' - ' + productProvider : ''}`
    : contractVariables?.productDescription 
      ? `${contractVariables.productDescription}${productProvider ? ' - ' + productProvider : ''}`
      : ''

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentTerms, setPaymentTerms] = useState('7') // Tage
  const [description, setDescription] = useState('Honorarvermittlung Netto Police')
  const [subDescription, setSubDescription] = useState(autoSubDescription)
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState(totalAmount?.toString() || '')
  const [discount, setDiscount] = useState('0')
  const [subject, setSubject] = useState('Rechnung Nr. ') // ✅ Vorausgefüllt mit "Rechnung Nr. "
  const [header, setHeader] = useState('Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!\n\nHiermit stelle ich Ihnen die folgenden Leistungen in Rechnung:') // ✅ Vorgefertigter Text
  const [footText, setFootText] = useState('Vielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!')

  async function handleCreateInvoice() {
    if (!hasSevdeskToken) {
      setError('Sevdesk API Token nicht konfiguriert. Bitte tragen Sie Ihren Token in den Einstellungen ein.')
      return
    }

    setCreating(true)
    setError(null)
    setSuccess(false)

    try {
      // Berechne Gesamtpreis
      const qty = parseFloat(quantity) || 1
      const price = parseFloat(unitPrice) || 0
      const disc = parseFloat(discount) || 0
      const totalPrice = price - disc

      if (totalPrice <= 0) {
        setError('Bitte geben Sie einen gültigen Betrag ein.')
        setCreating(false)
        return
      }

      const response = await fetch(`/api/contracts/${contractId}/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceDate,
          deliveryDate,
          paymentTerms: parseInt(paymentTerms),
          positions: [{
            description,
            subDescription: subDescription || undefined,
            quantity: qty,
            unitPrice: price,
            discount: disc > 0 ? disc : undefined,
            taxRate: 0, // Nach § 4 Abs. 11 UStG umsatzsteuerfrei
          }],
          subject: subject || undefined,  // ✅ NEU: Betreff
          header,                         // ✅ Kopftext
          footText,
          status: 100, // 100 = Entwurf (Draft)
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        // Erstelle eine detaillierte Fehlermeldung
        let errorMessage = data.message || data.error || 'Fehler beim Erstellen der Rechnung'
        
        // Füge Details hinzu, wenn vorhanden
        if (data.error && data.error !== errorMessage) {
          errorMessage += `\n\nDetails: ${typeof data.error === 'string' ? data.error : JSON.stringify(data.error)}`
        }
        if (data.details) {
          errorMessage += `\n\nTechnische Details: ${data.details}`
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setSuccess(true)
      setShowForm(false)
      
      setTimeout(() => {
        setSuccess(false)
        window.location.reload()
      }, 3000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    } finally {
      setCreating(false)
    }
  }

  if (!hasSevdeskToken) {
    return (
      <section className="border rounded p-6 space-y-4 bg-gray-50">
        <h2 className="text-lg font-semibold">Rechnung in Sevdesk erstellen</h2>
        <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p className="text-sm">
            ⚠️ Sevdesk API Token nicht konfiguriert. Bitte tragen Sie Ihren Token in den Einstellungen ein.
          </p>
        </div>
      </section>
    )
  }

  if (!showForm) {
    return (
      <section className="border rounded p-6 space-y-4 bg-white">
        <h2 className="text-lg font-semibold">Rechnung in Sevdesk erstellen</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          📄 Rechnung als Entwurf erstellen
        </button>
        <p className="text-xs text-gray-500">
          Erstellt eine Rechnung in Sevdesk als Entwurf. Sie können sie später in Sevdesk überarbeiten und versenden.
        </p>
      </section>
    )
  }

  return (
    <section className="border rounded p-6 space-y-4 bg-white">
      <h2 className="text-lg font-semibold">Rechnung in Sevdesk erstellen</h2>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ✅ Rechnung erfolgreich in Sevdesk als Entwurf erstellt!
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rechnungsdatum *</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Lieferdatum *</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Zahlungsbedingungen (Tage) *</label>
          <input
            type="number"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="7"
            min="1"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Anzahl Tage bis zur Fälligkeit</p>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-md font-semibold mb-3">Rechnungsposition</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Beschreibung *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="z.B. Honorarvermittlung Netto Police"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Zusatzbeschreibung (optional)</label>
              <input
                type="text"
                value={subDescription}
                onChange={(e) => setSubDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="z.B. Sonja Vogtmann für Honorarpolice - FR10 - Alte Leipziger"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Menge</label>
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="1"
                  min="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Einzelpreis (EUR) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rabatt (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="0.00"
                  min="0"
                />
              </div>
            </div>

            {parseFloat(unitPrice) > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm">
                  <strong>Gesamtpreis:</strong> {
                    (parseFloat(quantity) || 1) * (parseFloat(unitPrice) || 0) - (parseFloat(discount) || 0)
                  } EUR
                </p>
                {parseFloat(discount) > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    Einzelpreis: {parseFloat(unitPrice) || 0} EUR × {parseFloat(quantity) || 1} 
                    {' - '} Rabatt: {parseFloat(discount) || 0} EUR
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-md font-semibold mb-3">Kopftext</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Betreff</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Rechnung Nr. RE112522"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Text</label>
              <textarea
                value={header}
                onChange={(e) => setHeader(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows={5}
                placeholder="Sehr geehrte Damen und Herren,..."
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fußtext</label>
          <textarea
            value={footText}
            onChange={(e) => setFootText(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            rows={3}
            placeholder="Vielen Dank für Ihren Auftrag..."
          />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={handleCreateInvoice}
            disabled={creating || !unitPrice || parseFloat(unitPrice) <= 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Erstelle...' : '📄 Als Entwurf in Sevdesk erstellen'}
          </button>
          <button
            onClick={() => {
              setShowForm(false)
              setError(null)
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </section>
  )
}

