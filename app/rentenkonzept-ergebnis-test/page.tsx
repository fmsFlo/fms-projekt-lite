"use client"

import RentenkonzeptErgebnis from '@/app/components/retirement/RentenkonzeptErgebnis'
import { beispielRentenErgebnis } from '@/app/components/retirement/rentenErgebnisBeispiel'

/**
 * Test-Seite für die Rentenkonzept-Ergebnisseite
 * Erreichbar unter: /rentenkonzept-ergebnis-test
 */
export default function RentenkonzeptErgebnisTestPage() {
  const handleBeratungstermin = () => {
    alert('Beratungstermin-Funktion würde hier implementiert werden')
  }

  const handlePdfExport = () => {
    alert('PDF-Export-Funktion würde hier implementiert werden')
  }

  const handleAnpassen = () => {
    window.location.href = '/clients'
  }

  return (
    <RentenkonzeptErgebnis
      ergebnis={beispielRentenErgebnis}
      onBeratungstermin={handleBeratungstermin}
      onPdfExport={handlePdfExport}
      onAnpassen={handleAnpassen}
    />
  )
}

