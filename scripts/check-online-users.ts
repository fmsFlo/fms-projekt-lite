import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Prüfe User in der Datenbank...\n')
  
  try {
    // Hole alle User
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`📊 Gefundene User: ${users.length}\n`)
    
    if (users.length === 0) {
      console.log('❌ Keine User gefunden!')
      console.log('\n💡 Erstelle einen Admin-User mit:')
      console.log('   npx ts-node scripts/create-admin-simple.ts')
      return
    }
    
    console.log('📋 User-Liste:\n')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   Name: ${user.name || 'N/A'}`)
      console.log(`   Rolle: ${user.role}`)
      console.log(`   Aktiv: ${user.isActive ? '✅' : '❌'}`)
      console.log(`   Erstellt: ${user.createdAt.toISOString()}`)
      console.log(`   ID: ${user.id}`)
      console.log()
    })
    
    // Prüfe spezifisch nach Admin-User
    const adminUsers = users.filter(u => u.role === 'admin' && u.isActive)
    console.log(`\n👑 Aktive Admin-User: ${adminUsers.length}`)
    if (adminUsers.length > 0) {
      adminUsers.forEach(admin => {
        console.log(`   ✅ ${admin.email}`)
      })
    } else {
      console.log('   ❌ Keine aktiven Admin-User gefunden!')
    }
    
    // Prüfe ob Standard-Admin existiert
    const standardAdmin = users.find(u => u.email === 'admin@finance-made-simple.de')
    if (standardAdmin) {
      console.log(`\n📧 Standard-Admin gefunden:`)
      console.log(`   Email: ${standardAdmin.email}`)
      console.log(`   Aktiv: ${standardAdmin.isActive ? '✅' : '❌'}`)
      if (!standardAdmin.isActive) {
        console.log('\n⚠️  Standard-Admin ist INAKTIV!')
        console.log('   Aktiviere mit:')
        console.log(`   UPDATE "User" SET "isActive" = true WHERE email = 'admin@finance-made-simple.de';`)
      }
    } else {
      console.log('\n❌ Standard-Admin (admin@finance-made-simple.de) nicht gefunden!')
      console.log('   Erstelle mit: npx ts-node scripts/create-admin-simple.ts')
    }
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    console.error('\n💡 Prüfe:')
    console.error('   1. DATABASE_URL ist gesetzt?')
    console.error('   2. Datenbank ist erreichbar?')
    console.error('   3. Prisma Schema ist aktuell?')
  } finally {
    await prisma.$disconnect()
  }
}

main()

