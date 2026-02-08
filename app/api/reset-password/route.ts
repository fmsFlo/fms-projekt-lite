import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

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

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      console.log('❌ User nicht gefunden:', email)
      return NextResponse.json({
        message: 'Benutzer nicht gefunden'
      }, { status: 404 })
    }

    if (!user.authUserId) {
      console.log('❌ User hat keine Supabase Auth ID:', email)
      return NextResponse.json({
        message: 'Benutzer ist nicht für Supabase Auth konfiguriert'
      }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY nicht konfiguriert')
      return NextResponse.json({
        message: 'Service nicht verfügbar'
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

    const { error } = await supabase.auth.admin.updateUserById(
      user.authUserId,
      { password: newPassword.trim() }
    )

    if (error) {
      console.error('❌ Supabase Auth Error:', error.message)
      return NextResponse.json({
        message: 'Fehler beim Zurücksetzen des Passworts',
        error: error.message
      }, { status: 500 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true }
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
