import { prisma } from './prisma'

/**
 * Sevdesk API Client
 * Dokumentation: https://hilfe.sevdesk.de/de/articles/9374668-sevdesk-api
 */

interface SevdeskConfig {
  apiToken: string
  apiUrl?: string
}

interface SevdeskContact {
  id?: number
  name: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  street?: string
  houseNumber?: string
  zip?: string
  city?: string
  isCompany?: boolean      // ✅ NEU!
  companyName?: string     // ✅ NEU!
}

interface SevdeskInvoicePosition {
  quantity: number
  price: number
  name: string
  text?: string
  taxRate: number // 0, 7, 19 für DE
  unity?: { id: number } // Standard: Stück
}

interface SevdeskInvoice {
  invoiceNumber?: string
  invoiceDate: string // Format: YYYY-MM-DD
  deliveryDate?: string // Format: YYYY-MM-DD
  invoiceType?: string // Default: "RE"
  contact: { id: number } // Kontakt-ID
  address?: string // Rechnungsadresse (optional)
  currency: string // "EUR"
  status?: number // 100 = Entwurf (Draft)
  subject?: string // ✅ NEU: Betreff
  header?: string // Rechnungskopf-Text (Haupttext)
  footText?: string // Fußtext
  positions: SevdeskInvoicePosition[]
  paymentMethod?: number // Zahlungsmethode
  taxRate?: number // Steuerrate (optional)
  taxType?: string // Steuerregelung (optional)
}

/**
 * Initialisiert Sevdesk Client mit Konfiguration aus CompanySettings
 */
async function getSevdeskConfig(): Promise<SevdeskConfig | null> {
  const settings = await prisma.companySettings.findFirst()
  
  if (!settings?.sevdeskApiToken) {
    console.error('Sevdesk API Token nicht konfiguriert')
    return null
  }

  return {
    apiToken: settings.sevdeskApiToken,
    apiUrl: settings.sevdeskApiUrl || 'https://my.sevdesk.de/api/v1',
  }
}

/**
 * Führt einen API-Call zu Sevdesk durch
 */
async function sevdeskRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const config = await getSevdeskConfig()
  if (!config) {
    throw new Error('Sevdesk API Token nicht konfiguriert')
  }

  const url = `${config.apiUrl}/${endpoint}`
  
  try {
    // Sevdesk API-Authentifizierung
    // WICHTIG: Ab April 2025 akzeptiert Sevdesk Token NICHT mehr als URL-Parameter
    // Dokumentation: https://tech.sevdesk.com/api_news/posts/2025_02_06-authentication-method-removed/
    // Token MUSS im Authorization Header übergeben werden
    // Einige Installationen benötigen "Bearer", andere nicht
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiToken.trim()}`,
    }
    
    console.log(`📤 Sevdesk Request: ${method} ${url}`)
    if (body) {
      console.log('📦 Request Body (vollständig):', JSON.stringify(body, null, 2))
      // Spezielle Prüfung für invoiceType
      if (body.invoice && body.invoice.invoiceType !== undefined) {
        console.log('✅ invoiceType gefunden in body.invoice.invoiceType:', body.invoice.invoiceType, '(Type:', typeof body.invoice.invoiceType, ')')
      } else if (body.invoiceType !== undefined) {
        console.log('✅ invoiceType gefunden in body.invoiceType:', body.invoiceType, '(Type:', typeof body.invoiceType, ')')
      } else {
        console.log('❌ invoiceType NICHT gefunden in der Payload!')
      }
    }
    
    // Erstelle den Request Body - prüfe invoiceType explizit
    let requestBody: string | undefined = undefined
    if (body) {
      requestBody = JSON.stringify(body)
      
      // Spezielle Validierung für Invoice-Requests
      if (endpoint.includes('Invoice') && body.invoice) {
        const invoiceTypeInBody = body.invoice.invoiceType
        console.log('🔍 PRE-SEND Check - invoiceType im body:', invoiceTypeInBody, '(Type:', typeof invoiceTypeInBody, ')')
        if (!invoiceTypeInBody || invoiceTypeInBody !== 'RE') {
          console.error('❌ KRITISCHER FEHLER VOR DEM SENDEN: invoiceType ist nicht "RE"!')
          console.error('   Wert:', invoiceTypeInBody)
          console.error('   Type:', typeof invoiceTypeInBody)
          console.error('   Kompletter body:', JSON.stringify(body, null, 2))
        }
      }
    }
    
    // URL OHNE Token-Parameter verwenden
    let response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    })

    // Falls 401 mit Bearer, versuche ohne Bearer
    if (response.status === 401) {
      console.log('⚠️ Bearer-Token fehlgeschlagen, versuche ohne Bearer...')
      headers['Authorization'] = config.apiToken.trim()
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
    }

    const responseText = await response.text()
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorDetails: any = null
      
      try {
        const errorJson = JSON.parse(responseText)
        errorDetails = errorJson
        
        // Extrahiere Fehlermeldung aus verschiedenen möglichen Strukturen
        if (errorJson.message) {
          errorMessage = typeof errorJson.message === 'string' 
            ? errorJson.message 
            : JSON.stringify(errorJson.message)
        } else if (errorJson.error) {
          errorMessage = typeof errorJson.error === 'string'
            ? errorJson.error
            : JSON.stringify(errorJson.error)
        } else if (errorJson.statusText) {
          errorMessage = errorJson.statusText
        }
        
        // Falls es ein errors-Array gibt
        if (Array.isArray(errorJson.errors)) {
          const errorStrings = errorJson.errors.map((e: any) => {
            if (typeof e === 'string') return e
            if (e.message) return e.message
            if (e.field) return `${e.field}: ${e.message || JSON.stringify(e)}`
            return JSON.stringify(e)
          })
          errorMessage = errorStrings.join(', ')
        }
        
        // Falls es ein errors-Objekt gibt (key-value pairs)
        if (errorJson.errors && typeof errorJson.errors === 'object' && !Array.isArray(errorJson.errors)) {
          const errorStrings = Object.entries(errorJson.errors).map(([key, value]) => {
            if (typeof value === 'string') return `${key}: ${value}`
            if (Array.isArray(value)) return `${key}: ${value.join(', ')}`
            return `${key}: ${JSON.stringify(value)}`
          })
          errorMessage = errorStrings.join(' | ')
        }
      } catch {
        errorMessage = responseText ? responseText.substring(0, 500) : errorMessage
      }
      
      console.error('❌ Sevdesk API Fehler:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        error: errorMessage,
        errorDetails: errorDetails,
        rawResponse: responseText.substring(0, 1000),
      })
      
      // Erstelle eine detaillierte Fehlermeldung
      const detailedError = errorDetails 
        ? `Sevdesk API Error: ${response.status} - ${errorMessage} (Details: ${JSON.stringify(errorDetails).substring(0, 500)})`
        : `Sevdesk API Error: ${response.status} - ${errorMessage}`
      
      throw new Error(detailedError)
    }

    const data = JSON.parse(responseText || '{}')
    console.log('✅ Sevdesk Response:', JSON.stringify(data, null, 2).substring(0, 500))
    return data as T
  } catch (err: any) {
    console.error('❌ Sevdesk Request Error:', {
      endpoint,
      method,
      error: err.message || err,
      stack: err.stack,
    })
    throw err
  }
}

/**
 * Erstellt einen neuen Kontakt in Sevdesk
 * IMMER neuen Kontakt erstellen (keine Suche mehr)
 * Grund: Jeder Vertrag sollte einen eigenen Kontakt-Eintrag haben
 * Adresse, E-Mail und Telefon werden als separate Objekte hinzugefügt
 * Unterstützt Personen und Organisationen
 * 
 * KRITISCH: Sevdesk unterscheidet Person/Organisation durch Feld-Auswahl:
 * - PERSON: familyname MUSS gesetzt sein, name NICHT
 * - ORGANISATION: name MUSS gesetzt sein, familyname NICHT
 */
export async function getOrCreateSevdeskContact(
  contactData: SevdeskContact
): Promise<{ id: number } | null> {
  try {
    // Erstelle vollständige Adresse
    const fullAddress = [
      contactData.street,
      contactData.houseNumber
    ].filter(Boolean).join(' ')

    // KRITISCH: Person vs Organisation wird durch Feld-Auswahl gesteuert!
    const isCompany = contactData.isCompany === true
    
    const createData: any = {
      category: { id: 3, objectName: 'Category' }, // Kunde = 3
    }

    if (isCompany) {
      // ===== ORGANISATION =====
      // NUR 'name' setzen, KEIN 'familyname'!
      createData.name = contactData.companyName || contactData.name
      console.log('📝 Erstelle ORGANISATION:', createData.name)
      console.log('   ⚠️ familyname wird NICHT gesetzt (wichtig!)')
    } else {
      // ===== PERSON =====
      // 'familyname' MUSS gesetzt sein für Person!
      // 'name' wird NICHT gesetzt bei Person
      if (contactData.firstName) {
        createData.surename = contactData.firstName  // Vorname
      }
      if (contactData.lastName) {
        createData.familyname = contactData.lastName  // ✅ KRITISCH für Person!
      }
      console.log('📝 Erstelle PERSON:', contactData.firstName, contactData.lastName)
      console.log('   ✅ familyname gesetzt:', createData.familyname)
      console.log('   ⚠️ name wird NICHT gesetzt (wichtig!)')
    }

    console.log('🔍 Finale Contact-Daten:', JSON.stringify(createData, null, 2))

    const result = await sevdeskRequest<any>(
      'Contact',
      'POST',
      createData
    )

    console.log('📥 Sevdesk Contact Response:', JSON.stringify(result, null, 2))

    // Extrahiere Kontakt-ID aus verschiedenen möglichen Strukturen
    let contactId: number | undefined
    
    if (result?.objects) {
      // Struktur 1: result.objects ist ein Array
      if (Array.isArray(result.objects) && result.objects.length > 0) {
        const firstObj = result.objects[0]
        if (firstObj && firstObj.id) {
          contactId = typeof firstObj.id === 'string' ? parseInt(firstObj.id) : firstObj.id
        }
      }
      // Struktur 2: result.objects ist ein Objekt mit id
      else if ((result.objects as any).id) {
        const id = (result.objects as any).id
        contactId = typeof id === 'string' ? parseInt(id) : id
      }
    }
    
    // Struktur 3: result hat direkt eine id
    if (!contactId && result && (result as any).id) {
      const id = (result as any).id
      contactId = typeof id === 'string' ? parseInt(id) : id
    }

    if (!contactId) {
      console.error('❌ Keine Kontakt-ID gefunden in Response:', JSON.stringify(result, null, 2))
      throw new Error('Kein Kontakt-Objekt in der Antwort - Response-Struktur unerwartet')
    }

    console.log('✅ Kontakt erstellt mit ID:', contactId)

    // ===== ADRESSE HINZUFÜGEN =====
    if (fullAddress && contactData.zip && contactData.city) {
      try {
        const addressData = {
          contact: { id: contactId, objectName: 'Contact' },
          street: fullAddress,
          zip: contactData.zip,
          city: contactData.city,
          country: { id: 1, objectName: 'StaticCountry' },
          category: { id: 43, objectName: 'Category' },
        }

        console.log('📍 Füge Adresse hinzu')
        await sevdeskRequest<any>('ContactAddress', 'POST', addressData)
        console.log('✅ Adresse hinzugefügt')
      } catch (err: any) {
        console.error('⚠️ Adresse-Fehler:', err.message)
      }
    }

    // ===== E-MAIL HINZUFÜGEN =====
    console.log('🔍 DEBUG - E-Mail Check:', {
      email: contactData.email,
      emailType: typeof contactData.email,
      emailTruthy: !!contactData.email,
      emailLength: contactData.email?.length,
      emailTrimmed: contactData.email?.trim()
    })
    
    if (contactData.email && contactData.email.trim()) {
      try {
        const emailValue = contactData.email.trim()
        const emailData = {
          contact: { id: contactId, objectName: 'Contact' },
          type: 'EMAIL',
          value: emailValue,
          key: { id: 2, objectName: 'CommunicationWayKey' }, // ✅ KORRIGIERT: CommunicationWayKey statt CommunicationKey
        }

        console.log('📧 Füge E-Mail hinzu:', emailValue)
        console.log('📧 E-Mail Payload:', JSON.stringify(emailData, null, 2))
        const emailResult = await sevdeskRequest<any>('CommunicationWay', 'POST', emailData)
        console.log('📧 E-Mail Response:', JSON.stringify(emailResult, null, 2))
        console.log('✅ E-Mail hinzugefügt')
      } catch (err: any) {
        console.error('⚠️ E-Mail-Fehler:', err.message)
        console.error('⚠️ E-Mail-Fehler Details:', err)
        // Nicht abbrechen, Kontakt wurde bereits erstellt
      }
    } else {
      console.log('⚠️ Keine E-Mail vorhanden oder leer:', contactData.email)
    }

    // ===== TELEFON HINZUFÜGEN =====
    if (contactData.phone) {
      try {
        const phoneData = {
          contact: { id: contactId, objectName: 'Contact' },
          type: 'PHONE',
          value: contactData.phone,
          key: { id: 2, objectName: 'CommunicationWayKey' }, // ✅ KORRIGIERT: CommunicationWayKey statt CommunicationKey
        }

        console.log('📞 Füge Telefon hinzu:', contactData.phone)
        console.log('📞 Telefon Payload:', JSON.stringify(phoneData, null, 2))
        const phoneResult = await sevdeskRequest<any>('CommunicationWay', 'POST', phoneData)
        console.log('📞 Telefon Response:', JSON.stringify(phoneResult, null, 2))
        console.log('✅ Telefon hinzugefügt')
      } catch (err: any) {
        console.error('⚠️ Telefon-Fehler:', err.message)
        console.error('⚠️ Telefon-Fehler Details:', err)
      }
    }

    return { id: contactId }
  } catch (err: any) {
    console.error('❌ Kontakt-Erstellungs-Fehler:', err.message)
    console.error('   Stack:', err.stack)
    throw err
  }
}

/**
 * Berechnet Stripe-Gebühren für eine Zahlung
 * Stripe SEPA: 0,8% + 0,35€ pro Transaktion (EU)
 */
export function calculateStripeFees(amount: number): number {
  // SEPA Direct Debit Gebühren (EU): 0,8% + 0,35€
  const percentage = 0.008 // 0,8%
  const fixedFee = 0.35 // 0,35€
  return amount * percentage + fixedFee
}

/**
 * Holt die aktuelle User-ID für contactPerson
 */
async function getSevdeskUserId(): Promise<number> {
  const result = await sevdeskRequest<{ objects: Array<{ id: string }> }>('SevUser', 'GET')
  if (!result?.objects?.[0]?.id) {
    throw new Error('Konnte SevUser-ID nicht abrufen')
  }
  return parseInt(result.objects[0].id)
}

/**
 * Erstellt eine Rechnung in Sevdesk
 */
export async function createSevdeskInvoice(
  invoiceData: Omit<SevdeskInvoice, 'contact' | 'positions'> & {
    contactId: number
    positions: SevdeskInvoicePosition[]
    includeStripeFees?: boolean // Soll Stripe-Gebühren als separate Position aufgeführt werden?
  }
): Promise<{ id: number; invoiceNumber: string } | null> {
  const {
    contactId,
    positions,
    includeStripeFees = false,
    ...invoiceBase
  } = invoiceData

  // Berechne Gesamtbetrag
  const totalAmount = positions.reduce((sum, pos) => sum + pos.price * pos.quantity, 0)
  
  // Berechne Stripe-Gebühren wenn gewünscht
  let finalPositions = [...positions]
  if (includeStripeFees && totalAmount > 0) {
    const stripeFees = calculateStripeFees(totalAmount)
    finalPositions.push({
      quantity: 1,
      price: stripeFees,
      name: 'Stripe-Gebühren (SEPA Direct Debit)',
      text: 'Bearbeitungsgebühr für SEPA-Lastschrift',
      taxRate: 19, // Umsatzsteuer auf Gebühren
    })
  }

  // Sevdesk API-Struktur für Rechnungserstellung
  // Siehe: https://hilfe.sevdesk.de/de/articles/9374668-sevdesk-api
  // WICHTIG: Die API erwartet ein spezielles Format
  // invoiceNumber wird weggelassen, damit Sevdesk automatisch eine Nummer generiert
  
  // Konvertiere Datum von YYYY-MM-DD zu Unix-Timestamp (Sekunden)
  // Sevdesk erwartet Unix-Timestamp in Sekunden
  const dateToTimestamp = (dateStr: string): number | null => {
    if (!dateStr) return null
    try {
      // Wenn es bereits ein Timestamp ist, verwende es
      if (/^\d+$/.test(dateStr)) {
        return parseInt(dateStr)
      }
      // Andernfalls parsen wir das Datum
      // Stelle sicher, dass wir UTC verwenden (setze Zeit auf 00:00:00 UTC)
      const date = new Date(dateStr + 'T00:00:00Z')
      if (isNaN(date.getTime())) {
        // Fallback: Versuche ohne UTC
        const date2 = new Date(dateStr)
        if (isNaN(date2.getTime())) return null
        return Math.floor(date2.getTime() / 1000)
      }
      // Unix-Timestamp in Sekunden
      return Math.floor(date.getTime() / 1000)
    } catch {
      return null
    }
  }
  
  const invoiceDateTimestamp = dateToTimestamp(invoiceBase.invoiceDate)
  const deliveryDateTimestamp = dateToTimestamp(invoiceBase.deliveryDate || invoiceBase.invoiceDate)
  
  console.log('📅 Invoice Date:', invoiceBase.invoiceDate, '→ Timestamp:', invoiceDateTimestamp)
  console.log('📅 Delivery Date:', invoiceBase.deliveryDate || invoiceBase.invoiceDate, '→ Timestamp:', deliveryDateTimestamp)
  
  if (!invoiceDateTimestamp) {
    throw new Error(`Ungültiges Rechnungsdatum: ${invoiceBase.invoiceDate}`)
  }
  
  // Hole SevUser ID für contactPerson
  const sevUserId = await getSevdeskUserId()
  
  // Erstelle Positionen mit ALLEN erforderlichen Feldern
  const invoicePosSave = finalPositions.map((pos, index) => ({
    objectName: 'InvoicePos',
    mapAll: true,
    quantity: pos.quantity,
    price: pos.price,
    name: pos.name,
    text: pos.text || pos.name, // Verwende text oder fallback zu name
    taxRate: pos.taxRate,
    unity: { id: 1, objectName: 'Unity' },
    positionNumber: index,
  }))
  
  // Bestimme Steuerregelung basierend auf Positionen
  // Wenn alle Positionen 0% Steuer haben = "Steuerfreie Umsätze §4 UStG"
  const allPositionsHaveZeroTax = finalPositions.every(pos => pos.taxRate === 0)
  const taxType = allPositionsHaveZeroTax ? 'default' : 'default' // Sevdesk verwendet 'default' für beide
  // Für Steuerfreie Umsätze: taxRate bleibt 0, taxType = 'default'
  
  // Erstelle Payload mit ALLEN erforderlichen Feldern
  const payload = {
    invoice: {
      objectName: 'Invoice',   // ✅ WICHTIG!
      mapAll: true,            // ✅ WICHTIG!
      invoiceType: 'RE',
      invoiceDate: invoiceDateTimestamp,
      deliveryDate: deliveryDateTimestamp,
      currency: 'EUR',
      status: 100,  // 100 = Draft (Entwurf) - Rechnung muss in Sevdesk freigegeben werden
      contact: { id: parseInt(contactId.toString()), objectName: 'Contact' },
      contactPerson: { id: sevUserId, objectName: 'SevUser' },  // ✅ WICHTIG!
      addressCountry: { id: 1, objectName: 'StaticCountry' },
      taxRate: allPositionsHaveZeroTax ? 0 : (invoiceBase.taxRate || 0), // ✅ Steuerrate basierend auf Positionen
      taxType: taxType, // ✅ Steuerregelung
      ...(invoiceBase.address && { address: invoiceBase.address }), // ✅ Adresse wird übergeben
      ...(invoiceBase.subject && { subject: invoiceBase.subject }), // ✅ NEU: Betreff
      ...(invoiceBase.header && { headText: invoiceBase.header }),   // ✅ Kopftext
      ...(invoiceBase.footText && { footText: invoiceBase.footText }),
    },
    invoicePosSave: invoicePosSave,
  }
  
  console.log('📤 Sevdesk Invoice Payload:', JSON.stringify(payload, null, 2))
  
  try {
    const result = await sevdeskRequest<any>('Invoice/Factory/saveInvoice', 'POST', payload)
    
    console.log('🔍 COMPLETE RESULT:', JSON.stringify(result, null, 2))  // ✅ NEU!
    
    // Prüfe beide möglichen Strukturen für die Rechnung
    let invoice = null
    if (result?.objects) {
      // Struktur 1: result.objects.invoice (Objekt)
      if ((result.objects as any).invoice) {
        invoice = (result.objects as any).invoice
      }
      // Struktur 2: result.objects[0].invoice (Array)
      else if (Array.isArray(result.objects) && result.objects.length > 0 && (result.objects[0] as any).invoice) {
        invoice = (result.objects[0] as any).invoice
      }
      // Struktur 3: result.objects ist direkt die Invoice
      else if ((result.objects as any).id && (result.objects as any).objectName === 'Invoice') {
        invoice = result.objects
      }
    }
    
    if (invoice) {
      const invoiceId = typeof invoice.id === 'string' ? parseInt(invoice.id) : invoice.id
      const invoiceNumber = invoice.invoiceNumber || `Draft-${invoiceId}`
      console.log('✅ Rechnung erfolgreich erstellt! ID:', invoiceId, 'Rechnungsnummer:', invoiceNumber, 'Status:', invoice.status)
      return { id: invoiceId, invoiceNumber: invoiceNumber }
    }
    
    throw new Error('Keine Rechnung in der Antwort gefunden')
  } catch (err: any) {
    console.error('❌ Fehler beim Erstellen der Rechnung:', err.message)
    throw new Error(`Fehler beim Erstellen der Rechnung in Sevdesk: ${err.message}`)
  }
}

/**
 * Testet die Sevdesk-Verbindung
 */
export async function testSevdeskConnection(): Promise<{
  success: boolean
  message: string
  account?: any
  error?: string
}> {
  const config = await getSevdeskConfig()
  if (!config) {
    return {
      success: false,
      message: 'Sevdesk API Token nicht konfiguriert',
    }
  }

  try {
    // Teste Verbindung durch Abrufen der AccountingSystem-Info (zuverlässiger Endpoint)
    // Alternative Endpoints: /Contact, /Invoice, /AccountingSystem
    const url = `${config.apiUrl}/AccountingSystem`
    
    // WICHTIG: Token nur im Authorization Header, NICHT als URL-Parameter
    // Einige Sevdesk-Installationen verwenden auch nur den Token ohne "Bearer"
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Versuche beide Methoden: Mit und ohne "Bearer"
    // Zuerst mit Bearer versuchen
    headers['Authorization'] = `Bearer ${config.apiToken.trim()}`
    
    console.log('🔍 Sevdesk Test - URL:', url)
    console.log('🔍 Sevdesk Test - Token (erste 10 Zeichen):', config.apiToken.substring(0, 10) + '...')
    console.log('🔍 Sevdesk Test - Token-Länge:', config.apiToken.length)
    
    let response = await fetch(url, {
      method: 'GET',
      headers,
    })
    
    // Falls 401, versuche ohne "Bearer"
    if (response.status === 401) {
      console.log('⚠️ Bearer-Token fehlgeschlagen, versuche ohne Bearer...')
      headers['Authorization'] = config.apiToken.trim()
      response = await fetch(url, {
        method: 'GET',
        headers,
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorJson = JSON.parse(errorText)
        // Versuche verschiedene Felder für Fehlermeldung
        errorMessage = errorJson.message 
          || errorJson.error 
          || errorJson.errors 
          || errorJson.statusText 
          || errorMessage
        
        // Falls es ein Array von Fehlern ist
        if (Array.isArray(errorJson.errors)) {
          errorMessage = errorJson.errors.map((e: any) => e.message || e).join(', ')
        }
      } catch {
        // Wenn kein JSON, nutze den Text direkt (limit auf 200 Zeichen)
        errorMessage = errorText ? errorText.substring(0, 200) : errorMessage
      }

      console.error('❌ Sevdesk API Fehler:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
      })

      return {
        success: false,
        message: `Verbindung zu Sevdesk fehlgeschlagen (HTTP ${response.status})`,
        error: errorMessage,
      }
    }

    const data = await response.json()
    
    // Sevdesk gibt normalerweise { objects: [...] } zurück
    if (data && (data.objects || data.id || data.name)) {
      const accountInfo = data.objects?.[0] || data
      return {
        success: true,
        message: 'Sevdesk-Verbindung erfolgreich',
        account: {
          id: accountInfo.id,
          name: accountInfo.name || accountInfo.description || 'Sevdesk Account',
          type: accountInfo.type || 'unknown',
        },
      }
    }

    return {
      success: false,
      message: 'Unerwartete Antwort von Sevdesk',
      error: 'Keine Daten zurückgegeben',
    }
  } catch (err: any) {
    console.error('Sevdesk Test Error:', err)
    return {
      success: false,
      message: 'Fehler beim Testen der Verbindung',
      error: err.message || 'Unbekannter Fehler',
    }
  }
}

