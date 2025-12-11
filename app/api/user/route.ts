import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    console.log('🔍 /api/user: Request received')
    const sessionCookie = cookies().get('session')
    console.log('🔍 /api/user: Session cookie:', sessionCookie ? 'present' : 'missing', sessionCookie?.value?.substring(0, 30))
    
    if (!sessionCookie) {
      console.log('❌ /api/user: No session cookie')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const [role, userId] = sessionCookie.value.split(':')
    console.log('🔍 /api/user: Parsed role:', role, 'userId:', userId)
    
    if (!role || !userId) {
      console.log('❌ /api/user: Invalid session format')
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
    
    console.log('🔍 /api/user: Querying database for user:', userId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        visibleCategories: true
      }
    })
    
    console.log('🔍 /api/user: User found:', user ? 'yes' : 'no', user?.isActive ? 'active' : 'inactive')
    
    if (!user || !user.isActive) {
      console.log('❌ /api/user: User not found or inactive')
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    if (user.role !== role) {
      console.log('❌ /api/user: Role mismatch', 'expected:', user.role, 'got:', role)
      return NextResponse.json({ error: 'Role mismatch' }, { status: 401 })
    }
    
    let visibleCategories: string[] | null = null
    
    // Admin sieht alle Kategorien (null = alle)
    if (user.role === 'admin') {
      visibleCategories = null
    } else if (user.visibleCategories) {
      try {
        visibleCategories = JSON.parse(user.visibleCategories)
      } catch {
        visibleCategories = []
      }
    } else {
      visibleCategories = []
    }
    
    console.log('✅ /api/user: Returning user data for', user.email)
    return NextResponse.json({ 
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive, // WICHTIG: isActive muss zurückgegeben werden!
      visibleCategories
    })
  } catch (error) {
    console.error('❌ /api/user: Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

