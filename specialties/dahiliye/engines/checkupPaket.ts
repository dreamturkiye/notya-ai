/**
 * NOTYA-DAH-WOW W3.8 — Check-up paket defteri (KENDİ ÖDEMELİ; SGK'ya fatura edilmez) + birleşik rapor.
 * Paket SKU'ları yaş/cinsiyete göre; kalemler onaylı lab (canonical_key) veya belge (belge_analizleri.modality_final) ile
 * paket tarihinden SONRA gelen sonuçla "tamam" sayılır; tarama kalemleri (FRAIL + düşme) dahiliye_taramalar'daki kayıtla, paket
 * tarihinden en çok 12 ay önce yapılmışsa da (yıllık tarama aralığı, nudge.ts) "tamam" sayılır; hekim elle işaretleyebilir. Birleşik rapor: onaylı lab + onaylı belge
 * özetleri + kartların hekim kilitli özetleri. Rapor hekim kilidi olmadan "taslak" damgalı.
 */
import type { Dipnot } from './dahiliye'

export interface PaketKalem { kod: string; ad: string; keys?: string[]; belge?: string; tarama?: ('frail' | 'dusme' | 'phq2')[]; opsiyonel?: boolean; not?: string }
export interface PaketSku { sku: string; ad: string; uygun: (yas: number | null, kadin: boolean) => boolean; kalemler: PaketKalem[] }

const TEMEL: PaketKalem[] = [
  { kod: 'hemogram', ad: 'Hemogram', keys: ['Hb', 'WBC', 'Plt'] }, { kod: 'glukoz', ad: 'Açlık glukoz', keys: ['Glu'] }, { kod: 'lipid', ad: 'Lipid paneli', keys: ['TChol', 'LDL', 'HDL', 'TG'] },
  { kod: 'bobrek', ad: 'Kreatinin + eGFR', keys: ['Kre', 'eGFR'] }, { kod: 'karaciger', ad: 'ALT / AST', keys: ['ALT', 'AST'] }, { kod: 'tsh', ad: 'TSH', keys: ['TSH'] }, { kod: 'idrar', ad: 'Tam idrar', keys: ['UA_protein', 'UA_glu', 'UA_blood'] },
]
const KAPSAMLI: PaketKalem[] = [
  ...TEMEL, { kod: 'hba1c', ad: 'HbA1c', keys: ['HbA1c'] }, { kod: 'elektrolit', ad: 'Na / K', keys: ['Na', 'K'] }, { kod: 'urik', ad: 'Ürik asit', keys: ['Uric'] }, { kod: 'b12', ad: 'Vitamin B12', keys: ['B12'] }, { kod: 'vitd', ad: 'D vitamini', keys: ['VitD'], opsiyonel: true },
  { kod: 'ekg', ad: 'EKG', belge: 'ekg' }, { kod: 'batin_us', ad: 'Batın ultrasonu', belge: 'us', opsiyonel: true }, { kod: 'akciger', ad: 'Akciğer grafisi', belge: 'xray', opsiyonel: true },
]
export const PAKETLER: PaketSku[] = [
  { sku: 'temel', ad: 'Temel check-up (18–39)', uygun: (y) => y != null && y >= 18 && y < 40, kalemler: TEMEL },
  { sku: 'kapsamli', ad: 'Kapsamlı check-up (40+)', uygun: (y) => y != null && y >= 40, kalemler: KAPSAMLI },
  { sku: 'kadin40', ad: 'Kadın check-up (40+)', uygun: (y, k) => k && y != null && y >= 40, kalemler: [...KAPSAMLI, { kod: 'mamografi', ad: 'Mamografi', belge: 'mamografi', not: 'KETEM\'de 40–69 ücretsiz alternatif' }, { kod: 'hpv', ad: 'HPV-DNA / smear', not: 'jine / KETEM 30–65; elle işaretle', opsiyonel: true }] },
  { sku: 'erkek50', ad: 'Erkek check-up (50+)', uygun: (y, k) => !k && y != null && y >= 50, kalemler: [...KAPSAMLI, { kod: 'ggk', ad: 'Gaitada gizli kan', not: 'KETEM ücretsiz; elle işaretle' }, { kod: 'psa', ad: 'PSA', keys: ['PSA'], opsiyonel: true, not: 'yarar/zarar paylaşılmış karar sonrası' }] },
  { sku: 'ileri65', ad: 'İleri yaş check-up (65+)', uygun: (y) => y != null && y >= 65, kalemler: [...KAPSAMLI, { kod: 'dxa', ad: 'DXA (kadın ≥65 / risk)', not: 'TEMD Osteoporoz; elle işaretle', opsiyonel: true }, { kod: 'kirilganlik', ad: 'Kırılganlık + düşme taraması', tarama: ['frail', 'dusme'], not: 'Bakım kalitesi › FRAIL + düşme taraması' }, { kod: 'isitme_gorme', ad: 'İşitme / görme sorgusu', not: 'elle işaretle' }] },
]
export const CHECKUP_DIPNOT: Dipnot[] = [{ ref: 'TIHUD2023', not: 'Check-up içeriği yaş/cinsiyet ve risk faktörüne göre; kanser taramaları ulusal program (KETEM) ile hizalı' }, { ref: 'SGK', not: 'Check-up paketleri kendi ödemelidir; SGK\'ya fatura edilmez' }]

function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

export function uygunPaketler(yas: number | null, kadin: boolean): PaketSku[] { return PAKETLER.filter((p) => p.uygun(yas, kadin)) }

export interface KalemDurum { kod: string; ad: string; tamam: boolean; kaynak: 'lab' | 'belge' | 'tarama' | 'hekim' | null; tarih: string | null; opsiyonel: boolean; not?: string }
export function paketDurumu(p: { sku: string; tarih: string; manuelTamam: string[] }, labTarihleri: Record<string, string[]>, belgeTarihleri: Record<string, string[]>, taramaTarihleri: Record<string, string[]> = {}): { kalemler: KalemDurum[]; tamamlanan: number; zorunluToplam: number; bitti: boolean } {
  const sku = PAKETLER.find((x) => x.sku === p.sku)
  const kalemler: KalemDurum[] = (sku?.kalemler || []).map((k) => {
    if (p.manuelTamam.includes(k.kod)) return { kod: k.kod, ad: k.ad, tamam: true, kaynak: 'hekim', tarih: null, opsiyonel: !!k.opsiyonel, not: k.not }
    if (k.keys?.length) { const t = k.keys.flatMap((key) => labTarihleri[key] || []).filter((x) => x >= p.tarih).sort()[0] || null; return { kod: k.kod, ad: k.ad, tamam: !!t, kaynak: t ? 'lab' : null, tarih: t, opsiyonel: !!k.opsiyonel, not: k.not } }
    if (k.belge) { const t = (belgeTarihleri[k.belge] || []).filter((x) => x >= p.tarih).sort()[0] || null; return { kod: k.kod, ad: k.ad, tamam: !!t, kaynak: t ? 'belge' : null, tarih: t, opsiyonel: !!k.opsiyonel, not: k.not } }
    if (k.tarama?.length) {
      // Her tarama tipinin paket tarihinden ≤12 ay önce veya sonra kaydı olmalı; kalem tarihi = en geç gelen tipin ilk uygun kaydı.
      const alt = ekleAy(p.tarih, -12)
      const ilk = k.tarama.map((tip) => (taramaTarihleri[tip] || []).filter((x) => x >= alt).sort()[0] || null)
      const t = ilk.every(Boolean) ? (ilk as string[]).sort().at(-1)! : null
      return { kod: k.kod, ad: k.ad, tamam: !!t, kaynak: t ? 'tarama' : null, tarih: t, opsiyonel: !!k.opsiyonel, not: k.not }
    }
    return { kod: k.kod, ad: k.ad, tamam: false, kaynak: null, tarih: null, opsiyonel: !!k.opsiyonel, not: k.not }
  })
  const zorunlu = kalemler.filter((k) => !k.opsiyonel)
  const tamamlanan = zorunlu.filter((k) => k.tamam).length
  return { kalemler, tamamlanan, zorunluToplam: zorunlu.length, bitti: zorunlu.length > 0 && tamamlanan === zorunlu.length }
}

export interface RaporBolum { baslik: string; satirlar: string[] }
export function birlesikRapor(g: { hasta: { adSoyad: string; yas: number | null; kadin: boolean }; paketAd: string; paketTarih: string; labs: { ad: string; deger: string; tarih: string }[]; belgeler: { tur: string; tarih: string; ozet: string }[]; kartOzetleri: { kart: string; satir: string }[]; eksikKalemler: string[]; hekimKilitli: boolean; bugun: string }): { bolumler: RaporBolum[]; taslak: boolean } {
  const b: RaporBolum[] = []
  b.push({ baslik: 'Check-up birleşik raporu', satirlar: [`${g.hasta.adSoyad} · ${g.hasta.kadin ? 'K' : 'E'}${g.hasta.yas != null ? ` · ${g.hasta.yas} yaş` : ''}`, `Paket: ${g.paketAd} (${g.paketTarih}) · kendi ödemeli — SGK'ya fatura edilmez`, `Rapor tarihi: ${g.bugun}${g.hekimKilitli ? ' · hekim onaylı' : ' · TASLAK (hekim onayı bekliyor)'}`] })
  b.push({ baslik: 'Laboratuvar (yalnız onaylı sonuçlar)', satirlar: g.labs.length ? g.labs.map((l) => `${l.ad}: ${l.deger} (${l.tarih})`) : ['Onaylı lab sonucu yok'] })
  b.push({ baslik: 'Görüntüleme / EKG (onaylı belge raporları)', satirlar: g.belgeler.length ? g.belgeler.map((x) => `${x.tur} (${x.tarih}): ${x.ozet}`) : ['Onaylı belge raporu yok'] })
  b.push({ baslik: 'Kronik kart özetleri (hekim kilitli)', satirlar: g.kartOzetleri.length ? g.kartOzetleri.map((k) => `${k.kart}: ${k.satir}`) : ['Kilitli kart değeri yok'] })
  if (g.eksikKalemler.length) b.push({ baslik: 'Tamamlanmamış kalemler', satirlar: g.eksikKalemler })
  return { bolumler: b, taslak: !g.hekimKilitli }
}
