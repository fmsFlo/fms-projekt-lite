import { NextResponse } from 'next/server'
import { clearAuthCookies, createSupabaseServerClient } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = createSupabaseServerClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout error:', error)
  }

  clearAuthCookies()

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')

  return response
}
