import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CloseApiService } from '@/lib/close-api'

export async function GET(req: NextRequest) {
  try {
    // Prüfe Session
    const session = req.cookies.get('session')?.value
    if (!session || !session.includes(':')) {
      return NextResponse.json({ message: 'Nicht authentifiziert' }, { status: 401 })
    }
    
    const [role] = session.split(':')
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Nur Administratoren können Dashboards anzeigen' }, { status: 403 })
    }

    // Hole Close API Key aus Settings
    const settings = await prisma.companySettings.findFirst()
    const closeApiKey = settings?.closeApiKey || process.env.CLOSE_API_KEY

    if (!closeApiKey) {
      return NextResponse.json({ error: 'Close API Key nicht konfiguriert' }, { status: 500 })
    }

    // Initialisiere Close API Service
    const closeApi = new CloseApiService(closeApiKey)

    // Hole alle User aus Close
    const allUsers = await closeApi.getAllUsers()

    // Filtere nur Florian Hörning
    const florianUser = allUsers.find((user: any) => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
      return fullName.toLowerCase().includes('florian') && fullName.toLowerCase().includes('hörning')
    })

    if (!florianUser) {
      // Fallback: Suche nach "Florian" oder "Hörning"
      const fallbackUser = allUsers.find((user: any) => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase()
        return fullName.includes('florian') || fullName.includes('hörning')
      })

      if (fallbackUser) {
        return NextResponse.json([{
          id: fallbackUser.id,
          name: `${fallbackUser.first_name || ''} ${fallbackUser.last_name || ''}`.trim() || 'Florian Hörning',
          close_user_id: fallbackUser.id,
          email: fallbackUser.email
        }])
      }

      return NextResponse.json([], { status: 404 })
    }

    // Formatiere User für Frontend
    const formattedUser = {
      id: florianUser.id,
      name: `${florianUser.first_name || ''} ${florianUser.last_name || ''}`.trim() || 'Florian Hörning',
      close_user_id: florianUser.id,
      email: florianUser.email
    }

    return NextResponse.json([formattedUser])
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

