/**
 * NOTYA-DAH-WOW W3.6 — Tiroid nodül tarifi (ACR TI-RADS tarzı puanlama) + izlem görevleri.
 * US belgesi Belgeler'e yüklenir; hekim bileşenleri işaretler. İİAB / ablasyon / cerrahi = endokrin SEVKİ (girişim ofiste yok).
 * Eşikler: TR3 İİAB ≥2,5 cm / izlem ≥1,5 · TR4 İİAB ≥1,5 / izlem ≥1,0 · TR5 İİAB ≥1,0 / izlem ≥0,5.
 */
import type { Dipnot } from './dahiliye'

export interface NodulGirdi {
  bilesim: 'kistik' | 'sungerimsi' | 'mikst' | 'solid'
  ekojenite: 'anekoik' | 'hiper_izo' | 'hipo' | 'cok_hipo'
  sekil: 'genis' | 'uzun' // genişlik > yükseklik | yükseklik > genişlik (taller-than-wide)
  kenar: 'duzgun' | 'belirsiz' | 'lobule_duzensiz' | 'ekstratiroidal'
  odak: 'yok' | 'makro' | 'periferik' | 'punktat'
  boyutMm: number; usTarihi: string; tsh: number | null; bugun: string
}
export interface NodulSonuc { puan: number; tr: 1 | 2 | 3 | 4 | 5; oneri: 'iiab' | 'izlem' | 'gerekmez'; izlemTarihleri: string[]; sonrakiUs: string | null; sevk: string[]; notlar: string[]; tarif: string; dipnot: Dipnot }

const P = { bilesim: { kistik: 0, sungerimsi: 0, mikst: 1, solid: 2 }, ekojenite: { anekoik: 0, hiper_izo: 1, hipo: 2, cok_hipo: 3 }, sekil: { genis: 0, uzun: 3 }, kenar: { duzgun: 0, belirsiz: 0, lobule_duzensiz: 2, ekstratiroidal: 3 }, odak: { yok: 0, makro: 1, periferik: 2, punktat: 3 } } as const
const AD = { bilesim: { kistik: 'kistik', sungerimsi: 'süngerimsi', mikst: 'mikst kistik-solid', solid: 'solid' }, ekojenite: { anekoik: 'anekoik', hiper_izo: 'hiper/izoekoik', hipo: 'hipoekoik', cok_hipo: 'çok hipoekoik' }, sekil: { genis: 'genişliği yüksekliğinden fazla', uzun: 'yüksekliği genişliğinden fazla' }, kenar: { duzgun: 'düzgün sınırlı', belirsiz: 'sınırları belirsiz', lobule_duzensiz: 'lobüle/düzensiz sınırlı', ekstratiroidal: 'ekstratiroidal uzanımlı' }, odak: { yok: 'ekojenik odak yok', makro: 'makrokalsifikasyon', periferik: 'periferik (rim) kalsifikasyon', punktat: 'punktat ekojenik odaklar' } }
function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

export function tiradsPuan(g: Pick<NodulGirdi, 'bilesim' | 'ekojenite' | 'sekil' | 'kenar' | 'odak'>): number {
  // Kistik / süngerimsi nodüllerde diğer bileşenler puanlanmaz (ACR TI-RADS)
  if (g.bilesim === 'kistik' || g.bilesim === 'sungerimsi') return 0
  return P.bilesim[g.bilesim] + P.ekojenite[g.ekojenite] + P.sekil[g.sekil] + P.kenar[g.kenar] + P.odak[g.odak]
}
export function trKategori(puan: number): 1 | 2 | 3 | 4 | 5 { return puan <= 1 ? 1 : puan === 2 ? 2 : puan === 3 ? 3 : puan <= 6 ? 4 : 5 }

export function nodulDegerlendir(g: NodulGirdi): NodulSonuc {
  const dipnot: Dipnot = { ref: 'TEMD_TIROID2025', not: 'Nodül US risk sınıflaması (TI-RADS) ve boyut eşiklerine göre İİAB/izlem; girişimsel işlemler endokrinoloji; TSH düşükse sintigrafi' }
  const puan = tiradsPuan(g), tr = trKategori(puan)
  const cm = g.boyutMm / 10
  const esik: Record<number, [number, number] | null> = { 1: null, 2: null, 3: [2.5, 1.5], 4: [1.5, 1.0], 5: [1.0, 0.5] }
  const e = esik[tr]
  const oneri: NodulSonuc['oneri'] = !e ? 'gerekmez' : cm >= e[0] ? 'iiab' : cm >= e[1] ? 'izlem' : 'gerekmez'
  const yillar: Record<number, number[]> = { 3: [1, 3, 5], 4: [1, 2, 3, 5], 5: [1, 2, 3, 4, 5] }
  const izlemTarihleri = oneri === 'izlem' ? (yillar[tr] || []).map((y) => ekleAy(g.usTarihi, 12 * y)) : []
  const sonrakiUs = izlemTarihleri.find((t) => t >= g.bugun) || (izlemTarihleri.length ? izlemTarihleri[izlemTarihleri.length - 1] : null)
  const sevk: string[] = [], notlar: string[] = []
  if (oneri === 'iiab') sevk.push(`Endokrinoloji: TR${tr} ${cm.toLocaleString('tr-TR')} cm nodül — İİAB değerlendirmesi (ofiste girişim yok)`)
  if (g.kenar === 'ekstratiroidal') sevk.push('Endokrinoloji/genel cerrahi: ekstratiroidal uzanım şüphesi — öncelikli')
  if (g.tsh != null && g.tsh < 0.4) notlar.push(`TSH ${g.tsh} düşük: otonom (sıcak) nodül olasılığı — İİAB öncesi sintigrafi (endokrin)`)
  if (oneri === 'gerekmez' && tr >= 3) notlar.push(`TR${tr} ama boyut izlem eşiğinin altında: rutin izlem gerekmez (hekim kararı)`)
  const tarif = `${g.boyutMm} mm, ${AD.bilesim[g.bilesim]}, ${AD.ekojenite[g.ekojenite]}, ${AD.sekil[g.sekil]}, ${AD.kenar[g.kenar]}, ${AD.odak[g.odak]} nodül — TI-RADS tarzı puan ${puan} (TR${tr}); öneri: ${oneri === 'iiab' ? 'İİAB değerlendirmesi (endokrin)' : oneri === 'izlem' ? `US izlem (${izlemTarihleri.join(', ')})` : 'İİAB/izlem gerekmez'} (US ${g.usTarihi}; taslak — hekim onaylar).`
  return { puan, tr, oneri, izlemTarihleri, sonrakiUs, sevk, notlar, tarif, dipnot }
}
