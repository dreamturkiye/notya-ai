/**
 * NOTYA-ILAC-SONLANDIR-01 (Kaan / Dr. Gökhan, 2026-09-25) — onaylanan muayene notu bir ilacı kesiyorsa
 * ("Klacid süspansiyon ve Calpol şurubu keselim"), o ilaç hastanın İlaçlar listesinde (hasta_ilaclar)
 * SONLANDIRILIR — silinmez: aktif = false, bitiş = bugün, gerekçe = notun alıntısı.
 *
 * Yalnız ONAYDA çalışır (/api/notes/[id]/approve, nottanIlacAktar'dan SONRA): onay hekimin imzasıdır;
 * yazarken hiçbir şey olmaz. Kapsam: bu hekimin bu hastadaki AKTİF ilaçları, kaynağı ne olursa olsun
 * (başka not, elle ekleme). Asla dokunulmayanlar:
 *  - bu notun kendi yazdığı satırlar (kaynak_note_id = bu not),
 *  - aynı notun İlaçlar listesinde (yeniden) yazılan ilaç (ad ya da etken madde eşleşmesi),
 *  - hekimin bu not için daha önce "Geri al" dediği satır.
 *
 * Akış: ucuz deterministik ön kontrol (lib/doktor/ilacSonlandirMetin.ts) → gerekiyorsa TEK model çağrısı
 * (klinik-analiz = GÜÇLÜ, temperature 0, yalnız JSON; kimlik verisi yok — yalnız not metni + ilaç adları)
 * → her öneri deterministik olarak yeniden doğrulanır (alıntı notta birebir, ilaç adı alıntıda, alıntıda
 * olumsuzluk/koşul yok). Şüphede durdurma.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'
import { aiCagir, yanitMetni, type AiIstemci } from '@/lib/ai/cagir'
import { ayniIlac, nottanIlaclariCikar } from './receteAktarim'
import { arsivsizIlaclar } from './arsiv'
import {
  durdurmaOnKontrol, gerekceyiKaldir, katla, oneriGecerliMi, sonlandirmaGerekcesi, sonlandirmaMesaji,
  type MarkaSorgu,
} from './ilacSonlandirMetin'

export type SonlandirilanIlac = { id: string; ad: string; alinti: string }

export type SonlandirmaSonucu = {
  sonlandirilan: SonlandirilanIlac[]
  /** Onay sonrası tek sakin satır; hiçbir şey sonlanmadıysa ''. */
  mesaj: string
  hata: string | null
}

/** Denetim + Geri al kaydı (migration 101). Tablo yoksa özellik yine çalışır; denetim satırı yazılmaz. */
const DENETIM = 'ilac_sonlandirmalari'

type NotAlanlari = {
  content_subjektif?: unknown; content_anamnez?: unknown; content_objektif?: unknown; content_degerlendirme?: unknown
  content_tani?: unknown; content_plan?: unknown; content_tedavi?: unknown
  content_ilaclar?: unknown; recete_onerisi?: unknown
}

/** Modele giden not metni: yalnız klinik bölümler, başlıklı. Hasta adı / doğum / TC GİTMEZ. */
export function notMetniDerle(not: NotAlanlari): string {
  const bolumler: [string, unknown][] = [
    ['Subjektif', not.content_subjektif], ['Anamnez', not.content_anamnez], ['Objektif', not.content_objektif],
    ['Değerlendirme', not.content_degerlendirme], ['Tanı', not.content_tani], ['Plan', not.content_plan], ['Tedavi', not.content_tedavi],
  ]
  return bolumler
    .map(([b, v]) => [b, typeof v === 'string' ? v.trim() : ''] as const)
    .filter(([, v]) => v)
    .map(([b, v]) => `${b}:\n${v}`)
    .join('\n\n')
}

const ilkKelime = (ad: string) => katla(ad).split(/[^a-z0-9]+/).find(Boolean) || ''

let MARKALAR: Map<string, Set<string>> | null = null
/** SGK listesi: marka ilk kelimesi (katlanmış) → etken madde(ler). Liste yoksa boş. */
function sgkMarkalari(): Map<string, Set<string>> {
  if (MARKALAR) return MARKALAR
  MARKALAR = new Map()
  try {
    const ham = JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'sgk-ilaclar.json'), 'utf8')) as { ilaclar?: { marka?: string; etkenMadde?: string }[] }
    for (const i of ham.ilaclar || []) {
      const ilk = ilkKelime(String(i.marka || ''))
      if (!ilk || ilk.length < 4 || /^\d/.test(ilk)) continue
      if (!MARKALAR.has(ilk)) MARKALAR.set(ilk, new Set())
      if (i.etkenMadde) MARKALAR.get(ilk)!.add(i.etkenMadde)
    }
  } catch { /* liste yoksa yalnız kayıtlı ad/etken madde ile kontrol edilir */ }
  return MARKALAR
}

/** "Calpol keselim" → Calpol bilinen bir ilaç markası mı? (ön kontrol) */
export function sgkMarkaSorgu(): MarkaSorgu {
  const m = sgkMarkalari()
  return (t) => m.has(t)
}

/** Ad bir markaysa SGK etken madde(ler)i: "Parol 120 mg" → ["Parasetamol"]. */
export type EtkenSorgu = (ad: string) => string[]
export function sgkEtkenSorgu(): EtkenSorgu {
  const m = sgkMarkalari()
  return (ad) => [...(m.get(ilkKelime(ad)) || [])]
}

export const SONLANDIRMA_SISTEM = `Sen bir muayene notunu okuyan klinik asistansın. Görevin TEK: hekimin bu notta hastanın AKTİF ilaçlarından hangisini kesin olarak KESTİĞİNİ bulmak.

Kurallar:
- Yalnız notta açıkça ve koşulsuz kesilen/sonlandırılan ilaç: "keselim", "kesildi", "iptal", "sonlandırıyoruz", "bıraksın", "artık vermiyoruz", "vermeyelim", "kullanmasın", "devam etmesin", "X yerine Y başlandı" (X kesilir).
- KESME SAYILMAZ: olumsuzluk ("kesmeyelim", "devam etsin", "değiştirmeyelim"), koşul ya da erteleme ("ateş düşerse keselim", "3 gün sonra keselim", "gerekirse", "kontrolde karar"), olasılık ("kesilebilir", "düşünülebilir").
- Marka ve etken maddeyi eşle (ör. Klacid = klaritromisin, Calpol = parasetamol): aktif listedeki ad veya etken madde ile notta yazan ad aynı ilaçsa eşleştir. Emin değilsen eşleştirme.
- "buNottaYazilanlar" listesindeki (ya da onların marka/etken eşdeğeri olan) bir ilacı ASLA kesme — hekim onu bu notta yeniden yazmış.
- Emin değilsen KESME. Boş liste doğru cevaptır.
- id yalnız "aktifIlaclar" içindeki id'lerden biri olabilir.
- alinti: notta ilacın kesildiğini söyleyen en kısa ifade, nottan HARFİ HARFİNE kopyalanmış (düzeltme, özetleme yok).
- notAdi: ilacın notta yazıldığı ad (harfi harfine).

Yalnız şu JSON'u döndür, başka hiçbir şey yazma:
{"sonlandir":[{"id":"...","notAdi":"...","alinti":"..."}]}`

type ModelOnerisi = { id: string; notAdi: string; alinti: string }

/** Model yanıtını çözer; bozuk/eksik → boş liste (şüphede durdurma). */
export function modelYanitiniCoz(metin: string): ModelOnerisi[] {
  const t = String(metin || '').replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  const bas = t.indexOf('{')
  const son = t.lastIndexOf('}')
  if (bas < 0 || son <= bas) return []
  try {
    const j = JSON.parse(t.slice(bas, son + 1)) as { sonlandir?: unknown }
    if (!Array.isArray(j.sonlandir)) return []
    return j.sonlandir
      .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {}))
      .map((o) => ({ id: String(o.id || '').trim(), notAdi: String(o.notAdi || '').trim(), alinti: String(o.alinti || '').trim() }))
      .filter((o) => o.id && o.notAdi && o.alinti)
  } catch {
    return []
  }
}

function bugunTr(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' })
}

type AktifSatir = { id: string; ilac_adi: string | null; etken_madde: string | null; bitis_tarihi: string | null; notlar: string | null; kaynak_note_id: string | null }

/**
 * Onaylanan notun kestiği ilaçları sonlandırır. Hata onayı asla bloklamaz — çağıran yalnız loglar.
 * `not`: approve rotasının onaydan SONRAKİ güncel alanları (düzenlenmiş Plan / İlaçlar dahil).
 */
export async function nottanIlacSonlandir(
  sb: SupabaseClient,
  opts: {
    noteId: string; doctorId: string; patientId: string; not: NotAlanlari
    istemci?: AiIstemci; markaMi?: MarkaSorgu; etkenBul?: EtkenSorgu; zamanAsimiMs?: number
  },
): Promise<SonlandirmaSonucu> {
  const bos = (hata: string | null = null): SonlandirmaSonucu => ({ sonlandirilan: [], mesaj: '', hata })
  const notMetni = notMetniDerle(opts.not)
  if (!notMetni) return bos()

  // HASTA-IZOLASYON-01: yalnız bu hekimin bu hastadaki satırları. NOTYA-ARSIV-02: arşivlenmiş muayenenin
  // (hekimin görmediği) ilacı kesilmez — yalnız listede görünen satırlar.
  const { data: aktif, error: okHata } = await arsivsizIlaclar(sb, 'id, ilac_adi, etken_madde, bitis_tarihi, notlar, kaynak_note_id')
    .eq('patient_id', opts.patientId)
    .eq('doctor_id', opts.doctorId)
    .eq('aktif', true)
  if (okHata) return bos(okHata.message)

  const yazilanlar = nottanIlaclariCikar(opts.not)
  // Aynı notta yeniden yazılan ilaç — başka markayla da olsa (Calpol satırı, notta Parol → ikisi de parasetamol).
  // SGK'dan türetilen etken madde TAM eşleşmeli: Augmentin (amoksisilin/klavulanik asit) bir Amoksisilin satırını korumaz.
  const etkenBul = opts.etkenBul ?? sgkEtkenSorgu()
  const tam = (a: string) => katla(a).replace(/[^a-z]+/g, '')
  const kimlik = (...x: (string | null | undefined)[]) => {
    const adlar = x.filter((a): a is string => !!a)
    return { adlar, etkenler: new Set([...adlar, ...adlar.flatMap((a) => etkenBul(a))].map(tam).filter(Boolean)) }
  }
  const yenidenYazildi = (s: AktifSatir) => {
    const satir = kimlik(s.ilac_adi, s.etken_madde)
    return yazilanlar.some((y) => {
      const n = kimlik(y.ilac_adi, y.etken_madde)
      if (satir.adlar.some((a) => n.adlar.some((b) => ayniIlac(a, b)))) return true
      return [...satir.etkenler].some((e) => n.etkenler.has(e))
    })
  }

  // Hekim bu not için daha önce "Geri al" dediyse aynı satır yeniden kesilmez.
  const geriAlinan = new Set<string>()
  try {
    const { data: g } = await sb.from(DENETIM).select('ilac_id, geri_alindi_at').eq('note_id', opts.noteId).eq('doctor_id', opts.doctorId)
    for (const x of (g || []) as { ilac_id: string; geri_alindi_at: string | null }[]) if (x.geri_alindi_at) geriAlinan.add(x.ilac_id)
  } catch { /* denetim tablosu yok */ }

  const adaylar = ((aktif || []) as AktifSatir[]).filter((s) =>
    s.ilac_adi && s.kaynak_note_id !== opts.noteId && !yenidenYazildi(s) && !geriAlinan.has(s.id))
  if (!adaylar.length) return bos()
  if (!durdurmaOnKontrol(notMetni, adaylar, opts.markaMi ?? sgkMarkaSorgu())) return bos()

  let yanit: string
  try {
    const girdi = {
      aktifIlaclar: adaylar.map((s) => ({ id: s.id, ad: s.ilac_adi, etkenMadde: s.etken_madde || null })),
      buNottaYazilanlar: yazilanlar.map((y) => ({ ad: y.ilac_adi, etkenMadde: y.etken_madde })),
      notMetni,
    }
    const cagri = aiCagir({
      gorev: 'klinik-analiz',
      system: [{ metin: SONLANDIRMA_SISTEM, onbellek: true }],
      messages: [{ role: 'user', content: JSON.stringify(girdi) }],
      temperature: 0,
      maxTokens: 800,
      istemci: opts.istemci,
      doctorId: opts.doctorId,
    })
    let zamanlayici: ReturnType<typeof setTimeout> | undefined
    const zaman = new Promise<never>((_, red) => { zamanlayici = setTimeout(() => red(new Error('zaman aşımı')), opts.zamanAsimiMs ?? 20000) })
    try {
      yanit = yanitMetni(await Promise.race([cagri, zaman]))
    } finally {
      clearTimeout(zamanlayici)
    }
  } catch (e) {
    return bos(`İlaç sonlandırma kontrolü yapılamadı: ${e instanceof Error ? e.message : 'bilinmeyen hata'}`)
  }

  const bugun = bugunTr()
  const sonlandirilan: SonlandirilanIlac[] = []
  for (const o of modelYanitiniCoz(yanit)) {
    // Model çıktısındaki kimlik de istek girdisidir: yalnız aday listesindeki id.
    const s = adaylar.find((a) => a.id === o.id)
    if (!s || sonlandirilan.some((x) => x.id === s.id)) continue
    if (!oneriGecerliMi(o, s, notMetni)) continue

    const { data: g, error: gHata } = await sb
      .from('hasta_ilaclar')
      .update({ aktif: false, bitis_tarihi: bugun, notlar: sonlandirmaGerekcesi(o.alinti, s.notlar) })
      .eq('id', s.id)
      .eq('doctor_id', opts.doctorId)
      .eq('patient_id', opts.patientId)
      .eq('aktif', true)
      .select('id')
    if (gHata) return { sonlandirilan, mesaj: sonlandirmaMesaji(sonlandirilan.map((x) => x.ad)), hata: gHata.message }
    if (!g || !(g as unknown[]).length) continue
    sonlandirilan.push({ id: s.id, ad: String(s.ilac_adi), alinti: o.alinti })

    // Denetim: kim (onaylayan hekim), ne zaman, hangi not, hangi cümle, satırın önceki hali (Geri al için).
    try {
      const { error: dHata } = await sb.from(DENETIM).insert({
        doctor_id: opts.doctorId, patient_id: opts.patientId, note_id: opts.noteId, ilac_id: s.id,
        ilac_adi: s.ilac_adi, alinti: o.alinti.slice(0, 500),
        onceki: { aktif: true, bitis_tarihi: s.bitis_tarihi, notlar: s.notlar },
      })
      if (dHata) console.error('[ilac-sonlandir] denetim', dHata.message)
    } catch (e) { console.error('[ilac-sonlandir] denetim', e) }
  }
  console.info('[ilac-sonlandir]', JSON.stringify({ noteId: opts.noteId, doctorId: opts.doctorId, sonlandirilan: sonlandirilan.map((x) => x.id) }))
  return { sonlandirilan, mesaj: sonlandirmaMesaji(sonlandirilan.map((x) => x.ad)), hata: null }
}

/**
 * "Geri al": onay satırındaki düğme. Yalnız bu notun sonlandırdığı, hâlâ sonlanmış satırları eski
 * haline döndürür (aktif, eski bitiş tarihi, eski not). Denetim satırı varsa oradan, yoksa gerekçe
 * önekini kaldırarak. Kimlikler istemciden gelir → hekim + hasta kapsamında yeniden okunur.
 */
export async function ilacSonlandirmaGeriAl(
  sb: SupabaseClient,
  opts: { noteId: string; doctorId: string; patientId: string; ilacIds: string[] },
): Promise<{ geriAlinan: string[]; hata: string | null }> {
  const ids = [...new Set(opts.ilacIds.map(String).filter(Boolean))].slice(0, 30)
  if (!ids.length) return { geriAlinan: [], hata: null }
  const { data: satirlar, error } = await sb
    .from('hasta_ilaclar')
    .select('id, aktif, notlar')
    .eq('doctor_id', opts.doctorId)
    .eq('patient_id', opts.patientId)
    .in('id', ids)
  if (error) return { geriAlinan: [], hata: error.message }

  let denetim: { id: string; ilac_id: string; onceki: { bitis_tarihi?: string | null; notlar?: string | null } | null }[] = []
  try {
    const { data } = await sb.from(DENETIM).select('id, ilac_id, onceki, geri_alindi_at')
      .eq('note_id', opts.noteId).eq('doctor_id', opts.doctorId).in('ilac_id', ids)
    denetim = ((data || []) as (typeof denetim[number] & { geri_alindi_at: string | null })[]).filter((d) => !d.geri_alindi_at)
  } catch { /* denetim tablosu yok */ }

  const geriAlinan: string[] = []
  for (const s of (satirlar || []) as { id: string; aktif: boolean | null; notlar: string | null }[]) {
    if (s.aktif) continue
    const eskiNot = gerekceyiKaldir(s.notlar)
    if (eskiNot === null) continue // bu satırı muayene notu sonlandırmadı
    const d = denetim.find((x) => x.ilac_id === s.id)
    const { error: gHata } = await sb.from('hasta_ilaclar')
      .update({ aktif: true, bitis_tarihi: d?.onceki?.bitis_tarihi ?? null, notlar: d ? (d.onceki?.notlar ?? null) : (eskiNot || null) })
      .eq('id', s.id).eq('doctor_id', opts.doctorId).eq('patient_id', opts.patientId)
    if (gHata) return { geriAlinan, hata: gHata.message }
    geriAlinan.push(s.id)
    if (d) {
      try {
        await sb.from(DENETIM).update({ geri_alindi_at: new Date().toISOString(), geri_alan: opts.doctorId }).eq('id', d.id).eq('doctor_id', opts.doctorId)
      } catch (e) { console.error('[ilac-sonlandir] geri al denetim', e) }
    }
  }
  console.info('[ilac-sonlandir] geri al', JSON.stringify({ noteId: opts.noteId, doctorId: opts.doctorId, geriAlinan }))
  return { geriAlinan, hata: null }
}
