import Link from 'next/link'
import { totalsForZVE } from '@/lib/steuer/steuer2025'

const euro = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
})

const percent = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const churchRateOptions: Array<{ label: string; value: 0 | 0.08 | 0.09 }> = [
  { label: 'Keine', value: 0 },
  { label: '8 % (z. B. BY, BW)', value: 0.08 },
  { label: '9 % (übrige Länder)', value: 0.09 },
]

const parseChurchRate = (value: string | undefined): 0 | 0.08 | 0.09 => {
  if (!value) return 0
  const parsed = Number(value)
  return parsed === 0.08 || parsed === 0.09 ? parsed : 0
}

type PageProps = {
  searchParams?: Record<string, string | string[]>
}

export default function SteuerrechnerPage({ searchParams }: PageProps) {
  const zveParam = searchParams?.zve
  const churchRateParam = searchParams?.churchRate

  const zveInput = Array.isArray(zveParam) ? zveParam[0] : zveParam
  const churchRateInput = Array.isArray(churchRateParam)
    ? churchRateParam[0]
    : churchRateParam

  const zve = zveInput ? Number(zveInput) : undefined
  const churchRate = parseChurchRate(churchRateInput)

  const showResult = zve !== undefined && Number.isFinite(zve) && zve >= 0
  const result = showResult ? totalsForZVE(zve, churchRate) : null

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Einkommensteuer 2025 (Grundtarif)</h1>
        <p className="text-sm text-gray-600">
          Berechnet Steuer nach §32a EStG 2025 mit optionaler Kirchensteuer. Solidaritätszuschlag
          und Sonderregelungen sind nicht berücksichtigt.
        </p>
      </section>

      <form className="grid gap-4 rounded-lg border bg-white p-6 shadow-sm" method="get">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="zve">
            zu versteuerndes Einkommen (zvE) in €
          </label>
          <input
            id="zve"
            name="zve"
            type="number"
            min={0}
            step={1}
            defaultValue={zveInput ?? ''}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="50000"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="churchRate">
            Kirchensteuer
          </label>
          <select
            id="churchRate"
            name="churchRate"
            defaultValue={churchRateInput ?? '0'}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {churchRateOptions.map((option) => (
              <option key={option.value} value={option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Berechnen
          </button>
          <a
            href="/tools/steuerrechner"
            className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Zurücksetzen
          </a>
        </div>
      </form>

      {showResult && result && (
        <section className="grid gap-4 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Ergebnis</h2>
          <dl className="grid gap-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <dt>Einkommensteuer</dt>
              <dd className="font-semibold">{euro.format(result.est)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Kirchensteuer</dt>
              <dd className="font-semibold">{euro.format(result.kist)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Gesamtsteuer</dt>
              <dd className="font-semibold">{euro.format(result.total)}</dd>
            </div>
            <div className="flex justify-between text-gray-500">
              <dt>Ø-Steuersatz ohne KiSt</dt>
              <dd>{percent.format(result.avgNoChurch / 100)}</dd>
            </div>
            <div className="flex justify-between text-gray-500">
              <dt>Ø-Steuersatz inkl. KiSt</dt>
              <dd>{percent.format(result.avgWithChurch / 100)}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Vollversion im Browser öffnen</h2>
        <p className="text-sm text-gray-600">
          Für eine visuelle Variante mit Beispieltabelle steht der ursprüngliche Rechner weiterhin zur
          Verfügung.
        </p>
        <Link
          href="/tools/steuerrechner_2025_kirchensteuer.html"
          className="mt-3 inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          HTML-Rechner öffnen
        </Link>
      </section>
    </div>
  )
}








