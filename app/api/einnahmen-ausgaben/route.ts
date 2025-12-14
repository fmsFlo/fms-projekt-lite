// Diese Route ist veraltet - verwende /api/clients/[id]/einnahmen-ausgaben stattdessen
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return NextResponse.json({ message: 'Diese Route ist veraltet. Verwende /api/clients/[id]/einnahmen-ausgaben' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ message: 'Diese Route ist veraltet. Verwende /api/clients/[id]/einnahmen-ausgaben' }, { status: 410 })
}

