import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderRetirementConceptHtml } from '@/lib/retirementConceptTemplate'

export const dynamic = 'force-dynamic'

interface Params {
  params: { id: string }
}

export async function GET(req: Request, { params }: Params) {
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
    const { origin } = new URL(req.url)
    const { html, data, templateSource, isCustom } = await renderRetirementConceptHtml(concept, {
      resolveAttachmentUrl: (attachment, conceptId) =>
        `${origin}/api/retirement-concepts/${conceptId}/attachments/${attachment.id}`,
    })

    return NextResponse.json({ html, data, templateSource, isCustom })
  } catch (err: any) {
    console.error('Rentenkonzept HTML Fehler:', err)
    return NextResponse.json({ message: 'HTML-Erstellung fehlgeschlagen', error: err?.message }, { status: 500 })
  }
}

