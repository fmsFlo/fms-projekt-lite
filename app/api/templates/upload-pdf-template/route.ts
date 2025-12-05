import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const pdfFile = formData.get('pdfFile') as File
    const templateSlug = formData.get('templateSlug') as string

    if (!pdfFile) {
      return NextResponse.json({ message: 'Keine PDF-Datei hochgeladen' }, { status: 400 })
    }

    if (!templateSlug) {
      return NextResponse.json({ message: 'Template-Slug fehlt' }, { status: 400 })
    }

    // Validiere PDF
    if (!pdfFile.name.endsWith('.pdf')) {
      return NextResponse.json({ message: 'Nur PDF-Dateien erlaubt' }, { status: 400 })
    }

    // Lese PDF als Buffer
    const arrayBuffer = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Speichere PDF als Vorlage (für später: PDF → Bild → HTML)
    const root = process.cwd()
    const templatesDir = join(root, 'public', 'template-pdfs')
    
    if (!existsSync(templatesDir)) {
      await mkdir(templatesDir, { recursive: true })
    }

    const pdfPath = join(templatesDir, `${templateSlug}.pdf`)
    await writeFile(pdfPath, buffer)

    // Erstelle Basis HTML-Template mit PDF als Hintergrund-Bild
    // Der User muss das PDF zuerst zu Bildern konvertieren (z.B. mit Online-Tool)
    const htmlTemplate = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Template ${templateSlug}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .pdf-background {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      background: #fff;
      /* TODO: PDF als Hintergrund-Bild einfügen */
      /* background-image: url('/template-pdfs/${templateSlug}-page1.png'); */
      /* background-size: contain; */
      /* background-repeat: no-repeat; */
    }
    /* Platzhalter mit absoluter Positionierung */
    .field-placeholder {
      position: absolute;
      padding: 2px 5px;
      /* Position anpassen! */
      /* top: 100mm; */
      /* left: 50mm; */
    }
  </style>
</head>
<body>
  <div class="pdf-background">
    <!-- TODO: Platzhalter hier positionieren -->
    <!-- Beispiel: -->
    <!-- <div class="field-placeholder" style="top: 50mm; left: 30mm;">{{client.firstName}} {{client.lastName}}</div> -->
    <!-- <div class="field-placeholder" style="top: 60mm; left: 30mm;">{{client.street}} {{client.houseNumber}}</div> -->
  </div>
</body>
</html>`

    // Speichere HTML-Template
    const htmlPath = join(root, 'templates', 'contracts', `${templateSlug}.hbs`)
    await writeFile(htmlPath, htmlTemplate, 'utf-8')

    return NextResponse.json({ 
      message: 'PDF erfolgreich hochgeladen',
      slug: templateSlug,
      htmlTemplate: htmlTemplate,
      nextSteps: [
        '1. PDF zu PNG konvertieren (z.B. ilovepdf.com/pdf-zu-jpg)',
        '2. PNG-Dateien als [slug]-page1.png, [slug]-page2.png in /public/template-pdfs/ hochladen',
        '3. Im Template-Editor die background-image Zeilen aktivieren',
        '4. Platzhalter mit absoluter Positionierung hinzufügen'
      ],
      pdfPath: `/template-pdfs/${templateSlug}.pdf`
    })
  } catch (err: any) {
    console.error('PDF Upload Error:', err)
    return NextResponse.json({ message: 'Upload fehlgeschlagen', error: err.message }, { status: 500 })
  }
}

