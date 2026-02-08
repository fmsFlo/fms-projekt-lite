import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderHandlebarsToHtml, htmlToPdf } from '@/lib/pdf'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 Minuten Cache für PDF-Generierung

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const contract = await prisma.contract.findUnique({ where: { id: params.id } })
  if (!contract) return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
  const client = await prisma.client.findUnique({ where: { id: contract.clientId } })
  if (!client) return NextResponse.json({ message: 'Client fehlt' }, { status: 404 })

  const companySettings = await prisma.companySettings.findFirst()
  let vars: any = {}
  try { vars = JSON.parse(contract.variables || '{}') } catch { vars = {} }
  
  // Berechne Gesamthonorar aus einzelnen Personen
  const amount1 = parseFloat(vars['amountEUR'] as string) || 0
  const amount2 = parseFloat(vars['person2Amount'] as string) || 0
  const amount3 = parseFloat(vars['person3Amount'] as string) || 0
  const calculatedTotal = amount1 + amount2 + amount3
  if (calculatedTotal > 0 && !vars['totalAmount']) {
    vars['totalAmount'] = calculatedTotal.toFixed(2)
  }
  
  // Berechne Ratenhöhe wenn nötig (nutze Gesamthonorar wenn vorhanden)
  const paymentMethod = vars['paymentMethod'] as string
  const paymentFrequency = vars['paymentFrequency'] as string
  if (paymentMethod === 'Lastschrift' && 
      (paymentFrequency === 'Ratenzahlung' || paymentFrequency === 'Ratenzahlung mit erhöhter Startzahlung')) {
    const totalAmount = parseFloat(vars['totalAmount'] as string) || parseFloat(vars['amountEUR'] as string) || 0
    const numRates = parseInt(vars['numberOfInstallments'] as string) || 0
    const startAmount = parseFloat(vars['increasedStartAmount'] as string) || 0
    const remainingAmount = totalAmount - startAmount
    const installmentAmount = numRates > 0 ? (remainingAmount / numRates) : 0
    vars['installmentAmount'] = installmentAmount.toFixed(2)
  }
  
  // Füge IBAN-Informationen hinzu
  if (paymentMethod === 'Lastschrift') {
    vars['clientIban'] = client.iban || ''
  }
  if (paymentMethod === 'Überweisung') {
    vars['advisorIban'] = companySettings?.advisorIban || ''
    vars['paymentSubject'] = companySettings?.paymentSubject || 
      `${companySettings?.companyName || companySettings?.personalName || 'Vertrag'} - ${client.lastName || 'Kunde'}`
  }
  
  // Konvertiere Datumsfelder von YYYY-MM-DD zu TAG.MONAT.JAHR (falls noch nicht formatiert)
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return ''
    const str = String(dateStr)
    // Prüfe ob es im Format YYYY-MM-DD ist
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      try {
        const date = new Date(str)
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          return `${day}.${month}.${year}`
        }
      } catch {}
    }
    // Wenn bereits formatiert (Punkte oder Semikolons), umwandeln zu Punkten
    if (str.includes(';')) {
      return str.replace(/;/g, '.')
    }
    // Wenn bereits mit Punkten formatiert, einfach zurückgeben
    return str
  }
  
  const dateFields = ['bookingStart', 'applicationDate', 'terminationDate', 'handoverDate', 'lastWorkingDay', 'effectiveDate', 'responseDeadline', 'sepaRevocationDate', 'contactDate']
  const formattedVars: Record<string, any> = { ...vars }
  for (const field of dateFields) {
    if (formattedVars[field]) {
      formattedVars[field] = formatDate(formattedVars[field])
    }
  }
  
  const recipientAddressLines = (() => {
    const raw = formattedVars.recipientAddress || vars['recipientAddress']
    if (!raw) return []
    return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => Boolean(s) && !/^deutschland$/i.test(s))
  })()

  const requestedDocsRaw = formattedVars.requestedDocuments || vars['requestedDocuments']
  const requestedDocumentList = requestedDocsRaw
    ? String(requestedDocsRaw)
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  const data = { 
    client: {
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      street: client.street,
      houseNumber: client.houseNumber,
      zip: client.zip,
      city: client.city,
      iban: client.iban
    },
    ...formattedVars,
    date: new Date().toLocaleDateString('de-DE').replace(/\//g, '.'),
    recipientAddressLines,
    requestedDocumentList,
    companySettings: companySettings || {}
  }
  const html = await renderHandlebarsToHtml(contract.templateSlug, data)
  const pdf = await htmlToPdf(html)

  const getLastNameForFilename = (lastName: string): string => {
    const trimmed = (lastName || '').trim()
    if (!trimmed) return 'Unbekannt'
    const parts = trimmed.split(/\s+/)
    return parts[parts.length - 1]
  }

  const sanitizeForFilename = (value: string): string => {
    const map: Record<string, string> = {
      Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss'
    }
    const replaced = value.replace(/[ÄÖÜäöüß]/g, (char) => map[char] || char)
    return replaced
      .normalize('NFD')
      .replace(/[^a-zA-Z0-9-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 60)
  }

  const shortenTemplateName = (name: string): string => {
    const lower = name.toLowerCase()
    if (lower.includes('beitragsfreistellung') && lower.includes('sepa')) return 'BTFSEPA'
    if (lower.includes('beitragsfreistellung')) return 'BTF'
    if (lower.includes('kündigung') && lower.includes('auszahlung')) return 'Kuendi'
    if (lower.includes('kündigung')) return 'Kuendi'
    if (lower.includes('beitragsänderung') || lower.includes('beitragsaenderung')) return 'BANDR'
    if (lower.includes('kontaktsperre')) return 'KONTS'
    if (lower.includes('unterlagen')) return 'SERV'
    if (lower.includes('erstkontakt')) return 'ERST'
    return sanitizeForFilename(name)
  }

  const shortenRecipientName = (name: string): string => {
    const trimmed = name.trim()
    const upper = trimmed.toUpperCase()
    if (upper.startsWith('LBS')) return 'LBS'
    return sanitizeForFilename(trimmed).toUpperCase()
  }
  
  // Generiere Dateinamen falls nicht vorhanden
  let fileName = contract.pdfFileName
  if (!fileName) {
    const lastName = getLastNameForFilename(client.lastName || '')
    const template = await prisma.contractTemplate.findUnique({ where: { slug: contract.templateSlug } })
    const templateName = template?.name || 'Vertrag'
    
    // Spezielle Formatierung für Beratungsprotokoll
    if (contract.templateSlug === 'beratungsprotokoll') {
      // Extrahiere Produktart aus Variablen
      const productType = vars['customerWishesProductType'] || vars['riskAssessmentProductType'] || vars['adviceAndReasoningProductType'] || 'Produkt'
      const sanitizedLastName = lastName.replace(/[^a-zA-Z0-9äöüÄÖÜß-]/g, '_')
      const sanitizedProduct = String(productType).replace(/[^a-zA-Z0-9äöüÄÖÜß-]/g, '_')
      fileName = `${sanitizedLastName}-Beratungsprotokoll-${sanitizedProduct}.pdf`
    } else {
      // Standard-Formatierung für andere Templates
      const sanitizedLastName = sanitizeForFilename(lastName)
      const fileCodeRaw = formattedVars.fileNameCode || vars['fileNameCode']
      const sanitizedTemplateName = fileCodeRaw
        ? sanitizeForFilename(String(fileCodeRaw))
        : shortenTemplateName(templateName)
      const recipientRaw = formattedVars.recipientCompany || vars['recipientCompany']
      let recipientCode = recipientRaw ? shortenRecipientName(String(recipientRaw)) : ''
      if (recipientCode.length > 5) {
        recipientCode = recipientCode.slice(0, 5)
      }

      if (recipientCode) {
        fileName = `${sanitizedLastName}_${sanitizedTemplateName}_${recipientCode}.pdf`
      } else {
        fileName = `${sanitizedLastName}_${sanitizedTemplateName}.pdf`
      }
    }
  }
  
  // URL-encode Dateinamen für Content-Disposition
  const encodedFileName = encodeURIComponent(fileName)
  
  return new NextResponse(pdf as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`
    }
  })
}

