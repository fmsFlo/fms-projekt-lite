import { NextResponse, type NextRequest } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  // Session-Cookie löschen
  const response = NextResponse.json({ success: true })
  
  // Session-Cookie löschen
  response.cookies.delete('session')
  response.cookies.set('session', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })

  return response
}



