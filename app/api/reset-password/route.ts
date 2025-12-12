import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const schema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6)
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, newPassword } = schema.parse(body)

    console.log('🔍 Reset Password Request für:', email)

    // Suche User
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      console.log('❌ User nicht gefunden:', email)
      return NextResponse.json({ 
        message: 'Benutzer nicht gefunden' 
      }, { status: 404 })
    }

    // Hash neues Passwort
    const hashedPassword = await hashPassword(newPassword)

    // Update User
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        isActive: true // Stelle sicher, dass User aktiv ist
      }
    })

    console.log('✅ Passwort zurückgesetzt für:', user.email)

    return NextResponse.json({ 
      success: true,
      message: 'Passwort erfolgreich zurückgesetzt' 
    })
  } catch (err: any) {
    console.error('❌ Reset Password Error:', err)
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({ 
      message: 'Interner Fehler', 
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 })
  }
}

