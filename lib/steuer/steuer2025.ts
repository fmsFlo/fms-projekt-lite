// steuer2025.ts – Hilfsfunktionen für Cursor/Next.js Projekte
export function est2025Single(zve: number): number {
  const x = Math.floor(Math.max(0, zve));
  let est = 0;
  if (x <= 12096) est = 0;
  else if (x <= 17443) {
    const y = (x - 12096) / 10000;
    est = (932.30 * y + 1400) * y;
  } else if (x <= 68480) {
    const z = (x - 17443) / 10000;
    est = (176.64 * z + 2397) * z + 1015.13;
  } else if (x <= 277825) {
    est = 0.42 * x - 10911.92;
  } else {
    est = 0.45 * x - 19246.67;
  }
  return Math.round(est);
}

export function totalsForZVE(zve: number, churchRate: 0 | 0.08 | 0.09 = 0) {
  const est = est2025Single(zve);
  const kist = Math.round(est * churchRate);
  const total = est + kist;
  const avgNoChurch = zve > 0 ? +((est / zve) * 100).toFixed(2) : 0;
  const avgWithChurch = zve > 0 ? +((total / zve) * 100).toFixed(2) : 0;
  return { zve, est, kist, total, avgNoChurch, avgWithChurch };
}









