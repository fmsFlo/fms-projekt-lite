import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort erforderlich' },
        { status: 400 }
      )
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User nicht in Datenbank gefunden' },
        { status: 404 }
      )
    }

    if (existingUser.authUserId) {
      return NextResponse.json(
        {
          message: 'User ist bereits verknüpft',
          userId: existingUser.authUserId,
          canLogin: true
        },
        { status: 200 }
      )
    }

    // Create Supabase Auth user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json(
        { error: `Supabase Auth Fehler: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Kein User zurückgegeben' },
        { status: 500 }
      )
    }

    // Link auth user to database user
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { authUserId: data.user.id }
    })

    return NextResponse.json({
      message: 'User erfolgreich verknüpft!',
      email: email,
      authUserId: data.user.id,
      canLogin: true
    })

  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: error.message || 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
