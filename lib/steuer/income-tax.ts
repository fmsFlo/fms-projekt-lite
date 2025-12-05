import { est2025Single } from './steuer2025'

export type FilingStatus = 'single' | 'married' | 'widowed'

export function calculateIncomeTaxAnnual(zve: number, filingStatus: FilingStatus = 'single'): number {
  if (!Number.isFinite(zve) || zve <= 0) {
    return 0
  }

  if (filingStatus === 'married') {
    const half = zve / 2
    return est2025Single(half) * 2
  }

  return est2025Single(zve)
}
