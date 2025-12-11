import { neon } from "@neondatabase/serverless"
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

interface LeadData {
  email: string
  close_lead_id?: string | null
  name?: string | null
  phone?: string | null
  status?: string | null
  source?: string | null
  address?: string | null
  bank?: string | null
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: "Method not allowed" })
    }
  }

  try {
    // Parse request body
    let body: LeadData
    try {
      body = JSON.parse(event.body || '{}')
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: "Invalid JSON in request body" })
      }
    }

    // Validate required field: email
    if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: "Email is required" })
      }
    }

    // Validate DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    // Get database connection
    const sql = neon(process.env.DATABASE_URL)

    // Normalize email (trim and lowercase)
    const email = body.email.trim().toLowerCase()

    // Check if lead exists
    const existingLead = await sql`
      SELECT * FROM leads 
      WHERE email = ${email} 
      LIMIT 1
    `

    if (existingLead && existingLead.length > 0) {
      // Update existing lead - only update fields that were provided
      const updates: string[] = []
      const values: any[] = []

      if (body.close_lead_id !== undefined && body.close_lead_id !== null) {
        updates.push(`close_lead_id = $${values.length + 1}`)
        values.push(body.close_lead_id)
      }
      if (body.name !== undefined && body.name !== null) {
        updates.push(`name = $${values.length + 1}`)
        values.push(body.name)
      }
      if (body.phone !== undefined && body.phone !== null) {
        updates.push(`phone = $${values.length + 1}`)
        values.push(body.phone)
      }
      if (body.status !== undefined && body.status !== null) {
        updates.push(`status = $${values.length + 1}`)
        values.push(body.status)
      }
      if (body.source !== undefined && body.source !== null) {
        updates.push(`source = $${values.length + 1}`)
        values.push(body.source)
      }
      if (body.address !== undefined && body.address !== null) {
        updates.push(`address = $${values.length + 1}`)
        values.push(body.address)
      }
      if (body.bank !== undefined && body.bank !== null) {
        updates.push(`bank = $${values.length + 1}`)
        values.push(body.bank)
      }

      // Always update updated_at
      updates.push(`updated_at = NOW()`)

      if (updates.length > 1) {
        // Build UPDATE query - add email to values for WHERE clause
        values.push(email)
        const updateQuery = `
          UPDATE leads 
          SET ${updates.join(', ')}
          WHERE email = $${values.length}
        `
        await sql.unsafe(updateQuery, values)
      } else {
        // Only update updated_at if no other fields to update
        await sql`
          UPDATE leads 
          SET updated_at = NOW()
          WHERE email = ${email}
        `
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true, 
          action: "updated" 
        })
      }
    } else {
      // Insert new lead
      const insertFields: string[] = ['email', 'created_at', 'updated_at']
      const insertValues: any[] = [email, new Date(), new Date()]

      if (body.close_lead_id !== undefined && body.close_lead_id !== null) {
        insertFields.push('close_lead_id')
        insertValues.push(body.close_lead_id)
      }
      if (body.name !== undefined && body.name !== null) {
        insertFields.push('name')
        insertValues.push(body.name)
      }
      if (body.phone !== undefined && body.phone !== null) {
        insertFields.push('phone')
        insertValues.push(body.phone)
      }
      if (body.status !== undefined && body.status !== null) {
        insertFields.push('status')
        insertValues.push(body.status)
      }
      if (body.source !== undefined && body.source !== null) {
        insertFields.push('source')
        insertValues.push(body.source)
      }
      if (body.address !== undefined && body.address !== null) {
        insertFields.push('address')
        insertValues.push(body.address)
      }
      if (body.bank !== undefined && body.bank !== null) {
        insertFields.push('bank')
        insertValues.push(body.bank)
      }

      const placeholders = insertValues.map((_, idx) => `$${idx + 1}`).join(', ')
      const insertQuery = `
        INSERT INTO leads (${insertFields.join(', ')}) 
        VALUES (${placeholders})
      `

      await sql.unsafe(insertQuery, insertValues)

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true, 
          action: "created" 
        })
      }
    }
  } catch (err: any) {
    console.error('Error in leads function:', err)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: err.message || 'Internal server error' 
      })
    }
  }
}

// Production endpoint: /.netlify/functions/leads
