/**
 * TR-PROTOKOL-KUTUPHANESI — monthly edition check, the I/O part (app/api/cron/protokol-surum). Reads every watched official
 * URL once (15 s timeout each, 25 MB cap, 6 at a time), compares with last month (takip.ts), stores the new snapshot in ONE
 * upsert and the flags in ONE insert (duplicates ignored on `imza`). Never edits the registry, never notifies doctors —
 * that happens only after the founder reviews the queue (/kurucu/kaynaklar).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { PROTOKOL_BELGELERI } from './belgeler'
import { takipHedefleri, type TakipHedefi } from './index'
import { takipKarsilastir, type TakipBulgusu, type TakipKaydi, type TakipYaniti } from './takip'

export const TAKIP_ZAMAN_ASIMI_MS = 15_000
export const TAKIP_AZAMI_BAYT = 25 * 1024 * 1024
export const TAKIP_ESZAMANLI = 6
const KULLANICI_AJANI = 'NotyaKaynakTakip/1.0 (+aylik resmi kaynak surum kontrolu)'

export async function urlOku(url: string, fetchFn: typeof fetch = fetch): Promise<TakipYaniti> {
  try {
    const r = await fetchFn(url, { redirect: 'follow', cache: 'no-store', headers: { 'user-agent': KULLANICI_AJANI }, signal: AbortSignal.timeout(TAKIP_ZAMAN_ASIMI_MS) })
    const uzunluk = Number(r.headers.get('content-length') || 0)
    const govde = r.ok && uzunluk <= TAKIP_AZAMI_BAYT ? new Uint8Array(await r.arrayBuffer()) : null
    return {
      httpDurum: govde && govde.byteLength > TAKIP_AZAMI_BAYT ? 413 : r.status,
      etag: r.headers.get('etag'),
      sonDegisiklik: r.headers.get('last-modified'),
      icerikTuru: r.headers.get('content-type'),
      govde: govde && govde.byteLength <= TAKIP_AZAMI_BAYT ? govde : null,
    }
  } catch {
    return { httpDurum: null, etag: null, sonDegisiklik: null, icerikTuru: null, govde: null }
  }
}

type Satir = { url: string; hash: string | null; etag: string | null; son_degisiklik: string | null; http_durum: number | null; liste_ogeleri: string[] | null; kontrol_at: string; degisti_at: string | null }

const satirdan = (s: Satir): TakipKaydi => ({ url: s.url, hash: s.hash, etag: s.etag, sonDegisiklik: s.son_degisiklik, httpDurum: s.http_durum, listeOgeleri: s.liste_ogeleri, kontrolAt: s.kontrol_at, degistiAt: s.degisti_at })
const satira = (k: TakipKaydi): Satir => ({ url: k.url, hash: k.hash, etag: k.etag, son_degisiklik: k.sonDegisiklik, http_durum: k.httpDurum, liste_ogeleri: k.listeOgeleri, kontrol_at: k.kontrolAt, degisti_at: k.degistiAt })

export type TakipOzeti = { kontrol: number; erisilemeyen: number; bulgu: number; kuyrugaEklenen: number }

export async function takipCalistir(sb: SupabaseClient, d: { fetchFn?: typeof fetch; simdi?: Date; hedefler?: TakipHedefi[] } = {}): Promise<TakipOzeti> {
  const simdi = d.simdi || new Date()
  const hedefler = d.hedefler || takipHedefleri()
  const { data: onceSatirlar, error } = await sb.from('protokol_takip_durum').select('url, hash, etag, son_degisiklik, http_durum, liste_ogeleri, kontrol_at, degisti_at')
  if (error) throw new Error(`protokol_takip_durum okunamadı: ${error.message}`)
  const onceki = new Map(((onceSatirlar || []) as Satir[]).map((s) => [s.url, satirdan(s)]))

  const kayitlar: TakipKaydi[] = []
  const bulgular: TakipBulgusu[] = []
  let sira = 0
  const isci = async () => {
    while (sira < hedefler.length) {
      const h = hedefler[sira++]
      const yanit = await urlOku(h.url, d.fetchFn)
      const r = takipKarsilastir(h, onceki.get(h.url) || null, yanit, PROTOKOL_BELGELERI, simdi)
      kayitlar.push(r.kayit)
      bulgular.push(...r.bulgular)
    }
  }
  await Promise.all(Array.from({ length: Math.min(TAKIP_ESZAMANLI, hedefler.length) }, isci))

  if (kayitlar.length) {
    const { error: e } = await sb.from('protokol_takip_durum').upsert(kayitlar.map(satira), { onConflict: 'url' })
    if (e) throw new Error(`protokol_takip_durum yazılamadı: ${e.message}`)
  }
  let kuyrugaEklenen = 0
  if (bulgular.length) {
    const { data, error: e } = await sb
      .from('protokol_inceleme_kuyrugu')
      .upsert(bulgular.map((b) => ({ tur: b.tur, url: b.url, belge_idleri: b.belgeIdleri, ayrinti: b.ayrinti, imza: b.imza.slice(0, 1500) })), { onConflict: 'imza', ignoreDuplicates: true })
      .select('id')
    if (e) throw new Error(`protokol_inceleme_kuyrugu yazılamadı: ${e.message}`)
    kuyrugaEklenen = (data || []).length
  }
  return { kontrol: kayitlar.length, erisilemeyen: kayitlar.filter((k) => !(k.httpDurum && k.httpDurum < 400)).length, bulgu: bulgular.length, kuyrugaEklenen }
}
