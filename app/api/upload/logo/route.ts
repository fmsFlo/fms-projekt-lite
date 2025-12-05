import { NextResponse } from 'next/server'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return NextResponse.json({ message: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Validierung: Nur Bilder erlauben
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Nur Bilder erlaubt (PNG, JPG, WebP, SVG)' }, { status: 400 })
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'Datei zu groß (max. 5MB)' }, { status: 400 })
    }

    // Dateiname mit Timestamp für Eindeutigkeit
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `logo-${timestamp}.${extension}`
    
    // Speichern in public/uploads/
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(process.cwd(), 'public', 'uploads', fileName)
    
    await writeFile(filePath, buffer)
    
    // Relativer Pfad für die Datenbank
    const logoUrl = `/uploads/${fileName}`
    
    return NextResponse.json({ logoUrl, message: 'Logo erfolgreich hochgeladen' })
  } catch (err: any) {
    console.error('Upload Error:', err)
    return NextResponse.json({ message: 'Upload fehlgeschlagen', error: err.message }, { status: 500 })
  }
}




