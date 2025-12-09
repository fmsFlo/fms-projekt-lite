import { NextResponse } from 'next/server'
import { totalsForZVE } from '@/lib/steuer/steuer2025'

function parseChurchRate(value: string | null): 0 | 0.08 | 0.09 {
  if (!value) return 0
  const parsed = Number(value)
  if (parsed === 0.08) return 0.08
  if (parsed === 0.09) return 0.09
  return 0
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const zveParam = searchParams.get('zve')
  const churchRateParam = searchParams.get('churchRate')

  const zve = zveParam !== null ? Number(zveParam) : NaN

  if (!Number.isFinite(zve) || zve < 0) {
    return NextResponse.json(
      { error: 'Parameter "zve" muss eine nicht-negative Zahl sein.' },
      { status: 400 }
    )
  }

  const result = totalsForZVE(zve, parseChurchRate(churchRateParam))
  return NextResponse.json(result)
}



















