import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import Handlebars from 'handlebars'
import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'

export async function renderHandlebarsToHtml(templateSlug: string, data: Record<string, unknown>): Promise<string> {
  const root = process.cwd()
  const filePath = path.join(root, 'templates', 'contracts', `${templateSlug}.hbs`)
  
  // Prüfe ob Datei existiert
  if (!existsSync(filePath)) {
    console.error(`❌ Template-Datei nicht gefunden: ${filePath}`)
    throw new Error(`Template-Datei nicht gefunden: ${filePath}`)
  }
  
  try {
    const templateSource = await fs.readFile(filePath, 'utf-8')
    console.log(`✅ Template geladen: ${filePath}, Größe: ${templateSource.length} Zeichen`)
    
    const template = Handlebars.compile(templateSource, { strict: false })
    const html = template(data)
    return html
  } catch (err: any) {
    console.error(`❌ Fehler beim Laden/Kompilieren des Templates:`, err)
    throw new Error(`Template-Fehler: ${err.message}`)
  }
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  // Konvertiere relative Pfade (z.B. /uploads/logo.png oder /contracts/...) zu absoluten file:// URLs für Puppeteer
  const root = process.cwd()
  const processedHtml = html.replace(
    /src="([^"]+)"/g,
    (match, imagePath) => {
      // Wenn es bereits eine file:// URL ist, unverändert lassen
      if (imagePath.startsWith('file://')) {
        return match
      }
      // Wenn es eine absolute URL ist (http/https), unverändert lassen
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return match
      }
      // Relative Pfade konvertieren
      if (imagePath.startsWith('/')) {
        const relativePath = imagePath.replace(/^\//, '')
        const absolutePath = path.join(root, 'public', relativePath)
        // Prüfe ob Datei existiert und konvertiere zu file:// URL
        try {
          if (existsSync(absolutePath)) {
            // Windows-Pfade korrekt formatieren (Backslashes zu Slashes)
            const normalizedPath = absolutePath.replace(/\\/g, '/')
            return `src="file://${normalizedPath}"`
          } else {
            console.warn(`Logo-Datei nicht gefunden: ${absolutePath}`)
          }
        } catch (err) {
          console.warn(`Fehler beim Prüfen der Logo-Datei: ${absolutePath}`, err)
        }
      }
      // Fallback: Original beibehalten
      return match
    }
  )

  // Environment detection
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isNetlify = !!(
    process.env.NETLIFY || 
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV
  )
  const isProduction = !isDevelopment && (isNetlify || process.env.VERCEL)
  
  console.log('[PDF] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    isDevelopment,
    isNetlify,
    isProduction,
    NETLIFY: process.env.NETLIFY,
    AWS_LAMBDA: process.env.AWS_LAMBDA_FUNCTION_NAME
  })
  
  let browser: any
  
  try {
    console.log('[PDF] Starting browser launch...')
    
    if (isProduction) {
      // Production (Netlify/Lambda) - use serverless Chromium
      console.log('[PDF] Production environment detected, using @sparticuz/chromium')
      
      let chromium: any
      try {
        chromium = await import('@sparticuz/chromium')
        // Wenn es ein default export ist, verwende default
        if (chromium.default) {
          chromium = chromium.default
        }
      } catch (importError: any) {
        console.error('[PDF] Error importing @sparticuz/chromium:', importError.message)
        // Fallback: Versuche require() (für CommonJS)
        try {
          chromium = require('@sparticuz/chromium')
        } catch (requireError: any) {
          throw new Error(`Cannot import or require @sparticuz/chromium: ${importError.message} / ${requireError.message}`)
        }
      }
      
      // Chromium für Netlify konfigurieren
      if (chromium.setGraphicsMode && typeof chromium.setGraphicsMode === 'function') {
        chromium.setGraphicsMode(false)
      }
      
      // executablePath kann eine Property oder eine Funktion sein, je nach Version
      let executablePath: string | undefined
      if (typeof chromium.executablePath === 'function') {
        executablePath = await chromium.executablePath()
      } else if (chromium.executablePath) {
        executablePath = chromium.executablePath as string
      }
      
      console.log('[PDF] Chromium executablePath:', executablePath ? 'found' : 'not found')
      console.log('[PDF] Chromium args count:', chromium.args?.length || 0)
      
      if (!executablePath) {
        throw new Error('Chromium executablePath could not be determined. Please ensure @sparticuz/chromium is correctly installed.')
      }
      
      browser = await puppeteerCore.launch({
        args: chromium.args || [],
        defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
        executablePath: executablePath,
        headless: chromium.headless ?? true,
        ignoreHTTPSErrors: true,
      })
      
      console.log('[PDF] Browser launched successfully in production')
    } else {
      // Local development - use system Chrome or puppeteer
      console.log('[PDF] Development environment, using local Chrome/puppeteer')
      
      const chromeExecutablePath = process.env.CHROME_EXECUTABLE_PATH
      
      if (chromeExecutablePath) {
        // Use custom Chrome path from environment variable
        console.log('[PDF] Using Chrome from CHROME_EXECUTABLE_PATH:', chromeExecutablePath)
        browser = await puppeteerCore.launch({
          headless: true,
          executablePath: chromeExecutablePath,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      } else {
        // Use regular puppeteer (includes Chrome)
        console.log('[PDF] Using puppeteer (includes Chrome)')
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      }
      
      console.log('[PDF] Browser launched successfully in development')
    }
  } catch (error: any) {
    console.error('[PDF] Detailed error:', {
      message: error.message,
      stack: error.stack,
      env: process.env.NODE_ENV,
      isDevelopment,
      isProduction,
      chromePath: process.env.CHROME_EXECUTABLE_PATH
    })
    throw new Error(`PDF-Generierung fehlgeschlagen: ${error.message}`)
  }
  try {
    const page = await browser.newPage()
    await page.setContent(processedHtml, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

