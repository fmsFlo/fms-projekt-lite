import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

export async function handler(event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' }),
    }
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { email, newPassword } = JSON.parse(event.body || '{}')

    if (!email || !newPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email und Passwort sind erforderlich' }),
      }
    }

    if (newPassword.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Passwort muss mindestens 6 Zeichen lang sein' }),
      }
    }

    // Connect to database (nur process.env.DATABASE_URL - keine Fallbacks)
    if (!process.env.DATABASE_URL) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'DATABASE_URL environment variable is not set' }),
      }
    }
    const sql = neon(process.env.DATABASE_URL)

    // Find user
    const users = await sql`
      SELECT id, email, "isActive" 
      FROM "User" 
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `

    if (users.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Benutzer nicht gefunden' }),
      }
    }

    const user = users[0]

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user
    await sql`
      UPDATE "User"
      SET "passwordHash" = ${hashedPassword},
          "isActive" = true,
          "updatedAt" = NOW()
      WHERE id = ${user.id}
    `

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Passwort erfolgreich zurückgesetzt',
        email: user.email,
      }),
    }
  } catch (error) {
    console.error('❌ Reset Password Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Interner Fehler',
        message: error.message,
      }),
    }
  }
}

