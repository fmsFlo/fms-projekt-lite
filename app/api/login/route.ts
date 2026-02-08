import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/auth'

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

    const supabase = createSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (error || !data.user || !data.session) {
      console.error('Supabase Auth Error:', error?.message)
      return NextResponse.json({
        error: 'Invalid credentials',
        message: 'Ungültige Zugangsdaten'
      }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })

    const sevenDays = 7 * 24 * 60 * 60

    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sevenDays
    })

    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sevenDays
    })

    console.log('✅ Login erfolgreich via Supabase Auth')
    return response
  } catch (err: any) {
    console.error('❌ Login Error:', err)
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({
      message: 'Interner Fehler',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 })
  }
}
