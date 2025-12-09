import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAttachmentAbsolutePath } from '@/lib/server/storage'
import fs from 'node:fs/promises'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string; attachmentId: string } }) {
  const attachment = await prisma.retirementConceptAttachment.findUnique({
    where: { id: params.attachmentId },
  })

  if (!attachment || attachment.conceptId !== params.id) {
    return NextResponse.json({ message: 'Anhang nicht gefunden' }, { status: 404 })
  }

  try {
    const absolutePath = getAttachmentAbsolutePath(attachment.filePath)
    const data = await fs.readFile(absolutePath)
    return new NextResponse(data, {
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.originalName)}"`,
      },
    })
  } catch (err: any) {
    console.error('Attachment serve error:', err)
    return NextResponse.json({ message: 'Datei konnte nicht geladen werden' }, { status: 500 })
  }
}

