import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSepaPayment, getPaymentStatus } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

interface Params { params: { id: string } }

/**
 * POST /api/contracts/[id]/charge
 * Initiiert eine SEPA-Lastschrift für einen Vertrag
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const contract = await prisma.contract.findUnique({ 
      where: { id: params.id },
      include: { client: true }
    })
    
    if (!contract) {
      return NextResponse.json({ message: 'Vertrag nicht gefunden' }, { status: 404 })
    }

    if (!contract.stripeMandateId) {
      return NextResponse.json({ 
        message: 'Kein Stripe-Mandat für diesen Vertrag gefunden. Bitte laden Sie zuerst das unterschriebene Dokument hoch.' 
      }, { status: 400 })
    }

    // Parse Request Body
    const body = await req.json().catch(() => ({}))
    const { amount, currency = 'eur', description } = body

    // Parse Contract Variables für Betrag
    let variables: any = {}
    try {
      variables = JSON.parse(contract.variables || '{}')
    } catch {
      variables = {}
    }

    // Bestimme Betrag: aus Request oder aus Contract Variables
    let paymentAmount = amount
    if (!paymentAmount) {
      // Versuche totalAmount, dann amountEUR
      paymentAmount = parseFloat(variables.totalAmount || variables.amountEUR || '0')
    }

    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ 
        message: 'Ungültiger Betrag. Bitte geben Sie einen Betrag an.' 
      }, { status: 400 })
    }

    if (!contract.stripeCustomerId) {
      return NextResponse.json({ 
        message: 'Kein Stripe-Customer für diesen Vertrag gefunden.' 
      }, { status: 400 })
    }

    // Erstelle Payment Intent
    const paymentIntent = await createSepaPayment(
      contract.stripeMandateId!, // Payment Method ID
      contract.stripeCustomerId,
      paymentAmount,
      currency,
      description || `Zahlung für Vertrag ${contract.id}`,
      {
        contractId: contract.id,
        clientId: contract.clientId,
        clientName: `${contract.client.firstName} ${contract.client.lastName}`,
      }
    )

    if (!paymentIntent) {
      return NextResponse.json({ 
        message: 'Fehler beim Erstellen der Zahlung. Bitte überprüfen Sie Ihre Stripe-Konfiguration.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Zahlung erfolgreich initiiert',
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Zurück in Euro
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        description: paymentIntent.description,
      }
    })
  } catch (err: any) {
    console.error('Charge error:', err)
    return NextResponse.json({ 
      message: 'Fehler beim Initiieren der Zahlung', 
      error: err.message 
    }, { status: 500 })
  }
}

/**
 * GET /api/contracts/[id]/charge
 * Ruft den Status einer Zahlung ab
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url)
    const paymentIntentId = searchParams.get('paymentIntentId')

    if (!paymentIntentId) {
      // Lade Contract und zeige letzte Zahlungen (falls gespeichert)
      const contract = await prisma.contract.findUnique({ 
        where: { id: params.id },
        select: {
          id: true,
          stripeMandateId: true,
          stripeMandateStatus: true,
          stripeCustomerId: true,
        }
      })

      if (!contract) {
        return NextResponse.json({ message: 'Vertrag nicht gefunden' }, { status: 404 })
      }

      return NextResponse.json({
        contract: {
          id: contract.id,
          hasMandate: !!contract.stripeMandateId,
          mandateStatus: contract.stripeMandateStatus,
          customerId: contract.stripeCustomerId,
        }
      })
    }

    // Hole Payment Intent Status
    const paymentIntent = await getPaymentStatus(paymentIntentId)

    if (!paymentIntent) {
      return NextResponse.json({ 
        message: 'Zahlung nicht gefunden' 
      }, { status: 404 })
    }

    return NextResponse.json({
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        description: paymentIntent.description,
        created: new Date(paymentIntent.created * 1000).toISOString(),
      }
    })
  } catch (err: any) {
    console.error('Get charge error:', err)
    return NextResponse.json({ 
      message: 'Fehler beim Abrufen des Zahlungsstatus', 
      error: err.message 
    }, { status: 500 })
  }
}

