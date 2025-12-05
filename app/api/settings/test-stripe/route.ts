import { NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe'

/**
 * GET /api/settings/test-stripe
 * Testet die Stripe-Verbindung
 */
export async function GET() {
  try {
    const stripe = await getStripeClient()
    
    if (!stripe) {
      return NextResponse.json({
        success: false,
        message: 'Stripe Secret Key nicht konfiguriert',
        error: 'Bitte tragen Sie Ihren Stripe Secret Key in den Einstellungen ein.'
      }, { status: 400 })
    }

    // Teste die Verbindung durch Abrufen des Account-Status
    const account = await stripe.accounts.retrieve()
    
    return NextResponse.json({
      success: true,
      message: 'Stripe-Verbindung erfolgreich!',
      account: {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        type: account.type,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      },
      capabilities: {
        sepa_debit_payments: (account.capabilities as any)?.sepa_debit_payments?.status || (account.capabilities as any)?.sepa_debit_payments || 'unknown',
        card_payments: (account.capabilities as any)?.card_payments?.status || (account.capabilities as any)?.card_payments || 'unknown',
      }
    })
  } catch (err: any) {
    console.error('Stripe Test Error:', err)
    
    if (err?.type === 'StripeAuthenticationError') {
      return NextResponse.json({
        success: false,
        message: 'Stripe Authentifizierung fehlgeschlagen',
        error: 'Der eingegebene Secret Key ist ungültig. Bitte überprüfen Sie Ihre Stripe API Keys.',
        details: err.message
      }, { status: 401 })
    }

    if (err?.type === 'StripeAPIError') {
      return NextResponse.json({
        success: false,
        message: 'Stripe API Fehler',
        error: err.message,
        details: 'Bitte überprüfen Sie Ihre Stripe-Konfiguration.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: false,
      message: 'Fehler beim Testen der Stripe-Verbindung',
      error: err.message || 'Unbekannter Fehler'
    }, { status: 500 })
  }
}

