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

    // Prepare fields for update/insert (only include fields that were provided)
    const fieldsToUpdate: Record<string, any> = {}
    const fieldsToInsert: Record<string, any> = {
      email: email
    }

    // Add optional fields if provided (handle null/undefined safely)
    if (body.close_lead_id !== undefined && body.close_lead_id !== null) {
      fieldsToUpdate.close_lead_id = body.close_lead_id
      fieldsToInsert.close_lead_id = body.close_lead_id
    }
    if (body.name !== undefined && body.name !== null) {
      fieldsToUpdate.name = body.name
      fieldsToInsert.name = body.name
    }
    if (body.phone !== undefined && body.phone !== null) {
      fieldsToUpdate.phone = body.phone
      fieldsToInsert.phone = body.phone
    }
    if (body.status !== undefined && body.status !== null) {
      fieldsToUpdate.status = body.status
      fieldsToInsert.status = body.status
    }
    if (body.source !== undefined && body.source !== null) {
      fieldsToUpdate.source = body.source
      fieldsToInsert.source = body.source
    }
    if (body.address !== undefined && body.address !== null) {
      fieldsToUpdate.address = body.address
      fieldsToInsert.address = body.address
    }
    if (body.bank !== undefined && body.bank !== null) {
      fieldsToUpdate.bank = body.bank
      fieldsToInsert.bank = body.bank
    }

    if (existingLead && existingLead.length > 0) {
      // Update existing lead - only update fields that were provided
      const updateKeys = Object.keys(fieldsToUpdate)
      
      if (updateKeys.length > 0) {
        // Build UPDATE query with proper parameterized values
        const setParts: string[] = []
        const params: any[] = []
        
        updateKeys.forEach((key) => {
          setParts.push(`${key} = $${params.length + 1}`)
          params.push(fieldsToUpdate[key])
        })
        
        // Add updated_at
        setParts.push(`updated_at = NOW()`)
        params.push(email) // For WHERE clause
        
        const updateQuery = `
          UPDATE leads 
          SET ${setParts.join(', ')}
          WHERE email = $${params.length}
        `
        
        await sql.unsafe(updateQuery, params)
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
      fieldsToInsert.created_at = new Date()
      fieldsToInsert.updated_at = new Date()

      const insertKeys = Object.keys(fieldsToInsert)
      const insertValues = Object.values(fieldsToInsert)
      const placeholders = insertKeys.map((_, idx) => `$${idx + 1}`).join(', ')

      const insertQuery = `
        INSERT INTO leads (${insertKeys.join(', ')}) 
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

// Final API endpoint in production: /.netlify/functions/leads
