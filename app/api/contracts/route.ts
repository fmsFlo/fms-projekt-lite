import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { renderHandlebarsToHtml, htmlToPdf } from '@/lib/pdf'

const schema = z.object({
  clientId: z.string().min(1),
  templateSlug: z.string().min(1),
  variables: z.record(z.any()).default({})
})

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json())
    const client = await prisma.client.findUnique({ where: { id: input.clientId } })
    if (!client) return NextResponse.json({ message: 'Client nicht gefunden' }, { status: 404 })

    const template = await prisma.contractTemplate.findUnique({ where: { slug: input.templateSlug } })
    if (!template) return NextResponse.json({ message: 'Template nicht gefunden' }, { status: 404 })

    const companySettings = await prisma.companySettings.findFirst()
    const today = new Date().toLocaleDateString('de-DE')
    
    // Konvertiere Datum-Variablen von YYYY-MM-DD zu TAG.MONAT.JAHR
    const formatDate = (dateStr: string | undefined): string => {
      if (!dateStr) return ''
      try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return dateStr
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}.${month}.${year}`
      } catch {
        return dateStr
      }
    }
    
    const formattedVars: Record<string, any> = {}
    for (const [key, value] of Object.entries(input.variables)) {
      if (
        key === 'bookingStart' ||
        key === 'applicationDate' ||
        key === 'terminationDate' ||
        key === 'handoverDate' ||
        key === 'lastWorkingDay' ||
        key === 'effectiveDate' ||
        key === 'responseDeadline' ||
        key === 'sepaRevocationDate' ||
        key === 'contactDate'
      ) {
        formattedVars[key] = formatDate(value as string)
      } else {
        formattedVars[key] = value
      }
    }
    
    // Berechne Gesamthonorar aus einzelnen Personen
    const amount1 = parseFloat(input.variables['amountEUR'] as string) || 0
    const amount2 = parseFloat(input.variables['person2Amount'] as string) || 0
    const amount3 = parseFloat(input.variables['person3Amount'] as string) || 0
    const calculatedTotal = amount1 + amount2 + amount3
    if (calculatedTotal > 0 && !input.variables['totalAmount']) {
      formattedVars['totalAmount'] = calculatedTotal.toFixed(2)
    }
    
    // Berechne Ratenhöhe wenn nötig (nutze Gesamthonorar wenn vorhanden)
    const paymentMethod = input.variables['paymentMethod'] as string
    const paymentFrequency = input.variables['paymentFrequency'] as string
    if (paymentMethod === 'Lastschrift' && 
        (paymentFrequency === 'Ratenzahlung' || paymentFrequency === 'Ratenzahlung mit erhöhter Startzahlung')) {
      const totalAmount = parseFloat(input.variables['totalAmount'] as string) || parseFloat(input.variables['amountEUR'] as string) || 0
      const numRates = parseInt(input.variables['numberOfInstallments'] as string) || 0
      const startAmount = parseFloat(input.variables['increasedStartAmount'] as string) || 0
      const remainingAmount = totalAmount - startAmount
      const installmentAmount = numRates > 0 ? (remainingAmount / numRates) : 0
      formattedVars['installmentAmount'] = installmentAmount.toFixed(2)
    }
    
    // Füge IBAN-Informationen hinzu
    if (paymentMethod === 'Lastschrift') {
      // IBAN des Kunden aus Client-Daten
      formattedVars['clientIban'] = client.iban || ''
    }
    if (paymentMethod === 'Überweisung') {
      // IBAN des Beraters aus CompanySettings
      formattedVars['advisorIban'] = companySettings?.advisorIban || ''
      // Verwendungszweck aus CompanySettings oder generiert
      formattedVars['paymentSubject'] = companySettings?.paymentSubject || 
        `${companySettings?.companyName || companySettings?.personalName || 'Vertrag'} - ${client.lastName || 'Kunde'}`
    }
    
    const renderData = { 
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
      date: today,
      companySettings: companySettings || {}
    }
    console.log('🔍 Rendering Template:', input.templateSlug)
    console.log('🔍 Render Data Keys:', Object.keys(renderData))
    console.log('🔍 Formatted Vars:', formattedVars)
    
    let html: string
    try {
      html = await renderHandlebarsToHtml(input.templateSlug, renderData)
      console.log('✅ HTML rendered successfully, length:', html.length)
    } catch (templateErr: any) {
      console.error('❌ Template rendering error:', templateErr)
      return NextResponse.json({ 
        message: 'Fehler beim Rendern des Templates', 
        error: templateErr.message,
        details: String(templateErr)
      }, { status: 500 })
    }
    
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await htmlToPdf(html)
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length)
    } catch (pdfErr: any) {
      console.error('❌ PDF generation error:', pdfErr)
      return NextResponse.json({ 
        message: 'Fehler beim Generieren des PDFs', 
        error: pdfErr.message,
        details: String(pdfErr)
      }, { status: 500 })
    }

    const contract = await prisma.contract.create({
      data: {
        clientId: client.id,
        templateSlug: input.templateSlug,
        variables: JSON.stringify(input.variables),
        pdfFileName: null
      }
    })

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

    const lastName = getLastNameForFilename(client.lastName || '')
    const sanitizedLastName = sanitizeForFilename(lastName)
    const fileCodeRaw = formattedVars['fileNameCode'] || input.variables['fileNameCode']
    const templateNameShort = fileCodeRaw
      ? sanitizeForFilename(String(fileCodeRaw))
      : shortenTemplateName(template.name || 'Vertrag')
    const recipientRaw = formattedVars['recipientCompany'] || input.variables['recipientCompany']
    let recipientCode = recipientRaw ? shortenRecipientName(String(recipientRaw)) : ''
    if (recipientCode.length > 5) recipientCode = recipientCode.slice(0, 5)

    const generatedFileName = recipientCode
      ? `${sanitizedLastName}_${templateNameShort}_${recipientCode}.pdf`
      : `${sanitizedLastName}_${templateNameShort}.pdf`

    await prisma.contract.update({
      where: { id: contract.id },
      data: { pdfFileName: generatedFileName }
    })

    // Return the id; PDF is downloadable via dedicated route
    return NextResponse.json({ contractId: contract.id })
  } catch (err: any) {
    console.error('❌ Contract creation error:', err)
    console.error('❌ Error stack:', err?.stack)
    console.error('❌ Error details:', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      cause: err?.cause
    })
    
    if (err?.name === 'ZodError') {
      return NextResponse.json({ 
        message: 'Ungültige Eingabe', 
        issues: err.issues,
        details: err.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')
      }, { status: 400 })
    }
    if (err?.code === 'ENOENT') {
      return NextResponse.json({ 
        message: 'Template-Datei nicht gefunden. Bitte Template erstellen.', 
        error: err.message,
        templateSlug: parsedInput.templateSlug,
        filePath: `templates/contracts/${parsedInput.templateSlug}.hbs`
      }, { status: 404 })
    }
    return NextResponse.json({ 
      message: 'Interner Fehler', 
      error: err.message || String(err),
      details: err?.stack || String(err)
    }, { status: 500 })
  }
}

