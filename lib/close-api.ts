import axios from 'axios'

// Custom Activity Type Definitionen
const ACTIVITY_TYPE_CONFIG = {
  'vorqualifizierung': {
    id: 'actitype_1H3wPemMNkfkmT0nJuEBUT',
    resultField: 'cf_xnH96817ih93fVQRG75NuqlCTJCNTkJ0OHCuup2iPLg',
    name: 'Vorqualifizierung'
  },
  'erstgespraech': {
    id: 'actitype_6VB2MiuFziQxyuzfMzHy7q',
    resultField: 'cf_QDWQYVNx3jMp1Pv0SIvzeoDigjMulHFh5qJQwWcesGZ',
    name: 'Erstgespräch'
  },
  'konzeptgespraech': {
    id: 'actitype_6ftbHtxSEz9wIwdLnovYP0',
    resultField: 'cf_XqpdiUMWiYCaw5uW9DRkSiXlOgBrdZtdEf2L8XmjNhT',
    name: 'Konzeptgespräch'
  },
  'umsetzungsgespraech': {
    id: 'actitype_6nwTHKNbqf3EbQIjORgPg5',
    resultField: 'cf_bd4BlLaCpH6uyfldREh1t9MAv7OCRcrZ5CxzJbpUIJf',
    name: 'Umsetzungsgespräch'
  },
  'servicegespraech': {
    id: 'actitype_7dOp29fi26OKZQeXd9bCYP',
    resultField: 'cf_PZvw6SxG2UlSSQNQeDmu63gdMTDP24JG6kfxWB8RXH4',
    name: 'Servicegespräch'
  }
}

export class CloseApiService {
  private apiKey: string
  private baseURL: string
  private client: any

  constructor(apiKey?: string) {
    // Verwende übergebenen Key oder versuche aus DB zu laden
    this.apiKey = apiKey || process.env.CLOSE_API_KEY || ''
    this.baseURL = 'https://api.close.com/api/v1'
    
    if (!this.apiKey) {
      throw new Error('CLOSE_API_KEY ist nicht definiert. Bitte in den Einstellungen konfigurieren.')
    }
    
    // Base64 encoding für Next.js (Browser und Node.js kompatibel)
    const authString = typeof Buffer !== 'undefined' 
      ? Buffer.from(this.apiKey + ':').toString('base64')
      : btoa(this.apiKey + ':')
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      }
    })
  }

  // Hole Custom Activities nach Type (wie im Original)
  async getCustomActivitiesByType(activityTypeId: string, startDate?: string, endDate?: string) {
    try {
      // Verwende getCustomActivitiesWithFilters wie im Original
      const filters: any = {
        custom_activity_type_id: activityTypeId
      }

      if (startDate) {
        filters.date_created__gte = startDate
      }
      if (endDate) {
        filters.date_created__lte = endDate
      }

      console.log(`[CloseApi] Using getCustomActivitiesWithFilters with filters:`, JSON.stringify(filters, null, 2))

      const activities = await this.getCustomActivitiesWithFilters(filters)

      console.log(`[CloseApi] Found ${activities.length} activities for type ${activityTypeId}`)

      return activities
    } catch (error: any) {
      console.error(`[CloseApi] Error in getCustomActivitiesByType:`, error.message)
      if (error.response) {
        console.error('[CloseApi] Response Status:', error.response.status)
        console.error('[CloseApi] Response Data:', JSON.stringify(error.response.data).substring(0, 200))
      }
      return []
    }
  }

  // Hole Custom Activities mit flexiblen Filtern (wie im Original)
  async getCustomActivitiesWithFilters(filters: any = {}) {
    try {
      let allActivities: any[] = []
      let hasMore = true
      let skip = 0
      const limit = 100

      // Close API erwartet bestimmte Parameter-Formate
      // Entferne _type aus filters, da wir das manuell filtern
      const { _type, custom_activity_type_id, date_created__gte, date_created__lte, ...otherFilters } = filters

      while (hasMore) {
        const params: any = {
          _limit: limit
        }

        if (skip > 0) {
          params._skip = skip
        }

        // Füge Datum-Filter hinzu (wenn vorhanden) - Close API Format
        // WICHTIG: Close API erwartet ISO-Format mit Zeit, nicht nur Datum
        if (date_created__gte) {
          // Wenn nur Datum (YYYY-MM-DD), füge Zeit hinzu
          const dateStr = date_created__gte.includes('T') 
            ? date_created__gte 
            : `${date_created__gte}T00:00:00Z`
          params.date_created__gte = dateStr
        }
        if (date_created__lte) {
          // Wenn nur Datum (YYYY-MM-DD), füge Zeit hinzu (Ende des Tages)
          const dateStr = date_created__lte.includes('T') 
            ? date_created__lte 
            : `${date_created__lte}T23:59:59Z`
          params.date_created__lte = dateStr
        }

        // Füge custom_activity_type_id NICHT als Query-Parameter hinzu
        // Stattdessen filtern wir clientseitig
        // Object.assign(params, otherFilters) // ENTFERNT - custom_activity_type_id wird nicht als Query-Parameter verwendet

        try {
          const response = await this.client.get('/activity/', { params })
          const activities = response.data.data || []
        
          // Filtere nur Custom Activities und nach custom_activity_type_id
          const customActivities = activities.filter((activity: any) => {
            if (activity._type !== 'CustomActivity') return false
            if (custom_activity_type_id && activity.custom_activity_type_id !== custom_activity_type_id) {
              return false
            }
            return true
          })
        
          // Füge Activities direkt hinzu
          allActivities.push(...customActivities)
        
          hasMore = response.data.has_more || false
          skip += limit
        } catch (apiError: any) {
          console.error('[CloseApi] API Fehler:', apiError.message)
          if (apiError.response) {
            console.error('[CloseApi] Status:', apiError.response.status)
            console.error('[CloseApi] Data:', JSON.stringify(apiError.response.data).substring(0, 200))
          }
          // Bei Fehler: versuche ohne Filter
          if (skip === 0 && Object.keys(filters).length > 0) {
            console.log('[CloseApi] Versuche ohne spezifische Filter...')
            // Retry ohne custom_activity_type_id Filter
            const retryParams: any = { _limit: limit }
            if (date_created__gte) {
              const dateStr = date_created__gte.includes('T') 
                ? date_created__gte 
                : `${date_created__gte}T00:00:00Z`
              retryParams.date_created__gte = dateStr
            }
            if (date_created__lte) {
              const dateStr = date_created__lte.includes('T') 
                ? date_created__lte 
                : `${date_created__lte}T23:59:59Z`
              retryParams.date_created__lte = dateStr
            }
            
            try {
              const retryResponse = await this.client.get('/activity/', { params: retryParams })
              const retryActivities = retryResponse.data.data || []
              const filtered = retryActivities.filter((a: any) => 
                a._type === 'CustomActivity' && 
                (!custom_activity_type_id || a.custom_activity_type_id === custom_activity_type_id)
              )
              allActivities.push(...filtered)
            } catch (retryError: any) {
              console.error('[CloseApi] Retry fehlgeschlagen:', retryError.message)
            }
          }
          break // Beende Loop bei Fehler
        }
        
        // Sicherheitscheck: Max 10000 Activities
        if (allActivities.length >= 10000) {
          console.warn('Maximale Anzahl von Activities erreicht (10000)')
          break
        }
      }

      console.log(`[CloseApi] ${allActivities.length} Custom Activities geladen`)
      return allActivities
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Custom Activities mit Filtern:', error.message)
      if (error.response) {
        console.error('Response Status:', error.response.status)
        console.error('Response Data:', error.response.data)
      }
      return []
    }
  }

  // Hole Lead-Details
  async getLeadDetails(leadId: string) {
    try {
      const response = await this.client.get(`/lead/${leadId}/`)
      return response.data
    } catch (error: any) {
      console.error(`[CloseApi] Fehler beim Abrufen des Leads ${leadId}:`, error.message)
      return null
    }
  }

  // Hole User-Details
  async getUserDetails(userId: string) {
    try {
      const response = await this.client.get(`/user/${userId}/`)
      return response.data
    } catch (error: any) {
      console.error(`[CloseApi] Fehler beim Abrufen des Users ${userId}:`, error.message)
      return null
    }
  }

  // Hole alle User aus Close
  async getAllUsers() {
    try {
      let allUsers: any[] = []
      let hasMore = true
      let skip = 0
      const limit = 100

      while (hasMore) {
        const params: any = {
          _limit: limit
        }
        if (skip > 0) {
          params._skip = skip
        }

        const response = await this.client.get('/user/', { params })
        const users = response.data.data || []
        allUsers.push(...users)
        
        hasMore = response.data.has_more || false
        skip += limit
      }

      return allUsers
    } catch (error: any) {
      console.error('[CloseApi] Fehler beim Abrufen der User:', error.message)
      if (error.response) {
        console.error('[CloseApi] Response Status:', error.response.status)
        console.error('[CloseApi] Response Data:', JSON.stringify(error.response.data).substring(0, 200))
      }
      return []
    }
  }

  static getActivityTypeConfig() {
    return ACTIVITY_TYPE_CONFIG
  }
}

