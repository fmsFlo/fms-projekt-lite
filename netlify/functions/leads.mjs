import { neon } from '@neondatabase/serverless'

export async function handler(event, context) {
  // Log request for debugging
  console.log('📥 Leads Function called:', {
    method: event.httpMethod,
    path: event.path,
    body: event.body ? JSON.parse(event.body || '{}') : null
  })

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true })
    }
  }

  // Allow GET requests for testing
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Leads Function is running',
        endpoint: '/.netlify/functions/leads',
        method: 'Use POST to create/update leads',
        requiredFields: ['email'],
        optionalFields: ['name', 'phone', 'close_lead_id', 'status', 'source', 'address', 'bank']
      })
    }
  }

  // Only allow POST for actual operations
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed', expected: 'POST' })
    }
  }

  // Parse body
  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Invalid JSON', details: error.message })
    }
  }

  // Validate required field: email
  if (!body.email || typeof body.email !== 'string' || body.email.trim() === '') {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Email is required' })
    }
  }

  // Validate DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL || 
                      process.env.NETLIFY_DATABASE_URL_UNPOOLED || 
                      process.env.NETLIFY_DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set')
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')))
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Database configuration error',
        details: 'DATABASE_URL environment variable is not set. Please check your .env.local file or Netlify environment variables.'
      })
    }
  }

  // Validate DATABASE_URL format
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.error('❌ DATABASE_URL has invalid format:', databaseUrl.substring(0, 30) + '...')
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Database configuration error',
        details: 'DATABASE_URL must start with postgresql:// or postgres://'
      })
    }
  }

  // Connect to Neon
  let sql
  try {
    sql = neon(databaseUrl)
  } catch (neonError) {
    console.error('❌ Neon connection error:', neonError.message)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Database connection error',
        details: neonError.message
      })
    }
  }

  try {
    // Normalize email
    const email = body.email.trim().toLowerCase()
    const { name, phone, close_lead_id, status, source, address, bank } = body

    // Split name into firstName and lastName
    let firstName = null
    let lastName = null
    if (name) {
      const nameParts = name.trim().split(/\s+/).filter(Boolean)
      if (nameParts.length > 0) {
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ') || null
      }
    }

    // Combine address and bank into notes
    const notesParts = []
    if (body.notes) notesParts.push(body.notes)
    if (address) notesParts.push(`Adresse: ${address}`)
    if (bank) notesParts.push(`Bank: ${bank}`)
    const notes = notesParts.length > 0 ? notesParts.join('\n') : null

    // Store close_lead_id in automationData as JSON
    const automationData = close_lead_id ? JSON.stringify({ close_lead_id }) : null

    // Set default source if not provided
    const leadSource = source || 'close_crm'

    // Check if lead exists
    // Prisma table names: Model Lead -> table "Lead" (PascalCase, no @@map)
    // Prisma column names: camelCase stays camelCase (firstName, lastName, createdAt, etc.)
    const existing = await sql`
      SELECT * FROM "Lead" 
      WHERE email = ${email} 
      LIMIT 1
    `

    let leadResult

    if (existing && existing.length > 0) {
      // UPDATE existing lead - only update fields that were provided
      const updates = []
      const values = []

      if (firstName !== undefined && firstName !== null) {
        updates.push(`"firstName" = $${values.length + 1}`)
        values.push(firstName)
      }
      if (lastName !== undefined && lastName !== null) {
        updates.push(`"lastName" = $${values.length + 1}`)
        values.push(lastName)
      }
      if (phone !== undefined && phone !== null) {
        updates.push(`phone = $${values.length + 1}`)
        values.push(phone)
      }
      if (body.company !== undefined && body.company !== null) {
        updates.push(`company = $${values.length + 1}`)
        values.push(body.company)
      }
      // Always update source (use provided or default)
      updates.push(`source = $${values.length + 1}`)
      values.push(leadSource)
      if (notes !== undefined && notes !== null) {
        updates.push(`notes = $${values.length + 1}`)
        values.push(notes)
      }
      if (automationData !== undefined && automationData !== null) {
        updates.push(`"automationData" = $${values.length + 1}`)
        values.push(automationData)
      }

      // Always update updatedAt
      updates.push(`"updatedAt" = NOW()`)
      values.push(email) // For WHERE clause

      if (updates.length > 1) {
        // Build UPDATE query with RETURNING
        const updateQuery = `
          UPDATE "Lead" 
          SET ${updates.join(', ')}
          WHERE email = $${values.length}
          RETURNING *
        `
        const result = await sql.unsafe(updateQuery, values)
        leadResult = result[0]
      } else {
        // Only update updatedAt if no other fields to update
        const result = await sql`
          UPDATE "Lead" 
          SET "updatedAt" = NOW()
          WHERE email = ${email}
          RETURNING *
        `
        leadResult = result[0]
      }
    } else {
      // INSERT new lead
      // Prisma table: "Lead" (PascalCase)
      // Do NOT set phaseId - leave it NULL
      const insertFields = ['email', '"createdAt"', '"updatedAt"', 'source']
      const insertValues = [email, new Date(), new Date(), leadSource]

      if (firstName !== undefined && firstName !== null) {
        insertFields.push('"firstName"')
        insertValues.push(firstName)
      }
      if (lastName !== undefined && lastName !== null) {
        insertFields.push('"lastName"')
        insertValues.push(lastName)
      }
      if (phone !== undefined && phone !== null) {
        insertFields.push('phone')
        insertValues.push(phone)
      }
      if (body.company !== undefined && body.company !== null) {
        insertFields.push('company')
        insertValues.push(body.company)
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
      leadResult = result[0]
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        lead: leadResult
      })
    }
  } catch (error) {
    console.error('❌ Database error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Database error',
        details: error.message || 'Internal server error'
      })
    }
  }
}

// Final API endpoint in production: /.netlify/functions/leads

