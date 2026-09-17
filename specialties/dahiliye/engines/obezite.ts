/**
 * NOTYA-DAH-WOW W2.3 — Obezite kartı + TEMD obezite basamakları + GLP-1 yolu (TEMD_OBEZITE2024).
 * VKİ, bel çevresi, basamak (yaşam tarzı → farmakoterapi sınıfı → bariatrik değerlendirme SEVKİ), 3. ay %5 yanıt kontrolü,
 * ödeme onayı (özel sigorta / kurum) gerekçe metni. Doz yok; bariatrik cerrahi protokolü yok — yalnız sevk.
 */
import type { Dipnot } from './dahiliye'

export interface ObeziteGirdi {
  kiloKg: number | null; boyCm: number | null; belCm: number | null; kadin: boolean; yas: number | null
  komorbidite: { dm?: boolean; prediyabet?: boolean; ht?: boolean; dislipidemi?: boolean; osa?: boolean; masld?: boolean; osteoartrit?: boolean; kvh?: boolean }
  kiloSerisi: { kg: number; tarih: string }[]; farmakoterapiBaslangic: string | null; glp1Var: boolean; bugun: string
}
export type VkiSinif = 'zayif' | 'normal' | 'fazla_kilolu' | 'obez_1' | 'obez_2' | 'obez_3'
export interface ObeziteSonuc {
  vki: number | null; sinif: VkiSinif | null; sinifAd: string; belRiski: 'yok' | 'artmis' | 'yuksek' | null
  basamak: 'yok' | 'yasam_tarzi' | 'farmakoterapi' | 'bariatrik_degerlendirme' | null
  yanit: { degisimYuzde: number; not: string } | null
  plan: string[]; sevk: string[]; gerekceMetni: string; dipnotlar: Dipnot[]
}
const AD: Record<VkiSinif, string> = { zayif: 'Zayıf (<18,5)', normal: 'Normal (18,5–24,9)', fazla_kilolu: 'Fazla kilolu (25–29,9)', obez_1: 'Obez sınıf 1 (30–34,9)', obez_2: 'Obez sınıf 2 (35–39,9)', obez_3: 'Obez sınıf 3 (≥40)' }

export function vkiHesapla(kg: number, boyCm: number): number { return Math.round((kg / Math.pow(boyCm / 100, 2)) * 10) / 10 }
export function vkiSinif(v: number): VkiSinif { return v < 18.5 ? 'zayif' : v < 25 ? 'normal' : v < 30 ? 'fazla_kilolu' : v < 35 ? 'obez_1' : v < 40 ? 'obez_2' : 'obez_3' }

export function obeziteDegerlendir(g: ObeziteGirdi): ObeziteSonuc {
  const dip: Dipnot[] = [{ ref: 'TEMD_OBEZITE2024', not: 'VKİ ≥30 veya ≥27 + komorbidite: yaşam tarzına ek farmakoterapi; VKİ ≥40 veya ≥35 + komorbidite: metabolik/bariatrik cerrahi değerlendirmesi; 3 ayda <%5 kilo kaybı → tedaviyi yeniden değerlendir' }]
  const komorb = Object.entries(g.komorbidite).filter(([, v]) => v).map(([k]) => k)
  const komorbAd: Record<string, string> = { dm: 'diyabet', prediyabet: 'prediyabet', ht: 'hipertansiyon', dislipidemi: 'dislipidemi', osa: 'obstrüktif uyku apnesi', masld: 'yağlı karaciğer (MASLD)', osteoartrit: 'osteoartrit', kvh: 'kardiyovasküler hastalık' }
  const kg = g.kiloKg ?? g.kiloSerisi[0]?.kg ?? null
  const r: ObeziteSonuc = { vki: null, sinif: null, sinifAd: '—', belRiski: null, basamak: null, yanit: null, plan: [], sevk: [], gerekceMetni: '', dipnotlar: dip }
  if (g.belCm != null) r.belRiski = g.kadin ? (g.belCm >= 88 ? 'yuksek' : g.belCm >= 80 ? 'artmis' : 'yok') : (g.belCm >= 102 ? 'yuksek' : g.belCm >= 94 ? 'artmis' : 'yok')
  if (kg == null || g.boyCm == null) { r.plan.push('Kilo ve boy girin (VKİ)'); return r }
  const v = vkiHesapla(kg, g.boyCm); r.vki = v; r.sinif = vkiSinif(v); r.sinifAd = AD[r.sinif]
  if (v < 25) { r.basamak = 'yok'; if (r.belRiski === 'yuksek') r.plan.push('VKİ normal ama bel çevresi yüksek: abdominal obezite — yaşam tarzı + kardiyometabolik tarama'); return r }
  r.basamak = 'yasam_tarzi'
  r.plan.push('Yaşam tarzı: günlük ~500–750 kcal enerji açığı, haftada 150–300 dk orta şiddette aktivite + direnç egzersizi; hedef 6 ayda %5–10 kilo kaybı')
  if (v >= 30 || (v >= 27 && komorb.length)) { r.basamak = 'farmakoterapi'; r.plan.push(`Farmakoterapi sınıfları (hekim seçer, dozu yazar): GLP-1 RA${g.komorbidite.dm ? ' (DM varsa öncelikli)' : ''} · GIP/GLP-1 agonisti · orlistat · naltrekson/bupropion — kontrendikasyonlar hekimde`) }
  if (v >= 40 || (v >= 35 && komorb.length)) { r.basamak = 'bariatrik_degerlendirme'; r.sevk.push(`Genel cerrahi / obezite merkezi: metabolik-bariatrik cerrahi değerlendirmesi (VKİ ${v}${komorb.length ? ' + ' + komorb.map((k) => komorbAd[k]).join(', ') : ''}) — ofiste protokol yok`) }
  if (g.komorbidite.osa == null && v >= 35) r.plan.push('Horlama/gündüz uykululuk sorgula (OSA)')
  if (g.farmakoterapiBaslangic) {
    const bas = g.kiloSerisi.filter((k) => k.tarih <= g.farmakoterapiBaslangic!).sort((a, b) => b.tarih.localeCompare(a.tarih))[0] || g.kiloSerisi.slice().sort((a, b) => a.tarih.localeCompare(b.tarih))[0]
    const ucAy = new Date(Date.parse(g.farmakoterapiBaslangic) + 84 * 86400000).toISOString().slice(0, 10)
    if (bas && g.bugun >= ucAy) {
      const degisim = Math.round(((kg - bas.kg) / bas.kg) * 1000) / 10
      r.yanit = { degisimYuzde: degisim, not: degisim <= -5 ? `3. ay yanıtı yeterli (%${degisim})` : `3. ay kilo değişimi %${degisim} (<%5 kayıp): tedaviyi yeniden değerlendir — hekim` }
      r.plan.push(r.yanit.not)
    }
  }
  const ilkKilo = g.kiloSerisi.slice().sort((a, b) => a.tarih.localeCompare(b.tarih))[0]
  r.gerekceMetni = [
    'OBEZİTE FARMAKOTERAPİ GEREKÇESİ (ödeme onayı / kurum yazısı taslağı — hekim düzenler)',
    `Hasta: ${g.kadin ? 'K' : 'E'}${g.yas != null ? `, ${g.yas} yaş` : ''}. VKİ ${v} kg/m² (${AD[r.sinif]})${g.belCm != null ? `, bel çevresi ${g.belCm} cm` : ''}.`,
    `Eşlik eden hastalıklar: ${komorb.length ? komorb.map((k) => komorbAd[k]).join(', ') : 'yok'}.`,
    ilkKilo ? `Yapılandırılmış yaşam tarzı müdahalesi ${ilkKilo.tarih} tarihinden bu yana izlenmekte; kilo ${ilkKilo.kg} → ${kg} kg.` : 'Yaşam tarzı müdahalesi süresi ve kilo seyri eklenmelidir.',
    `TEMD Obezite Kılavuzu basamaklarına göre ${r.basamak === 'yasam_tarzi' ? 'farmakoterapi eşiği karşılanmamaktadır' : 'farmakoterapi endikasyonu mevcuttur'}. Etken madde ve doz hekim tarafından belirlenir.`,
    'Not: Obezite endikasyonunda SGK geri ödeme kapsamı hekim tarafından güncel SUT ile doğrulanır; kapsam dışı ise kendi ödemeli.',
  ].join('\n')
  dip.push({ ref: 'SGK', not: 'Obezite farmakoterapisinde geri ödeme kapsamı güncel SUT ile doğrulanır' })
  return r
}
