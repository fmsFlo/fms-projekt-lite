import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@finance-made-simple.de'
  const newPassword = 'admin123'
  
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  const user = await prisma.user.update({
    where: { email },
    data: {
      passwordHash: hashedPassword,
      isActive: true
    }
  })
  
  console.log('✅ Passwort zurückgesetzt für:', user.email)
  console.log('📧 Email:', email)
  console.log('🔑 Neues Passwort:', newPassword)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
