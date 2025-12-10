import { NextResponse } from 'next/server'
import { z } from 'zod'
import { setSessionCookie, verifyCredentials } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = schema.parse(body)

    console.log('📥 Login Request erhalten:', { email, passwordLength: password.length })
    
    // Teste Prisma-Verbindung direkt
    const { prisma } = await import('@/lib/prisma')
    try {
      await prisma.$connect()
      console.log('✅ Prisma verbunden')
    } catch (connectErr: any) {
      console.error('❌ Prisma Connect Fehler:', connectErr.message)
    }

    const result = await verifyCredentials(email, password)
    
    console.log('🔍 verifyCredentials Ergebnis:', result ? '✅ Erfolg' : '❌ Fehlgeschlagen')
    
    if (!result) {
      console.log('❌ Login fehlgeschlagen - keine gültigen Credentials')
      // Prüfe ob User existiert
      try {
        const testUser = await prisma.user.findFirst({
          where: { email: email.toLowerCase() }
        })
        console.log('🔍 User-Existenz-Check:', testUser ? `Gefunden (Aktiv: ${testUser.isActive})` : 'Nicht gefunden')
      } catch (testErr: any) {
        console.error('❌ User-Check Fehler:', testErr.message)
      }
      
      return NextResponse.json({ 
        message: 'Ungültige Zugangsdaten',
        debug: process.env.NODE_ENV === 'development' ? 'Prüfe Server-Logs für Details' : undefined
      }, { status: 401 })
    }

    console.log('✅ Login erfolgreich, setze Session:', { role: result.role, userId: result.userId })
    setSessionCookie(result.role, result.userId)

    const response = NextResponse.json({ ok: true, role: result.role })
    // Stelle sicher, dass das Cookie auch in der Response gesetzt wird
    response.cookies.set('session', `${result.role}:${result.userId}`, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    })
    
    console.log('✅ Session-Cookie gesetzt in Response')
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

