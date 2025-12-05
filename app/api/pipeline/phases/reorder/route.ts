import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const reorderSchema = z.object({
  phaseIds: z.array(z.string()).min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phaseIds } = reorderSchema.parse(body)
    
    // Update order für alle Phasen
    await Promise.all(
      phaseIds.map((id, index) =>
        prisma.pipelinePhase.update({
          where: { id },
          data: { order: index }
        })
      )
    )
    
    return NextResponse.json({ message: 'Reihenfolge aktualisiert' })
  } catch (err: any) {
    console.error('Error reordering phases:', err)
    if (err.name === 'ZodError') {
      return NextResponse.json({ message: 'Validierungsfehler', errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}



