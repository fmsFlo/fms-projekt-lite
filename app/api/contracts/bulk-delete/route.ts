import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ids } = schema.parse(body)

    const contracts = await prisma.contract.findMany({
      where: { id: { in: ids } },
    })

    if (contracts.length === 0) {
      return NextResponse.json({ deletedCount: 0 })
    }

    const root = process.cwd()
    await Promise.all(
      contracts.map(async (contract) => {
        if (contract.pdfFileName) {
          const pdfPath = path.join(root, 'public', 'contracts', contract.pdfFileName)
          await fs.unlink(pdfPath).catch(() => {})
        }
        if (contract.signedPdfFileName) {
          const signedPath = path.join(
            root,
            'public',
            contract.signedPdfFileName.replace(/^\//, '')
          )
          await fs.unlink(signedPath).catch(() => {})
        }
      })
    )

    const result = await prisma.contract.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ deletedCount: result.count })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Ungültige Anfrage', issues: err.issues },
        { status: 400 }
      )
    }
    console.error('Bulk delete contracts error:', err)
    return NextResponse.json(
      { message: 'Löschen fehlgeschlagen', error: err?.message },
      { status: 500 }
    )
  }
}








