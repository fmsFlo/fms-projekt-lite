import { NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    console.log('🔍 /api/user: Request received')

    const authUser = await getAuthUserFromRequest(request)

    if (!authUser) {
      console.log('❌ /api/user: Not authenticated')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ /api/user: Returning user data for', authUser.email)
    return NextResponse.json({
      id: authUser.userId,
      email: authUser.email,
      role: authUser.role,
      isActive: true,
      visibleCategories: null // Admin sieht alle Kategorien
    })
  } catch (error) {
    console.error('❌ /api/user: Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

