import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@financemadesimple.de'
  const password = 'admin123'
  const name = 'Administrator'

  try {
    console.log('🔍 Prüfe ob User bereits existiert...')
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('⚠️ User existiert bereits:', email)
      console.log('🔄 Aktualisiere Passwort...')
      const passwordHash = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          isActive: true,
          role: 'admin'
        }
      })
      console.log('✅ User-Passwort aktualisiert!')
    } else {
      console.log('➕ Erstelle neuen Admin-User...')
      const passwordHash = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'admin',
          isActive: true
        }
      })
      console.log('✅ Admin created:', user.email)
    }

    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    throw error
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

