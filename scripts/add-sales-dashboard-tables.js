const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkTableExists(tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `)
    return result[0]?.exists || false
  } catch (error) {
    console.error(`Fehler beim Prüfen von Tabelle ${tableName}:`, error.message)
    return false
  }
}

async function createCalendlyEventsTable() {
  const exists = await checkTableExists('calendly_events')
  if (exists) {
    console.log('✅ Tabelle calendly_events existiert bereits')
    return
  }

  console.log('🔧 Erstelle Tabelle calendly_events...')
  
  try {
    // Erstelle Tabelle
    await prisma.$executeRawUnsafe(`
      CREATE TABLE calendly_events (
        id TEXT PRIMARY KEY,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "calendlyEventUri" TEXT UNIQUE NOT NULL,
        "eventTypeName" TEXT,
        "mappedType" TEXT,
        "startTime" TIMESTAMP NOT NULL,
        "endTime" TIMESTAMP NOT NULL,
        status TEXT,
        "hostName" TEXT,
        "hostEmail" TEXT,
        "userId" TEXT,
        "inviteeName" TEXT,
        "inviteeEmail" TEXT,
        "leadId" TEXT,
        "syncedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    
    // Erstelle Indizes separat (jeder Befehl einzeln)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS calendly_events_inviteeEmail_idx ON calendly_events("inviteeEmail")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS calendly_events_startTime_idx ON calendly_events("startTime")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS calendly_events_leadId_idx ON calendly_events("leadId")`)
    
    console.log('✅ Tabelle calendly_events erstellt')
  } catch (error) {
    console.error('❌ Fehler beim Erstellen von calendly_events:', error.message)
  }
}

async function createCustomActivitiesTable() {
  const exists = await checkTableExists('custom_activities')
  if (exists) {
    console.log('✅ Tabelle custom_activities existiert bereits')
    return
  }

  console.log('🔧 Erstelle Tabelle custom_activities...')
  
  try {
    // Erstelle Tabelle
    await prisma.$executeRawUnsafe(`
      CREATE TABLE custom_activities (
        id TEXT PRIMARY KEY,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "closeActivityId" TEXT UNIQUE NOT NULL,
        "activityType" TEXT NOT NULL,
        "activityTypeId" TEXT,
        "leadId" TEXT,
        "leadEmail" TEXT,
        "leadName" TEXT,
        "userId" TEXT,
        "userEmail" TEXT,
        "userName" TEXT,
        "resultFieldId" TEXT,
        "resultValue" TEXT,
        "dateCreated" TIMESTAMP NOT NULL,
        "dateUpdated" TIMESTAMP,
        "calendlyEventId" TEXT,
        "matchedAt" TIMESTAMP,
        "matchConfidence" DOUBLE PRECISION,
        "syncedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    
    // Erstelle Indizes separat (jeder Befehl einzeln)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS custom_activities_closeActivityId_idx ON custom_activities("closeActivityId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS custom_activities_leadEmail_idx ON custom_activities("leadEmail")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS custom_activities_activityType_idx ON custom_activities("activityType")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS custom_activities_dateCreated_idx ON custom_activities("dateCreated")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS custom_activities_calendlyEventId_idx ON custom_activities("calendlyEventId")`)
    
    console.log('✅ Tabelle custom_activities erstellt')
  } catch (error) {
    console.error('❌ Fehler beim Erstellen von custom_activities:', error.message)
  }
}

async function main() {
  console.log('🔧 Prüfe und erstelle Sales Dashboard Tabellen...\n')
  
  try {
    await createCalendlyEventsTable()
    await createCustomActivitiesTable()
    
    console.log('\n✅ Fertig!')
  } catch (error) {
    console.error('❌ Fehler:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
