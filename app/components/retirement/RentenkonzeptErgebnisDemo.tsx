"use client"

import RentenkonzeptErgebnis from './RentenkonzeptErgebnis'
import { beispielRentenErgebnis } from './rentenErgebnisBeispiel'

/**
 * Demo-Seite für die Rentenkonzept-Ergebnisseite
 * Diese kann für Tests und Präsentationen verwendet werden
 */
export default function RentenkonzeptErgebnisDemo() {
  const handleBeratungstermin = () => {
    alert('Beratungstermin-Funktion würde hier implementiert werden')
  }

  const handlePdfExport = () => {
    alert('PDF-Export-Funktion würde hier implementiert werden')
  }

  const handleAnpassen = () => {
    alert('Anpassen-Funktion würde hier implementiert werden')
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

