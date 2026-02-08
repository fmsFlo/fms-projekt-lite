import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const settingsSchema = z.object({
  personalName: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  personalEmail: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  personalStreet: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  personalHouseNumber: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  personalZip: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  personalCity: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  personalPhone: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  personalWebsite: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  companyName: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  contactPerson: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  companyEmail: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  companyStreet: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  companyHouseNumber: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  companyZip: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  companyCity: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  companyPhone: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  companyWebsite: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  billingStreet: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  billingHouseNumber: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  billingZip: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  billingCity: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  billingEmail: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  makeWebhookUrl: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  makeApiKey: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  logoUrl: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  companySlogan: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  advisorIban: z.union([z.string(), z.null(), z.literal('')]).optional().transform(v => {
    if (v === null || v === undefined || v === '') return null
    const trimmed = String(v).trim()
    return trimmed === '' ? null : trimmed
  }),
  paymentSubject: z.union([z.string(), z.null(), z.literal('')]).optional().transform(v => {
    if (v === null || v === undefined || v === '') return null
    const trimmed = String(v).trim()
    return trimmed === '' ? null : trimmed
  }),
  creditorId: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  stripeSecretKey: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  stripePublishableKey: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  sevdeskApiToken: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  sevdeskApiUrl: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  closeApiKey: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  calendlyApiToken: z.string().nullable().optional().transform(v => (v && v.trim()) || undefined),
  primaryColor: z.string().optional().transform(v => (v && v.trim()) || undefined),
  secondaryColor: z.string().optional().transform(v => (v && v.trim()) || undefined)
})

export async function GET(req: NextRequest) {
  try {
    // Auth-Prüfung - nur Admin
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: 'Nur für Administratoren' }, { status: 403 })
    }

    let settings = await prisma.companySettings.findFirst()
    if (!settings) {
      settings = await prisma.companySettings.create({ data: {} })
    }
    return NextResponse.json(settings)
  } catch (err: any) {
    console.error('Settings GET error:', err)
    return NextResponse.json({ message: 'Interner Fehler', error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth-Prüfung - nur Admin
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: 'Nur für Administratoren' }, { status: 403 })
    }

    const body = await req.json()
    console.log('📝 Settings POST:', body)
    
    const data = settingsSchema.parse(body)
    console.log('✅ Validated Settings:', data)
    
    // Konvertiere undefined zu null für Prisma und entferne Felder, die nicht im Schema sind
    const prismaData: Record<string, any> = {}
    const allowedFields = [
      'personalName', 'personalEmail', 'personalStreet', 'personalHouseNumber', 'personalZip', 'personalCity', 'personalPhone', 'personalWebsite',
      'companyName', 'contactPerson', 'companyEmail', 'companyStreet', 'companyHouseNumber', 'companyZip', 'companyCity', 'companyPhone', 'companyWebsite',
      'billingStreet', 'billingHouseNumber', 'billingZip', 'billingCity', 'billingEmail',
      'makeWebhookUrl', 'makeApiKey',
      'closeApiKey',
      'calendlyApiToken',
      'logoUrl', 'companySlogan',
      'advisorIban', 'paymentSubject', 'creditorId',
      'stripeSecretKey', 'stripePublishableKey',
      'sevdeskApiToken', 'sevdeskApiUrl',
      'primaryColor', 'secondaryColor'
    ]
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        prismaData[key] = value === undefined ? null : value
      }
    }
    console.log('📤 Prisma Data:', prismaData)
    
    let settings = await prisma.companySettings.findFirst()
    
    if (settings) {
      settings = await prisma.companySettings.update({ where: { id: settings.id }, data: prismaData })
    } else {
      settings = await prisma.companySettings.create({ data: prismaData })
    }
    
    console.log('✅ Saved Settings:', settings)
    return NextResponse.json(settings)
  } catch (err: any) {
    console.error('❌ Settings Error:', err)
    
    if (err?.name === 'ZodError') {
      console.error('📋 Validation Issues:', JSON.stringify(err.issues, null, 2))
      return NextResponse.json({ 
        message: 'Validierungsfehler', 
        issues: err.issues,
        details: err.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')
      }, { status: 400 })
    }
    
    if (err?.code?.startsWith('P')) {
      // Prisma Error
      console.error('🗄️ Prisma Error:', err.code, err.message)
      return NextResponse.json({ 
        message: 'Datenbankfehler', 
        error: err.message,
        code: err.code 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Interner Fehler', 
      error: err.message || 'Unbekannter Fehler' 
    }, { status: 500 })
  }
}

