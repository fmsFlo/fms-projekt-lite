import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { htmlToPdf } from '@/lib/pdf'
import { getAttachmentAbsolutePath } from '@/lib/server/storage'
import { renderRetirementConceptHtml } from '@/lib/retirementConceptTemplate'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const concept = await prisma.retirementConcept.findUnique({
    where: { id: params.id },
    include: {
      client: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      attachments: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!concept) {
    return NextResponse.json({ message: 'Rentenkonzept nicht gefunden' }, { status: 404 })
  }

  try {
    const { html } = await renderRetirementConceptHtml(concept, {
      resolveAttachmentUrl: (attachment) => {
        if (!attachment.filePath) {
          return null
        }
        const absolute = getAttachmentAbsolutePath(attachment.filePath).replace(/\\/g, '/')
        return `file://${absolute}`
      },
    })
    const pdfBuffer = await htmlToPdf(html)
    const clientName = `${concept.client?.firstName ?? ''} ${concept.client?.lastName ?? ''}`.trim()
    const fileName = `${(clientName.length > 0 ? clientName : 'Rentenkonzept').replace(/\s+/g, '_')}.pdf`

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err: any) {
    console.error('Rentenkonzept PDF Fehler:', err)
    return NextResponse.json({ message: 'PDF-Erstellung fehlgeschlagen', error: err?.message }, { status: 500 })
  }
}

