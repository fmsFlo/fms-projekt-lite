import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@financemadesimple.de'
  const password = 'Admin123!'

  console.log('🔍 Suche Admin-User...')

  const user = await prisma.user.findFirst({
    where: { email }
  })

  if (!user) {
    console.log('❌ User nicht gefunden')
    return
  }

  console.log('✅ User gefunden:', user.email)
  console.log('📝 Setze neues Passwort...')

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      isActive: true
    }
  })

  console.log('✅ Passwort erfolgreich gesetzt!')
  console.log('')
  console.log('Login-Credentials:')
  console.log('==================')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('==================')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
