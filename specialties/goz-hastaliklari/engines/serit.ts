/**
 * GOZ-CHAPTER — Vizit şeridi (hasta dosyası › Göz'ün üstünde yapışkan) + intake → Subjektif taslağı. Pure.
 * Şerit: son VA (OD/OS, en iyi uzak) + Δ harf, son GİB (OD/OS) + hedef, DR evresi, sıradaki enjeksiyon, geciken görev, acil bayrak.
 * Intake: bransSorulari 'goz-hastaliklari' yanıtlarından Subjektif taslağı + kart ipuçları (dahiliye anket dersi) — hekim ekler.
 */
import { enIyiUzak, harfFarki, vaGoster, type VaSeti } from './va'
import { EVRE_ADI, type DrEvre } from './dr'
import { acilTara, type AcilBayrak } from './acil'

export interface SeritMuayene { tarih: string; va: { sag?: VaSeti; sol?: VaSeti }; gibSag: number | null; gibSol: number | null }
export interface GozSerit {
  va: { sag: string; sol: string; harfSag: number | null; harfSol: number | null; tarih: string | null }
  gib: { sag: number | null; sol: number | null; hedefSag: number | null; hedefSol: number | null; ustSag: boolean; ustSol: boolean }
  drEvre: string | null
  sonrakiEnjeksiyon: string | null
  gecikenGorev: number
  acil: AcilBayrak[]
  bugunOlcumVar: boolean
}

export function gozSeridi(g: { muayeneler: SeritMuayene[]; hedefSag: number | null; hedefSol: number | null; evreSag: DrEvre | null; evreSol: DrEvre | null; sonrakiEnjeksiyon: string | null; gorevDue: (string | null)[]; sikayetMetinleri: string[]; bugun: string }): GozSerit {
  const m = [...g.muayeneler].sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
  const son = m[0], onceki = m[1]
  const vaSag = enIyiUzak(son?.va.sag), vaSol = enIyiUzak(son?.va.sol)
  const sonGib = (k: 'gibSag' | 'gibSol') => m.find((x) => x[k] != null)?.[k] ?? null
  const gs = sonGib('gibSag'), gl = sonGib('gibSol')
  const evre = [g.evreSag ? `OD ${EVRE_ADI[g.evreSag]}` : null, g.evreSol ? `OS ${EVRE_ADI[g.evreSol]}` : null].filter(Boolean).join(' · ') || null
  return {
    va: { sag: vaGoster(vaSag), sol: vaGoster(vaSol), harfSag: onceki ? harfFarki(enIyiUzak(onceki.va.sag), vaSag) : null, harfSol: onceki ? harfFarki(enIyiUzak(onceki.va.sol), vaSol) : null, tarih: son?.tarih ?? null },
    gib: { sag: gs, sol: gl, hedefSag: g.hedefSag, hedefSol: g.hedefSol, ustSag: gs != null && g.hedefSag != null && gs > g.hedefSag, ustSol: gl != null && g.hedefSol != null && gl > g.hedefSol },
    drEvre: evre,
    sonrakiEnjeksiyon: g.sonrakiEnjeksiyon,
    gecikenGorev: g.gorevDue.filter((d) => d && d < g.bugun).length,
    acil: acilTara(g.sikayetMetinleri),
    bugunOlcumVar: son?.tarih === g.bugun,
  }
}

type Yanit = Record<string, unknown>
const liste = (v: unknown) => (Array.isArray(v) ? v.map(String).filter((x) => x && x !== 'Yok') : [])
const metin = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Intake (Göz Sağlığınız) → Subjektif taslağı + kart ipuçları. Tanı üretmez; hasta beyanı olarak yazar. */
export function intakeSubjektif(y: Yanit): { subjektif: string; ipuclari: { kart: 'glokom' | 'dr' | 'enjeksiyon' | 'katarakt' | 'on_segment' | 'pediatrik'; neden: string }[]; acil: AcilBayrak[] } {
  const satir: string[] = []
  const neden = metin(y.basvuruNedeni); if (neden) satir.push(`Başvuru nedeni (hasta beyanı): ${neden}`)
  const sik = liste(y.mevcutGozSikayetleri); if (sik.length) satir.push(`Şikâyetler: ${sik.join(', ')}`)
  const bul = metin(y.bulanikGormeSikligi); if (bul && bul !== 'Yok') satir.push(`Bulanık görme: ${bul.toLocaleLowerCase('tr-TR')}`)
  const mes = metin(y.gormeZorluguMesafe); if (mes && mes !== 'Belirgin değil') satir.push(`Zorluk mesafesi: ${mes.toLocaleLowerCase('tr-TR')}`)
  const ek = metin(y.ekGozSikayetleri); if (ek) satir.push(`Ek açıklama: ${ek}`)
  const gozluk = metin(y.gozlukKullanimi), kl = metin(y.kontaktLensKullanimi)
  if (gozluk) satir.push(`Gözlük: ${gozluk.toLocaleLowerCase('tr-TR')}`)
  if (kl && kl !== 'Hayır') satir.push(`Kontakt lens: ${kl.toLocaleLowerCase('tr-TR')}`)
  const bilinen = liste(y.bilinenGozHastaliklari); if (bilinen.length) satir.push(`Bilinen göz hastalıkları (beyan): ${bilinen.join(', ')}`)
  const kronik = liste(y.kronikRahatsizliklarGoz); if (kronik.length) satir.push(`Sistemik: ${kronik.join(', ')}`)
  const op = liste(y.oncekiGozOperasyonlari); if (op.length) satir.push(`Önceki göz işlemleri: ${op.join(', ')}`)
  const aile = liste(y.aileGozHastaligiOykusu).filter((x) => x !== 'Bilinmiyor'); if (aile.length) satir.push(`Aile öyküsü: ${aile.join(', ')}`)

  const ipuclari: ReturnType<typeof intakeSubjektif>['ipuclari'] = []
  if (bilinen.includes('Glokom') || aile.includes('Glokom')) ipuclari.push({ kart: 'glokom', neden: bilinen.includes('Glokom') ? 'Glokom beyanı' : 'Ailede glokom' })
  if (kronik.includes('Diyabet')) ipuclari.push({ kart: 'dr', neden: 'Diyabet beyanı — retinopati taraması' })
  if (op.includes('Göz İçi Enjeksiyon')) ipuclari.push({ kart: 'enjeksiyon', neden: 'Önceki göz içi enjeksiyon' })
  if (bilinen.includes('Katarakt')) ipuclari.push({ kart: 'katarakt', neden: 'Katarakt beyanı' })
  if (sik.includes('Göz Kuruluğu') || bilinen.includes('Göz Kuruluğu') || (kl && kl !== 'Hayır') || sik.includes('Kaşıntı')) ipuclari.push({ kart: 'on_segment', neden: 'Kuru göz / kontakt lens / kaşıntı' })
  return { subjektif: satir.join('\n'), ipuclari, acil: acilTara([neden, ek, sik.join(' ')]) }
}
