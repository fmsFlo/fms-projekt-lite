import Stripe from 'stripe'
import { prisma } from './prisma'

/**
 * Initialisiert Stripe Client mit Secret Key aus CompanySettings
 */
export async function getStripeClient(): Promise<Stripe | null> {
  const settings = await prisma.companySettings.findFirst()
  
  if (!settings?.stripeSecretKey) {
    console.error('Stripe Secret Key nicht konfiguriert')
    return null
  }

  return new Stripe(settings.stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  })
}

/**
 * Erstellt oder findet einen Stripe Customer für einen Client
 */
export async function getOrCreateStripeCustomer(
  clientId: string,
  clientData: {
    firstName: string
    lastName: string
    email?: string | null
    iban?: string | null
  }
): Promise<Stripe.Customer | null> {
  const stripe = await getStripeClient()
  if (!stripe) return null

  // Prüfe ob bereits ein Customer existiert
  const contract = await prisma.contract.findFirst({
    where: { clientId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true }
  })

  if (contract?.stripeCustomerId) {
    try {
      return await stripe.customers.retrieve(contract.stripeCustomerId) as Stripe.Customer
    } catch (err) {
      console.error('Fehler beim Abrufen des Stripe Customers:', err)
    }
  }

  // Erstelle neuen Customer
  try {
    const customer = await stripe.customers.create({
      name: `${clientData.firstName} ${clientData.lastName}`,
      email: clientData.email || undefined,
      metadata: {
        clientId,
        source: 'docreate'
      }
    })

    return customer
  } catch (err) {
    console.error('Fehler beim Erstellen des Stripe Customers:', err)
    return null
  }
}

/**
 * Erstellt ein SEPA Direct Debit Mandate in Stripe
 * 
 * WICHTIG: Diese Funktion erstellt das SetupIntent und die Payment Method.
 * Das Mandat muss dann vom Kunden bestätigt werden (normalerweise über Frontend).
 * Hier erstellen wir es im Backend, da das Dokument bereits unterschrieben wurde.
 */
export async function createSepaMandate(
  customerId: string,
  contractId: string,
  iban: string,
  mandateReference?: string
): Promise<{ paymentMethodId: string; setupIntentId: string; status: string } | null> {
  const stripe = await getStripeClient()
  if (!stripe) return null

  // Prüfe IBAN Format (einfache Validierung)
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()
  if (!cleanIban.match(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/)) {
    console.error('Ungültige IBAN:', iban)
    return null
  }

  try {
    // Erstelle Payment Method (SEPA Direct Debit)
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'sepa_debit',
      sepa_debit: {
        iban: cleanIban,
      },
    })

    // Hänge Payment Method an Customer an
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    })

    // Erstelle SetupIntent um das Mandat zu aktivieren
    // Da das Dokument bereits unterschrieben wurde, können wir es direkt bestätigen
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method: paymentMethod.id,
      payment_method_types: ['sepa_debit'],
      mandate_data: {
        customer_acceptance: {
          type: 'offline', // Da wir das unterschriebene Dokument haben
          offline: {
            stripe_agreement: {
              date: Math.floor(Date.now() / 1000), // Aktuelles Datum als Unix Timestamp
              ip: '127.0.0.1', // Placeholder, da offline
            },
          },
        },
      },
      metadata: {
        contractId,
        mandateReference: mandateReference || `MANDATE-${contractId}`,
      },
    })

    // Bestätige das SetupIntent (Mandat ist jetzt aktiv)
    const confirmedSetupIntent = await stripe.setupIntents.confirm(setupIntent.id)
    
    // Setze als Standard Payment Method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    })

    return {
      paymentMethodId: paymentMethod.id,
      setupIntentId: confirmedSetupIntent.id,
      status: confirmedSetupIntent.status === 'succeeded' ? 'active' : 'pending',
    }
  } catch (err: any) {
    console.error('Fehler beim Erstellen des SEPA Mandates:', err)
    return null
  }
}

/**
 * Initiiert eine SEPA Direct Debit Zahlung
 * 
 * @param paymentMethodId Die Payment Method ID (aus dem Mandat)
 * @param customerId Die Stripe Customer ID
 * @param amount Betrag in Euro (wird in Cent umgerechnet)
 * @param currency Währung (Standard: eur)
 * @param description Beschreibung der Zahlung
 * @param metadata Zusätzliche Metadaten
 */
export async function createSepaPayment(
  paymentMethodId: string,
  customerId: string,
  amount: number, // in Euro
  currency: string = 'eur',
  description?: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent | null> {
  const stripe = await getStripeClient()
  if (!stripe) return null

  try {
    // Erstelle Payment Intent für SEPA Direct Debit
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe verwendet Cent
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method: paymentMethodId,
      payment_method_types: ['sepa_debit'],
      description: description || `Zahlung über SEPA Direct Debit`,
      metadata: metadata || {},
      confirmation_method: 'automatic',
      confirm: true, // Bestätige automatisch
    })

    return paymentIntent
  } catch (err: any) {
    console.error('Fehler beim Erstellen der SEPA Zahlung:', err)
    return null
  }
}

/**
 * Prüft den Status eines Payment Intents
 */
export async function getPaymentStatus(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  const stripe = await getStripeClient()
  if (!stripe) return null

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (err) {
    console.error('Fehler beim Abrufen des Payment Status:', err)
    return null
  }
}

