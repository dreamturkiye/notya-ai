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
 * Inline styles, matching components/core/CihazdanAl.tsx (this codebase does not use Tailwind in
 * app components). Works at 390px: fields stack, buttons wrap.
 */
import React, { useMemo, useState } from 'react'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'

export interface EylemAlan {
  anahtar: string
  etiket: string
  tip: 'metin' | 'uzunMetin' | 'sayi' | 'tarih' | 'secim' | 'mantik'
  secenekler?: { deger: string; etiket: string }[]
  birim?: string
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
  zorunlu?: string[]
  portalaYansir?: boolean
  /** T2 only — what the row looks like today, so the card can show önce → sonra. */
  once?: Record<string, unknown> | null
}

export interface EylemHasta {
  ad: string
  dogumTarihi?: string | null
}

const kart: React.CSSProperties = { marginTop: 8, background: 'rgba(15,155,142,0.08)', border: '1px solid rgba(15,155,142,0.35)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#EDF1F7' }
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5' }
const btn: React.CSSProperties = { border: '1px solid rgba(15,155,142,0.45)', color: '#2DD4BF', background: 'rgba(15,155,142,0.14)', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
const birincil: React.CSSProperties = { ...btn, background: '#0F9B8E', color: '#fff', borderColor: '#0F9B8E' }
const hayalet: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', borderColor: 'rgba(255,255,255,0.15)' }
const girdi: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: '7px 9px', color: '#EDF1F7', fontSize: 13 }
const girdiBos: React.CSSProperties = { ...girdi, borderColor: 'rgba(250,204,21,0.55)', background: 'rgba(250,204,21,0.08)' }

const KAYNAK_ETIKET: Record<string, string> = { doktor_soyledi: 'Hekim söyledi', dosyadan: 'Dosyadan' }

function trTarih(iso?: string | null): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [y, a, g] = iso.split('-')
  return `${g}.${a}.${y}`
}

function Baslik({ hasta, etiket, kademe }: { hasta: EylemHasta; etiket: string; kademe: 'T1' | 'T2' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{hasta.ad}</div>
      {hasta.dogumTarihi ? <div style={{ fontSize: 14, color: '#94A3B8' }}>{trTarih(hasta.dogumTarihi)}</div> : null}
      <div style={{ ...kucuk, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {etiket}
        {kademe === 'T2' ? ' · değişiklik' : ''}
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
    setDurum('kaydediliyor')
    const duzeltmeler: Record<string, unknown> = {}
    for (const a of oneri.alanlar) if (String(deger[a.anahtar] ?? '').trim()) duzeltmeler[a.anahtar] = deger[a.anahtar]
    const r = await cagir({ adim: 'onayla', oneriId: oneri.id, duzeltmeler })
    if (!r.ok) {
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

  if (durum === 'vazgecildi') return <div style={{ ...kart, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.12)', color: '#8FA0B5' }}>Vazgeçildi — dosyaya hiçbir şey yazılmadı.</div>
  if (durum === 'geri_alindi') return <div style={{ ...kart, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.12)', color: '#8FA0B5' }}>Geri alındı.</div>

  if (durum === 'kaydedildi') {
    return (
      <div style={{ ...kart, borderColor: 'rgba(34,197,94,0.45)', background: 'rgba(34,197,94,0.08)' }}>
        <div style={{ fontWeight: 700 }}>Kaydedildi · {oneri.etiket}</div>
        <div style={{ ...kucuk, marginTop: 2 }}>{hasta.ad}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sonuc?.ilgiliSekme ? (
            <a href={sonuc.ilgiliSekme.yol} style={{ ...btn, textDecoration: 'none', display: 'inline-block' }}>
              {sonuc.ilgiliSekme.etiket}
            </a>
          ) : null}
          <button type="button" onClick={geriAl} style={hayalet}>Geri al</button>
        </div>
        {hata ? <div style={{ ...kucuk, color: '#FCA5A5', marginTop: 6 }}>{hata}</div> : null}
      </div>
    )
  }

  return (
    <div style={kart}>
      <Baslik hasta={hasta} etiket={oneri.etiket} kademe={oneri.kademe} />

      {(oneri.uyarilar || []).map((u, i) => (
        <div key={i} style={{ ...kucuk, color: '#FCD34D', marginBottom: 6 }}>⚠ {u}</div>
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
                  <span style={{ textDecoration: 'line-through' }}>{String(oncekiDeger)}</span> → <span style={{ color: '#2DD4BF' }}>{deger[a.anahtar] || '…'}</span>
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
                  onChange={(e) => setDeger((d) => ({ ...d, [a.anahtar]: e.target.value }))}
                  style={isaretli ? girdiBos : girdi}
                />
              )}
              {isaretli ? <div style={{ ...kucuk, color: '#FCD34D', marginTop: 3 }}>Ayşe bu alandan emin değil — siz girin.</div> : null}
              {!bos && k && KAYNAK_ETIKET[k.kaynak] ? (
                <div style={{ ...kucuk, marginTop: 3 }}>Kaynak: {KAYNAK_ETIKET[k.kaynak]}{k.alinti ? ` — “${k.alinti}”` : ''}</div>
              ) : null}
            </label>
          )
        })}
      </div>

      {oneri.portalaYansir ? <div style={{ ...kucuk, marginTop: 8, color: '#2DD4BF' }}>Hasta portalında da görünecek.</div> : null}
      {hata ? <div style={{ ...kucuk, color: '#FCA5A5', marginTop: 8 }}>{hata}</div> : null}

      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={kaydet} disabled={durum === 'kaydediliyor' || doldurulmamis.length > 0} style={{ ...birincil, opacity: durum === 'kaydediliyor' || doldurulmamis.length ? 0.5 : 1, cursor: doldurulmamis.length ? 'not-allowed' : 'pointer' }}>
          {durum === 'kaydediliyor' ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button type="button" onClick={vazgec} style={hayalet}>Vazgeç</button>
        {doldurulmamis.length ? <span style={{ ...kucuk, color: '#FCD34D' }}>Önce doldurun: {doldurulmamis.map((a) => a.etiket).join(', ')}</span> : null}
      </div>
    </div>
  )
}

/**
 * Batch card — "epikrizdeki her şeyi işle" produces several proposals at once (docs §4 P2).
 * ONE card with checkbox rows, not five stacked cards: the doctor reads the list, unticks what is
 * wrong, and taps once. A row with a missing required field cannot be ticked — the same rule as the
 * single card, applied per row, so a batch can never become the way to slip a guess through.
 */
export function EylemToplu({
  oneriler,
  hasta,
  tokenAl = ensureDoctorAccessToken,
  onSonuc,
}: {
  oneriler: EylemOneriGorunumu[]
  hasta: EylemHasta
  tokenAl?: () => Promise<string | null>
  onSonuc?: (d: { kaydedilen: number }) => void
}) {
  const eksikOlan = (o: EylemOneriGorunumu) => (o.zorunlu || []).filter((k) => o.veri?.[k] == null || String(o.veri[k]).trim() === '')
  const [secili, setSecili] = useState<Record<string, boolean>>(() => Object.fromEntries(oneriler.map((o) => [o.id, eksikOlan(o).length === 0])))
  const [durum, setDurum] = useState<'acik' | 'kaydediliyor' | 'bitti'>('acik')
  const [rapor, setRapor] = useState<{ oneriId: string; ok: boolean; hata?: string }[]>([])

  const secililer = oneriler.filter((o) => secili[o.id] && eksikOlan(o).length === 0)

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
      body: JSON.stringify({ adim: 'toplu_onayla', oneriIdler: secililer.map((o) => o.id) }),
    })
    const d = (await r.json().catch(() => ({}))) as { sonuclar?: { oneriId: string; ok: boolean; hata?: string }[] }
    setRapor(d.sonuclar || [])
    setDurum('bitti')
    onSonuc?.({ kaydedilen: (d.sonuclar || []).filter((s) => s.ok).length })
  }

  const ozet = (o: EylemOneriGorunumu) =>
    o.alanlar
      .map((a) => (o.veri?.[a.anahtar] == null || String(o.veri[a.anahtar]) === '' ? null : `${a.etiket}: ${o.veri[a.anahtar]}`))
      .filter(Boolean)
      .join(' · ')

  return (
    <div style={kart}>
      <Baslik hasta={hasta} etiket={`${oneriler.length} kayıt hazırlandı`} kademe="T1" />
      <div style={{ display: 'grid', gap: 8 }}>
        {oneriler.map((o) => {
          const eksik = eksikOlan(o)
          const r = rapor.find((x) => x.oneriId === o.id)
          return (
            <div key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <input
                type="checkbox"
                checked={Boolean(secili[o.id]) && !eksik.length}
                disabled={eksik.length > 0 || durum !== 'acik'}
                onChange={(e) => setSecili((s) => ({ ...s, [o.id]: e.target.checked }))}
                style={{ marginTop: 3 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{o.etiket}</div>
                <div style={kucuk}>{ozet(o) || '—'}</div>
                {eksik.length ? (
                  <div style={{ ...kucuk, color: '#FCD34D' }}>
                    Eksik alan var — tek tek açıp doldurmanız gerekiyor ({eksik.map((k) => o.alanlar.find((a) => a.anahtar === k)?.etiket || k).join(', ')}).
                  </div>
                ) : null}
                {r ? <div style={{ ...kucuk, color: r.ok ? '#22C55E' : '#FCA5A5' }}>{r.ok ? 'Kaydedildi' : r.hata}</div> : null}
              </div>
            </div>
          )
        })}
      </div>
      {durum !== 'bitti' ? (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={kaydet} disabled={durum === 'kaydediliyor' || !secililer.length} style={{ ...birincil, opacity: !secililer.length ? 0.5 : 1 }}>
            {durum === 'kaydediliyor' ? 'Kaydediliyor…' : `Seçilenleri kaydet (${secililer.length})`}
          </button>
        </div>
      ) : null}
    </div>
  )
}
