import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { isAdmin, createAuthUser, createSupabaseClient } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'advisor']),
  name: z.string().optional(),
  visibleCategories: z.array(z.string()).optional()
})

const updateUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'advisor']).optional(),
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  visibleCategories: z.array(z.string()).optional()
})

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await isAdmin(req)

    if (!adminCheck) {
      return NextResponse.json({ message: 'Nicht authentifiziert oder keine Berechtigung' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        authUserId: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        visibleCategories: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(users)
  } catch (err: any) {
    console.error('❌ Users GET Error:', err)
    return NextResponse.json({
      message: 'Interner Fehler',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await isAdmin(req)

    if (!adminCheck) {
      return NextResponse.json({ message: 'Nicht authentifiziert oder keine Berechtigung' }, { status: 403 })
    }

    const body = await req.json()
    const data = createUserSchema.parse(body)

    const existing = await prisma.user.findFirst({
      where: { email: data.email.toLowerCase() }
    })

    if (existing) {
      return NextResponse.json({ message: 'E-Mail-Adresse bereits vergeben' }, { status: 400 })
    }

    const result = await createAuthUser(
      data.email,
      data.password,
      data.role,
      data.name
    )

    if (!result.success) {
      return NextResponse.json({
        message: 'Fehler beim Erstellen des Users',
        error: result.error
      }, { status: 500 })
    }

    if (data.visibleCategories) {
      await prisma.user.update({
        where: { id: result.userId },
        data: {
          visibleCategories: JSON.stringify(data.visibleCategories)
        }
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: {
        id: true,
        authUserId: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        visibleCategories: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (err: any) {
    console.error('❌ Users POST Error:', err)
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({
      message: 'Interner Fehler',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminCheck = await isAdmin(req)

    if (!adminCheck) {
      return NextResponse.json({ message: 'Nicht authentifiziert oder keine Berechtigung' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateUserSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { id: data.id }
    })

    if (!existingUser) {
      return NextResponse.json({ message: 'User nicht gefunden' }, { status: 404 })
    }

    const updateData: any = {}
    if (data.email) updateData.email = data.email.toLowerCase()
    if (data.role) updateData.role = data.role
    if (data.name !== undefined) updateData.name = data.name || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.visibleCategories !== undefined) {
      updateData.visibleCategories = data.visibleCategories ? JSON.stringify(data.visibleCategories) : null
    }

    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          NOT: { id: data.id }
        }
      })
      if (existing) {
        return NextResponse.json({ message: 'E-Mail-Adresse bereits vergeben' }, { status: 400 })
      }
    }

    if (data.password && existingUser.authUserId) {
      try {
        const supabase = createSupabaseClient()
        const adminSupabase = createSupabaseClient()

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          )

          await adminClient.auth.admin.updateUserById(
            existingUser.authUserId,
            { password: data.password.trim() }
          )
        }
      } catch (error: any) {
        console.error('Error updating password:', error)
        return NextResponse.json({
          message: 'Fehler beim Aktualisieren des Passworts',
          error: error.message
        }, { status: 500 })
      }
    }

    if (data.email && existingUser.authUserId) {
      try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          )

          await adminClient.auth.admin.updateUserById(
            existingUser.authUserId,
            { email: data.email.toLowerCase() }
          )
        }
      } catch (error: any) {
        console.error('Error updating email:', error)
      }
    }

    const user = await prisma.user.update({
      where: { id: data.id },
      data: updateData,
      select: {
        id: true,
        authUserId: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        visibleCategories: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user)
  } catch (err: any) {
    console.error('❌ Users PATCH Error:', err)
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    return NextResponse.json({
      message: 'Interner Fehler',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminCheck = await isAdmin(req)

    if (!adminCheck) {
      return NextResponse.json({ message: 'Nicht authentifiziert oder keine Berechtigung' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ message: 'ID erforderlich' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ message: 'User nicht gefunden' }, { status: 404 })
    }

    if (user.authUserId) {
      try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceKey,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            }
          )

          await adminClient.auth.admin.deleteUser(user.authUserId)
        }
      } catch (error: any) {
        console.error('Error deleting auth user:', error)
      }
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('❌ Users DELETE Error:', err)
    return NextResponse.json({
      message: 'Interner Fehler',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 })
  }
}
