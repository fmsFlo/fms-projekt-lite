import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@finance-made-simple.de'
  const password = process.argv[3] || 'admin123'
  
  console.log('🔐 Teste Login...\n')
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Password: ${password}\n`)
  
  try {
    // Suche User
    const allUsers = await prisma.user.findMany({
      where: { isActive: true }
    })
    
    console.log(`📊 Aktive User in DB: ${allUsers.length}`)
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`)
    })
    console.log()
    
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      console.log('❌ User nicht gefunden!')
      console.log('\n💡 Mögliche Lösungen:')
      console.log('   1. User existiert nicht - Erstelle mit: npx ts-node scripts/create-admin-simple.ts')
      console.log('   2. User ist inaktiv - Aktiviere in der Datenbank')
      console.log('   3. Email ist falsch geschrieben')
      return
    }
    
    console.log('✅ User gefunden:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name || 'N/A'}`)
    console.log(`   Rolle: ${user.role}`)
    console.log(`   Aktiv: ${user.isActive ? '✅' : '❌'}`)
    console.log(`   Passwort-Hash: ${user.passwordHash.substring(0, 20)}...`)
    console.log()
    
    if (!user.isActive) {
      console.log('❌ User ist INAKTIV!')
      console.log('\n💡 Aktiviere mit:')
      console.log(`   UPDATE "User" SET "isActive" = true WHERE email = '${user.email}';`)
      return
    }
    
    // Teste Passwort
    console.log('🔐 Teste Passwort...')
    const isValid = await bcrypt.compare(password, user.passwordHash)
    
    if (isValid) {
      console.log('✅ Passwort ist KORREKT!')
      console.log('\n✅ Login sollte funktionieren!')
      console.log('\n💡 Wenn Login online nicht funktioniert:')
      console.log('   1. Prüfe Netlify Environment Variables (DATABASE_URL)')
      console.log('   2. Prüfe Netlify Logs für Fehlermeldungen')
      console.log('   3. Stelle sicher, dass die Datenbank online erreichbar ist')
    } else {
      console.log('❌ Passwort ist FALSCH!')
      console.log('\n💡 Lösungen:')
      console.log('   1. Passwort zurücksetzen:')
      console.log(`      npx ts-node scripts/reset-user-password.ts ${email} neues-passwort`)
      console.log('   2. Oder erstelle neuen User:')
      console.log('      npx ts-node scripts/create-admin-simple.ts')
    }
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    console.error('\n💡 Prüfe:')
    console.error('   1. DATABASE_URL ist gesetzt?')
    console.error('   2. Datenbank ist erreichbar?')
  } finally {
    await prisma.$disconnect()
  }
}

main()

