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
  const email = process.argv[2]
  const role = process.argv[3] as 'admin' | 'advisor'

  if (!email || !role) {
    console.log('❌ Verwendung: npx ts-node scripts/set-user-role.ts <email> <admin|advisor>')
    process.exit(1)
  }

  console.log('🔧 Setze Rolle für:', email, '→', role)

  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { role }
  })

  console.log('✅ Rolle aktualisiert!')
  console.log('   E-Mail:', user.email)
  console.log('   Rolle:', user.role)
}

main()
  .catch((e) => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



