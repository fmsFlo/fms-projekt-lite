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

async function createCallsTable() {
  const exists = await checkTableExists('calls')
  if (exists) {
    console.log('✅ Tabelle calls existiert bereits')
    return
  }

  console.log('🔧 Erstelle Tabelle calls...')
  
  try {
    // Erstelle Tabelle
    await prisma.$executeRawUnsafe(`
      CREATE TABLE calls (
        id SERIAL PRIMARY KEY,
        "closeCallId" TEXT UNIQUE,
        "leadId" TEXT,
        "userId" TEXT,
        "callDate" TIMESTAMP NOT NULL,
        duration INTEGER DEFAULT 0,
        direction TEXT,
        status TEXT,
        disposition TEXT,
        note TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    
    // Erstelle Indizes separat
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS calls_closeCallId_idx ON calls("closeCallId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS calls_leadId_idx ON calls("leadId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS calls_userId_idx ON calls("userId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS calls_callDate_idx ON calls("callDate")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS calls_status_idx ON calls(status)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS calls_disposition_idx ON calls(disposition)`)
    
    console.log('✅ Tabelle calls erstellt')
  } catch (error) {
    console.error('❌ Fehler beim Erstellen von calls:', error.message)
  }
}

async function createLeadsTable() {
  const exists = await checkTableExists('leads')
  if (exists) {
    console.log('✅ Tabelle leads existiert bereits')
    return
  }

  console.log('🔧 Erstelle Tabelle leads...')
  
  try {
    // Erstelle Tabelle
    await prisma.$executeRawUnsafe(`
      CREATE TABLE leads (
        id TEXT PRIMARY KEY,
        "closeLeadId" TEXT UNIQUE,
        name TEXT,
        email TEXT,
        phone TEXT,
        status TEXT,
        "firstContactDate" TIMESTAMP,
        "assignedUserId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    
    // Erstelle Indizes separat
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS leads_closeLeadId_idx ON leads("closeLeadId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS leads_assignedUserId_idx ON leads("assignedUserId")`)
    
    console.log('✅ Tabelle leads erstellt')
  } catch (error) {
    console.error('❌ Fehler beim Erstellen von leads:', error.message)
  }
}

async function main() {
  console.log('🔧 Prüfe und erstelle Sales Dashboard Tabellen...\n')
  
  try {
    await createCalendlyEventsTable()
    await createCustomActivitiesTable()
    await createCallsTable()
    await createLeadsTable()
    
    console.log('\n✅ Fertig!')
  } catch (error) {
    console.error('❌ Fehler:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
