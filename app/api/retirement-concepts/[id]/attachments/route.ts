import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteConceptFile, saveConceptFile } from '@/lib/server/storage'

const MAX_ATTACHMENTS_PER_CATEGORY = 3
const EXPIRY_HOURS = 48
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
])

function buildAttachmentResponse(attachment: {
  id: string
  category: string
  originalName: string
  mimeType: string
  fileName: string
  filePath: string
  size: number
  createdAt: Date
  expiresAt: Date
  conceptId: string
}) {
  return {
    id: attachment.id,
    category: attachment.category,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    createdAt: attachment.createdAt,
    expiresAt: attachment.expiresAt,
    url: `/api/retirement-concepts/${attachment.conceptId}/attachments/${attachment.id}`,
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const attachments = await prisma.retirementConceptAttachment.findMany({
    where: { conceptId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(attachments.map(buildAttachmentResponse))
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const concept = await prisma.retirementConcept.findUnique({
      where: { id: params.id },
      select: { id: true },
    })
    if (!concept) {
      return NextResponse.json({ message: 'Rentenkonzept nicht gefunden' }, { status: 404 })
    }

    const form = await req.formData()
    const file = form.get('file')
    const category = (form.get('category') as string | null) ?? 'statutory'

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Ungültige Datei' }, { status: 400 })
    }

    const mimeType = file.type || 'application/octet-stream'
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ message: 'Nur Bilder (jpg, png, webp, gif) sind erlaubt.' }, { status: 400 })
    }

    const originalName =
      typeof (file as { name?: unknown }).name === 'string' && ((file as { name?: string }).name?.length ?? 0) > 0
        ? (file as { name: string }).name
        : 'upload'

    const existingCount = await prisma.retirementConceptAttachment.count({
      where: { conceptId: params.id, category },
    })
    if (existingCount >= MAX_ATTACHMENTS_PER_CATEGORY) {
      return NextResponse.json(
        { message: `Es sind maximal ${MAX_ATTACHMENTS_PER_CATEGORY} Dateien erlaubt.` },
        { status: 400 },
      )
    }

    const saved = await saveConceptFile({
      conceptId: params.id,
      file,
      category,
      originalName,
      mimeType,
    })

    const attachment = await prisma.retirementConceptAttachment.create({
      data: {
        conceptId: params.id,
        category,
        filePath: saved.relativePath,
        fileName: saved.fileName,
        originalName: saved.originalName,
        mimeType: saved.mimeType,
        size: saved.size,
        expiresAt: new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000),
      },
    })

    return NextResponse.json(buildAttachmentResponse(attachment))
  } catch (err: any) {
    console.error('Attachment upload error:', err)
    return NextResponse.json({ message: 'Upload fehlgeschlagen', error: err?.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const attachmentId = searchParams.get('attachmentId')
    if (!attachmentId) {
      return NextResponse.json({ message: 'attachmentId fehlt' }, { status: 400 })
    }

    const attachment = await prisma.retirementConceptAttachment.findUnique({
      where: { id: attachmentId },
    })
    if (!attachment || attachment.conceptId !== params.id) {
      return NextResponse.json({ message: 'Anhang nicht gefunden' }, { status: 404 })
    }

    await prisma.retirementConceptAttachment.delete({ where: { id: attachmentId } })
    await deleteConceptFile(attachment.filePath).catch((err) => {
      console.warn('Konnte Datei nicht löschen:', attachment.filePath, err)
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Attachment delete error:', err)
    return NextResponse.json({ message: 'Löschen fehlgeschlagen', error: err?.message }, { status: 500 })
  }
}

