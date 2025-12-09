import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const requestResetSchema = z.object({
  email: z.string().email()
})

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, token, newPassword } = body

    console.log('🔐 Reset Password Request:', { hasEmail: !!email, hasToken: !!token, hasNewPassword: !!newPassword })

    // Passwort zurücksetzen mit Token
    if (token && newPassword) {
      console.log('🔐 Passwort zurücksetzen mit Token...')
      const data = resetPasswordSchema.parse({ token, newPassword })
      
      const user = await prisma.user.findFirst({
        where: {
          resetToken: data.token,
          resetTokenExpires: {
            gt: new Date()
          },
          isActive: true
        }
      })

      if (!user) {
        console.log('❌ Token ungültig oder abgelaufen')
        return NextResponse.json({ message: 'Ungültiger oder abgelaufener Token' }, { status: 400 })
      }

      console.log('✅ Token gültig für User:', user.email)
      const passwordHash = await hashPassword(data.newPassword)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpires: null
        }
      })

      console.log('✅ Passwort erfolgreich zurückgesetzt')
      return NextResponse.json({ ok: true, message: 'Passwort erfolgreich zurückgesetzt' })
    }

    // Reset-Token anfordern
    console.log('🔐 Reset-Token anfordern für:', email)
    const data = requestResetSchema.parse({ email })
    
    // Teste Prisma-Verbindung
    try {
      await prisma.$connect()
    } catch (connectError: any) {
      console.error('❌ Prisma Connect Error:', connectError)
    }
    
    const user = await prisma.user.findFirst({
      where: { 
        email: data.email.toLowerCase(),
        isActive: true 
      }
    })

    if (!user) {
      console.log('❌ User nicht gefunden oder inaktiv:', data.email)
      // Aus Sicherheitsgründen geben wir keine Auskunft, ob die E-Mail existiert
      return NextResponse.json({ 
        ok: true, 
        message: 'Falls diese E-Mail-Adresse registriert ist, wurde ein Reset-Link gesendet.' 
      })
    }

    console.log('✅ User gefunden:', user.email)
    // Generiere Reset-Token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpires = new Date()
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1) // Token gültig für 1 Stunde

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires
      }
    })

    // In einer echten Anwendung würde hier eine E-Mail gesendet werden
    // Für jetzt geben wir den Token zurück (nur für Entwicklung!)
    // In Produktion sollte der Token per E-Mail gesendet werden
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5001'}/reset-password?token=${resetToken}`

    console.log('🔐 Reset-Token für', user.email, ':', resetToken)
    console.log('🔗 Reset-URL:', resetUrl)

    return NextResponse.json({ 
      ok: true, 
      message: 'Falls diese E-Mail-Adresse registriert ist, wurde ein Reset-Link gesendet.',
      // Nur in Entwicklung: Token zurückgeben
      ...(process.env.NODE_ENV === 'development' && { token: resetToken, resetUrl })
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

