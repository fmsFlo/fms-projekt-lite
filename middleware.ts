import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // CRITICAL: Allow all Netlify Functions WITHOUT authentication
  // This must be checked FIRST, before any other checks
  if (path.startsWith('/.netlify/functions/')) {
    return NextResponse.next()
  }
  
  // Public routes - no auth check
  const publicRoutes = ['/api/login', '/reset-password', '/api/reset-password', '/api/user']
  if (publicRoutes.includes(path) || 
      path.startsWith('/api/user') || 
      path.startsWith('/api/make') || 
      path.startsWith('/api/login') ||
      path.startsWith('/api/leads/webhook') ||
      path.startsWith('/api/webhook/')) {
    return NextResponse.next()
  }
  
  // Check session cookie
  const session = request.cookies.get('session')
  
  // If user has valid session format AND is on /login page, redirect to /dashboard
  // WICHTIG: Keine Prisma-Abfrage hier, da Middleware im Edge Runtime läuft
  if (path === '/login' && session && session.value) {
    const [role, userId] = session.value.split(':')
    if (role && userId && (role === 'admin' || role === 'advisor')) {
      // Cookie-Format ist gültig - redirect away from login page
      // Die tatsächliche User-Validierung passiert in den API-Routen
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // Allow access to login/reset-password pages and root (without redirect)
  if (path === '/login' || path === '/reset-password' || path === '/') {
    return NextResponse.next()
  }
  
  // Protected routes - require authentication
  if (!session || !session.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Validate session format (role:userId)
  // WICHTIG: Keine Prisma-Abfrage hier, nur Format-Validierung
  const [role, userId] = session.value.split(':')
  if (!role || !userId || (role !== 'admin' && role !== 'advisor')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Cookie-Format ist gültig - erlaube Zugriff
  // Die tatsächliche User-Validierung (existiert User, ist aktiv, etc.) passiert in den API-Routen
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}

