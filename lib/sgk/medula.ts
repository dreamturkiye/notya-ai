// SGK Medula SOAP Web Services Connector
// Endpoint: https://medula.sgk.gov.tr/MedulaDoktorWS/
// Protocol: SOAP 1.1 over HTTPS
// Auth: Hekim TC + SGK Kurumsal Sifre + Tesis Kodu
// Docs: medeczane.sgk.gov.tr/doktor/

export const SGK_MEDULA_BASE = 'https://medula.sgk.gov.tr/MedulaDoktorWS'
export const SGK_ECZANE_BASE  = 'https://medeczane.sgk.gov.tr/eczane'

export interface SgkCredentials {
  hekimTc: string
  sifre: string
  tesiKodu?: string
  hekimSicilNo?: string
}

export interface ProvizionRequest {
  hastaTc: string
  tesiKodu: string
  hekimTc: string
  sifre: string
}

export interface EReceteRequest {
  hastaTc: string
  hekimTc: string
  sifre: string
  tesiKodu: string
  ilaclar: Array<{
    barkod: string
    kutu: number
    kullanimSekli: string
  }>
  tani: { icd10Kodu: string; aciklama: string }
}

// Build SOAP envelope for Medula provizyon
export function buildProvizionSOAP(req: ProvizionRequest): string {
  return `<?xml version='1.0' encoding='UTF-8'?>
    <soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/'
      xmlns:med='http://medula.sgk.gov.tr/'>
      <soapenv:Header/>
      <soapenv:Body>
        <med:medulaProvizyon>
          <hekimTC>${req.hekimTc}</hekimTC>
          <sifre>${req.sifre}</sifre>
          <tesiKodu>${req.tesiKodu}</tesiKodu>
          <hastaTc>${req.hastaTc}</hastaTc>
        </med:medulaProvizyon>
      </soapenv:Body>
    </soapenv:Envelope>
  `
}

// Send SOAP request to Medula
export async function callMedulaSOAP(endpoint: string, soapBody: string, action: string) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': action,
    },
    body: soapBody,
  })
  if (!response.ok) throw new Error(`SGK SOAP error: ${response.status}`)
  return response.text()
}

// Parse Medula XML response
export function parseMedulaResponse(xml: string): Record<string, string> {
  const result: Record<string, string> = {}
  const matches = xml.matchAll(/<([\w]+)>([^<]+)<\/>/g)
  for (const m of matches) result[m[1]] = m[2]
  return result
}

// SGK Uyum Kontrol - validate drug+diagnosis combo
export async function sgkUyumKontrol(ilacBarkod: string, icd10: string): Promise<{ok: boolean; mesaj: string}> {
  // Real: calls SGK rule engine via Medula webservice
  // Demo: basic rule simulation
  const blockedCombos: Record<string, string[]> = {
    'Z00': ['tramadol', 'morfin'],    // Routine checkup - no opioids
    'J00': ['antibiyotik-genis'],     // Common cold - no broad spectrum
  }
  const prefix = icd10.substring(0, 3)
  const blocked = blockedCombos[prefix] || []
  const ilacLower = ilacBarkod.toLowerCase()
  if (blocked.some(b => ilacLower.includes(b))) {
    return { ok: false, mesaj: 'SGK bu tani icin bu ilaci desteklememektedir' }
  }
  return { ok: true, mesaj: 'SGK uyumlu' }
}
