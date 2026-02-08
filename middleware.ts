import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith('/.netlify/functions/')) {
    return NextResponse.next()
  }

  const publicRoutes = ['/api/login', '/reset-password', '/api/reset-password', '/api/user']
  if (publicRoutes.includes(path) ||
      path.startsWith('/api/user') ||
      path.startsWith('/api/make') ||
      path.startsWith('/api/login') ||
      path.startsWith('/api/reset-password') ||
      path.startsWith('/api/leads/webhook') ||
      path.startsWith('/api/webhook/')) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get('sb-access-token')

  if (path === '/login' && accessToken && accessToken.value) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (path === '/login' || path === '/reset-password' || path === '/') {
    return NextResponse.next()
  }

  if (!accessToken || !accessToken.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
