import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/settings/test-stripe
 * Testet die Stripe-Verbindung
 */
export async function GET() {
  try {
    // Prevent build-time crashes on Vercel
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("[Stripe Test] STRIPE_SECRET_KEY missing.");
      return NextResponse.json(
        {
          success: false,
          message: "Stripe Secret Key nicht konfiguriert",
          error: "Missing STRIPE_SECRET_KEY",
        },
        { status: 400 }
      );
    }

    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        {
          success: false,
          message: "Stripe Secret Key nicht konfiguriert",
          error: "Bitte tragen Sie Ihren Stripe Secret Key in den Einstellungen ein.",
        },
        { status: 400 }
      );
    }

    // Try retrieving Stripe account to validate connection
    const account = await stripe.accounts.retrieve();

    return NextResponse.json({
      success: true,
      message: "Stripe-Verbindung erfolgreich!",
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
        card_payments:
          (account.capabilities as any)?.card_payments?.status ||
          (account.capabilities as any)?.card_payments ||
          "unknown",
        sepa_debit_payments:
          (account.capabilities as any)?.sepa_debit_payments?.status ||
          (account.capabilities as any)?.sepa_debit_payments ||
          "unknown",
      },
    });
  } catch (err: any) {
    console.error("[Stripe Test Error]:", err);

    // Stripe authentication error → Invalid API key
    if (err?.type === "StripeAuthenticationError") {
      return NextResponse.json(
        {
          success: false,
          message: "Stripe Authentifizierung fehlgeschlagen",
          error:
            "Der eingegebene Secret Key ist ungültig. Bitte überprüfen Sie Ihre Stripe API Keys.",
          details: err.message,
        },
        { status: 401 }
      );
    }

    // Stripe API internal error
    if (err?.type === "StripeAPIError") {
      return NextResponse.json(
        {
          success: false,
          message: "Stripe API Fehler",
          error: err.message,
          details: "Bitte überprüfen Sie Ihre Stripe-Konfiguration.",
        },
        { status: 500 }
      );
    }

    // Unknown error (fallback)
    return NextResponse.json(
      {
        success: false,
        message: "Fehler beim Testen der Stripe-Verbindung",
        error: err?.message ?? "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}


