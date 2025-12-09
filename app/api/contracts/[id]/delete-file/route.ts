import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-dynamic'

interface Params { params: { id: string } }

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(req.url)
    const fileType = searchParams.get('type') // 'signed' oder 'original'

    const contract = await prisma.contract.findUnique({ where: { id: params.id } })
    if (!contract) return NextResponse.json({ message: 'Vertrag nicht gefunden' }, { status: 404 })

    if (fileType === 'signed' && contract.signedPdfFileName) {
      // Lösche die Datei
      const root = process.cwd()
      const filePath = path.join(root, 'public', contract.signedPdfFileName.replace(/^\//, ''))
      try {
        await fs.unlink(filePath)
      } catch (err: any) {
        if (err.code !== 'ENOENT') throw err // Ignoriere wenn Datei nicht existiert
      }

      // Lösche den Verweis in der DB
      await prisma.contract.update({
        where: { id: params.id },
        data: { signedPdfFileName: null }
      })

      return NextResponse.json({ message: 'Unterschriebenes Dokument gelöscht' })
    }

    return NextResponse.json({ message: 'Ungültiger Dateityp' }, { status: 400 })
  } catch (err: any) {
    console.error('Delete error:', err)
    return NextResponse.json({ message: 'Löschen fehlgeschlagen', error: err.message }, { status: 500 })
  }
}




