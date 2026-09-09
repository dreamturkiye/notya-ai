/**
 * NOTYA-GUN-01 — Günün Başı / Günün Sonu ("Ayşe günü açar, günü kapatır").
 *
 * Kaan direktifi (2026-09-09): tanımak işin yarısı, ORTAYA ÇIKMAK diğer yarısı.
 * Balık yemediğini bilen şef yine de sofraya oturmanı bekler; ilişkiyi kuran,
 * onun günü senin için açmasıdır. Ayşe artık doktor uygulamayı ya da sesli
 * seansı açtığında ilk sözü söyler: bugün kaç randevu, kaçı kontrol, ilki kimle,
 * kaç not onay bekliyor, kaç hasta mesajı okunmamış, dün kaç hasta. Akşam: bugün
 * kaç hasta baktık, yarın ne var. Alışkanlık döngüsü budur — bir gün kaçırınca
 * boşluk hissedilir; "vazgeçilmez" tam olarak bu demektir.
 *
 * Tasarım: LLM YOK — deterministik Türkçe, ucuz ve öngörülebilir. Sesli Ayşe ve
 * sohbet, bu metni persona diliyle doğallaştırır. Yeni ekran yok (sadelik kuralı):
 * dashboard başlığı, yazılı sohbetin ilk baloncuğu, sesli seansın ilk cümlesi.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { address, type AddressableUser } from '@/lib/address'
import { asamaBul, type DoktorIliski } from '@/lib/doktor/hafiza'

export type GunFazi = 'basi' | 'orta' | 'sonu'

export interface GunVerisi {
  bugun: string                 // YYYY-MM-DD (TRT)
  haftaGunu: string             // "Perşembe"
  saatTRT: number
  randevu: { toplam: number; kontrol: number; ilkSaat: string | null; ilkHasta: string | null; kalan: number }
  yarinRandevu: { toplam: number; kontrol: number }
  bugunHasta: number            // bugün başlayan seanslar
  dunHasta: number
  onaysizNot: number
  okunmamisMesaj: number
  yeniBelge: number             // son 24 saat
}

const TZ = 'Europe/Istanbul'

function trtTarih(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ })
}
function trtSaat(d: Date): number {
  return Number(d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).slice(0, 2))
}
/** TRT gün sınırlarını UTC ISO olarak verir (offset yaz/kış için hesaplanır). */
function trtGunSinirlari(gunOffset = 0): { bas: string; son: string } {
  const simdi = new Date()
  const bugun = trtTarih(simdi)
  // TRT offset: yerel TRT saati ile UTC farkı
  const trtStr = simdi.toLocaleString('en-US', { timeZone: TZ })
  const offsetMs = new Date(trtStr).getTime() - new Date(simdi.toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
  const gunBasUtc = new Date(new Date(`${bugun}T00:00:00Z`).getTime() - offsetMs + gunOffset * 86400000)
  return { bas: gunBasUtc.toISOString(), son: new Date(gunBasUtc.getTime() + 86400000).toISOString() }
}

export function gunFazi(saat = trtSaat(new Date()), rutin?: Record<string, unknown>): GunFazi {
  const bitis = Number(String(rutin?.tipikBitisSaati || '18:00').slice(0, 2)) || 18
  if (saat < 12) return 'basi'
  if (saat >= Math.max(16, bitis - 1)) return 'sonu'
  return 'orta'
}

export async function gunVerisiDerle(sb: SupabaseClient, doctorId: string): Promise<GunVerisi> {
  const simdi = new Date()
  const bugunS = trtGunSinirlari(0)
  const dunS = trtGunSinirlari(-1)
  const yarinS = trtGunSinirlari(1)
  const son24 = new Date(simdi.getTime() - 86400000).toISOString()

  const [randevuRes, yarinRes, bugunSeansRes, dunSeansRes, notRes, mesajRes, belgeRes] = await Promise.all([
    sb.from('randevular').select('baslangic, tur, durum, hasta_adi_serbest, patient_id')
      .eq('doktor_id', doctorId).gte('baslangic', bugunS.bas).lt('baslangic', bugunS.son)
      .not('durum', 'in', '("iptal","gelmedi")').order('baslangic', { ascending: true }).limit(200),
    sb.from('randevular').select('tur', { count: 'exact' })
      .eq('doktor_id', doctorId).gte('baslangic', yarinS.bas).lt('baslangic', yarinS.son)
      .not('durum', 'in', '("iptal","gelmedi")').limit(200),
    sb.from('sessions').select('id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId).gte('started_at', bugunS.bas).lt('started_at', bugunS.son),
    sb.from('sessions').select('id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId).gte('started_at', dunS.bas).lt('started_at', dunS.son),
    sb.from('notes').select('id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId).is('approved_at', null),
    sb.from('hasta_mesaj_konulari').select('id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId).eq('okundu_pratik', false).eq('pratik_arsiv', false),
    sb.from('medical_documents').select('id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId).gte('created_at', son24),
  ])

  const randevular = (randevuRes.data || []) as { baslangic: string; tur: string; durum: string; hasta_adi_serbest: string | null; patient_id: string | null }[]
  const ilk = randevular[0]
  let ilkHasta: string | null = ilk?.hasta_adi_serbest || null
  if (!ilkHasta && ilk?.patient_id) {
    try {
      const { data: p } = await sb.from('patients').select('name_encrypted').eq('id', ilk.patient_id).maybeSingle()
      if (p?.name_encrypted) {
        const { decrypt } = await import('@/lib/security/encryption')
        ilkHasta = (JSON.parse(decrypt(p.name_encrypted)).ad || '').trim() || null
      }
    } catch { /* ad kritik değil */ }
  }
  const kalan = randevular.filter((r) => new Date(r.baslangic) > simdi && r.durum !== 'tamamlandi').length
  const yarin = (yarinRes.data || []) as { tur: string }[]

  return {
    bugun: trtTarih(simdi),
    haftaGunu: simdi.toLocaleDateString('tr-TR', { timeZone: TZ, weekday: 'long' }),
    saatTRT: trtSaat(simdi),
    randevu: {
      toplam: randevular.length,
      kontrol: randevular.filter((r) => r.tur === 'kontrol').length,
      ilkSaat: ilk ? new Date(ilk.baslangic).toLocaleTimeString('tr-TR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : null,
      ilkHasta,
      kalan,
    },
    yarinRandevu: { toplam: yarinRes.count ?? yarin.length, kontrol: yarin.filter((r) => r.tur === 'kontrol').length },
    bugunHasta: bugunSeansRes.count || 0,
    dunHasta: dunSeansRes.count || 0,
    onaysizNot: notRes.count || 0,
    okunmamisMesaj: mesajRes.count || 0,
    yeniBelge: belgeRes.count || 0,
  }
}

function selamla(saat: number): string {
  if (saat < 12) return 'Günaydın'
  if (saat < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

/** Ayşe'nin ilk sözü — aşamaya göre ton: tanışmada açıklayıcı, meslektaşta kısa ve ortak dil. */
export function gunOzetiMetni(
  v: GunVerisi,
  doctor: AddressableUser | null | undefined,
  iliski?: DoktorIliski | null,
  faz: GunFazi = gunFazi(v.saatTRT, iliski?.rutin),
): string {
  const named = address(doctor || { firstName: 'Hocam' }, 'named')
  const asama = asamaBul(iliski?.seans_sayisi || 0)
  const yakin = asama === 'meslektas' || asama === 'ortak'
  const rutin = (iliski?.rutin || {}) as Record<string, unknown>
  const yogunGunler = Array.isArray(rutin.yogunGunler) ? (rutin.yogunGunler as string[]) : []
  const c: string[] = []

  if (faz === 'basi') {
    c.push(`${selamla(v.saatTRT)} ${named}.`)
    if (v.randevu.toplam > 0) {
      const kontrol = v.randevu.kontrol ? `, ${v.randevu.kontrol}'i kontrol` : ''
      const ilk = v.randevu.ilkSaat ? `; ilki ${v.randevu.ilkSaat}${v.randevu.ilkHasta ? ` — ${v.randevu.ilkHasta}` : ''}` : ''
      c.push(`Bugün ${v.randevu.toplam} randevu var${kontrol}${ilk}.`)
    } else {
      c.push(yakin ? 'Takvim boş; gelen olursa buradayım.' : 'Bugün takvimde randevu görünmüyor; hasta geldikçe birlikte bakarız.')
    }
    if (yakin && yogunGunler.includes(v.haftaGunu)) c.push(`${v.haftaGunu} — sizin yoğun gününüz, tempoyu ona göre tutarız.`)
    if (v.dunHasta > 0 && yakin) c.push(`Dün ${v.dunHasta} hasta baktık.`)
  } else if (faz === 'orta') {
    c.push(`${named}, şu ana kadar ${v.bugunHasta} hasta${v.randevu.kalan ? `, kalan ${v.randevu.kalan} randevu` : ''}.`)
  } else {
    c.push(`${selamla(v.saatTRT)} ${named}.`)
    c.push(v.bugunHasta > 0 ? `Bugün ${v.bugunHasta} hasta baktık.` : 'Bugün seans olmadı.')
    if (v.yarinRandevu.toplam > 0) {
      c.push(`Yarın ${v.yarinRandevu.toplam} randevu${v.yarinRandevu.kontrol ? `, ${v.yarinRandevu.kontrol}'i kontrol` : ''}.`)
    } else if (yakin) {
      c.push('Yarın takvim boş.')
    }
  }

  const bekleyen: string[] = []
  if (v.onaysizNot > 0) bekleyen.push(`${v.onaysizNot} not onay bekliyor`)
  if (v.okunmamisMesaj > 0) bekleyen.push(`${v.okunmamisMesaj} okunmamış hasta mesajı var`)
  if (v.yeniBelge > 0 && faz !== 'sonu') bekleyen.push(`${v.yeniBelge} yeni belge geldi`)
  if (bekleyen.length) c.push(`${bekleyen.join(', ')}.`)

  if (faz === 'sonu') c.push(yakin ? 'Yarın görüşürüz.' : 'İyi dinlenmeler.')
  else if (faz === 'basi' && !yakin) c.push('Hazır olduğunuzda başlayalım.')
  return c.join(' ')
}

/** Prompt bloğu — sohbet/ses Ayşe'sinin günün durumunu bilmesi için. */
export function gunBlogu(v: GunVerisi, faz: GunFazi): string {
  return `=== GÜNÜN DURUMU (${v.bugun} ${v.haftaGunu}, saat ${String(v.saatTRT).padStart(2, '0')}:00 TRT, faz: ${faz}) ===
Bugün randevu: ${v.randevu.toplam} (kontrol ${v.randevu.kontrol}, kalan ${v.randevu.kalan}${v.randevu.ilkSaat ? `, ilki ${v.randevu.ilkSaat}` : ''}) | Bugün seans: ${v.bugunHasta} | Dün: ${v.dunHasta} | Yarın randevu: ${v.yarinRandevu.toplam} (kontrol ${v.yarinRandevu.kontrol})
Onaysız not: ${v.onaysizNot} | Okunmamış hasta mesajı: ${v.okunmamisMesaj} | Son 24 saatte yeni belge: ${v.yeniBelge}
Sohbet açılışında bunlardan doğal ve KISA söz et (meslektaş gibi, liste okuma); doktor konuya girdiyse tekrar etme.`
}
