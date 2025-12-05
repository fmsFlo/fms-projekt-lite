export interface InsuranceCompany {
  name: string
  email: string
  address: string
  category?: string
}

export const insuranceCompanies: InsuranceCompany[] = [
  { name: 'ACM Lebensversicherung AG', email: 'kontakt-acmd@acmd.de', address: 'Breite Straße 29, 40213 Düsseldorf', category: 'Lebensversicherung' },
  { name: 'AGER Lebensversicherung AG', email: 'service@axa.de', address: 'Colonia-Allee 15, 51067 Köln', category: 'Lebensversicherung' },
  { name: 'Aioi Nissay Dowa Life Insurance of Europe Aktiengesellschaft', email: 'kundenservice-life@aioinissaydowa.eu', address: 'Carl-Zeiss-Ring 25, 85737 Ismaning', category: 'Lebensversicherung' },
  { name: 'Allianz Lebensversicherungs-Aktiengesellschaft', email: 'info@allianz.de', address: 'Heßbrühlstraße 2, 70565 Stuttgart', category: 'Lebensversicherung' },
  { name: 'Alte Leipziger Lebensversicherung auf Gegenseitigkeit', email: 'service@alte-leipziger.de', address: 'Alte Leipziger-Platz 1, 61440 Oberursel', category: 'Lebensversicherung' },
  { name: 'Athora Lebensversicherung Aktiengesellschaft', email: 'info.ge@athora.com', address: 'Söhnleinstraße 8, 65201 Wiesbaden', category: 'Lebensversicherung' },
  { name: 'AXA Lebensversicherung Aktiengesellschaft', email: 'service@axa.de', address: 'Colonia Allee 10 - 20, 51067 Köln', category: 'Lebensversicherung' },
  { name: 'Baloise Lebensversicherung Aktiengesellschaft Deutschland', email: 'info@baloise.de', address: 'Ludwig-Erhard-Straße 22, 20459 Hamburg', category: 'Lebensversicherung' },
  { name: 'Bayern-Versicherung Lebensversicherung Aktiengesellschaft', email: 'service@vkb.de', address: 'Maximilianstraße 53, 80530 München', category: 'Lebensversicherung' },
  { name: 'BL die Bayerische Lebensversicherung AG', email: 'info@diebayerische.de', address: 'Thomas-Dehler-Straße 25, 81737 München', category: 'Lebensversicherung' },
  { name: 'BY die Bayerische Vorsorge Lebensversicherung a.G.', email: 'info@diebayerische.de', address: 'Thomas-Dehler-Straße 25, 81737 München', category: 'Lebensversicherung' },
  { name: 'Concordia oeco Lebensversicherungs-AG', email: 'versicherungen@concordia.de', address: 'Karl-Wiechert-Allee 55, 30625 Hannover', category: 'Lebensversicherung' },
  { name: 'Condor Lebensversicherungs-Aktiengesellschaft', email: 'kundenservice@condor-versicherungen.de', address: 'Heidenkampsweg 102, 20097 Hamburg', category: 'Lebensversicherung' },
  { name: 'Continentale Lebensversicherung AG', email: 'info@continentale.de', address: 'Baierbrunner Straße 31-33, 81379 München', category: 'Lebensversicherung' },
  { name: 'Cosmos Lebensversicherungs-Aktiengesellschaft', email: 'info@cosmosdirekt.de', address: 'Halbergstraße 50-60, 66121 Saarbrücken', category: 'Lebensversicherung' },
  { name: 'Credit Life AG', email: 'service@creditlife.net', address: 'RheinLandplatz 1, 41460 Neuss', category: 'Lebensversicherung' },
  { name: 'Debeka Lebensversicherungsverein auf Gegenseitigkeit Sitz Koblenz am Rhein', email: 'kundenservice@debeka.de', address: 'Debeka-Platz 1, 56073 Koblenz am Rhein', category: 'Lebensversicherung' },
  { name: 'Delta Direkt Lebensversicherung Aktiengesellschaft München', email: 'info@deltadirekt.de', address: 'Ottostraße 16, 80333 München', category: 'Lebensversicherung' },
  { name: 'Deutsche Lebensversicherungs-Aktiengesellschaft', email: 'info.dlvag@allianz.de', address: 'Merlitzstraße 8, 12489 Berlin', category: 'Lebensversicherung' },
  { name: 'Deutsche Ärzteversicherung Aktiengesellschaft', email: 'service@aerzteversicherung.de', address: 'Colonia-Allee 10-20, 51067 Köln', category: 'Lebensversicherung' },
  { name: 'DEVK Allgemeine Lebensversicherungs-Aktiengesellschaft', email: 'info@devk.de', address: 'Riehler Straße 190, 50735 Köln', category: 'Lebensversicherung' },
  { name: 'DEVK Deutsche Eisenbahn Versicherung Lebensversicherungsverein a.G.', email: 'info@devk.de', address: 'Riehler Straße 190, 50735 Köln', category: 'Lebensversicherung' },
  { name: 'Dialog Lebensversicherungs-Aktiengesellschaft', email: 'service@dialog-versicherung.de', address: 'Stadtberger Straße 99, 86157 Augsburg', category: 'Lebensversicherung' },
  { name: 'DIREKTE LEBEN Versicherung AG', email: 'info@direkte-leben.de', address: 'Rotebühlstraße 120, 70197 Stuttgart', category: 'Lebensversicherung' },
  { name: 'Dortmunder Lebensversicherung AG', email: 'info@die-dortmunder.de', address: 'Südwall 37-41, 44137 Dortmund', category: 'Lebensversicherung' },
  { name: 'Entis Lebensversicherung AG', email: 'service@entis-lv.de', address: 'Dornhofstraße 36, 63263 Neu-Isenburg', category: 'Lebensversicherung' },
  { name: 'ERGO Lebensversicherung Aktiengesellschaft', email: 'info@ergo.de', address: 'Überseering 45, 22297 Hamburg', category: 'Lebensversicherung' },
  { name: 'ERGO Vorsorge Lebensversicherung Aktiengesellschaft', email: 'info@ergo-vorsorge.de', address: 'ERGO-Platz 1, 40477 Düsseldorf', category: 'Lebensversicherung' },
  { name: 'EUROPA Lebensversicherung Aktiengesellschaft', email: 'info@continentale.de', address: 'Piusstraße 137, 50931 Köln', category: 'Lebensversicherung' },
  { name: 'Generali Deutschland Lebensversicherung AG', email: 'service@generali.de', address: 'Adenauerring 7, 81737 München', category: 'Lebensversicherung' },
  { name: 'Gothaer Lebensversicherung Aktiengesellschaft', email: 'info@gothaer.de', address: 'Arnoldiplatz 1, 50969 Köln', category: 'Lebensversicherung' },
  { name: 'Hannoversche Lebensversicherung AG', email: 'kontakt@hannoversche-leben.de', address: 'VHV-Platz 1, 30177 Hannover', category: 'Lebensversicherung' },
  { name: 'Hallesche', email: 'service@hallesche.de', address: 'Löffelstraße 34-38, 70597 Stuttgart', category: 'Lebensversicherung' },
  { name: 'HanseMerkur Lebensversicherung AG', email: 'info@hansemerkur.de', address: 'Siegfried-Wedells-Platz 1, 20354 Hamburg', category: 'Lebensversicherung' },
  { name: 'HDI Lebensversicherung AG', email: 'leben.service@hdi.de', address: 'Charles-de-Gaulle-Platz 1, 50679 Köln', category: 'Lebensversicherung' },
  { name: 'Heidelberger Lebensversicherung AG', email: 'service@heidelberger-leben.de', address: 'Dornhofstraße 36, 63263 Neu-Isenburg', category: 'Lebensversicherung' },
  { name: 'HELVETIA schweizerische Lebensversicherungs-AG', email: 'info@helvetia.de', address: 'Weißadlergasse 2, 60311 Frankfurt am Main', category: 'Lebensversicherung' },
  { name: 'HUK-COBURG-Lebensversicherung AG', email: 'Info@HUK-COBURG.de', address: 'Bahnhofsplatz, 96450 Coburg', category: 'Lebensversicherung' },
  { name: 'IDEAL Lebensversicherung a.G.', email: 'info@ideal-versicherung.de', address: 'Kochstraße 26, 10969 Berlin', category: 'Lebensversicherung' },
  { name: 'INTER Lebensversicherung AG', email: 'info@inter.de', address: 'Erzbergerstraße 9-15, 68165 Mannheim', category: 'Lebensversicherung' },
  { name: 'InterRisk Lebensversicherungs-AG', email: 'info@interrisk.de', address: 'Carl-Bosch-Straße 5, 65203 Wiesbaden', category: 'Lebensversicherung' },
  { name: 'Itzehoer Lebensversicherungs-AG', email: 'info@itzehoer.de', address: 'Itzehoer Platz, 25521 Itzehoe', category: 'Lebensversicherung' },
  { name: 'LV 1871 a.G.', email: 'info@lv1871.de', address: 'Maximiliansplatz 5, 80333 München', category: 'Lebensversicherung' },
  { name: 'mylife Lebensversicherung AG', email: 'info@mylife-leben.de', address: 'Herzberger Landstraße 25, 37085 Göttingen', category: 'Lebensversicherung' },
  { name: 'NÜRNBERGER Lebensversicherung AG', email: 'info@nuernberger.de', address: 'Ostendstraße 100, 90482 Nürnberg', category: 'Lebensversicherung' },
  { name: 'Proxalto Lebensversicherung AG', email: 'service@proxalto-lv.de', address: 'Adenauerring 7, 81737 München', category: 'Lebensversicherung' },
  { name: 'R+V Lebensversicherung a.G.', email: 'ruv@ruv.de', address: 'Wilhelmstraße 1, 65343 Eltville', category: 'Lebensversicherung' },
  { name: 'SIGNAL IDUNA Lebensversicherung a. G.', email: 'info@signal-iduna.de', address: 'Neue Rabenstraße 15-19, 20354 Hamburg', category: 'Lebensversicherung' },
  { name: 'Stuttgarter Lebensversicherung a.G.', email: 'info@stuttgarter.de', address: 'Rotebühlstraße 120, 70197 Stuttgart', category: 'Lebensversicherung' },
  { name: 'Swiss Life Lebensversicherung SE', email: 'info@swisslife.de', address: 'Zeppelinstraße 1, 85748 Garching b. München', category: 'Lebensversicherung' },
  { name: 'WWK Lebensversicherung a.G.', email: 'info@wwk.de', address: 'Marsstraße 37, 80335 München', category: 'Lebensversicherung' },
  { name: 'Zurich Deutscher Herold Lebensversicherung AG', email: 'service@zurich.de', address: 'Deutzer Allee 1, 50679 Köln', category: 'Lebensversicherung' },
]

export function searchInsuranceCompanies(query: string, limit = 10): InsuranceCompany[] {
  if (!query || query.trim().length < 2) {
    return []
  }

  const term = query.toLowerCase()
  return insuranceCompanies
    .filter((company) => {
      return (
        company.name.toLowerCase().includes(term) ||
        company.email.toLowerCase().includes(term) ||
        (company.category?.toLowerCase().includes(term) ?? false)
      )
    })
    .slice(0, limit)
}








