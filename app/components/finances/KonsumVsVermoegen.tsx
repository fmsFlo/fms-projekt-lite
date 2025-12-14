"use client"

import { useState } from 'react'
import { calculateAnlageErgebnis, formatEuro } from './utils'
import { ShoppingBag, TrendingUp } from 'lucide-react'

interface KonsumVsVermoegenProps {
  monatlicheSparrate: number
  jahre?: number
  rendite?: number
}

export default function KonsumVsVermoegen({
  monatlicheSparrate,
  jahre = 20,
  rendite = 5,
}: KonsumVsVermoegenProps) {
  // Startwert: Wenn Sparrate positiv und > 50€, verwende diese, sonst 200€ Beispiel
  const startBetrag = monatlicheSparrate > 50 ? Math.abs(monatlicheSparrate) : 200
  const [verfuegbarerBetrag, setVerfuegbarerBetrag] = useState(startBetrag)
  const [sliderPosition, setSliderPosition] = useState(50) // 0-100

  // Der Slider teilt einen verfügbaren Betrag auf
  // Bei 0% = alles wird konsumiert, bei 100% = alles wird investiert
  const konsumProzent = sliderPosition
  const vermoegenProzent = 100 - sliderPosition

  // Konsum: wird monatlich ausgegeben, keine Rendite
  const konsumMonatlich = (verfuegbarerBetrag * konsumProzent) / 100
  const konsumJaehrlich = konsumMonatlich * 12
  const konsumGesamt = konsumJaehrlich * jahre // Einfach summiert, keine Rendite

  // Vermögen: wird investiert, mit Rendite
  const vermoegenMonatlich = (verfuegbarerBetrag * vermoegenProzent) / 100
  const vermoegenErgebnis = calculateAnlageErgebnis(vermoegenMonatlich, jahre, rendite)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-6 w-6 text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-900">Konsum vs. Vermögen</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Verschiebe den Slider und sieh, wie sich deine Entscheidung zwischen Konsum und Vermögen
        langfristig auswirkt. Links siehst du, was du für Konsum ausgibst (ohne Rendite), rechts was
        du durch Investition aufbaust (mit {rendite}% Rendite).
      </p>
      
      {/* Betrag eingeben */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verfügbarer Betrag pro Monat (€)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            step="10"
            value={verfuegbarerBetrag || ''}
            onChange={(e) => setVerfuegbarerBetrag(parseFloat(e.target.value) || 0)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            placeholder="200"
          />
          <span className="text-sm text-gray-600">€/Monat</span>
        </div>
        {monatlicheSparrate > 0 && monatlicheSparrate !== verfuegbarerBetrag && (
          <p className="text-xs text-gray-500 mt-2">
            💡 Deine aktuelle Sparrate: {formatEuro(monatlicheSparrate)}/Monat
          </p>
        )}
      </div>

      {/* Slider Bereich */}
      <div className="relative">
        {/* Zwei Seiten */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* KONSUM */}
          <div className="bg-red-50 rounded-lg border-2 border-red-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold text-gray-900">KONSUM</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-600">Monatlich</p>
                <p className="text-2xl font-bold text-red-700">{formatEuro(konsumMonatlich)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Jährlich</p>
                <p className="text-lg font-semibold text-red-600">{formatEuro(konsumJaehrlich)}</p>
              </div>
              <div className="pt-3 border-t border-red-200">
                <p className="text-xs text-gray-600">Gesamt in {jahre} Jahren</p>
                <p className="text-xl font-bold text-red-800">{formatEuro(konsumGesamt)}</p>
              </div>
            </div>
          </div>

          {/* VERMÖGEN */}
          <div className="bg-green-50 rounded-lg border-2 border-green-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">VERMÖGEN</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-600">Monatlich</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatEuro(vermoegenMonatlich)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Nach {jahre} Jahren</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatEuro(vermoegenErgebnis.endkapital)}
                </p>
              </div>
              <div className="pt-3 border-t border-green-200">
                <p className="text-xs text-gray-600">Davon Zinsen</p>
                <p className="text-xl font-bold text-green-800">
                  {formatEuro(vermoegenErgebnis.zinsenGewinn)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-600">Mehr Konsum</span>
            <span className="text-sm font-medium text-green-600">Mehr Vermögen</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(parseInt(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #fca5a5 0%, #fca5a5 ${sliderPosition}%, #86efac ${sliderPosition}%, #86efac 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Vergleich */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <p className="text-sm text-blue-800 mb-2">
          <strong>Unterschied nach {jahre} Jahren:</strong>
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700 font-medium">Konsum (ohne Rendite):</p>
            <p className="text-lg font-bold text-blue-900">{formatEuro(konsumGesamt)}</p>
            <p className="text-xs text-blue-600 mt-1">
              {formatEuro(konsumMonatlich)}/Monat × {jahre} Jahre
            </p>
          </div>
          <div>
            <p className="text-green-700 font-medium">Investition (mit {rendite}% Rendite):</p>
            <p className="text-lg font-bold text-green-900">{formatEuro(vermoegenErgebnis.endkapital)}</p>
            <p className="text-xs text-green-600 mt-1">
              {formatEuro(vermoegenMonatlich)}/Monat × {jahre} Jahre
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm font-semibold text-blue-900">
            💰 Mehrwert durch Investition: {formatEuro(vermoegenErgebnis.endkapital - konsumGesamt)}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Davon Zinsen/Rendite: {formatEuro(vermoegenErgebnis.zinsenGewinn)}
          </p>
        </div>
      </div>
    </div>
  )
}

