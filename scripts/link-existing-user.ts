import { createClient } from '@supabase/supabase-js'
import { prisma } from '../lib/prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('❌ Usage: tsx link-existing-user.ts <email> <password>')
    process.exit(1)
  }

  console.log(`🔄 Linking user: ${email}`)

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (!existingUser) {
      console.error(`❌ User nicht gefunden: ${email}`)
      process.exit(1)
    }

    if (existingUser.authUserId) {
      console.log(`✅ User ist bereits verknüpft: ${existingUser.authUserId}`)
      console.log(`Sie können sich jetzt einloggen mit: ${email}`)
      process.exit(0)
    }

    console.log(`📝 Erstelle Supabase Auth User...`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
    })

    if (error) {
      console.error('❌ Supabase Auth Error:', error.message)
      process.exit(1)
    }

    if (!data.user) {
      console.error('❌ Kein User zurückgegeben')
      process.exit(1)
    }

    console.log(`✅ Supabase Auth User erstellt: ${data.user.id}`)

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { authUserId: data.user.id }
    })

    console.log(`✅ User erfolgreich verknüpft!`)
    console.log(``)
    console.log(`Login-Daten:`)
    console.log(`Email: ${email}`)
    console.log(`Passwort: ${password}`)
    console.log(``)
    console.log(`Sie können sich jetzt unter /login einloggen.`)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
