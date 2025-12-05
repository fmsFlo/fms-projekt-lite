import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, isAdmin } from '@/lib/auth'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

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
    // Prüfe Session manuell
    const session = req.cookies.get('session')?.value
    
    if (!session || !session.includes(':')) {
      return NextResponse.json({ message: 'Nicht authentifiziert' }, { status: 401 })
    }
    
    const [role] = session.split(':')
    
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Nur Administratoren können Benutzer anzeigen' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
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
    const session = req.cookies.get('session')?.value
    if (!session || !session.includes(':')) {
      return NextResponse.json({ message: 'Nicht authentifiziert' }, { status: 401 })
    }
    const [role] = session.split(':')
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Nur Administratoren können Benutzer erstellen' }, { status: 403 })
    }

    const body = await req.json()
    const data = createUserSchema.parse(body)

    // Prüfe ob E-Mail bereits existiert
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    })

    if (existing) {
      return NextResponse.json({ message: 'E-Mail-Adresse bereits vergeben' }, { status: 400 })
    }

    const passwordHash = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        name: data.name || null,
        visibleCategories: data.visibleCategories ? JSON.stringify(data.visibleCategories) : null
      },
      select: {
        id: true,
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
    const session = req.cookies.get('session')?.value
    if (!session || !session.includes(':')) {
      return NextResponse.json({ message: 'Nicht authentifiziert' }, { status: 401 })
    }
    const [role] = session.split(':')
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Nur Administratoren können Benutzer bearbeiten' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateUserSchema.parse(body)

    const updateData: any = {}
    if (data.email) updateData.email = data.email.toLowerCase()
    if (data.role) updateData.role = data.role
    if (data.name !== undefined) updateData.name = data.name || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.visibleCategories !== undefined) {
      updateData.visibleCategories = data.visibleCategories ? JSON.stringify(data.visibleCategories) : null
    }
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password)
    }

    // Prüfe ob E-Mail bereits von anderem User verwendet wird
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

    const user = await prisma.user.update({
      where: { id: data.id },
      data: updateData,
      select: {
        id: true,
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
    const session = req.cookies.get('session')?.value
    if (!session || !session.includes(':')) {
      return NextResponse.json({ message: 'Nicht authentifiziert' }, { status: 401 })
    }
    const [role] = session.split(':')
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Nur Administratoren können Benutzer löschen' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ message: 'ID erforderlich' }, { status: 400 })
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

