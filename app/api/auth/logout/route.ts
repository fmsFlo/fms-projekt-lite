import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Cookies können in API Routes manchmal nicht gesetzt werden
          }
        },
      },
    }
  )

  // Session löschen
  await supabase.auth.signOut()

  // Response mit gelöschten Cookies
  const response = NextResponse.json({ success: true })
  
  // Alle Supabase-Cookies löschen
  const supabaseCookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
  ]
  
  supabaseCookieNames.forEach(name => {
    response.cookies.delete(name)
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/',
    })
  })

  return response
}



