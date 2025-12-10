import { NextResponse } from "next/server";
import { testSevdeskConnection } from "@/lib/sevdesk";

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/settings/test-sevdesk
 * Testet die Sevdesk-Verbindung
 */
export async function GET() {
  try {
    // Falls DATABASE_URL fehlt → nicht crashen
    if (!process.env.DATABASE_URL) {
      console.warn("[Sevdesk Test] DATABASE_URL missing. Skipping Prisma call.");
      return NextResponse.json(
        {
          success: false,
          message: "DATABASE_URL fehlt – Verbindung kann nicht getestet werden.",
          error: "Missing DATABASE_URL",
        },
        { status: 400 }
      );
    }

    const result = await testSevdeskConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        account: result.account || null,
      });
    }

    const errorMessage =
      result.error && typeof result.error !== "string"
        ? JSON.stringify(result.error)
        : result.error ?? result.message;

    return NextResponse.json(
      {
        success: false,
        message: result.message ?? "Sevdesk-Test fehlgeschlagen",
        error: errorMessage,
      },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[Sevdesk Test] Unexpected Error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Fehler beim Testen der Sevdesk-Verbindung",
        error: err?.message ?? "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}


