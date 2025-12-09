import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-dynamic'

interface Params { params: { id: string } }

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const contract = await prisma.contract.findUnique({ where: { id: params.id } })
    if (!contract) return NextResponse.json({ message: 'Vertrag nicht gefunden' }, { status: 404 })

    // Lösche PDF-Dateien
    const root = process.cwd()
    if (contract.pdfFileName) {
      try {
        const pdfPath = path.join(root, 'public', 'contracts', contract.pdfFileName)
        await fs.unlink(pdfPath).catch(() => {}) // Ignoriere Fehler wenn Datei nicht existiert
      } catch {}
    }
    
    if (contract.signedPdfFileName) {
      try {
        const signedPath = path.join(root, 'public', contract.signedPdfFileName.replace(/^\//, ''))
        await fs.unlink(signedPath).catch(() => {}) // Ignoriere Fehler wenn Datei nicht existiert
      } catch {}
    }

    // Lösche Vertrag aus DB
    await prisma.contract.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Vertrag erfolgreich gelöscht' })
  } catch (err: any) {
    console.error('Delete contract error:', err)
    return NextResponse.json({ message: 'Löschen fehlgeschlagen', error: err.message }, { status: 500 })
  }
}




