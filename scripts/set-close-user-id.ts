/**
 * Script zum Setzen der Close User ID für lokale User
 * 
 * Verwendung:
 * 1. Finde deine Close User ID in den Call-Daten oder in Close CRM
 * 2. Führe dieses Script aus:
 *    npx tsx scripts/set-close-user-id.ts <email> <closeUserId>
 * 
 * Beispiel:
 *    npx tsx scripts/set-close-user-id.ts admin@financemadesimple.de user_VVD2ByQAIVirFLjgmy6Ugx10HqWFwCnvUD9zysWmcjt
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const closeUserId = process.argv[3]

  if (!email || !closeUserId) {
    console.error('❌ Fehler: Email und Close User ID müssen angegeben werden')
    console.log('Verwendung: npx tsx scripts/set-close-user-id.ts <email> <closeUserId>')
    console.log('Beispiel: npx tsx scripts/set-close-user-id.ts admin@financemadesimple.de user_VVD2ByQAIVirFLjgmy6Ugx10HqWFwCnvUD9zysWmcjt')
    process.exit(1)
  }

  try {
    // Prüfe ob User existiert
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ User mit Email ${email} nicht gefunden`)
      process.exit(1)
    }

    // Prüfe ob closeUserId bereits verwendet wird
    const existingUser = await prisma.user.findUnique({
      where: { closeUserId }
    })

    if (existingUser && existingUser.id !== user.id) {
      console.error(`❌ Close User ID ${closeUserId} wird bereits von User ${existingUser.email} verwendet`)
      process.exit(1)
    }

    // Update User
    const updated = await prisma.user.update({
      where: { email },
      data: { closeUserId }
    })

    console.log(`✅ Close User ID für ${email} gesetzt: ${closeUserId}`)
    console.log(`   User ID: ${updated.id}`)
    console.log(`   Name: ${updated.name || 'N/A'}`)
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

