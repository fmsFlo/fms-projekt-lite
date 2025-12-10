import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Params { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const template = await prisma.contractTemplate.findUnique({ where: { id: params.id } })
    if (!template) {
      return NextResponse.json({ message: 'Template nicht in Datenbank gefunden' }, { status: 404 })
    }

    const root = process.cwd()
    const filePath = path.join(root, 'templates', 'contracts', `${template.slug}.hbs`)
    
    // Prüfe ob Datei existiert
    try {
      await fs.access(filePath)
    } catch {
      console.warn(`Template-Datei nicht gefunden: ${filePath} für Template-Slug: ${template.slug}`)
      return NextResponse.json({ 
        message: 'Template-Datei nicht gefunden', 
        details: `Datei: ${template.slug}.hbs`,
        slug: template.slug 
      }, { status: 404 })
    }
    
    const content = await fs.readFile(filePath, 'utf-8')
    return new NextResponse(content, { 
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      } 
    })
  } catch (err: any) {
    console.error('Fehler beim Laden des Template-Inhalts:', err)
    if (err.code === 'ENOENT') {
      return NextResponse.json({ 
        message: 'Template-Datei nicht gefunden',
        details: err.message 
      }, { status: 404 })
    }
    return NextResponse.json({ 
      message: 'Interner Fehler',
      details: err.message 
    }, { status: 500 })
  }
}

