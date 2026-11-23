/**
 * ESNEK-MUAYENE-B1 — gölge mod on the server. First week, per doctor, on his choice; NOTHING changes for the doctor or the
 * secretary: she uploads the pages (the Phase A reader reads them) and pastes / types the note she wrote herself; Notya drafts
 * its own note from the pages in the background — never a visit note, never shown as one — compares the two at clinical
 * fact level, and the overnight loop learns from the differences. The doctor sees one daily line; at ≥ target rolling match
 * Notya offers "Yarın sekreteriniz yazmasın, siz yalnızca onaylayın".
 *
 * HASTA-IZOLASYON: patient by hastaSahibiMi before any write; source by id AND doctor_id (kaynakAl); an existing note by id
 * AND doctor_id whose visit patient is the source's patient; every row carries doctor_id.
 * A shadow source has NO session (no phantom visit) and is parked (durum 'iptal', hata_kodu 'golge') once compared, so it
 * never joins a compiled note, a Doğrula list or a visit.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PratikRol } from '@/lib/doktor/personelYetki'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { arsivsizNotlar } from '@/lib/doktor/arsiv'
import { denetimYaz, kaynakAl, type KaynakSatiri } from '@/lib/elNotu/sunucu'
import { notlariKarsilastir, kayanEslesme, gunlukGolge, teklifUygunMu, type Karsilastirma, type GolgeKaydi } from '@/core/esnek/olgu'
import { gunAnahtari } from '@/core/esnek/metinAraclari'
import { arkaPlanda, esnekAyarYaz, esnekAyarYukle, genisletici, sekreterYazmasinMi, type EsnekAyari } from './sunucu'

type Aktor = { userId: string; rol: PratikRol }

const SOAP_ALAN = ['subjektif', 'objektif', 'degerlendirme', 'plan'] as const
const NOT_KOLON = ['basvuru_yakinmasi', 'content_subjektif', 'content_objektif', 'content_degerlendirme', 'content_plan'] as const

/** Shadow mode is in force today (on, and "sekreter yazmasın" has not started yet). */
export const golgeEtkinMi = (a: EsnekAyari, simdi = new Date()) => a.golgeModu && !sekreterYazmasinMi(a, simdi)

/** A page-set source for the shadow comparison: no session, idempotent per (doctor, content hash). */
export async function golgeKaynagiOlustur(sb: SupabaseClient, g: { doktorId: string; patientId: string; kanal: string; isleme: string; aktor: Aktor }): Promise<{ kaynak: KaynakSatiri; yeni: boolean } | { hata: string; durum: number }> {
  if (!(await hastaSahibiMi(sb, g.doktorId, g.patientId))) return { hata: 'Hasta bulunamadı.', durum: 404 }
  const { data: var_ } = await sb.from('muayene_kaynaklari').select('*').eq('doctor_id', g.doktorId).eq('isleme_anahtari', g.isleme).maybeSingle()
  if (var_) {
    if (var_.patient_id !== g.patientId) return { hata: 'Bu sayfalar başka bir hastaya dosyalanmış.', durum: 409 }
    return { kaynak: var_ as KaynakSatiri, yeni: false }
  }
  const kanal = ['kamera', 'dosya', 'tarayici', 'toplu'].includes(g.kanal) ? g.kanal : 'kamera'
  const { data, error } = await sb.from('muayene_kaynaklari').insert({
    doctor_id: g.doktorId, patient_id: g.patientId, session_id: null, tur: 'sekreter_yukleme', kanal, durum: 'bekliyor',
    isleme_anahtari: g.isleme, ekleyen_user_id: g.aktor.userId, ekleyen_rol: g.aktor.rol,
  }).select('*').single()
  if (error || !data) return { hata: 'Kaynak kaydedilemedi.', durum: 500 }
  await denetimYaz(sb, { doktorId: g.doktorId, patientId: g.patientId, kaynakId: String(data.id), eylem: 'kaynak_eklendi', aktor: g.aktor, ayrinti: { golge: true, kanal } })
  return { kaynak: data as KaynakSatiri, yeni: true }
}

export type GolgeGirdisi = {
  doktorId: string; kaynakId: unknown; aktor: Aktor
  kaynagi: 'yapistir' | 'yazdi' | 'not'
  metin?: unknown; noteId?: unknown; sureMs?: unknown; beyanDk?: unknown
}

/** The secretary's note arrives → stored with the source; Notya's draft + comparison run after the response. */
export async function golgeKaydet(sb: SupabaseClient, g: GolgeGirdisi, o: { uret?: typeof golgeTaslagiUret; bekle?: boolean } = {}): Promise<{ id: string } | { hata: string; durum: number }> {
  const kaynak = await kaynakAl(sb, g.doktorId, g.kaynakId)
  if (!kaynak || !kaynak.patient_id || kaynak.session_id || kaynak.tur !== 'sekreter_yukleme') return { hata: 'Kaynak bulunamadı.', durum: 404 }
  let metin = ''
  if (g.kaynagi === 'not') {
    if (typeof g.noteId !== 'string' || !/^[0-9a-f-]{36}$/i.test(g.noteId)) return { hata: 'Not gerekli.', durum: 400 }
    const { data: n } = await arsivsizNotlar(sb, `id, ${NOT_KOLON.join(', ')}, sessions!inner(patient_id)`).eq('id', g.noteId).eq('doctor_id', g.doktorId).maybeSingle()
    const hasta = (n as { sessions?: { patient_id?: string } } | null)?.sessions?.patient_id
    if (!n || hasta !== kaynak.patient_id) return { hata: 'Not bulunamadı.', durum: 404 }
    metin = NOT_KOLON.map((k) => String((n as Record<string, unknown>)[k] || '').trim()).filter(Boolean).join('\n')
  } else metin = typeof g.metin === 'string' ? g.metin : ''
  metin = metin.replace(/\r/g, '').trim().slice(0, 20000)
  if (metin.length < 10) return { hata: 'Sekreterin notu boş.', durum: 400 }
  const sure = g.kaynagi === 'yazdi' && Number.isFinite(Number(g.sureMs)) && Number(g.sureMs) > 0 && Number(g.sureMs) <= 3600000 ? Math.round(Number(g.sureMs)) : null
  const beyan = Number.isFinite(Number(g.beyanDk)) && Number(g.beyanDk) > 0 && Number(g.beyanDk) <= 120 ? Math.round(Number(g.beyanDk) * 10) / 10 : null
  const { data, error } = await sb.from('golge_karsilastirmalari').upsert({
    doctor_id: g.doktorId, patient_id: kaynak.patient_id, kaynak_id: kaynak.id, sekreter_metni: metin, sekreter_kaynagi: g.kaynagi,
    sekreter_sure_ms: sure, sekreter_beyan_dk: beyan, durum: 'bekliyor', ogrenildi: false, gun: gunAnahtari(new Date()), ekleyen_user_id: g.aktor.userId, ekleyen_rol: g.aktor.rol, updated_at: new Date().toISOString(),
  }, { onConflict: 'doctor_id,kaynak_id' }).select('id').single()
  if (error || !data) return { hata: 'Kaydedilemedi.', durum: 500 }
  // park the shadow source: never part of a visit, a compiled note or a Doğrula list
  await sb.from('muayene_kaynaklari').update({ durum: 'iptal', hata_kodu: 'golge', updated_at: new Date().toISOString() }).eq('id', kaynak.id).eq('doctor_id', g.doktorId)
  const id = String(data.id)
  const is = golgeIsle(sb, g.doktorId, id, o.uret).catch((e) => console.error('[golge] isle', e instanceof Error ? e.name : 'hata'))
  if (o.bekle) await is; else arkaPlanda(is)
  return { id }
}

/** Notya's own draft from the pages only — the same generator, context and learned rules as a real hand-note draft. */
export async function golgeTaslagiUret(sb: SupabaseClient, doktorId: string, kaynak: Pick<KaynakSatiri, 'id' | 'patient_id' | 'metin' | 'isleme_anahtari' | 'sayfa_sayisi'>): Promise<Partial<Record<(typeof SOAP_ALAN)[number] | 'basvuruYakinmasi', string>>> {
  const hastaId = kaynak.patient_id
  const [{ hekimAdi, hekimBransi }, { hastaDogumIso }, { soapNotuUret, stilOrnekleriDerle }] = await Promise.all([
    import('@/lib/doktor/hekimAdi'), import('@/lib/specialties/kapsamSunucu'), import('@/lib/doktor/soapUret'),
  ])
  let klinikBaglam = '', stilOrnekleri = '', stilProfili = ''
  let doktorKurallari: { slug: string; satir: string }[] = []
  const [doktorAdi, doktorBransi, dogumIso] = await Promise.all([
    hekimAdi(sb, doktorId), hekimBransi(sb, doktorId), hastaDogumIso(sb, doktorId, hastaId),
    (async () => { try { if (hastaId) { const { hastaDosyasiniDerle } = await import('@/lib/doktor/hastaDosyaDerleyici'); const d = await hastaDosyasiniDerle(sb, doktorId, hastaId); if (d) klinikBaglam = d.split('## VİZİT GEÇMİŞİ')[0].slice(0, 4000) } } catch { /* bağlamsız */ } })(),
    (async () => { try { const { data } = await arsivsizNotlar(sb, 'content_subjektif, content_plan').eq('doctor_id', doktorId).not('approved_at', 'is', null).order('created_at', { ascending: false }).limit(2); if (data?.length) stilOrnekleri = stilOrnekleriDerle(data) } catch { /* stil */ } })(),
    (async () => { try { const { hafizaYukle, hafizaBloguNot } = await import('@/lib/doktor/hafiza'); stilProfili = hafizaBloguNot(await hafizaYukle(sb, doktorId)); const { uygulanirKurallariYukle } = await import('@/lib/doktor/ogrenme/kuralKaydet'); doktorKurallari = await uygulanirKurallariYukle(sb, doktorId) } catch { /* profil */ } })(),
  ])
  const metin = String(kaynak.metin || '')
  const not = await soapNotuUret({
    transcript: metin,
    kaynaklar: [{ id: kaynak.id, tur: 'sekreter_yukleme', baslik: `El notu${kaynak.sayfa_sayisi ? ` (${kaynak.sayfa_sayisi} sayfa)` : ''}`, metin, isleme: kaynak.isleme_anahtari }],
    specialty: doktorBransi || 'genel', klinikBaglam, stilOrnekleri, stilProfili, doktorKurallari, doktorAdi, doktorBransi, hastaDogumIso: dogumIso, doctorId: doktorId,
  }, { oneriYok: true })
  const out: Partial<Record<(typeof SOAP_ALAN)[number] | 'basvuruYakinmasi', string>> = {}
  for (const a of SOAP_ALAN) { const v = not.soap?.[a]; if (typeof v === 'string' && v.trim()) out[a] = v }
  if (typeof not.basvuruYakinmasi === 'string' && not.basvuruYakinmasi.trim()) out.basvuruYakinmasi = not.basvuruYakinmasi
  return out
}

export const taslakMetni = (t: Partial<Record<string, string>> | null | undefined) => ['basvuruYakinmasi', ...SOAP_ALAN].map((a) => String(t?.[a] || '').trim()).filter(Boolean).join('\n')

/** Compact, storable comparison (clauses only — no identity; the row is the doctor's own, RLS own rows). */
export function sonucOzeti(k: Karsilastirma) {
  return {
    sayim: k.sayim,
    ogeler: k.ogeler.slice(0, 80).map((o) => ({
      durum: o.durum,
      notya: 'notya' in o ? o.notya.metin.slice(0, 240) : null,
      sekreter: 'sekreter' in o ? o.sekreter.metin.slice(0, 240) : null,
      neden: o.durum === 'farkli' ? o.neden : undefined,
    })),
  }
}

/** Background: Notya's draft, the comparison, and the offer when the rolling match reached the target. */
export async function golgeIsle(sb: SupabaseClient, doktorId: string, id: string, uret: typeof golgeTaslagiUret = golgeTaslagiUret): Promise<void> {
  const { data: r } = await sb.from('golge_karsilastirmalari').select('id, kaynak_id, sekreter_metni, notya_taslak').eq('id', id).eq('doctor_id', doktorId).maybeSingle()
  if (!r) return
  const kaynak = await kaynakAl(sb, doktorId, r.kaynak_id)
  if (!kaynak || !String(kaynak.metin || '').trim()) {
    await sb.from('golge_karsilastirmalari').update({ durum: 'hata', hata_kodu: 'okunmadi', updated_at: new Date().toISOString() }).eq('id', id).eq('doctor_id', doktorId)
    return
  }
  let taslak = r.notya_taslak as Partial<Record<string, string>> | null
  if (!taslak) {
    const { aiKotaKullan } = await import('@/lib/doktor/hizLimiti')
    const kota = await aiKotaKullan(sb, doktorId, 'soap')
    if (!kota.izin) { await sb.from('golge_karsilastirmalari').update({ durum: 'hata', hata_kodu: 'kota', updated_at: new Date().toISOString() }).eq('id', id).eq('doctor_id', doktorId); return }
    try { taslak = await uret(sb, doktorId, kaynak) } catch {
      await sb.from('golge_karsilastirmalari').update({ durum: 'hata', hata_kodu: 'taslak', updated_at: new Date().toISOString() }).eq('id', id).eq('doctor_id', doktorId)
      return
    }
  }
  const genislet = await genisletici(sb, doktorId)
  const k = notlariKarsilastir(taslakMetni(taslak), String(r.sekreter_metni || ''), genislet)
  await sb.from('golge_karsilastirmalari').update({
    notya_taslak: taslak, sonuc: sonucOzeti(k), skor: k.skor, ayni_icerik: k.ayniIcerik, durum: 'karsilastirildi', hata_kodu: null, updated_at: new Date().toISOString(),
  }).eq('id', id).eq('doctor_id', doktorId)
  await teklifDegerlendir(sb, doktorId)
}

export async function golgeKayitlari(sb: SupabaseClient, doktorId: string, gun = 21): Promise<(GolgeKaydi & { id: string; patient_id: string; created_at: string; sayim: Karsilastirma['sayim'] | null })[]> {
  const kesim = gunAnahtari(new Date(Date.now() - gun * 86400000))
  const { data } = await sb.from('golge_karsilastirmalari').select('id, patient_id, ayni_icerik, skor, gun, created_at, sonuc').eq('doctor_id', doktorId).eq('durum', 'karsilastirildi').gte('gun', kesim).order('created_at', { ascending: false }).limit(300)
  return (data || []).map((x) => ({ id: String(x.id), patient_id: String(x.patient_id), ayniIcerik: x.ayni_icerik === true, skor: Number(x.skor) || 0, gun: String(x.gun), created_at: String(x.created_at), sayim: ((x.sonuc as { sayim?: Karsilastirma['sayim'] } | null)?.sayim) || null }))
}

/** Offer when shadow mode is in force, there is enough evidence, the rolling match ≥ his target; "Şimdi değil" waits 3 days. */
export async function teklifDegerlendir(sb: SupabaseClient, doktorId: string): Promise<boolean> {
  const a = await esnekAyarYukle(sb, doktorId)
  if (!golgeEtkinMi(a) || a.golgeTeklif === 'teklif' || a.golgeTeklif === 'kabul') return false
  if (a.golgeTeklif === 'ertele' && a.golgeTeklifAt && Date.now() - new Date(a.golgeTeklifAt).getTime() < 3 * 86400000) return false
  const kayitlar = await golgeKayitlari(sb, doktorId)
  if (!teklifUygunMu(kayitlar, a.golgeHedef)) return false
  const { error } = await sb.from('esnek_muayene_ayarlari').update({ golge_teklif: 'teklif', golge_teklif_at: new Date().toISOString() }).eq('doctor_id', doktorId)
  return !error
}

export type GolgeDurumu = {
  acik: boolean
  sekreterYazmasin: boolean
  sekreterYazmasinGun: string | null
  hedef: number
  gunluk: { toplam: number; ayni: number }
  kayan: { oran: number | null; not: number; ayni: number }
  teklif: boolean
  bekleyen: number
  son: { id: string; hasta: string; ayniIcerik: boolean; skor: number; sayim: Karsilastirma['sayim'] | null; gun: string }[]
}

export async function golgeDurumu(sb: SupabaseClient, doktorId: string, a?: EsnekAyari, ayrinti = false): Promise<GolgeDurumu> {
  const ayar = a || (await esnekAyarYukle(sb, doktorId))
  const [kayitlar, bek] = await Promise.all([
    golgeKayitlari(sb, doktorId),
    sb.from('golge_karsilastirmalari').select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId).eq('durum', 'bekliyor'),
  ])
  const bugun = gunAnahtari(new Date())
  let son: GolgeDurumu['son'] = []
  if (ayrinti) {
    const { hastaAdlari } = await import('@/lib/elNotu/sunucu')
    const ilk = kayitlar.slice(0, 20)
    const adlar = await hastaAdlari(sb, doktorId, ilk.map((k) => k.patient_id))
    son = ilk.map((k) => ({ id: k.id, hasta: adlar.get(k.patient_id) || '', ayniIcerik: k.ayniIcerik, skor: k.skor, sayim: k.sayim, gun: k.gun }))
  }
  return {
    acik: golgeEtkinMi(ayar), sekreterYazmasin: sekreterYazmasinMi(ayar), sekreterYazmasinGun: ayar.sekreterYazmasinGun, hedef: ayar.golgeHedef,
    gunluk: gunlukGolge(kayitlar, bugun), kayan: kayanEslesme(kayitlar), teklif: golgeEtkinMi(ayar) && ayar.golgeTeklif === 'teklif', bekleyen: bek.count || 0, son,
  }
}

/** The doctor's choices: start / stop shadow mode, answer the offer. Accepting = from tomorrow the secretary only uploads. */
export async function golgeIslem(sb: SupabaseClient, doktorId: string, userId: string, islem: unknown): Promise<{ ok: true; ayar: EsnekAyari } | { hata: string; durum: number }> {
  const simdi = new Date()
  let degisen: Record<string, unknown> | null = null
  if (islem === 'baslat') degisen = { golge_modu: true, golge_baslangic: simdi.toISOString(), golge_bitis: null, golge_teklif: 'yok', golge_teklif_at: null, sekreter_yazmasin_gun: null }
  else if (islem === 'durdur') degisen = { golge_modu: false, golge_bitis: simdi.toISOString() }
  else if (islem === 'teklif_hayir') degisen = { golge_teklif: 'ertele', golge_teklif_at: simdi.toISOString() }
  else if (islem === 'teklif_evet') {
    const yarin = gunAnahtari(new Date(simdi.getTime() + 86400000))
    // Phase A wiring for "secretary uploads, Notya drafts, the doctor approves": the secretary prepares hand notes, the
    // doctor's approval stays required (a draft compiled by staff goes straight to his queue — derle route).
    degisen = { golge_teklif: 'kabul', golge_teklif_at: simdi.toISOString(), sekreter_yazmasin_gun: yarin, el_notu_hazirlayan: 'sekreter', hekim_onayi_gerekli: true, golge_bitis: new Date(`${yarin}T00:00:00+03:00`).toISOString() }
  } else if (islem === 'sekreter_yazsin') degisen = { sekreter_yazmasin_gun: null, golge_teklif: 'yok' }
  if (!degisen) return { hata: 'Geçersiz işlem.', durum: 400 }
  if (!(await esnekAyarYaz(sb, doktorId, userId, degisen))) return { hata: 'Kaydedilemedi.', durum: 500 }
  return { ok: true, ayar: await esnekAyarYukle(sb, doktorId) }
}
