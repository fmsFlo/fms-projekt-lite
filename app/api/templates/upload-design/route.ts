import { NextResponse } from 'next/server'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import Handlebars from 'handlebars'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const htmlFile = formData.get('htmlFile') as File
    const templateSlug = formData.get('templateSlug') as string

    if (!htmlFile) {
      return NextResponse.json({ message: 'Keine HTML-Datei hochgeladen' }, { status: 400 })
    }

    if (!templateSlug) {
      return NextResponse.json({ message: 'Template-Slug fehlt' }, { status: 400 })
    }

    // Validiere HTML-Datei
    if (!htmlFile.name.endsWith('.html')) {
      return NextResponse.json({ message: 'Nur HTML-Dateien erlaubt' }, { status: 400 })
    }

    // Lese HTML-Inhalt
    const htmlContent = await htmlFile.text()

    // Validiere dass es Handlebars-kompatibel ist (nur wenn Platzhalter vorhanden)
    // Akzeptiere auch reines HTML ohne Platzhalter
    try {
      // Prüfe ob überhaupt Platzhalter vorhanden sind
      if (htmlContent.includes('{{')) {
        // Nur validieren wenn Platzhalter vorhanden sind
        Handlebars.compile(htmlContent)
      }
    } catch (err: any) {
      console.warn('Handlebars Validation Warning:', err.message)
      // Nicht fehlschlagen - auch fehlerhafte Templates können hochgeladen werden
      // Der User kann sie dann korrigieren
    }

    // Speichere als .hbs Datei
    const root = process.cwd()
    const filePath = join(root, 'templates', 'contracts', `${templateSlug}.hbs`)
    
    await writeFile(filePath, htmlContent, 'utf-8')

    return NextResponse.json({ 
      message: 'Design erfolgreich hochgeladen',
      slug: templateSlug,
      preview: htmlContent.substring(0, 500) + '...'
    })
  } catch (err: any) {
    console.error('Upload Error:', err)
    return NextResponse.json({ message: 'Upload fehlgeschlagen', error: err.message }, { status: 500 })
  }
}

