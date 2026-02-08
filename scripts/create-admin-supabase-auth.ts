import { createClient } from '@supabase/supabase-js'
import { prisma } from '../lib/prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: ts-node create-admin-supabase-auth.ts <email> <password>')
    process.exit(1)
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    console.log(`Creating Supabase Auth user for: ${email}`)

    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (!existingUser) {
      console.error(`User with email ${email} not found in database`)
      process.exit(1)
    }

    if (existingUser.authUserId) {
      console.log(`User already has Supabase Auth ID: ${existingUser.authUserId}`)
      console.log('User is already set up for Supabase Auth')
      process.exit(0)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
    })

    if (error) {
      console.error('Error creating Supabase Auth user:', error.message)
      process.exit(1)
    }

    if (!data.user) {
      console.error('No user data returned')
      process.exit(1)
    }

    console.log(`Supabase Auth user created: ${data.user.id}`)

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { authUserId: data.user.id }
    })

    console.log(`✅ Successfully linked User ${existingUser.id} with Supabase Auth User ${data.user.id}`)
    console.log(`You can now login with: ${email} / ${password}`)

  } catch (error: any) {
    console.error('Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
