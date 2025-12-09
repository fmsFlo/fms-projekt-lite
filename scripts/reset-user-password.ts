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
  const email = process.argv[2]
  const newPassword = process.argv[3]

  if (!email || !newPassword) {
    console.log('❌ Verwendung: npx ts-node scripts/reset-user-password.ts <email> <neues-passwort>')
    process.exit(1)
  }

  console.log('🔐 Setze Passwort zurück...')
  console.log('📧 E-Mail:', email)
  console.log('')

  try {
    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase()
      }
    })

    if (!user) {
      console.log('❌ User nicht gefunden!')
      return
    }

    console.log('✅ User gefunden:', user.email)
    console.log('🔐 Erstelle neuen Passwort-Hash...')

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null
      }
    })

    console.log('✅ Passwort erfolgreich zurückgesetzt!')
    console.log('')
    console.log('📧 E-Mail:', user.email)
    console.log('🔑 Neues Passwort:', newPassword)
    console.log('')
    console.log('💡 Du kannst dich jetzt mit diesen Daten einloggen.')
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



