import { NextResponse } from 'next/server'
import { z } from 'zod'
import { neon } from "@neondatabase/serverless"

export const dynamic = 'force-dynamic'
export const revalidate = 0

const schema = z.object({
  email: z.string().email(),
  close_lead_id: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  name: z.string().optional().nullable(), // Wird in firstName/lastName aufgeteilt
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bank: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const input = schema.parse(body)

    // Validate DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL || 
                        process.env.NETLIFY_DATABASE_URL_UNPOOLED || 
                        process.env.NETLIFY_DATABASE_URL
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    // Connect directly to database
    const sql = neon(databaseUrl)

    // Normalize email
    const email = input.email.trim().toLowerCase()
    
    // Handle name field: if "name" is provided, split into firstName and lastName
    let firstName = input.firstName
    let lastName = input.lastName
    if (input.name && !firstName && !lastName) {
      const nameParts = input.name.trim().split(/\s+/)
      if (nameParts.length > 0) {
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ') || null
      }
    }

    // Build notes from address and bank if provided
    const notesParts: string[] = []
    if (input.address) notesParts.push(`Adresse: ${input.address}`)
    if (input.bank) notesParts.push(`Bank: ${input.bank}`)
    if (input.notes) notesParts.push(input.notes)
    const notes = notesParts.length > 0 ? notesParts.join('\n') : null

    // Build automationData JSON for close_lead_id
    let automationData: string | null = null
    if (input.close_lead_id) {
      automationData = JSON.stringify({ close_lead_id: input.close_lead_id })
    }

    // Get default phaseId (we need a default phase for new leads)
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
        error: "No active lead phase found. Please create a lead phase first.",
        details: "The Lead model requires a phaseId, but no active lead phase exists in the database."
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
      // UPDATE existing lead
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
      if (input.phone !== undefined && input.phone !== null) {
        updates.push(`phone = $${values.length + 1}`)
        values.push(input.phone)
      }
      if (input.company !== undefined && input.company !== null) {
        updates.push(`company = $${values.length + 1}`)
        values.push(input.company)
      }
      if (input.source !== undefined && input.source !== null) {
        updates.push(`source = $${values.length + 1}`)
        values.push(input.source)
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
      // INSERT new lead
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
      if (input.phone !== undefined && input.phone !== null) {
        insertFields.push('phone')
        insertValues.push(input.phone)
      }
      if (input.company !== undefined && input.company !== null) {
        insertFields.push('company')
        insertValues.push(input.company)
      }
      if (input.source !== undefined && input.source !== null) {
        insertFields.push('source')
        insertValues.push(input.source)
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

    return NextResponse.json({ 
      success: true, 
      lead: lead
    })
  } catch (err: any) {
    console.error('❌ Leads Webhook Error:', err)
    
    if (err?.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid input',
        details: err.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal error',
      details: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
