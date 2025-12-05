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
  const email = process.argv[2] || 'admin@example.com'
  const password = process.argv[3] || 'admin123'
  const name = process.argv[4] || 'Administrator'

  console.log('🔐 Erstelle Admin-User...')
  console.log('📧 E-Mail:', email)
  console.log('👤 Name:', name)

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      passwordHash,
      role: 'admin',
      name,
      isActive: true
    },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      name,
      isActive: true
    }
  })

  console.log('✅ Admin-User erstellt/aktualisiert!')
  console.log('ID:', user.id)
  console.log('E-Mail:', user.email)
  console.log('Rolle:', user.role)
}

main()
  .catch((e) => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

