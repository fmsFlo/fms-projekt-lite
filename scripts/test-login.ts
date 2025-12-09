import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import path from 'path'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`,
    },
  },
})

async function main() {
  const email = process.argv[2] || 'florian.hoerning@finance-made-simple.de'
  const password = process.argv[3] || 'test123'

  console.log('🔐 Teste Login...')
  console.log('📧 E-Mail:', email)
  console.log('')

  try {
    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      }
    })

    if (!user) {
      console.log('❌ User nicht gefunden!')
      console.log('')
      console.log('Verfügbare User:')
      const allUsers = await prisma.user.findMany()
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (Aktiv: ${u.isActive})`)
      })
      return
    }

    console.log('✅ User gefunden:')
    console.log(`   ID: ${user.id}`)
    console.log(`   E-Mail: ${user.email}`)
    console.log(`   Rolle: ${user.role}`)
    console.log(`   Aktiv: ${user.isActive}`)
    console.log(`   Passwort-Hash: ${user.passwordHash.substring(0, 20)}...`)
    console.log('')

    console.log('🔍 Teste Passwort-Validierung...')
    const isValid = await bcrypt.compare(password, user.passwordHash)
    
    if (isValid) {
      console.log('✅ Passwort ist KORREKT!')
    } else {
      console.log('❌ Passwort ist FALSCH!')
      console.log('')
      console.log('💡 Möchtest du das Passwort zurücksetzen?')
      console.log('   Führe aus: npx ts-node scripts/reset-user-password.ts ' + email + ' neues-passwort')
    }
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    console.error('Stack:', error.stack)
  }
}

main()
  .catch((e) => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



