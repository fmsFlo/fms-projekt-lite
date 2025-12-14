import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Prüfe Neon-Datenbank...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Gesetzt' : '❌ Nicht gesetzt')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log('\n📋 Gefundene Benutzer in Neon:')
    console.log('─────────────────────────────────────────')
    if (users.length === 0) {
      console.log('❌ Keine Benutzer gefunden!')
      console.log('\n💡 Tipp: Erstelle einen Admin-User mit:')
      console.log('   npx ts-node scripts/create-admin-simple.ts')
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Rolle: ${user.role}`)
        console.log(`   Name: ${user.name || '-'}`)
        console.log(`   Aktiv: ${user.isActive ? '✅' : '❌'}`)
        console.log(`   Erstellt: ${user.createdAt}`)
        console.log('')
      })
    }
    
    // Prüfe speziell den Admin-User
    const adminUser = users.find(u => u.email === 'admin@finance-made-simple.de')
    if (adminUser) {
      console.log('✅ Admin-User gefunden!')
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   Aktiv: ${adminUser.isActive ? '✅' : '❌'}`)
    } else {
      console.log('❌ Admin-User (admin@finance-made-simple.de) nicht gefunden!')
    }
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    console.error('Stack:', error.stack)
    if (error.message.includes('DATABASE_URL')) {
      console.error('\n💡 Tipp: Setze DATABASE_URL als Environment Variable:')
      console.error('   export DATABASE_URL="postgresql://..."')
    }
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

