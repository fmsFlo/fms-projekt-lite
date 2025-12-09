import { PrismaClient } from '@prisma/client'
import path from 'path'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`,
    },
  },
})

async function main() {
  try {
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

    console.log('📋 Gefundene Benutzer:')
    console.log('─────────────────────────────────────────')
    if (users.length === 0) {
      console.log('❌ Keine Benutzer gefunden!')
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



