import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@finance-made-simple.de'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  
  const hashedPassword = await bcrypt.hash(password, 10)
  
  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name: 'Administrator',
      role: 'admin',
      isActive: true
    }
  })
  
  console.log('✅ Admin created:', admin.email)
  console.log('📧 Email:', email)
  console.log('🔑 Password:', password)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
