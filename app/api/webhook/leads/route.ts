import { NextResponse } from 'next/server'
import { neon } from "@neondatabase/serverless"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Einfache Route ohne Auth - für Make.com Webhooks
export async function POST(req: Request) {
  try {
    console.log('📥 Webhook /api/webhook/leads called')
    
    const body = await req.json().catch(() => ({}))
    console.log('📥 Body received:', body)

    // Validate email
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ 
        error: "Email is required",
        received: body
      }, { status: 400 })
    }

    // Validate DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(process.env.DATABASE_URL)
    const email = body.email.trim().toLowerCase()

    // Handle name field
    let firstName = body.firstName
    let lastName = body.lastName
    if (body.name && !firstName && !lastName) {
      const nameParts = body.name.trim().split(/\s+/)
      if (nameParts.length > 0) {
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ') || null
      }
    }

    // Build notes
    const notesParts: string[] = []
    if (body.address) notesParts.push(`Adresse: ${body.address}`)
    if (body.bank) notesParts.push(`Bank: ${body.bank}`)
    if (body.notes) notesParts.push(body.notes)
    const notes = notesParts.length > 0 ? notesParts.join('\n') : null

    // Build automationData
    let automationData: string | null = null
    if (body.close_lead_id) {
      automationData = JSON.stringify({ close_lead_id: body.close_lead_id })
    }

    // Get default phaseId
    let phaseId: string | null = null
    try {
      const defaultPhase = await sql`
        SELECT id FROM "PipelinePhase" 
        WHERE type = 'lead' AND "isActive" = true 
        ORDER BY "order" ASC 
        LIMIT 1
      `
      if (defaultPhase && defaultPhase.length > 0) {
        phaseId = defaultPhase[0].id
      }
    } catch (phaseError) {
      console.warn('⚠️ Could not get default phaseId:', phaseError)
    }

    if (!phaseId) {
      return NextResponse.json({ 
        error: "No active lead phase found. Please create a lead phase first."
      }, { status: 500 })
    }

    // Check if lead exists
    const existing = await sql`
      SELECT * FROM "Lead" 
      WHERE email = ${email} 
      LIMIT 1
    `

    let lead

    if (existing && existing.length > 0) {
      // UPDATE
      const updates: string[] = []
      const values: any[] = []

      if (firstName !== undefined && firstName !== null) {
        updates.push(`"firstName" = $${values.length + 1}`)
        values.push(firstName)
      }
      if (lastName !== undefined && lastName !== null) {
        updates.push(`"lastName" = $${values.length + 1}`)
        values.push(lastName)
      }
      if (body.phone !== undefined && body.phone !== null) {
        updates.push(`phone = $${values.length + 1}`)
        values.push(body.phone)
      }
      if (body.company !== undefined && body.company !== null) {
        updates.push(`company = $${values.length + 1}`)
        values.push(body.company)
      }
      if (body.source !== undefined && body.source !== null) {
        updates.push(`source = $${values.length + 1}`)
        values.push(body.source)
      }
      if (notes !== undefined && notes !== null) {
        updates.push(`notes = $${values.length + 1}`)
        values.push(notes)
      }
      if (automationData !== undefined && automationData !== null) {
        updates.push(`"automationData" = $${values.length + 1}`)
        values.push(automationData)
      }

      updates.push(`"updatedAt" = NOW()`)
      values.push(email)

      if (updates.length > 1) {
        const updateQuery = `
          UPDATE "Lead" 
          SET ${updates.join(', ')}
          WHERE email = $${values.length}
          RETURNING *
        `
        const result = await sql.unsafe(updateQuery, values)
        lead = result[0]
      } else {
        const result = await sql`
          UPDATE "Lead" 
          SET "updatedAt" = NOW()
          WHERE email = ${email}
          RETURNING *
        `
        lead = result[0]
      }
    } else {
      // INSERT
      const insertFields: string[] = ['email', '"phaseId"', '"createdAt"', '"updatedAt"']
      const insertValues: any[] = [email, phaseId, new Date(), new Date()]

      if (firstName !== undefined && firstName !== null) {
        insertFields.push('"firstName"')
        insertValues.push(firstName)
      }
      if (lastName !== undefined && lastName !== null) {
        insertFields.push('"lastName"')
        insertValues.push(lastName)
      }
      if (body.phone !== undefined && body.phone !== null) {
        insertFields.push('phone')
        insertValues.push(body.phone)
      }
      if (body.company !== undefined && body.company !== null) {
        insertFields.push('company')
        insertValues.push(body.company)
      }
      if (body.source !== undefined && body.source !== null) {
        insertFields.push('source')
        insertValues.push(body.source)
      } else {
        insertFields.push('source')
        insertValues.push('make')
      }
      if (notes !== undefined && notes !== null) {
        insertFields.push('notes')
        insertValues.push(notes)
      }
      if (automationData !== undefined && automationData !== null) {
        insertFields.push('"automationData"')
        insertValues.push(automationData)
      }

      const placeholders = insertValues.map((_, idx) => `$${idx + 1}`).join(', ')
      const insertQuery = `
        INSERT INTO "Lead" (${insertFields.join(', ')}) 
        VALUES (${placeholders})
        RETURNING *
      `

      const result = await sql.unsafe(insertQuery, insertValues)
      lead = result[0]
    }

    console.log('✅ Lead processed:', { action: existing && existing.length > 0 ? 'updated' : 'created', email })

    return NextResponse.json({ 
      success: true, 
      lead: lead
    })
  } catch (err: any) {
    console.error('❌ Webhook Error:', err)
    return NextResponse.json({ 
      error: 'Internal error',
      details: err.message || 'Internal server error'
    }, { status: 500 })
  }
}

// Erlaube auch GET für Tests
export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: "Webhook endpoint is running",
    endpoint: "/api/webhook/leads",
    method: "Use POST to create/update leads"
  })
}

