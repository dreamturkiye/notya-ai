'use client'
/**
 * HASTA-PORTALI-GUNLUK — "Ev verisi" card in the patient file (core: every branş). Loaded on demand (next/dynamic from
 * the patient-file page; its own request, never part of the patient-file payload — performans-butcesi-koruma).
 * Shows: open home-data alerts ("Gördüm" clears the Fısıltı), 28-day charts per metric with the target band, adherence
 * (7 / 30 days, per medicine, kritik flag), the Kontrol Öncesi Özet, the patient's questions, and per-patient threshold
 * editing with the guideline defaults as placeholders. Without the patient's KVKK consent: that fact only.
 */
import { useCallback, useEffect, useState } from 'react'
import type { EvVerisiKarti as Veri } from '@/lib/saglikEvi/evVerisi'
import { CHROME_RENK as R } from '@/lib/doktor/chromeRenk'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { OLCUM_TANIMLARI, metrikEtiketi } from '@/lib/saglikEvi/olcumler'
import type { EsikSeti } from '@/lib/saglikEvi/hedefler'
import type { OlcumTipi } from '@/lib/saglikEvi/tipler'

const panel: React.CSSProperties = { background: '#fff', border: `1px solid ${R.border}`, borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden' }
const kucuk: React.CSSProperties = { fontSize: 12, color: R.muted }
const btn: React.CSSProperties = { minHeight: 34, padding: '0 12px', borderRadius: 999, border: `1px solid ${R.border}`, background: '#faf6ee', color: R.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnAna: React.CSSProperties = { ...btn, background: R.pine, color: '#faf6ee', borderColor: R.pine }
const DUZEY: Record<string, { ad: string; renk: string }> = { acil: { ad: 'Acil eşik', renk: '#8b3a2e' }, hekime_bildir: { ad: 'Bildirim', renk: R.warn }, dikkat: { ad: 'Dikkat', renk: '#9a7a2e' } }
const trTarih = (iso: string) => new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
const f = (x: number | null, o = 0) => (x == null ? '—' : (Math.round(x * 10 ** o) / 10 ** o).toLocaleString('tr-TR'))

function Grafik({ m }: { m: Veri['metrikler'][number] }) {
  const W = 300, H = 96, P = 6
  const t0 = Date.now() - 28 * 86_400_000
  const v = m.noktalar.flatMap((n) => [n.deger, ...(n.deger2 != null ? [n.deger2] : [])])
  let min = Math.min(...v, ...(m.hedefMin != null ? [m.hedefMin] : [])), max = Math.max(...v, ...(m.hedefMax != null ? [m.hedefMax] : []))
  const pay = (max - min || 1) * 0.12; min -= pay; max += pay
  const x = (iso: string) => P + ((Date.parse(iso) - t0) / (28 * 86_400_000)) * (W - 2 * P)
  const y = (d: number) => P + (1 - (d - min) / (max - min || 1)) * (H - 2 * P)
  const ust = m.hedefMax, alt = m.hedefMin
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${m.etiket} — 28 gün`} style={{ display: 'block' }}>
      {ust != null || alt != null ? <rect x={0} width={W} y={y(ust ?? max)} height={Math.max(0, y(alt ?? min) - y(ust ?? max))} fill={R.pine} opacity={0.07} /> : null}
      {m.hedefMax2 != null ? <line x1={0} x2={W} y1={y(m.hedefMax2)} y2={y(m.hedefMax2)} stroke={R.pine} strokeOpacity={0.25} strokeDasharray="3 3" /> : null}
      <line x1={x(new Date(Date.now() - 7 * 86_400_000).toISOString())} x2={x(new Date(Date.now() - 7 * 86_400_000).toISOString())} y1={0} y2={H} stroke={R.muted} strokeOpacity={0.25} strokeDasharray="2 3" />
      {m.noktalar.map((n, i) => (
        <g key={i}>
          {n.deger2 != null ? <line x1={x(n.at)} x2={x(n.at)} y1={y(n.deger)} y2={y(n.deger2)} stroke="#b4832f" strokeOpacity={0.35} strokeWidth={2} /> : null}
          <circle cx={x(n.at)} cy={y(n.deger)} r={2.6} fill="#b4832f" />
          {n.deger2 != null ? <circle cx={x(n.at)} cy={y(n.deger2)} r={2.2} fill="#b4832f" opacity={0.55} /> : null}
        </g>
      ))}
    </svg>
  )
}

const ALANLAR: Array<[keyof EsikSeti, string]> = [['hedefMin', 'Hedef alt'], ['hedefMax', 'Hedef üst'], ['hedefMax2', 'Hedef üst (diyastolik)'], ['dikkatUst', 'Dikkat ≥'], ['dikkatAlt', 'Dikkat <'], ['bildirUst', 'Bildir ≥'], ['bildirAlt', 'Bildir <'], ['acilUst', 'Acil ≥'], ['acilAlt', 'Acil <'], ['bildirUst2', 'Bildir ≥ (diyastolik)'], ['acilUst2', 'Acil ≥ (diyastolik)'], ['trendDelta', 'Eğilim: haftalık artış ≥'], ['trendTaban', 'Eğilim: haftalık ort. ≥']]

function EsikPaneli({ veri, kaydet }: { veri: Veri; kaydet: (ayar: Record<string, unknown>) => Promise<void> }) {
  const varsayilan = veri.varsayilan as Record<string, EsikSeti>
  const [esik, setEsik] = useState<Record<string, Partial<Record<keyof EsikSeti, string>>>>(() => Object.fromEntries(Object.entries(veri.hekimAyar.esikler || {}).map(([k, v]) => [k, Object.fromEntries(Object.entries(v || {}).map(([a, n]) => [a, String(n)]))])))
  const [olcumler, setOlcumler] = useState<OlcumTipi[]>(veri.olcumTipleri)
  const [ldl, setLdl] = useState(veri.hekimAyar.ldlHedef ? String(veri.hekimAyar.ldlHedef) : '')
  const [kilo, setKilo] = useState<boolean>(veri.hekimAyar.kiloBildir ?? false)
  const [mesgul, setMesgul] = useState(false)
  const anahtarlar = Object.keys(varsayilan).filter((k) => Object.keys(varsayilan[k]).length && olcumler.includes(k.split(':')[0] as OlcumTipi))
  return (
    <div style={{ borderTop: `1px solid ${R.border}`, marginTop: 12, paddingTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Bu hasta için ölçümler</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {(Object.keys(OLCUM_TANIMLARI) as OlcumTipi[]).map((t) => (
          <label key={t} style={{ ...btn, display: 'inline-flex', alignItems: 'center', gap: 6, background: olcumler.includes(t) ? '#e3e8df' : '#fff' }}>
            <input type="checkbox" checked={olcumler.includes(t)} onChange={(e) => setOlcumler(e.target.checked ? [...olcumler, t] : olcumler.filter((x) => x !== t))} />{OLCUM_TANIMLARI[t].ad}
          </label>
        ))}
      </div>
      {anahtarlar.map((k) => (
        <fieldset key={k} style={{ border: `1px solid ${R.border}`, borderRadius: 12, padding: '8px 10px 10px', margin: '0 0 8px' }}>
          <legend style={{ fontSize: 12.5, fontWeight: 700, padding: '0 4px' }}>{metrikEtiketi(k)} <span style={kucuk}>({OLCUM_TANIMLARI[k.split(':')[0] as OlcumTipi].birim})</span></legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
            {ALANLAR.filter(([a]) => varsayilan[k][a] != null).map(([a, ad]) => (
              <label key={a} style={{ fontSize: 11.5, color: R.muted, display: 'grid', gap: 2 }}>{ad}
                <input inputMode="decimal" placeholder={String(varsayilan[k][a])} value={esik[k]?.[a] ?? ''} onChange={(e) => setEsik({ ...esik, [k]: { ...(esik[k] || {}), [a]: e.target.value.replace(',', '.') } })} style={{ minHeight: 32, borderRadius: 8, border: `1px solid ${R.border}`, padding: '0 8px', fontSize: 13, color: R.ink }} />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', margin: '8px 0' }}>
        <label style={{ fontSize: 12.5, display: 'inline-flex', gap: 6, alignItems: 'center' }}>LDL hedefi (mg/dL) <input inputMode="numeric" value={ldl} onChange={(e) => setLdl(e.target.value)} style={{ width: 70, minHeight: 30, borderRadius: 8, border: `1px solid ${R.border}`, padding: '0 6px' }} /></label>
        <label style={{ fontSize: 12.5, display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={kilo} onChange={(e) => setKilo(e.target.checked)} />3 günde +2 kg artışı bana bildir</label>
      </div>
      <p style={{ ...kucuk, margin: '4px 0 8px' }}>Boş alanlar kılavuz varsayılanını kullanır (gri değer). Kaynaklar: ESC 2024 / ESH 2023 hipertansiyon, TEMD diyabet kılavuzu (son baskı), ADA Standards of Care, gebelikte SB Doğum Öncesi Bakım Rehberi.</p>
      <button type="button" style={btnAna} disabled={mesgul} onClick={async () => {
        setMesgul(true)
        const temiz: Record<string, Record<string, number>> = {}
        for (const [k, v] of Object.entries(esik)) for (const [a, n] of Object.entries(v || {})) if (n !== '' && n != null && Number.isFinite(Number(n))) (temiz[k] ||= {})[a] = Number(n)
        const ekstra = olcumler.filter((t) => !veri.olcumTipleri.includes(t))
        const kapali = veri.olcumTipleri.filter((t) => !olcumler.includes(t))
        try { await kaydet({ esikler: temiz, olcumler: [...(veri.hekimAyar.olcumler || []).filter((t) => olcumler.includes(t)), ...ekstra], kapali, ldlHedef: ldl ? Number(ldl) : null, kiloBildir: kilo }) } finally { setMesgul(false) }
      }}>Kaydet</button>
    </div>
  )
}

export default function EvVerisiKarti({ patientId, ornek }: { patientId: string; ornek?: Veri }) {
  const [veri, setVeri] = useState<Veri | null>(ornek || null)
  const [hata, setHata] = useState<string | null>(null)
  const [esikAcik, setEsikAcik] = useState(false)
  const [ozetAcik, setOzetAcik] = useState(false)
  const [mesgul, setMesgul] = useState(false)
  const url = `/api/doktor/hastalar/${encodeURIComponent(patientId)}/ev-verisi`
  const yukle = useCallback(async () => {
    if (ornek) return
    try {
      const r = await doktorFetch(url, {})
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || 'Ev verisi yüklenemedi.')
      setVeri(j as Veri); setHata(null)
    } catch (e) { setHata(e instanceof Error ? e.message : 'Ev verisi yüklenemedi.') }
  }, [url, ornek])
  useEffect(() => { void yukle() }, [yukle])
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ev') === '1') document.getElementById('ev-verisi-karti')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [veri])
  const istek = async (method: 'POST' | 'PATCH', govde: unknown) => {
    if (ornek) return
    setMesgul(true)
    try { await doktorFetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(govde) }); await yukle() } finally { setMesgul(false) }
  }

  if (hata) return <div style={panel}><div style={{ fontSize: 14, fontWeight: 700 }}>Ev verisi</div><div style={{ ...kucuk, marginTop: 6 }}>{hata}</div></div>
  if (!veri) return <div style={panel}><div style={{ fontSize: 14, fontWeight: 700 }}>Ev verisi</div><div style={{ ...kucuk, marginTop: 6 }}>Yükleniyor…</div></div>

  const baslik = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: R.ink }}>Ev verisi <span style={{ ...kucuk, fontWeight: 500 }}>· Sağlığım</span></div>
      {veri.acikUyari ? <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: R.warn, borderRadius: 999, padding: '2px 9px' }}>{veri.acikUyari} yeni uyarı</span> : null}
    </div>
  )
  const cizgi = <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 2, background: `linear-gradient(90deg, ${R.pine}, transparent)` }} />

  if (!veri.onay) {
    return (
      <div id="ev-verisi-karti" style={panel}>{cizgi}{baslik}
        <div style={{ fontSize: 13, color: R.muted, lineHeight: 1.5 }}>{veri.kullaniyor ? 'Hasta Sağlığım günlüğünü kullanıyor ancak ev verisini sizinle paylaşmaya onay vermedi (KVKK açık rıza). Hastanın ekranında onay sorusu durur.' : 'Hasta henüz Sağlığım günlüğünü kullanmıyor. Sağlığım bağlantısı gönderildiğinde ilaç saatleri ve ev ölçümleri burada görünür.'}</div>
        <button type="button" style={{ ...btn, marginTop: 10 }} onClick={() => setEsikAcik(!esikAcik)}>{esikAcik ? 'Kapat' : 'Hedef ve eşikleri ayarla'}</button>
        {esikAcik ? <EsikPaneli veri={veri} kaydet={(a) => istek('PATCH', { ayarlar: a })} /> : null}
      </div>
    )
  }

  const acik = veri.uyarilar.filter((u) => !u.goruldu)
  return (
    <div id="ev-verisi-karti" style={{ ...panel, gridColumn: '1 / -1' }}>{cizgi}{baslik}
      {veri.uyarilar.length ? (
        <div style={{ marginBottom: 12 }}>
          {veri.uyarilar.slice(0, 6).map((u) => (
            <div key={u.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '7px 10px', borderRadius: 10, background: u.goruldu ? 'transparent' : 'rgba(164,91,62,0.07)', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: DUZEY[u.duzey]?.renk || R.muted, minWidth: 64 }}>{DUZEY[u.duzey]?.ad || u.duzey}</span>
              <span style={{ fontSize: 13.5, color: R.ink, flex: 1, lineHeight: 1.4 }}>{u.metin}</span>
              <span style={kucuk}>{trTarih(u.tarih)}</span>
            </div>
          ))}
          {acik.length ? <button type="button" style={btnAna} disabled={mesgul} onClick={() => istek('POST', { islem: 'gordum' })}>Gördüm</button> : null}
        </div>
      ) : <div style={{ ...kucuk, marginBottom: 10 }}>Açık uyarı yok.</div>}

      {veri.metrikler.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
          {[...veri.metrikler].sort((a, b) => Number(veri.uyarilar.some((u) => !u.goruldu && u.metin.startsWith(b.etiket))) - Number(veri.uyarilar.some((u) => !u.goruldu && u.metin.startsWith(a.etiket)))).map((m) => {
            const kb = m.anahtar === 'kb'
            const ort = (o: { ort: number | null; ort2: number | null }) => (o.ort == null ? '—' : kb ? `${f(o.ort)}/${f(o.ort2)}` : f(o.ort, 1))
            return (
              <div key={m.anahtar} style={{ border: `1px solid ${R.border}`, borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{m.etiket}</span><span style={kucuk}>{m.noktalar.length} ölçüm · 28 gün</span></div>
                <Grafik m={m} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: R.ink }}><span>7 gün ort. <b>{ort(m.hafta)}</b> {m.birim}</span><span style={kucuk}>önceki 3 hf. {ort(m.onceki)}</span></div>
              </div>
            )
          })}
        </div>
      ) : <div style={{ ...kucuk, marginBottom: 10 }}>Son 4 haftada ev ölçümü yok.</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>İlaç uyumu <span style={{ ...kucuk, fontWeight: 500 }}>7 gün %{veri.uyum.hafta.yuzde ?? '—'} · 30 gün %{veri.uyum.ay.yuzde ?? '—'}</span></div>
          {veri.uyum.ilaclar.map((i) => {
            const plan = veri.planlar.find((p) => p.id === i.planId)
            return (
              <div key={i.planId} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 40px 86px', gap: 8, alignItems: 'center', padding: '5px 0', fontSize: 13 }}>
                <span>{i.ad}{i.kaynak === 'hasta' ? <span style={{ ...kucuk, marginLeft: 6 }}>(hastanın eklediği)</span> : null}</span>
                <span style={{ height: 8, borderRadius: 4, background: 'rgba(15,155,142,0.14)', overflow: 'hidden' }} aria-label={`%${i.yuzde ?? '—'}`}><span style={{ display: 'block', height: '100%', width: `${i.yuzde ?? 0}%`, background: (i.yuzde ?? 100) < 70 ? R.warn : '#0f9b8e' }} /></span>
                <span style={{ ...kucuk, textAlign: 'right', color: R.ink }}>{i.yuzde == null ? '—' : `%${i.yuzde}`}</span>
                <button type="button" title="Kritik ilaç: 2 gün işaretlenmezse size bildirilir" style={{ ...btn, minHeight: 26, padding: '0 8px', fontSize: 11.5, background: plan?.kritik ? 'rgba(164,91,62,0.12)' : '#fff', color: plan?.kritik ? R.warn : R.muted }} onClick={() => istek('PATCH', { plan: { planId: i.planId, kritik: !plan?.kritik } })}>{plan?.kritik ? 'Kritik' : 'Kritik yap'}</button>
              </div>
            )
          })}
          {!veri.uyum.ilaclar.length ? <div style={kucuk}>Planlı ilaç yok.</div> : null}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Kontrol öncesi özet</div>
          {veri.kontrolOzeti ? (
            <>
              <div style={kucuk}>{trTarih(veri.kontrolOzeti.olusturmaAt)}{veri.kontrolOzeti.randevuAt ? ` · randevu ${trTarih(veri.kontrolOzeti.randevuAt)}` : ''}</div>
              <button type="button" style={{ ...btn, marginTop: 6 }} onClick={() => setOzetAcik(!ozetAcik)}>{ozetAcik ? 'Özeti kapat' : 'Özeti aç'}</button>
              {ozetAcik ? <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.5, background: '#faf6ee', borderRadius: 10, padding: 10, marginTop: 8 }}>{veri.kontrolOzeti.metin}</pre> : null}
            </>
          ) : <div style={kucuk}>Randevudan bir gün önce kendiliğinden hazırlanır.</div>}
          <button type="button" style={{ ...btn, marginTop: 6, marginLeft: veri.kontrolOzeti ? 6 : 0 }} disabled={mesgul} onClick={() => istek('POST', { islem: 'ozet' })}>Şimdi oluştur</button>
          {veri.sorular.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Hastanın soruları</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>{veri.sorular.map((q, i) => <li key={i}>{q.metin}</li>)}</ul>
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" style={btn} onClick={() => setEsikAcik(!esikAcik)}>{esikAcik ? 'Eşikleri kapat' : 'Hedef ve eşikleri düzenle'}</button>
        <span style={kucuk}>Ev ölçümleri hastanın kendi cihazıyla girilir; değerlendirme hekime aittir.</span>
      </div>
      {esikAcik ? <EsikPaneli veri={veri} kaydet={(a) => istek('PATCH', { ayarlar: a })} /> : null}
    </div>
  )
}
