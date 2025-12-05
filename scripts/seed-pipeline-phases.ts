import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Pipeline Phasen...')
  
  // Standard Pipeline Phasen
  const phases = [
    {
      name: 'Lead',
      slug: 'lead',
      order: 0,
      color: '#94A3B8', // Grau
      isActive: true,
    },
    {
      name: 'Qualifiziert',
      slug: 'qualified',
      order: 1,
      color: '#3B82F6', // Blau
      isActive: true,
    },
    {
      name: 'Angebot',
      slug: 'offer',
      order: 2,
      color: '#F59E0B', // Orange
      isActive: true,
    },
    {
      name: 'Verhandlung',
      slug: 'negotiation',
      order: 3,
      color: '#8B5CF6', // Lila
      isActive: true,
    },
    {
      name: 'Abschluss',
      slug: 'closed',
      order: 4,
      color: '#10B981', // Grün
      isActive: true,
    },
  ]
  
  for (const phase of phases) {
    await prisma.pipelinePhase.upsert({
      where: { slug: phase.slug },
      update: phase,
      create: phase,
    })
    console.log(`✅ Phase "${phase.name}" erstellt/aktualisiert`)
  }
  
  console.log('✅ Pipeline Phasen erfolgreich gesetzt!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



