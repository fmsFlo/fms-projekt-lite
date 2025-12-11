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
      // UPDATE existing lead using COALESCE - only update fields that are provided
      const result = await sql`
        UPDATE "Lead" 
        SET 
          "firstName" = COALESCE(${firstName}, "firstName"),
          "lastName" = COALESCE(${lastName}, "lastName"),
          phone = COALESCE(${phone}, phone),
          company = COALESCE(${body.company || null}, company),
          source = COALESCE(${leadSource}, source),
          notes = COALESCE(${notes}, notes),
          "automationData" = COALESCE(${automationData}, "automationData"),
          "updatedAt" = NOW()
        WHERE email = ${email}
        RETURNING *
      `
      leadResult = result[0]
    } else {
      // INSERT new lead
      // Prisma table: "Lead" (PascalCase)
      // Do NOT set phaseId - leave it NULL
      // id wird automatisch von Prisma generiert (cuid())
      const result = await sql`
        INSERT INTO "Lead" (
          id,
          email,
          "firstName",
          "lastName",
          phone,
          company,
          source,
          notes,
          "automationData",
          "createdAt",
          "updatedAt"
        ) 
        VALUES (
          gen_random_uuid()::text,
          ${email},
          ${firstName || null},
          ${lastName || null},
          ${phone || null},
          ${body.company || null},
          ${leadSource},
          ${notes || null},
          ${automationData || null},
          NOW(),
          NOW()
        )
        RETURNING *
      `
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

