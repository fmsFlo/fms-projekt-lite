import { cookies } from 'next/headers'
import { serialize } from 'cookie'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { NextRequest } from 'next/server'

const SESSION_COOKIE = 'session'

// Hilfsfunktion zum Lesen von Cookies aus Request (für API-Routen)
export function getSessionFromRequest(req?: NextRequest | Request): string | null {
  if (req) {
    // Prüfe ob es ein NextRequest ist (hat cookies.get)
    if ('cookies' in req && typeof req.cookies.get === 'function') {
      return (req as NextRequest).cookies.get(SESSION_COOKIE)?.value || null
    }
    // Fallback: Versuche aus Headers zu lesen
    try {
      const cookieHeader = (req as Request).headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)
        return cookies[SESSION_COOKIE] || null
      }
    } catch {
      // Ignoriere Fehler
    }
  }
  // Fallback für Server-Komponenten
  try {
    return cookies().get(SESSION_COOKIE)?.value || null
  } catch {
    return null
  }
}

export type UserRole = 'admin' | 'advisor'

export async function verifyCredentials(email: string, password: string): Promise<{ role: UserRole; userId: string } | null> {
  try {
    const inEmail = String(email || '').trim().toLowerCase()
    const inPassword = String(password || '').trim()
    
    console.log('🔍 verifyCredentials aufgerufen:', { email: inEmail, passwordLength: inPassword.length })
    
    // Stelle sicher, dass Prisma verbunden ist
    try {
      await prisma.$connect()
      console.log('✅ Prisma verbunden')
    } catch (connectError: any) {
      console.error('❌ Prisma Connect Error:', connectError.message)
      console.error('❌ Connect Error Stack:', connectError.stack)
      // Versuche trotzdem weiter
    }
    
    console.log('🔍 Suche User in Datenbank...')
    const user = await prisma.user.findFirst({
      where: { 
        email: inEmail,
        isActive: true 
      }
    })
    
    if (!user) {
      console.log('❌ User nicht gefunden oder inaktiv:', inEmail)
      // Prüfe ob User überhaupt existiert (auch inaktiv)
      const anyUser = await prisma.user.findFirst({
        where: { email: inEmail }
      })
      if (anyUser) {
        console.log('⚠️ User existiert, aber ist inaktiv:', anyUser.isActive)
      } else {
        console.log('❌ User existiert nicht in Datenbank')
        // Zeige alle User
        const allUsers = await prisma.user.findMany({ 
          select: { email: true, isActive: true },
          take: 5
        })
        console.log('📋 Erste 5 User in DB:', allUsers)
      }
      return null
    }
    
    console.log('✅ User gefunden:', user.email, 'Rolle:', user.role, 'Aktiv:', user.isActive)
    console.log('🔐 Prüfe Passwort (Hash-Länge:', user.passwordHash.length, ')...')
    
    const isValid = await bcrypt.compare(inPassword, user.passwordHash)
    
    if (!isValid) {
      console.log('❌ Passwort ist falsch')
      console.log('🔍 Eingegebenes Passwort (Länge):', inPassword.length)
      console.log('🔍 Passwort-Hash (erste 30 Zeichen):', user.passwordHash.substring(0, 30))
      // Teste mit einem bekannten Hash
      const testHash = await bcrypt.hash('test', 10)
      const testCompare = await bcrypt.compare('test', testHash)
      console.log('🧪 Bcrypt Test:', testCompare ? '✅ Funktioniert' : '❌ Funktioniert nicht')
      return null
    }
    
    console.log('✅ Passwort korrekt!')
    return { role: user.role as UserRole, userId: user.id }
  } catch (error: any) {
    console.error('❌ verifyCredentials Error:', error.message)
    console.error('❌ Error Name:', error.name)
    console.error('❌ Error Stack:', error.stack?.split('\n').slice(0, 5).join('\n'))
    return null
  }
}

export function setSessionCookie(role: UserRole, userId: string): void {
  const sevenDays = 7 * 24 * 60 * 60
  cookies().set('session', `${role}:${userId}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: sevenDays
  })
}

export function clearSessionCookie(): void {
  cookies().set('session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
}

export function isAuthenticated(): boolean {
  const c = cookies().get(SESSION_COOKIE)?.value
  return !!c && c.includes(':')
}

export function getUserRole(req?: NextRequest | Request): UserRole | null {
  const c = getSessionFromRequest(req)
  if (!c || !c.includes(':')) return null
  const role = c.split(':')[0]
  if (role === 'admin' || role === 'advisor') {
    return role as UserRole
  }
  return null
}

export function getUserId(req?: NextRequest | Request): string | null {
  const c = getSessionFromRequest(req)
  if (!c || !c.includes(':')) return null
  return c.split(':')[1] || null
}

export function isAdmin(req?: NextRequest | Request): boolean {
  return getUserRole(req) === 'admin'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
