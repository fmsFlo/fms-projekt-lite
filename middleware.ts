import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  // ALLE Routen außer Login sind geschützt!
  const publicPaths = ['/login']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path
  )

  // Wenn Session-Fehler oder keine Session → zu Login
  if (!isPublicPath && (!session || sessionError)) {
    // Stelle sicher, dass alle Auth-Cookies gelöscht sind
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
    // Lösche alle möglichen Supabase-Cookies
    const cookieNames = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token']
    cookieNames.forEach(name => {
      redirectResponse.cookies.delete(name)
      redirectResponse.cookies.set(name, '', { expires: new Date(0), path: '/' })
    })
    return redirectResponse
  }

  // Eingeloggt aber noch kein Profile → Unauthorized
  if (session && !isPublicPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=no_profile', request.url))
    }

    // Blocked user → raus
    if (profile.role === 'blocked') {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=blocked', request.url))
    }
  }

  return response
}

export const config = {
  // ALLE Routen außer public assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
