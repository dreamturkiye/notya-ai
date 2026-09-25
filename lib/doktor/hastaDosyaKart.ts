/**
 * Per-patient fact card — basic doctor questions answered from this dossier only.
 * The LLM must not invent a drug, allergy, date or count that is not here.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export interface HastaDosyaKart {
  yas: string
  cinsiyet: string
  alerji: string
  kronik: string
  kanGrubu: string
  ilaclar: string
  sonVizit: string
  sonSikayet: string
  sonTani: string
  /** NOTYA-SES-KART-01: last visit examination findings and plan / follow-up (voice card). */
  sonBulgu: string
  sonPlan: string
  sonRecete: string
  asilar: string
  olcum: string
  lab: string
  randevu: string
  vizitSayisi: number
  vizitAralik: string
}

const BOS = new Set([
  '',
  'kayıt yok',
  'kayıtlı değil',
  'kayıtlı ilaç yok',
  'kayıtlı aşı yok',
  'onaylı lab yok',
  'randevu yok',
])

export function kartBosMu(v: string | null | undefined): boolean {
  return BOS.has(String(v || '').trim())
}

export function bosKart(): HastaDosyaKart {
  return {
    yas: 'kayıtlı değil',
    cinsiyet: '',
    alerji: 'kayıt yok',
    kronik: 'kayıt yok',
    kanGrubu: 'kayıt yok',
    ilaclar: 'kayıtlı ilaç yok',
    sonVizit: 'kayıt yok',
    sonSikayet: 'kayıt yok',
    sonTani: 'kayıt yok',
    sonBulgu: '',
    sonPlan: '',
    sonRecete: 'kayıt yok',
    asilar: 'kayıtlı aşı yok',
    olcum: 'kayıt yok',
    lab: 'onaylı lab yok',
    randevu: 'randevu yok',
    vizitSayisi: 0,
    vizitAralik: '',
  }
}

export function kartMetin(k: HastaDosyaKart): string {
  return [
    '## HIZLI KART (yalnız bu dosya — uydurma yasak)',
    `- Yaş: ${k.yas}`,
    k.cinsiyet ? `- Cinsiyet: ${k.cinsiyet}` : '',
    `- Alerji: ${k.alerji}`,
    `- Kronik hastalık: ${k.kronik}`,
    `- Kan grubu: ${k.kanGrubu}`,
    `- Sürekli ilaç: ${k.ilaclar}`,
    `- Vizit: ${k.vizitSayisi}${k.vizitAralik ? ` (${k.vizitAralik})` : ''}`,
    `- Son vizit: ${k.sonVizit}`,
    `- Son şikayet: ${k.sonSikayet}`,
    `- Son tanı: ${k.sonTani}`,
    `- Son reçete: ${k.sonRecete}`,
    `- Aşı (son): ${k.asilar}`,
    `- Son ölçüm: ${k.olcum}`,
    `- Son onaylı lab: ${k.lab}`,
    `- Sonraki randevu: ${k.randevu}`,
  ].filter(Boolean).join('\n')
}

/** Spoken card when the doctor opens the file without a specific question. */
export function kartSoyle(k: HastaDosyaKart): string {
  const p: string[] = []
  if (!kartBosMu(k.yas)) p.push(k.yas)
  if (k.cinsiyet) p.push(k.cinsiyet)
  p.push(`alerji ${k.alerji}`)
  if (!kartBosMu(k.kronik)) p.push(`kronik ${k.kronik}`)
  if (!kartBosMu(k.kanGrubu)) p.push(`kan grubu ${k.kanGrubu}`)
  if (!kartBosMu(k.ilaclar)) p.push(`aktif ilaç ${k.ilaclar}`)
  if (!kartBosMu(k.sonVizit)) p.push(`son vizit ${k.sonVizit}`)
  if (!kartBosMu(k.sonSikayet)) p.push(`şikayet ${k.sonSikayet}`)
  if (!kartBosMu(k.sonTani)) p.push(`son tanı ${k.sonTani}`)
  if (!kartBosMu(k.sonBulgu)) p.push(`muayene bulgusu ${k.sonBulgu}`)
  if (!kartBosMu(k.sonRecete)) p.push(`son reçete ${k.sonRecete}`)
  if (!kartBosMu(k.sonPlan)) p.push(`plan ve takip ${k.sonPlan}`)
  if (!kartBosMu(k.asilar)) p.push(`aşı ${k.asilar}`)
  if (!kartBosMu(k.olcum)) p.push(`ölçüm ${k.olcum}`)
  if (!kartBosMu(k.lab)) p.push(`lab ${k.lab}`)
  if (!kartBosMu(k.randevu)) p.push(`randevu ${k.randevu}`)
  if (k.vizitSayisi) p.push(`${k.vizitSayisi} vizit`)
  return `Dosyadan: ${p.join('. ')}.`
}

const PRATIK = /en fazla (?:yazdim|yaptim|koydum)|en cok yazdigim|en sik (?:tani|sikayet|antibiyoti|ilac)/

/** Deterministic answer for a spoken/written question about THIS patient. */
export function dosyaSoruCevap(soru: string, k: HastaDosyaKart): string | null {
  const n = trAramaNormalize(soru)
  if (!n.trim()) return null
  if (PRATIK.test(n) && !/bu hasta|hastanin|hastaya|hastanin dosya/.test(n)) return null

  const bulunan: string[] = []
  const ekle = (baslik: string, deger: string) => {
    const satir = `Dosyada ${baslik}: ${deger}`
    if (!bulunan.includes(satir)) bulunan.push(satir)
  }

  if (/alerji/.test(n)) ekle('alerji', k.alerji)
  if (/kan grubu|kangrubu/.test(n)) ekle('kan grubu', k.kanGrubu)
  if (/kronik|ozgecmis/.test(n)) ekle('kronik hastalık', k.kronik)
  if (/cinsiyet|kiz mi|erkek mi/.test(n)) ekle('cinsiyet', k.cinsiyet || 'kayıt yok')
  if (/kac yas|yasi kac|kac yasinda|yasi nedir/.test(n)) ekle('yaş', k.yas)
  if (/kac(?:inci)? (?:vizit|ziyaret)|kac kez geldi|kac kere geldi|kac defa geldi|toplam vizit/.test(n)) {
    ekle('vizit sayısı', `${k.vizitSayisi}${k.vizitAralik ? ` — ${k.vizitAralik}` : ''}`)
  }
  if (/son vizit|en son (?:ne zaman )?gel|son muayene|son gelis/.test(n)) ekle('son vizit', k.sonVizit)
  if (/neden geldi|son sikayet|sikayeti ne|basvuru/.test(n)) ekle('son şikayet', k.sonSikayet)
  if (/son tani|son teshis|tanisi ne|ne tanisi/.test(n)) ekle('son tanı', k.sonTani)
  if (/son recete|son ilac|ne yazdin|ne yazdik|hangi ilac(?:i)? yaz|hangi antibiyoti/.test(n)) {
    ekle('son reçete', k.sonRecete)
  }
  if (/\basi/.test(n) && !/antibiyoti/.test(n)) ekle('aşı', k.asilar)
  if (/surekli ilac|ne kullaniyor|ilaclari ne|aktif ilac/.test(n)) ekle('aktif ilaç', k.ilaclar)
  // NOTYA-SES-KART-01 (Dr. Gökhan): kontrol / takip soruları son muayenenin planından cevaplanır.
  if (/kontrol|takip|plan|ne zaman gel|tekrar gel/.test(n)) ekle('plan ve takip', k.sonPlan)
  if (/muayene bulgu|fizik muayene|dinleme|bulgular/.test(n)) ekle('muayene bulgusu', k.sonBulgu)
  if (/randevu|siradaki kontrol|gelecek kontrol|ne zaman gelecek/.test(n)) ekle('randevu', k.randevu)
  if (/hba1c|egfr|tahlil|laboratuvar|\blab\b|kan sayimi|son onayli lab/.test(n)) ekle('onaylı lab', k.lab)
  if (/ates|kilo|tansiyon|nabiz|spo2|olcum|vital/.test(n)) ekle('son ölçüm', k.olcum)

  if (!bulunan.length) return null
  return `${bulunan.join('. ')}.`
}
