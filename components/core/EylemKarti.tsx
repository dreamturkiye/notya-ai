'use client'
/**
 * NOTYA-EYLEM — the confirm card. Core, every branş, rendered inline in the chat stream.
 *
 * Cihaz Köprüsü's rule, applied to records: the card ALWAYS appears, nothing is ever silent. What
 * the doctor sees before the tap is exactly what will be written.
 *
 * Four deliberate choices:
 *   • HEADER = hasta adı + doğum tarihi, large. This is the wrong-patient guard. In a chat stream
 *     the patient context can shift between turns; the card states who it is about, in the biggest
 *     type on the card, so a misdirected record is visible without reading the fields.
 *   • EMPTY-YELLOW for `eksik_alanlar`. A value Ayşe guessed was dropped upstream, never shown as
 *     a plausible default. Kaydet stays disabled while a required one is blank — the doctor cannot
 *     tap past a guess, because there is nothing to tap past.
 *   • KAYNAK line under each filled field ("Kaynak: Doğum epikrizi, s.1"), so provenance is read at
 *     the same glance as the value.
 *   • T2 shows önce → sonra. An edit is never presented as if it were an addition.
 *
 * Inline styles (this codebase does not use Tailwind in app components). Works at 390px: fields
 * stack, buttons wrap.
 */
import React, { useMemo, useState } from 'react'
// NOTYA-ASISTAN-YUZEN-01: next/link — kart asistan oturumunun içinde; tam sayfa yüklemesi oturumu öldürürdü.
import Link from 'next/link'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { baslangicSecimi, ciddiVarMi, dugmeMetni, eksikAlanlar, sayim, topluGovde, type TopluDuzeltme } from './topluSecim'
// TOPLU-ULKE-01: the batch card's wording is the ACTIVE country's (countries/active/toplu); Türkiye's is the default.
import type { TopluMetin } from './topluMetin'
import { AKTIF_TOPLU } from '@/countries/active/toplu'

export interface EylemAlan {
  anahtar: string
  etiket: string
  tip: 'metin' | 'uzunMetin' | 'sayi' | 'tarih' | 'secim' | 'mantik'
  secenekler?: { deger: string; etiket: string }[]
  birim?: string
  /** NOTYA-AYSE-GERI-03: filled by the server (which appointment is meant) — shown, not editable. */
  sunucu?: boolean
}

export interface EylemUyarisi {
  tur: 'alerji' | 'mukerrer_etken' | 'etkilesim' | 'pediatrik' | 'kapsam_disi' | 'ayse_notu'
  siddet: 'ciddi' | 'orta' | 'bilgi'
  baslik: string
  metin: string
  kaynak: string
}

export interface EylemOneriGorunumu {
  id: string
  eylem_anahtar: string
  etiket: string
  kademe: 'T1' | 'T2'
  veri: Record<string, unknown>
  alanlar: EylemAlan[]
  alan_kaynaklari?: Record<string, { kaynak: string; alinti?: string | null }>
  eksik_alanlar: string[]
  uyarilar?: string[]
  /** NOTYA-EYLEM-21 — severity-carrying drug warnings, printed above the fields. */
  uyari_detay?: EylemUyarisi[]
  zorunlu?: string[]
  portalaYansir?: boolean
  /** T2 only — what the row looks like today, so the card can show önce → sonra. */
  once?: Record<string, unknown> | null
  /**
   * NOTYA-EYLEM-STALE-01 (Kaan, 2026-09-24) — "sesli ve yazılı olarak hiçbir kayıt yapamıyorum":
   * traced to draft öneriler from up to 18+ hours earlier still surfacing as "onayınızı bekleyen
   * kayıtlar" with no indication of their age, indistinguishable from something the doctor just
   * said. The API already selects created_at (app/api/doktor/eylem/route.ts) -- it just never
   * reached this type or the card. Optional so callers that build a card without it (tests, other
   * surfaces) don't need updating.
   */
  created_at?: string
}

export interface EylemHasta {
  ad: string
  dogumTarihi?: string | null
}

const kart: React.CSSProperties = { marginTop: 8, background: 'rgba(47,67,52,0.06)', border: '1px solid rgba(47,67,52,0.2)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#3b2e24' }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8b7d70' }
const btn: React.CSSProperties = { border: '1px solid rgba(47,67,52,0.3)', color: '#2f4334', background: 'rgba(47,67,52,0.08)', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
const birincil: React.CSSProperties = { ...btn, background: '#2f4334', color: '#fff', borderColor: '#2f4334' }
const hayalet: React.CSSProperties = { ...btn, background: 'transparent', color: '#8b7d70', borderColor: 'rgba(58,44,34,0.2)' }
const girdi: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.18)', borderRadius: 8, padding: '7px 9px', color: '#3b2e24', fontSize: 13 }
const girdiBos: React.CSSProperties = { ...girdi, borderColor: 'rgba(180,131,47,0.6)', background: 'rgba(212,193,150,0.25)' }

const KAYNAK_ETIKET: Record<string, string> = {
  doktor_soyledi: 'Hekim söyledi',
  dosyadan: 'Dosyadan',
  belirsiz: 'Kaynak belirtilmedi — kontrol edin',
}

/**
 * NOTYA-EYLEM-21 — safety warnings, ABOVE the fields, severity-coloured, Turkish, NEVER collapsible.
 *
 * A warning behind a "Ayrıntı" toggle is a warning nobody read. `ciddi` is red and, on the card
 * logic below, costs a deliberate second tap; `orta` is amber; `bilgi` is blue. The kaynak line is
 * small but always present — a doctor weighing a warning needs to know whether it came from the
 * drug table, from this patient's own file, or from Ayşe.
 */
const UYARI_RENK: Record<string, { cizgi: string; zemin: string; yazi: string }> = {
  ciddi: { cizgi: 'rgba(239,68,68,0.55)', zemin: 'rgba(239,68,68,0.12)', yazi: '#B42318' },
  orta: { cizgi: 'rgba(245,158,11,0.5)', zemin: 'rgba(245,158,11,0.10)', yazi: '#8A5A12' },
  bilgi: { cizgi: 'rgba(59,130,246,0.45)', zemin: 'rgba(59,130,246,0.10)', yazi: '#1D4ED8' },
}

function UyariSatiri({ u, kaynakEtiketi = 'Kaynak' }: { u: EylemUyarisi; kaynakEtiketi?: string }) {
  const r = UYARI_RENK[u.siddet] || UYARI_RENK.bilgi
  return (
    <div style={{ border: `1px solid ${r.cizgi}`, background: r.zemin, borderRadius: 9, padding: '8px 10px', marginBottom: 6 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: r.yazi }}>
        {u.siddet === 'ciddi' ? '⚠ ' : u.siddet === 'orta' ? '• ' : 'ℹ '}
        {u.baslik}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 2 }}>{u.metin}</div>
      <div style={{ ...kucuk, marginTop: 3 }}>{kaynakEtiketi}: {u.kaynak}</div>
    </div>
  )
}

export function EylemUyarilari({ uyarilar, kaynakEtiketi }: { uyarilar?: EylemUyarisi[]; kaynakEtiketi?: string }) {
  if (!uyarilar?.length) return null
  // Most serious first: the eye lands on the top of the block.
  const sira = { ciddi: 0, orta: 1, bilgi: 2 } as const
  const sirali = [...uyarilar].sort((a, b) => (sira[a.siddet] ?? 3) - (sira[b.siddet] ?? 3))
  return <div style={{ marginBottom: 10 }}>{sirali.map((u, i) => <UyariSatiri key={i} u={u} kaynakEtiketi={kaynakEtiketi} />)}</div>
}

function trTarih(iso?: string | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [y, a, g] = iso.split('-')
  return `${g}.${a}.${y}`
}

/**
 * NOTYA-EYLEM-STALE-01 (Kaan, 2026-09-24) — how long ago this draft was proposed, so a card from
 * hours (or a previous day) earlier reads as stale on sight rather than looking like something the
 * doctor just said. Coarse buckets, not a live-ticking clock — this is a glance-and-move-on label,
 * not a stopwatch.
 */
function goreliZaman(iso?: string, m?: TopluMetin): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const dk = Math.floor((Date.now() - t) / 60000)
  // TOPLU-ULKE-01: the batch card passes the active country's copy; the single card keeps its own wording.
  if (m) {
    if (dk < 1) return m.zaman.azOnce
    if (dk < 60) return m.zaman.dakika(dk)
    const s = Math.floor(dk / 60)
    if (s < 24) return m.zaman.saat(s)
    const g = Math.floor(s / 24)
    if (g === 1) return m.zaman.dun
    if (g < 7) return m.zaman.gun(g)
    return new Date(iso).toLocaleDateString(m.tarihYerel, { day: 'numeric', month: 'long' })
  }
  if (dk < 1) return 'az önce'
  if (dk < 60) return `${dk} dakika önce`
  const sa = Math.floor(dk / 60)
  if (sa < 24) return `${sa} saat önce`
  const gun = Math.floor(sa / 24)
  if (gun === 1) return 'dün'
  if (gun < 7) return `${gun} gün önce`
  const d = new Date(iso)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

function Baslik({ hasta, etiket, kademe, createdAt, metin }: { hasta: EylemHasta; etiket: string; kademe: 'T1' | 'T2'; createdAt?: string; metin?: TopluMetin }) {
  const goreli = goreliZaman(createdAt, metin)
  // TOPLU-ULKE-01: with the active country's copy the birth date is written in that country's locale, not dd.mm.yyyy.
  const dogum = hasta.dogumTarihi && metin && /^\d{4}-\d{2}-\d{2}$/.test(hasta.dogumTarihi)
    ? new Date(`${hasta.dogumTarihi}T00:00:00Z`).toLocaleDateString(metin.tarihYerel, { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
    : trTarih(hasta.dogumTarihi)
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{hasta.ad}</div>
      {hasta.dogumTarihi ? <div style={{ fontSize: 14, color: '#8b7d70' }}>{dogum}</div> : null}
      <div style={{ ...kucuk, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {etiket}
        {kademe === 'T2' ? ' · değişiklik' : ''}
        {goreli ? ` · ${goreli}` : ''}
      </div>
    </div>
  )
}

export function EylemKarti({
  oneri,
  hasta,
  tokenAl = ensureDoctorAccessToken,
  onSonuc,
}: {
  oneri: EylemOneriGorunumu
  hasta: EylemHasta
  tokenAl?: () => Promise<string | null>
  onSonuc?: (d: { oneriId: string; kaydedildi: boolean }) => void
}) {
  const [deger, setDeger] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {}
    for (const a of oneri.alanlar) d[a.anahtar] = oneri.veri?.[a.anahtar] == null ? '' : String(oneri.veri[a.anahtar])
    return d
  })
  const [durum, setDurum] = useState<'acik' | 'kaydediliyor' | 'kaydedildi' | 'vazgecildi' | 'geri_alindi'>('acik')
  const [hata, setHata] = useState('')
  const [sonuc, setSonuc] = useState<{ kayitId: string; ilgiliSekme: { etiket: string; yol: string } | null } | null>(null)
  // NOTYA-EYLEM-21: the warnings shown here are the ones the server last computed. A commit re-runs
  // the check, so a refusal can arrive with FRESHER warnings than the card was drawn with — those
  // replace what is on screen rather than being appended to a stale list.
  const [uyarilar, setUyarilar] = useState<EylemUyarisi[]>(oneri.uyari_detay || [])
  const [onayBekliyor, setOnayBekliyor] = useState(false)
  const ciddiVar = uyarilar.some((u) => u.siddet === 'ciddi')

  const zorunlu = useMemo(() => new Set(oneri.zorunlu || []), [oneri.zorunlu])
  const eksik = useMemo(() => new Set(oneri.eksik_alanlar || []), [oneri.eksik_alanlar])
  const doldurulmamis = oneri.alanlar.filter((a) => zorunlu.has(a.anahtar) && !String(deger[a.anahtar] || '').trim())

  async function cagir(govde: Record<string, unknown>): Promise<{ ok: boolean; veri: Record<string, unknown> }> {
    const t = await tokenAl()
    if (!t) return { ok: false, veri: { error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' } }
    const r = await fetch('/api/doktor/eylem', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(govde),
    })
    return { ok: r.ok, veri: (await r.json().catch(() => ({}))) as Record<string, unknown> }
  }

  async function kaydet() {
    setHata('')
    // A `ciddi` warning does NOT block — the hekim is the authority. It costs one deliberate second
    // tap: the button becomes "Uyarıyı gördüm, kaydet" and only THAT tap sends the acknowledgement.
    // The server enforces the same rule independently (core/eylemler/onayla.ts), so a client that
    // skipped this step is refused there.
    if (ciddiVar && !onayBekliyor) {
      setOnayBekliyor(true)
      return
    }
    setDurum('kaydediliyor')
    const duzeltmeler: Record<string, unknown> = {}
    for (const a of oneri.alanlar) if (String(deger[a.anahtar] ?? '').trim()) duzeltmeler[a.anahtar] = deger[a.anahtar]
    const r = await cagir({ adim: 'onayla', oneriId: oneri.id, duzeltmeler, uyariGoruldu: onayBekliyor })
    if (!r.ok) {
      if (Array.isArray(r.veri.uyarilar)) setUyarilar(r.veri.uyarilar as EylemUyarisi[])
      if (r.veri.uyariOnayiGerekli) setOnayBekliyor(true)
      setHata(String(r.veri.error || 'Kaydedilemedi.'))
      setDurum('acik')
      return
    }
    setSonuc({ kayitId: String(r.veri.kayitId || ''), ilgiliSekme: (r.veri.ilgiliSekme as { etiket: string; yol: string } | null) ?? null })
    setDurum('kaydedildi')
    onSonuc?.({ oneriId: oneri.id, kaydedildi: true })
  }

  async function vazgec() {
    await cagir({ adim: 'vazgec', oneriId: oneri.id })
    setDurum('vazgecildi')
    onSonuc?.({ oneriId: oneri.id, kaydedildi: false })
  }

  async function geriAl() {
    if (!sonuc?.kayitId) return
    setHata('')
    const r = await cagir({ adim: 'geri_al', kayitId: sonuc.kayitId })
    if (!r.ok) {
      setHata(String(r.veri.error || 'Geri alınamadı.'))
      return
    }
    setDurum('geri_alindi')
  }

  if (durum === 'vazgecildi') return <div style={{ ...kart, background: 'rgba(58,44,34,0.04)', borderColor: 'rgba(58,44,34,0.12)', color: '#8b7d70' }}>Vazgeçildi — dosyaya hiçbir şey yazılmadı.</div>
  if (durum === 'geri_alindi') return <div style={{ ...kart, background: 'rgba(58,44,34,0.04)', borderColor: 'rgba(58,44,34,0.12)', color: '#8b7d70' }}>Geri alındı.</div>

  if (durum === 'kaydedildi') {
    return (
      <div style={{ ...kart, borderColor: 'rgba(34,197,94,0.45)', background: 'rgba(34,197,94,0.08)' }}>
        <div style={{ fontWeight: 700 }}>Kaydedildi · {oneri.etiket}</div>
        <div style={{ ...kucuk, marginTop: 2 }}>{hasta.ad}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sonuc?.ilgiliSekme ? (
            <Link href={sonuc.ilgiliSekme.yol} style={{ ...btn, textDecoration: 'none', display: 'inline-block' }}>
              {sonuc.ilgiliSekme.etiket}
            </Link>
          ) : null}
          <button type="button" onClick={geriAl} style={hayalet}>Geri al</button>
        </div>
        {hata ? <div style={{ ...kucuk, color: '#B42318', marginTop: 6 }}>{hata}</div> : null}
      </div>
    )
  }

  return (
    <div style={kart}>
      <Baslik hasta={hasta} etiket={oneri.etiket} kademe={oneri.kademe} createdAt={oneri.created_at} />

      <EylemUyarilari uyarilar={uyarilar} />

      {(oneri.uyarilar || []).map((u, i) => (
        <div key={i} style={{ ...kucuk, color: '#8A5A12', marginBottom: 6 }}>⚠ {u}</div>
      ))}

      <div style={{ display: 'grid', gap: 10 }}>
        {oneri.alanlar.map((a) => {
          const bos = !String(deger[a.anahtar] || '').trim()
          const isaretli = bos && (eksik.has(a.anahtar) || zorunlu.has(a.anahtar))
          const k = oneri.alan_kaynaklari?.[a.anahtar]
          const oncekiDeger = oneri.once?.[a.anahtar]
          return (
            <label key={a.anahtar} style={{ display: 'block' }}>
              <div style={{ ...kucuk, marginBottom: 3 }}>
                {a.etiket}
                {a.birim ? ` (${a.birim})` : ''}
                {zorunlu.has(a.anahtar) ? ' *' : ''}
              </div>
              {oneri.kademe === 'T2' && oncekiDeger != null && String(oncekiDeger) !== '' ? (
                <div style={{ ...kucuk, marginBottom: 3 }}>
                  <span style={{ textDecoration: 'line-through' }}>{String(oncekiDeger)}</span> → <span style={{ color: '#2f4334' }}>{deger[a.anahtar] || '…'}</span>
                </div>
              ) : null}
              {a.tip === 'secim' ? (
                <select value={deger[a.anahtar] || ''} onChange={(e) => setDeger((d) => ({ ...d, [a.anahtar]: e.target.value }))} style={isaretli ? girdiBos : girdi}>
                  <option value="">Seçin…</option>
                  {(a.secenekler || []).map((s) => (
                    <option key={s.deger} value={s.deger}>{s.etiket}</option>
                  ))}
                </select>
              ) : a.tip === 'uzunMetin' ? (
                <textarea rows={3} value={deger[a.anahtar] || ''} onChange={(e) => setDeger((d) => ({ ...d, [a.anahtar]: e.target.value }))} style={{ ...(isaretli ? girdiBos : girdi), resize: 'vertical' }} />
              ) : (
                <input
                  type={a.tip === 'tarih' ? 'date' : a.tip === 'sayi' ? 'number' : 'text'}
                  step={a.tip === 'sayi' ? 'any' : undefined}
                  value={deger[a.anahtar] || ''}
                  readOnly={Boolean(a.sunucu)}
                  onChange={(e) => { if (!a.sunucu) setDeger((d) => ({ ...d, [a.anahtar]: e.target.value })) }}
                  style={a.sunucu ? { ...girdi, opacity: 0.75 } : isaretli ? girdiBos : girdi}
                />
              )}
              {oneri.eylem_anahtar === 'asi_kaydi_ekle' && a.anahtar === 'uygulama_tarihi' && !String(deger[a.anahtar] || '').trim() && hasta.dogumTarihi ? (
                <button
                  type="button"
                  onClick={() => setDeger((d) => ({ ...d, uygulama_tarihi: String(hasta.dogumTarihi) }))}
                  style={{ ...btn, marginTop: 6, fontSize: 11, padding: '5px 10px' }}
                >
                  Doğum tarihinde uygulandı
                </button>
              ) : null}
              {isaretli ? <div style={{ ...kucuk, color: '#8A5A12', marginTop: 3 }}>Ayşe bu alandan emin değil — siz girin.</div> : null}
              {!bos && k && KAYNAK_ETIKET[k.kaynak] ? (
                <div style={{ ...kucuk, marginTop: 3 }}>Kaynak: {KAYNAK_ETIKET[k.kaynak]}{k.alinti ? ` — “${k.alinti}”` : ''}</div>
              ) : null}
            </label>
          )
        })}
      </div>

      {oneri.portalaYansir ? <div style={{ ...kucuk, marginTop: 8, color: '#2f4334' }}>Hasta portalında da görünecek.</div> : null}
      {hata ? <div style={{ ...kucuk, color: '#B42318', marginTop: 8 }}>{hata}</div> : null}

      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={kaydet}
          disabled={durum === 'kaydediliyor' || doldurulmamis.length > 0}
          style={{
            ...birincil,
            ...(onayBekliyor ? { background: '#DC2626', borderColor: '#DC2626' } : {}),
            minHeight: 44,
            opacity: durum === 'kaydediliyor' || doldurulmamis.length ? 0.5 : 1,
            cursor: doldurulmamis.length ? 'not-allowed' : 'pointer',
          }}
        >
          {durum === 'kaydediliyor' ? 'Kaydediliyor…' : onayBekliyor ? 'Uyarıyı gördüm, kaydet' : 'Kaydet'}
        </button>
        <button type="button" onClick={vazgec} style={hayalet}>Vazgeç</button>
        {doldurulmamis.length ? <span style={{ ...kucuk, color: '#8A5A12' }}>Önce doldurun: {doldurulmamis.map((a) => a.etiket).join(', ')}</span> : null}
      </div>
    </div>
  )
}

/**
 * Batch card — "epikrizdeki her şeyi işle" produces several proposals at once (docs §4 P2).
 * ONE card with checkbox rows, not five stacked cards: the doctor reads the list, unticks what is
 * wrong, and taps once. A row with a missing required field CAN be ticked and shows inline inputs for
 * the missing fields; it is written only once the doctor has filled them (same rule as the single
 * card, per row), so a batch can never become the way to slip a guess through.
 */
export function EylemToplu({
  oneriler,
  hasta,
  tokenAl = ensureDoctorAccessToken,
  onSonuc,
  metin = AKTIF_TOPLU,
}: {
  oneriler: EylemOneriGorunumu[]
  hasta: EylemHasta
  tokenAl?: () => Promise<string | null>
  onSonuc?: (d: { kaydedilen: number }) => void
  /** TOPLU-ULKE-01: card wording; defaults to the active country's. */
  metin?: TopluMetin
}) {
  // Server-sent labels are Turkish; the country copy overrides the ones it lists (base medication action), others fall back.
  const alanEtiketi = (a: EylemAlan) => metin.alanEtiketleri[a.anahtar] ?? a.etiket
  const eylemEtiketi = (o: EylemOneriGorunumu) => metin.eylemEtiketleri[o.eylem_anahtar] ?? o.etiket
  // BUG FIX (2026-10-16): rows with missing required fields used to be `disabled` with no way to fill
  // them, so the whole batch was stuck. Rows are always tickable now; missing fields get inline inputs
  // and a row is only written once ticked AND complete. All gating lives in ./topluSecim (tested).
  const [secili, setSecili] = useState<Record<string, boolean>>(() => baslangicSecimi(oneriler))
  const [gorulen, setGorulen] = useState<Record<string, boolean>>({})
  const [duzeltme, setDuzeltme] = useState<TopluDuzeltme>({})
  const [durum, setDurum] = useState<'acik' | 'kaydediliyor' | 'bitti'>('acik')
  const [rapor, setRapor] = useState<{ oneriId: string; ok: boolean; hata?: string }[]>([])

  const say = sayim(oneriler, secili, duzeltme, gorulen)

  async function kaydet() {
    setDurum('kaydediliyor')
    const t = await tokenAl()
    if (!t) {
      setDurum('acik')
      return
    }
    const r = await fetch('/api/doktor/eylem', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(topluGovde(oneriler, secili, duzeltme, gorulen)),
    })
    const d = (await r.json().catch(() => ({}))) as { sonuclar?: { oneriId: string; ok: boolean; hata?: string }[] }
    setRapor(d.sonuclar || [])
    setDurum('bitti')
    onSonuc?.({ kaydedilen: (d.sonuclar || []).filter((s) => s.ok).length })
  }

  const ozet = (o: EylemOneriGorunumu) =>
    o.alanlar
      .map((a) => (o.veri?.[a.anahtar] == null || String(o.veri[a.anahtar]) === '' ? null : `${alanEtiketi(a)}: ${o.veri[a.anahtar]}`))
      .filter(Boolean)
      .join(' · ')

  return (
    <div style={kart}>
      <Baslik hasta={hasta} etiket={metin.kayitHazirlandi(oneriler.length)} kademe="T1" metin={metin} />
      <div style={{ display: 'grid', gap: 8 }}>
        {oneriler.map((o) => {
          const eksik = eksikAlanlar(o, duzeltme)
          const ciddi = ciddiVarMi(o)
          const r = rapor.find((x) => x.oneriId === o.id)
          return (
            <div key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', paddingBottom: 8, borderBottom: '1px solid rgba(58,44,34,0.08)' }}>
              <input
                type="checkbox"
                checked={Boolean(secili[o.id])}
                disabled={durum !== 'acik'}
                onChange={(e) => setSecili((s) => ({ ...s, [o.id]: e.target.checked }))}
                style={{ marginTop: 3 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{eylemEtiketi(o)}{goreliZaman(o.created_at, metin) ? <span style={{ ...kucuk, fontWeight: 400 }}> · {goreliZaman(o.created_at, metin)}</span> : null}</div>
                <div style={kucuk}>{ozet(o) || '—'}</div>
                <EylemUyarilari uyarilar={o.uyari_detay} kaynakEtiketi={metin.kaynak} />
                {ciddi ? (
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', minHeight: 44, fontSize: 12.5, color: '#B42318', fontWeight: 700 }}>
                    <input type="checkbox" checked={Boolean(gorulen[o.id])} disabled={durum !== 'acik'} onChange={(e) => setGorulen((g) => ({ ...g, [o.id]: e.target.checked }))} />
                    {metin.uyariGordum}
                  </label>
                ) : null}
                {(o.zorunlu || []).some((k) => !String(o.veri?.[k] ?? '').trim()) && !r?.ok ? (
                  <div style={{ display: 'grid', gap: 6, marginTop: 4 }}>
                    <div style={{ ...kucuk, color: '#8A5A12' }}>
                      {metin.eksikAciklama}
                    </div>
                    {(o.zorunlu || [])
                      .filter((k) => !String(o.veri?.[k] ?? '').trim())
                      .map((k) => o.alanlar.find((a) => a.anahtar === k))
                      .filter((a): a is EylemAlan => Boolean(a) && !a?.sunucu)
                      .map((a) => {
                        const v = duzeltme[o.id]?.[a.anahtar] || ''
                        const yaz = (x: string) => setDuzeltme((d) => ({ ...d, [o.id]: { ...d[o.id], [a.anahtar]: x } }))
                        return (
                          <label key={a.anahtar} style={{ display: 'block' }}>
                            <div style={{ ...kucuk, marginBottom: 2 }}>{alanEtiketi(a)}{a.birim ? ` (${a.birim})` : ''} *</div>
                            {a.tip === 'secim' ? (
                              <select value={v} disabled={durum !== 'acik'} onChange={(e) => yaz(e.target.value)} style={v.trim() ? girdi : girdiBos}>
                                <option value="">{metin.seciniz}</option>
                                {(a.secenekler || []).map((s) => <option key={s.deger} value={s.deger}>{s.etiket}</option>)}
                              </select>
                            ) : (
                              <input
                                type={a.tip === 'tarih' ? 'date' : a.tip === 'sayi' ? 'number' : 'text'}
                                step={a.tip === 'sayi' ? 'any' : undefined}
                                value={v}
                                disabled={durum !== 'acik'}
                                onChange={(e) => yaz(e.target.value)}
                                style={v.trim() ? girdi : girdiBos}
                              />
                            )}
                          </label>
                        )
                      })}
                    {secili[o.id] && eksik.length ? <div style={{ ...kucuk, color: '#8A5A12' }}>{metin.seciliEksik(eksik.map((k) => { const a = o.alanlar.find((x) => x.anahtar === k); return a ? alanEtiketi(a) : k }))}</div> : null}
                  </div>
                ) : null}
                {r ? <div style={{ ...kucuk, color: r.ok ? '#1E7A3E' : '#B42318' }}>{r.ok ? metin.kaydedildi : r.hata}</div> : null}
              </div>
            </div>
          )
        })}
      </div>
      {durum !== 'bitti' ? (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={kaydet} disabled={durum === 'kaydediliyor' || !say.hazir} style={{ ...birincil, opacity: !say.hazir ? 0.5 : 1 }}>
            {durum === 'kaydediliyor' ? metin.kaydediliyor : dugmeMetni(say, metin)}
          </button>
        </div>
      ) : null}
    </div>
  )
}
