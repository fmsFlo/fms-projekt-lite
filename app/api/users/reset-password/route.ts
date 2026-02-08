import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    if (token && newPassword) {
      console.log('⚠️ Token-based reset not implemented with Supabase Auth')
      return NextResponse.json({
        message: 'Diese Funktion wird über Supabase Auth gehandhabt. Bitte verwenden Sie den Magic Link aus der E-Mail.'
      }, { status: 400 })
    }

    console.log('🔐 Reset-Token anfordern für:', email)
    const data = requestResetSchema.parse({ email })

    const user = await prisma.user.findFirst({
      where: {
        email: data.email.toLowerCase(),
        isActive: true
      }
    })

    if (!user) {
      console.log('❌ User nicht gefunden oder inaktiv:', data.email)
      return NextResponse.json({
        ok: true,
        message: 'Falls diese E-Mail-Adresse registriert ist, wurde ein Reset-Link gesendet.'
      })
    }

    if (!user.authUserId) {
      console.log('❌ User hat keine Supabase Auth ID:', data.email)
      return NextResponse.json({
        message: 'Benutzer ist nicht für Supabase Auth konfiguriert'
      }, { status: 400 })
    }

    console.log('✅ User gefunden:', user.email)

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY nicht konfiguriert')
      return NextResponse.json({
        message: 'Service nicht verfügbar. Bitte kontaktieren Sie den Administrator.'
      }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(
      data.email.toLowerCase(),
      { redirectTo: redirectUrl }
    )

    if (error) {
      console.error('❌ Supabase Auth Error:', error.message)
    }

    console.log('✅ Password reset email requested for:', user.email)

    return NextResponse.json({
      ok: true,
      message: 'Falls diese E-Mail-Adresse registriert ist, wurde ein Reset-Link gesendet.'
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
