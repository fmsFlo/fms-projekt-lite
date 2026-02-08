import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'

export type UserRole = 'admin' | 'advisor'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

export function createSupabaseServerClient(accessToken?: string) {
  const cookieStore = cookies()
  const authCookies = {
    access_token: accessToken || cookieStore.get('sb-access-token')?.value,
    refresh_token: cookieStore.get('sb-refresh-token')?.value,
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: authCookies.access_token
        ? { Authorization: `Bearer ${authCookies.access_token}` }
        : {},
    },
  })
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ role: UserRole; userId: string; authUserId: string } | null> {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (error || !data.user) {
      console.error('Supabase Auth Error:', error?.message)
      return null
    }

    const user = await prisma.user.findFirst({
      where: {
        authUserId: data.user.id,
        isActive: true,
      },
    })

    if (!user) {
      console.error('User not found in database or inactive')
      return null
    }

    return {
      role: user.role as UserRole,
      userId: user.id,
      authUserId: data.user.id,
    }
  } catch (error: any) {
    console.error('verifyCredentials Error:', error.message)
    return null
  }
}

export function setAuthCookies(accessToken: string, refreshToken: string): void {
  const sevenDays = 7 * 24 * 60 * 60

  try {
    cookies().set('sb-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sevenDays,
    })

    cookies().set('sb-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sevenDays,
    })
  } catch (error: any) {
    console.error('setAuthCookies error:', error.message)
  }
}

export function clearAuthCookies(): void {
  try {
    cookies().set('sb-access-token', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
    cookies().set('sb-refresh-token', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  } catch (error: any) {
    console.error('clearAuthCookies error:', error.message)
  }
}

export async function getAuthUserFromRequest(req?: NextRequest | Request): Promise<{
  authUserId: string
  userId: string
  role: UserRole
  email: string
} | null> {
  try {
    let accessToken: string | undefined

    if (req) {
      if ('cookies' in req && typeof req.cookies.get === 'function') {
        accessToken = (req as NextRequest).cookies.get('sb-access-token')?.value
      } else {
        const cookieHeader = (req as Request).headers.get('cookie')
        if (cookieHeader) {
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
          }, {} as Record<string, string>)
          accessToken = cookies['sb-access-token']
        }
      }
    } else {
      try {
        accessToken = cookies().get('sb-access-token')?.value
      } catch {
        return null
      }
    }

    if (!accessToken) {
      return null
    }

    const supabase = createSupabaseServerClient(accessToken)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    const appUser = await prisma.user.findFirst({
      where: {
        authUserId: user.id,
        isActive: true,
      },
    })

    if (!appUser) {
      return null
    }

    return {
      authUserId: user.id,
      userId: appUser.id,
      role: appUser.role as UserRole,
      email: appUser.email,
    }
  } catch (error: any) {
    console.error('getAuthUserFromRequest Error:', error.message)
    return null
  }
}

export async function isAuthenticated(req?: NextRequest | Request): Promise<boolean> {
  const user = await getAuthUserFromRequest(req)
  return !!user
}

export async function getUserRole(req?: NextRequest | Request): Promise<UserRole | null> {
  const user = await getAuthUserFromRequest(req)
  return user?.role || null
}

export async function getUserId(req?: NextRequest | Request): Promise<string | null> {
  const user = await getAuthUserFromRequest(req)
  return user?.userId || null
}

export async function isAdmin(req?: NextRequest | Request): Promise<boolean> {
  const role = await getUserRole(req)
  return role === 'admin'
}

export async function createAuthUser(
  email: string,
  password: string,
  role: UserRole,
  name?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const supabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      email_confirm: true,
    })

    if (error || !data.user) {
      console.error('Create Supabase User Error:', error?.message)
      return { success: false, error: error?.message || 'Failed to create auth user' }
    }

    const appUser = await prisma.user.create({
      data: {
        authUserId: data.user.id,
        email: email.trim().toLowerCase(),
        role,
        name,
        isActive: true,
      },
    })

    return { success: true, userId: appUser.id }
  } catch (error: any) {
    console.error('createAuthUser Error:', error.message)
    return { success: false, error: error.message }
  }
}
