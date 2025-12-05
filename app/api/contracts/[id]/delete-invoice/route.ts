import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

export async function DELETE(req: Request, { params }: Params) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id }
    })

    if (!contract) {
      return NextResponse.json({ message: 'Vertrag nicht gefunden' }, { status: 404 })
    }

    if (!contract.sevdeskInvoiceId) {
      return NextResponse.json({ 
        message: 'Keine Rechnung vorhanden',
      }, { status: 400 })
    }

    // Lösche nur die Referenz in der Datenbank, nicht die Rechnung in Sevdesk
    // (Die Rechnung bleibt in Sevdesk bestehen, kann aber neu erstellt werden)
    await prisma.contract.update({
      where: { id: params.id },
      data: {
        sevdeskInvoiceId: null,
        sevdeskInvoiceNumber: null,
      }
    })

    return NextResponse.json({
      message: 'Rechnungsreferenz gelöscht. Sie können jetzt eine neue Rechnung erstellen.',
    })
  } catch (err: any) {
    console.error('❌ Delete Invoice Error:', err)
    return NextResponse.json({ 
      message: 'Fehler beim Löschen der Rechnung',
      error: err.message || 'Unbekannter Fehler'
    }, { status: 500 })
  }
}



