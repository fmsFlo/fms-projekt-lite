import { NextResponse } from 'next/server'
import { testSevdeskConnection } from '@/lib/sevdesk'

/**
 * GET /api/settings/test-sevdesk
 * Testet die Sevdesk-Verbindung
 */
export async function GET() {
  try {
    const result = await testSevdeskConnection()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        account: result.account,
      })
    }

    // Stelle sicher, dass error ein String ist
    const errorMessage = result.error 
      ? (typeof result.error === 'string' ? result.error : JSON.stringify(result.error))
      : result.message

    return NextResponse.json({
      success: false,
      message: result.message,
      error: errorMessage,
    }, { status: 400 })
  } catch (err: any) {
    console.error('Sevdesk Test Error:', err)
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Testen der Sevdesk-Verbindung',
      error: err.message || 'Unbekannter Fehler'
    }, { status: 500 })
  }
}

