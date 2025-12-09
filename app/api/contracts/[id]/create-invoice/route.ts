import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateSevdeskContact, createSevdeskInvoice, calculateStripeFees } from '@/lib/sevdesk'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

interface Params { params: { id: string } }

const invoiceSchema = z.object({
  invoiceDate: z.string(),
  deliveryDate: z.string(),
  paymentTerms: z.number().min(1),
  positions: z.array(z.object({
    description: z.string(),
    subDescription: z.string().optional(),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).optional(),
    taxRate: z.number(),
  })),
  subject: z.string().optional(), // ✅ NEU: Betreff
  header: z.string().optional(),  // ✅ Kopftext (Haupttext)
  footText: z.string().optional(),
  status: z.number().optional(), // 100 = Entwurf (Draft)
})

export async function POST(req: Request, { params }: Params) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: { client: true }
    })

    if (!contract) {
      return NextResponse.json({ message: 'Vertrag nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob bereits eine Rechnung existiert
    if (contract.sevdeskInvoiceId) {
      return NextResponse.json({ 
        message: 'Für diesen Vertrag wurde bereits eine Rechnung erstellt',
        invoiceId: contract.sevdeskInvoiceId,
        invoiceNumber: contract.sevdeskInvoiceNumber,
      }, { status: 400 })
    }

    const body = await req.json()
    const invoiceData = invoiceSchema.parse(body)

    const companySettings = await prisma.companySettings.findFirst()
    if (!companySettings?.sevdeskApiToken) {
      return NextResponse.json({ 
        message: 'Sevdesk API Token nicht konfiguriert' 
      }, { status: 400 })
    }

    // Erstelle oder finde Kontakt in Sevdesk
    let sevdeskContact
    try {
      // DEBUG: Logge Client-Daten aus der Datenbank
      console.log('🔍 DEBUG - Client aus DB:', {
        id: contract.client.id,
        firstName: contract.client.firstName,
        lastName: contract.client.lastName,
        email: contract.client.email,
        emailType: typeof contract.client.email,
        emailExists: !!contract.client.email,
        phone: contract.client.phone,
        isCompany: contract.client.isCompany,
        isCompanyType: typeof contract.client.isCompany,
        isCompanyValue: contract.client.isCompany,
        companyName: contract.client.companyName
      })
      
      const clientIsCompany = contract.client.isCompany === true
      console.log('🔍 DEBUG - clientIsCompany (nach Prüfung):', clientIsCompany)
      
      const emailValue = contract.client.email || undefined
      console.log('🔍 DEBUG - emailValue:', emailValue, 'Type:', typeof emailValue, 'Truthy:', !!emailValue)
      
      sevdeskContact = await getOrCreateSevdeskContact({
        name: clientIsCompany 
          ? contract.client.companyName || `${contract.client.firstName} ${contract.client.lastName}`
          : `${contract.client.firstName} ${contract.client.lastName}`,
        firstName: contract.client.firstName,
        lastName: contract.client.lastName,
        email: emailValue,
        phone: contract.client.phone || undefined,
        street: contract.client.street || undefined,
        houseNumber: contract.client.houseNumber || undefined,
        zip: contract.client.zip || undefined,
        city: contract.client.city || undefined,
        isCompany: clientIsCompany,           // ✅ Explizit geprüft
        companyName: contract.client.companyName || undefined,
      })
    } catch (contactErr: any) {
      console.error('❌ Fehler beim Erstellen des Sevdesk-Kontakts:', contactErr)
      return NextResponse.json({ 
        message: 'Fehler beim Erstellen des Kontakts in Sevdesk',
        error: contactErr.message || 'Unbekannter Fehler',
        details: contactErr.stack ? contactErr.stack.split('\n').slice(0, 3).join('\n') : undefined
      }, { status: 500 })
    }

    if (!sevdeskContact) {
      return NextResponse.json({ 
        message: 'Fehler beim Erstellen des Kontakts in Sevdesk: Keine Kontakt-ID erhalten',
        error: 'Die Sevdesk API hat keine Kontakt-ID zurückgegeben. Bitte prüfen Sie die Server-Logs für Details.'
      }, { status: 500 })
    }

    // Bereite Rechnungspositionen vor
    const positions = invoiceData.positions.map(pos => {
      const totalPrice = pos.quantity * pos.unitPrice - (pos.discount || 0)
      
      // Erstelle aussagekräftigen Text für die Position
      let descriptionText = pos.description
      
      // Füge Sub-Description hinzu wenn vorhanden
      if (pos.subDescription && pos.subDescription.trim()) {
        descriptionText += `\n${pos.subDescription}`
      }
      
      // Füge Rabatt-Info hinzu wenn vorhanden
      if (pos.discount && pos.discount > 0) {
        descriptionText += `\n(Rabatt: ${pos.discount.toFixed(2).replace('.', ',')} EUR)`
      }

      return {
        quantity: pos.quantity,
        price: totalPrice, // Bereits mit Rabatt berechnet
        name: pos.description, // Kurzer Name für die Position
        text: descriptionText, // Vollständiger Text mit allen Details
        taxRate: pos.taxRate,
      }
    })

    // Prüfe ob SEPA-Vertrag und füge Stripe-Gebühren hinzu
    const isSepa = contract.templateSlug.includes('-sepa') || contract.templateSlug.includes('sepa')
    if (isSepa) {
      const totalAmount = positions.reduce((sum, p) => sum + p.price * p.quantity, 0)
      const stripeFees = calculateStripeFees(totalAmount)
      
      positions.push({
        quantity: 1,
        price: stripeFees,
        name: 'Stripe-Gebühren (SEPA Direct Debit)',
        text: 'Bearbeitungsgebühr für SEPA-Lastschrift (0,8% + 0,35€)',
        taxRate: 19, // Umsatzsteuer auf Gebühren
      })
    }

    // Prüfe ob alle Positionen 0% Steuer haben (dann USt 4 Hinweis)
    const allPositionsHaveZeroTax = positions.every(pos => pos.taxRate === 0)
    
    // Erstelle Fußtext - wenn keine Steuer, füge USt 4 Hinweis hinzu
    let footText = invoiceData.footText || 'Vielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!'
    if (allPositionsHaveZeroTax && !invoiceData.footText) {
      footText = 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.\n\nVielen Dank für Ihren Auftrag und das damit verbundene Vertrauen!'
    }
    
    // Erstelle Rechnungsadresse als String (Format für Sevdesk Invoice)
    const invoiceAddress = [
      `${contract.client.firstName} ${contract.client.lastName}`.trim(),
      contract.client.street && contract.client.houseNumber 
        ? `${contract.client.street} ${contract.client.houseNumber}`
        : contract.client.street,
      contract.client.zip && contract.client.city
        ? `${contract.client.zip} ${contract.client.city}`
        : null,
      'Deutschland'
    ].filter(Boolean).join('\n')
    
    // Erstelle Rechnung in Sevdesk
    const invoice = await createSevdeskInvoice({
      contactId: sevdeskContact.id,
      invoiceDate: invoiceData.invoiceDate,
      deliveryDate: invoiceData.deliveryDate,
      currency: 'EUR',
      status: invoiceData.status || 100, // 100 = Entwurf
      address: invoiceAddress, // ✅ Rechnungsadresse hinzugefügt
      subject: invoiceData.subject || undefined, // ✅ NEU: Betreff
      header: invoiceData.header || undefined,    // ✅ Kopftext
      footText: footText, // ✅ USt 4 Hinweis wenn alle Positionen 0% Steuer haben
      positions,
      includeStripeFees: false, // Bereits manuell hinzugefügt
    })

    if (!invoice) {
      return NextResponse.json({ 
        message: 'Fehler beim Erstellen der Rechnung in Sevdesk' 
      }, { status: 500 })
    }

    // Speichere Sevdesk-Rechnungs-ID im Contract
    await prisma.contract.update({
      where: { id: params.id },
      data: {
        sevdeskInvoiceId: invoice.id.toString(),
        sevdeskInvoiceNumber: invoice.invoiceNumber,
      }
    })

    return NextResponse.json({
      message: 'Rechnung erfolgreich in Sevdesk erstellt',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      }
    })
  } catch (err: any) {
    console.error('❌ Create Invoice Error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      errors: err.issues,
    })
    
    if (err?.name === 'ZodError') {
      return NextResponse.json({ 
        message: 'Ungültige Eingabe',
        errors: err.issues 
      }, { status: 400 })
    }

    // Detaillierte Fehlermeldung für Sevdesk-Fehler
    const errorMessage = err.message || 'Unbekannter Fehler'
    const isSevdeskError = errorMessage.includes('Sevdesk API Error')
    
    return NextResponse.json({ 
      message: isSevdeskError 
        ? `Fehler beim Erstellen der Rechnung in Sevdesk: ${errorMessage}`
        : `Fehler beim Erstellen der Rechnung: ${errorMessage}`,
      error: errorMessage,
      details: err.stack ? err.stack.split('\n').slice(0, 5).join('\n') : undefined
    }, { status: 500 })
  }
}

