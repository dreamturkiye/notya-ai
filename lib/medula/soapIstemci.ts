/**
 * NOTYA-MEDULA P3 — SGK Medula e-Reçete SOAP istemcisi (UYUYAN — MEDULA_ORTAM tanımlı değilse çalışmaz).
 *
 * Kılavuz v1.122: HTTP Basic Auth (hekim kullanıcı adı/şifre her istekte), SOAP 1.1,
 * ns http://servisler.ws.eczane.gss.sgk.gov.tr. Test ortamı sgkt.sgk.gov.tr kamuya açık test
 * kimlikleriyle (99999999990) çağrılabilir — sözleşmeyi doktor olmadan doğrulamak için.
 *
 * Gerçek ortamda 2016'dan beri yalnız imzalı metotlar kabul edilir (XAdES-BES enveloping,
 * RSA-SHA256, NES). İmza doktorun cihazında/mobil imzasında atılır; bu sunucu imzalamaz —
 * imzaliEreceteGiris yalnız hazır imzalı byte[] alır ve iletir.
 */
import { SOAP_NS, TEST_ORTAMI, GERCEK_ORTAM } from './tipler'
import type { MedulaEreceteBilgisi } from './tipler'

export type MedulaOrtam = 'test' | 'gercek'
export interface MedulaKimlik { kullanici: string; sifre: string; tesisKodu: number; doktorTc: number }
export interface MedulaSonuc { sonucKodu: string; sonucMesaji: string; uyariMesaji?: string; ereceteNo?: string; hamXml: string }

export function medulaOrtami(): MedulaOrtam | null {
  const o = process.env.MEDULA_ORTAM
  return o === 'test' || o === 'gercek' ? o : null
}

function wsAdresi(ortam: MedulaOrtam): string {
  return ortam === 'test' ? TEST_ORTAMI.receteWs : GERCEK_ORTAM.receteWs
}

function x(s: string | number | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** İmzasız ereceteGiris DVO gövdesi — alan sırası xsd2'deki xs:sequence ile birebir (2026-09-09, test WSDL). */
function ereceteDvoXml(e: MedulaEreceteBilgisi, kimlik: MedulaKimlik): string {
  const ilaclar = e.ereceteIlacBilgisi.map((i) => `<ereceteIlacListesi><adet>${i.adet}</adet><barkod>${i.barkod ?? 0}</barkod><ilacAdi>${x(i.ilacAdi)}</ilacAdi><kullanimDoz1>${i.kullanimDoz1}</kullanimDoz1><kullanimPeriyotBirimi>${i.kullanimPeriyotBirimi}</kullanimPeriyotBirimi><kullanimSekli>${i.kullanimSekli}</kullanimSekli><kullanimDoz2>${i.kullanimDoz2}</kullanimDoz2><kullanimPeriyot>${i.kullanimPeriyot}</kullanimPeriyot></ereceteIlacListesi>`).join('')
  const tanilar = e.ereceteTaniBilgisi.map((t) => `<ereceteTaniListesi><taniKodu>${x(t.taniKodu)}</taniKodu></ereceteTaniListesi>`).join('')
  return `<ereceteDVO><protokolNo>${x(e.protokolNo)}</protokolNo><provizyonTipi>${e.provizyonTipi}</provizyonTipi><receteAltTuru>${e.receteAltTuru}</receteAltTuru><receteTarihi>${x(e.receteTarihi)}</receteTarihi><receteTuru>${e.receteTuru}</receteTuru>${e.takipNo ? `<takipNo>${x(e.takipNo)}</takipNo>` : ''}<tcKimlikNo>${e.tcKimlikNo ?? 0}</tcKimlikNo><tesisKodu>${kimlik.tesisKodu}</tesisKodu><doktorBransKodu>${e.doktorBransKodu ?? 0}</doktorBransKodu><doktorSertifikaKodu>${e.doktorSertifikaKodu}</doktorSertifikaKodu><kisiDVO>${e.kisiBilgisi.adi ? `<adi>${x(e.kisiBilgisi.adi)}</adi>` : ''}${e.kisiBilgisi.cinsiyeti ? `<cinsiyeti>${e.kisiBilgisi.cinsiyeti}</cinsiyeti>` : ''}${e.kisiBilgisi.dogumTarihi ? `<dogumTarihi>${x(e.kisiBilgisi.dogumTarihi)}</dogumTarihi>` : ''}${e.kisiBilgisi.soyadi ? `<soyadi>${x(e.kisiBilgisi.soyadi)}</soyadi>` : ''}<tcKimlikNo>${e.tcKimlikNo ?? 0}</tcKimlikNo></kisiDVO>${ilaclar}${tanilar}<doktorAdi>${x(e.doktorAdi)}</doktorAdi><doktorSoyadi>${x(e.doktorSoyadi)}</doktorSoyadi><doktorTcKimlikNo>${kimlik.doktorTc}</doktorTcKimlikNo></ereceteDVO>`
}

function zarf(metod: string, govde: string, kimlik?: MedulaKimlik): string {
  // Kılavuz 1.36/1.37 (2014): erişim yöntemi ws-security. HTTP Basic ile birlikte WSSE UsernameToken da gönderilir.
  const wsse = kimlik
    ? `<wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><wsse:UsernameToken><wsse:Username>${x(kimlik.kullanici)}</wsse:Username><wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${x(kimlik.sifre)}</wsse:Password></wsse:UsernameToken></wsse:Security>`
    : ''
  return `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="${SOAP_NS}"><soapenv:Header>${wsse}</soapenv:Header><soapenv:Body><ser:${metod}>${govde}</ser:${metod}></soapenv:Body></soapenv:Envelope>`
}

function sonucCoz(xml: string): MedulaSonuc {
  const al = (ad: string) => (xml.match(new RegExp(`<(?:[a-zA-Z0-9]+:)?${ad}>([\\s\\S]*?)</(?:[a-zA-Z0-9]+:)?${ad}>`)) || [])[1]?.trim()
  const fault = al('faultstring')
  return {
    sonucKodu: al('sonucKodu') ?? (fault ? 'SOAP_FAULT' : 'PARSE'),
    sonucMesaji: al('sonucMesaji') ?? fault ?? 'Cevap çözümlenemedi',
    uyariMesaji: al('uyariMesaji'),
    ereceteNo: al('ereceteNo'),
    hamXml: xml.slice(0, 4000),
  }
}

async function soapCagir(ortam: MedulaOrtam, kimlik: MedulaKimlik, metod: string, govde: string): Promise<MedulaSonuc> {
  const res = await fetch(wsAdresi(ortam), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: '',
      Authorization: `Basic ${Buffer.from(`${kimlik.kullanici}:${kimlik.sifre}`).toString('base64')}`,
    },
    body: zarf(metod, govde, kimlik),
    cache: 'no-store',
  })
  const xml = await res.text()
  const s = sonucCoz(xml)
  if (!res.ok && s.sonucKodu === 'PARSE') s.sonucMesaji = `HTTP ${res.status}: ${xml.slice(0, 200)}`
  return s
}

/** İmzasız giriş — yalnız TEST ortamı sözleşme doğrulaması için (gerçekte SGK imza ister). JAX-WS sarmalayıcı: arg0. */
export function ereceteGiris(ortam: MedulaOrtam, kimlik: MedulaKimlik, e: MedulaEreceteBilgisi): Promise<MedulaSonuc> {
  return soapCagir(ortam, kimlik, 'ereceteGiris', `<arg0>${ereceteDvoXml(e, kimlik)}<tesisKodu>${kimlik.tesisKodu}</tesisKodu><doktorTcKimlikNo>${kimlik.doktorTc}</doktorTcKimlikNo></arg0>`)
}

export function ereceteSorgula(ortam: MedulaOrtam, kimlik: MedulaKimlik, ereceteNo: string): Promise<MedulaSonuc> {
  return soapCagir(ortam, kimlik, 'ereceteSorgula', `<arg0><tesisKodu>${kimlik.tesisKodu}</tesisKodu><ereceteNo>${x(ereceteNo)}</ereceteNo><doktorTcKimlikNo>${kimlik.doktorTc}</doktorTcKimlikNo></arg0>`)
}

/** İmzalı giriş — imzaliRecete: doktorun cihazında XAdES-BES ile imzalanmış erecete.s1.xsd XML'i (base64). */
export function imzaliEreceteGiris(ortam: MedulaOrtam, kimlik: MedulaKimlik, imzaliReceteBase64: string): Promise<MedulaSonuc> {
  return soapCagir(ortam, kimlik, 'imzaliEreceteGiris', `<arg0><tesisKodu>${kimlik.tesisKodu}</tesisKodu><doktorTcKimlikNo>${kimlik.doktorTc}</doktorTcKimlikNo><imzaliRecete>${imzaliReceteBase64}</imzaliRecete><surumNumarasi>1</surumNumarasi></arg0>`)
}
