import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyCredentials } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = schema.parse(body)

    const result = await verifyCredentials(email, password)
    
    if (!result) {
      return NextResponse.json({ 
        error: 'Invalid credentials',
        message: 'Ungültige Zugangsdaten'
      }, { status: 401 })
    }

    // Set cookie with proper options - Format: role:userId
    // WICHTIG: cookies().set() funktioniert nicht in API Routes, verwende response.cookies.set()
    const cookieValue = `${result.role}:${result.userId}`
    const response = NextResponse.json({ 
      success: true, 
      ok: true, // Für Kompatibilität mit Frontend
      role: result.role, 
      user: { id: result.userId, role: result.role } 
    })
    
    response.cookies.set('session', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    console.log('✅ Login erfolgreich, Cookie gesetzt:', cookieValue)
    return response
  } catch (err: any) {
    console.error('❌ Login Error:', err)
    console.error('❌ Error Stack:', err.stack)
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ 
      message: 'Interner Fehler', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
}

