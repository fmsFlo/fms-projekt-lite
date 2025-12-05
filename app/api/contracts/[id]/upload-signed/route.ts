import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateStripeCustomer, createSepaMandate } from '@/lib/stripe'
import fs from 'node:fs/promises'
import path from 'node:path'

interface Params { params: { id: string } }

/**
 * Prüft ob ein Template ein SEPA-Vertrag ist
 */
function isSepaContract(templateSlug: string): boolean {
  return templateSlug.includes('-sepa') || templateSlug.includes('sepa')
}

export async function POST(req: Request, { params }: Params) {
  try {
    const contract = await prisma.contract.findUnique({ 
      where: { id: params.id },
      include: { client: true }
    })
    if (!contract) return NextResponse.json({ message: 'Vertrag nicht gefunden' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ message: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Validiere, dass es eine PDF ist
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ message: 'Nur PDF-Dateien erlaubt' }, { status: 400 })
    }

    // Speichere die Datei
    const root = process.cwd()
    const uploadsDir = path.join(root, 'public', 'contracts', params.id)
    await fs.mkdir(uploadsDir, { recursive: true })

    const fileName = `signed_${Date.now()}.pdf`
    const filePath = path.join(uploadsDir, fileName)
    const arrayBuffer = await file.arrayBuffer()
    await fs.writeFile(filePath, Buffer.from(arrayBuffer))

    // Speichere den Dateinamen in der DB
    const relativePath = `/contracts/${params.id}/${fileName}`
    
    // Prüfe ob es ein SEPA-Vertrag ist und Stripe-Integration durchführen
    const isSepa = isSepaContract(contract.templateSlug)
    let stripeIntegrationResult = null
    
    // NOTE: Sevdesk-Rechnung wird jetzt manuell über den Button erstellt
    // (nicht mehr automatisch beim Upload)
    
    if (isSepa && !contract.stripeMandateId) {
      try {
        // Parse Contract Variables
        let variables: any = {}
        try {
          variables = JSON.parse(contract.variables || '{}')
        } catch {
          variables = {}
        }

        // Hole IBAN aus Variables (kann als clientIban gespeichert sein) oder aus Client
        const iban = variables.clientIban || contract.client.iban

        // Prüfe ob Gläubiger-ID vorhanden ist (wird für SEPA benötigt, aber nicht zwingend)
        const companySettings = await prisma.companySettings.findFirst()
        if (!companySettings?.creditorId) {
          console.warn('SEPA Gläubiger-ID nicht konfiguriert. Mandat wird erstellt, aber Sie sollten die Gläubiger-ID in den Einstellungen eintragen.')
        }

        if (iban) {
          // Erstelle oder hole Stripe Customer
          const customer = await getOrCreateStripeCustomer(contract.clientId, {
            firstName: contract.client.firstName,
            lastName: contract.client.lastName,
            email: contract.client.email,
            iban,
          })

          if (customer) {
            // Erstelle SEPA Mandate
            const mandate = await createSepaMandate(
              customer.id,
              contract.id,
              iban,
              `MANDATE-${contract.id}`
            )

            if (mandate) {
              // Speichere Stripe-Daten im Contract
              // Wir speichern die Payment Method ID als Mandate ID
              await prisma.contract.update({
                where: { id: params.id },
                data: {
                  stripeCustomerId: customer.id,
                  stripeMandateId: mandate.paymentMethodId,
                  stripeMandateStatus: mandate.status,
                  signedPdfFileName: relativePath,
                }
              })

              stripeIntegrationResult = {
                customerId: customer.id,
                paymentMethodId: mandate.paymentMethodId,
                setupIntentId: mandate.setupIntentId,
                status: mandate.status,
              }
            }
          }
        } else {
          console.warn('IBAN nicht gefunden für SEPA-Vertrag')
        }
      } catch (stripeError: any) {
        console.error('Stripe Integration Fehler:', stripeError)
        // Dokument wird trotzdem gespeichert, auch wenn Stripe fehlschlägt
        stripeIntegrationResult = { error: stripeError.message }
      }
    }

    // Falls kein Stripe-Update gemacht wurde, nur das signedPdfFileName updaten
    if (!stripeIntegrationResult || stripeIntegrationResult.error) {
    await prisma.contract.update({
      where: { id: params.id },
      data: { signedPdfFileName: relativePath }
    })
    }

    return NextResponse.json({ 
      message: 'Unterschriebenes Dokument erfolgreich hochgeladen', 
      filePath: relativePath,
      stripe: stripeIntegrationResult,
    })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ message: 'Upload fehlgeschlagen', error: err.message }, { status: 500 })
  }
}


