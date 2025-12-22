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

  // Für Netlify: Verwende puppeteer-core mit @sparticuz/chromium
  // Für lokale Entwicklung: Normales puppeteer
  let browser: any
  
  // Verbesserte Netlify-Erkennung
  const isNetlify = !!(
    process.env.NETLIFY || 
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY_DEV ||
    process.env.VERCEL ||
    process.env.AWS_EXECUTION_ENV
  )
  
  if (isNetlify) {
    // Netlify/Lambda Umgebung - verwende @sparticuz/chromium
    try {
      console.log('[PDF] Netlify-Umgebung erkannt, verwende @sparticuz/chromium')
      
      // Statischer Import für @sparticuz/chromium
      const chromium = require('@sparticuz/chromium')
      
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
      
      console.log('[PDF] Chromium executablePath:', executablePath ? 'gefunden' : 'nicht gefunden')
      
      if (!executablePath) {
        throw new Error('Chromium executablePath konnte nicht ermittelt werden. Bitte stellen Sie sicher, dass @sparticuz/chromium korrekt installiert ist.')
      }
      
      browser = await puppeteerCore.launch({
        args: chromium.args || [],
        defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
        executablePath: executablePath,
        headless: chromium.headless ?? true,
      })
      
      console.log('[PDF] Browser erfolgreich gestartet')
    } catch (error: any) {
      console.error('❌ Fehler beim Laden von @sparticuz/chromium:', error.message)
      console.error('❌ Error Stack:', error.stack)
      console.error('❌ Environment:', {
        NETLIFY: process.env.NETLIFY,
        AWS_LAMBDA: process.env.AWS_LAMBDA_FUNCTION_NAME,
        NETLIFY_DEV: process.env.NETLIFY_DEV,
        VERCEL: process.env.VERCEL
      })
      throw new Error(`PDF-Generierung fehlgeschlagen: An \`executablePath\` or \`channel\` must be specified for \`puppeteer-core\`. Bitte prüfen Sie die Netlify-Konfiguration.`)
    }
  } else {
    // Lokale Entwicklung - normales puppeteer
    console.log('[PDF] Lokale Umgebung, verwende puppeteer')
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
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

