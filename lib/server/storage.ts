import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import crypto from 'node:crypto'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'retirement-concepts')

function ensureExtension(originalName: string, mimeType: string): string {
  const ext = path.extname(originalName)
  if (ext) return ext

  switch (mimeType.toLowerCase()) {
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/gif':
      return '.gif'
    case 'image/webp':
      return '.webp'
    case 'application/pdf':
      return '.pdf'
    default:
      return ''
  }
}

async function ensureDirectory(dir: string) {
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true })
  }
}

export async function ensureStorageDir(conceptId: string): Promise<string> {
  const dir = path.join(STORAGE_ROOT, conceptId)
  await ensureDirectory(dir)
  return dir
}

interface SaveConceptFileOptions {
  conceptId: string
  file: Blob
  category?: string
  originalName: string
  mimeType: string
}

export async function saveConceptFile(options: SaveConceptFileOptions): Promise<{
  relativePath: string
  fileName: string
  originalName: string
  mimeType: string
  size: number
}> {
  const { conceptId, file, originalName, mimeType } = options
  const directory = await ensureStorageDir(conceptId)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const safeOriginalName = originalName && originalName.trim().length > 0 ? originalName : 'upload'
  const extension = ensureExtension(safeOriginalName, mimeType || 'application/octet-stream')
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`
  const filePath = path.join(directory, uniqueName)

  await fs.writeFile(filePath, buffer)

  return {
    relativePath: path.relative(process.cwd(), filePath),
    fileName: uniqueName,
    originalName: safeOriginalName,
    mimeType: mimeType || 'application/octet-stream',
    size: buffer.length,
  }
}

export async function deleteConceptFile(relativePath: string): Promise<void> {
  if (!relativePath) return
  const absolutePath = path.join(process.cwd(), relativePath)
  try {
    await fs.unlink(absolutePath)
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }
}

export function getAttachmentAbsolutePath(relativePath: string): string {
  return path.join(process.cwd(), relativePath)
}


