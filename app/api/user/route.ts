import { NextResponse } from 'next/server'
import { getUserRole, getUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    // Prüfe Session direkt aus Cookie
    const session = req.cookies.get('session')?.value
    
    if (!session || !session.includes(':')) {
      return NextResponse.json({ role: null, visibleCategories: null })
    }
    
    const [role, userId] = session.split(':')
    
    let visibleCategories: string[] | null = null
    
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { visibleCategories: true, role: true }
        })
        
        if (user) {
          // Admin sieht alle Kategorien (null = alle)
          if (user.role === 'admin') {
            visibleCategories = null
          } else if (user.visibleCategories) {
            // Parse JSON-Array
            try {
              visibleCategories = JSON.parse(user.visibleCategories)
            } catch {
              visibleCategories = []
            }
          } else {
            // Berater ohne visibleCategories sehen keine Honorarverträge
            visibleCategories = []
          }
        }
      } catch (dbError: any) {
        console.error('❌ DB Error in /api/user:', dbError.message)
        // Fallback: Verwende Rolle aus Session
      }
    }
    
    // Verwende Rolle aus Session, falls DB-Abfrage fehlschlägt
    const finalRole = (role === 'admin' || role === 'advisor') ? role : null
    
    return NextResponse.json({ role: finalRole, visibleCategories })
  } catch (error: any) {
    console.error('❌ User GET Error:', error)
    return NextResponse.json({ role: null, visibleCategories: null })
  }
}

