import { NextResponse, type NextRequest } from 'next/server'
import { clearAuthCookies, createSupabaseServerClient } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout error:', error)
  }

  const response = NextResponse.json({ success: true })

  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')
  response.cookies.set('sb-access-token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })
  response.cookies.set('sb-refresh-token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })

  return response
}
