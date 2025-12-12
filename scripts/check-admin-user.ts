import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@finance-made-simple.de'
  
  console.log('🔍 Prüfe Admin-User...')
  console.log('📧 Email:', email)
  console.log('')
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      passwordHash: true
    }
  })
  
  if (!user) {
    console.log('❌ Admin-User existiert NICHT!')
    console.log('')
    console.log('📋 Alle User in der DB:')
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true, isActive: true },
      take: 10
    })
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.role}, aktiv: ${u.isActive})`)
    })
    console.log('')
    console.log('💡 Lösung: Führe aus: npx tsx scripts/create-admin-simple.ts')
  } else {
    console.log('✅ Admin-User gefunden!')
    console.log('  ID:', user.id)
    console.log('  Email:', user.email)
    console.log('  Name:', user.name)
    console.log('  Rolle:', user.role)
    console.log('  Aktiv:', user.isActive)
    console.log('  Passwort-Hash vorhanden:', user.passwordHash ? 'Ja (' + user.passwordHash.length + ' Zeichen)' : 'Nein')
    console.log('')
    if (!user.isActive) {
      console.log('⚠️  User ist INAKTIV! Das könnte das Login-Problem sein.')
      console.log('💡 Lösung: User aktivieren mit:')
      console.log('   npx tsx scripts/reset-admin-password.ts')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

