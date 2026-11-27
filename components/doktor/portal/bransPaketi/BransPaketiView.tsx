'use client'
/**
 * BRANS-PAKETI — the patient's branş signature modules (one shared view for all 10 Özel Branşlar; later the countries
 * reuse it with their own words — gorunum-paritesi). It renders BELOW the existing branş page content (Taban önce:
 * nothing the old page showed is removed). Data comes from /api/portal/hasta/[token]/brans-paketi, or a fixture on the
 * demo portals. Rules: no diagnosis, no dose, no calorie counter, no score on the screening, no streak / badge; alert
 * marks use the shared palette (UYARI_RENK) with a word + icon, never colour alone; 112 on every acil line.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { portalFetch } from '@/lib/portal/portalFetch'
import { UyariIsareti } from '@/components/doktor/saglikEvi/UyariIsareti'
import { SoftPanel } from '../ui'
import type { HastaPaketi, HastaPaketModulu } from '@/lib/portal/bransPaketiSunucu'

/** Words are data (one look in every country; a country passes its own). */
export const PAKET_SOZLER = {
  hazirlaniyor: 'Uzmanınız bu bölümü sizin için hazırlıyor. Hazır olduğunda burada görünür.',
  onayYok: 'Kayıtlarınızı uzmanınızın görebilmesi için Tercihler bölümünden paylaşım onayı verin. Acil uyarılar her durumda size gösterilir.',
  tercihler: 'Tercihler',
  kaydet: 'Kaydet',
  kaydedildi: 'Kaydedildi.',
  yukleniyor: 'Yükleniyor…',
  hata: 'Bu bölüm şu an yüklenemedi.',
  baslangicYok: 'Uzmanınız tarihi girdiğinde adımlar takvime oturur.',
  gecti: 'Geçti', bugun: 'Bugün', sirada: 'Sırada',
  fotoSec: 'Fotoğraf çek / seç', fotoSil: 'Sil', fotoYorum: 'Uzmanınızın yorumu', fotoYorumYok: 'Yorum bekleniyor',
  aci: 'Açı', evet: 'Evet', hayir: 'Hayır',
  sonKayitlar: 'Son kayıtlarınız',
  bugunYaptim: 'Bugün yaptım',
  alisveris: 'Alışveriş listesi', hafta: 'Haftalık plan',
  planYok: 'Diyetisyeniniz haftalık planı yazdığında burada görünür.',
  ilacTakvimi: 'İlaç hatırlatmalarım',
  taramaGonder: 'Gönder',
  degerYok: 'Henüz kayıtlı sonuç yok.',
  hedef: 'Hedef',
  demo: 'Örnek görünüm — bu sayfada kayıt yapılmaz.',
  kahvalti: 'Kahvaltı en erken', kahve: 'Kahve en erken', kalsiyum: 'Kalsiyum / demir en erken',
}
type Sozler = typeof PAKET_SOZLER

const DURUM_RENK: Record<string, { zemin: string; yazi: string }> = {
  gecti: { zemin: '#eef0f6', yazi: '#4a5274' }, bugun: { zemin: '#E4F3F1', yazi: '#0B6E65' }, sirada: { zemin: '#FBF3DE', yazi: '#7A5B1E' }, ileride: { zemin: 'transparent', yazi: '#8b7d70' },
}

function tarihYaz(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

function Baslik({ m }: { m: HastaPaketModulu }) {
  return (
    <div className="sg-goz-baslik" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
      <h2>{m.baslik}</h2>
      <span style={{ fontSize: 13, color: 'var(--sg-muted)', lineHeight: 1.4 }}>{m.aciklama}</span>
    </div>
  )
}

const btn: React.CSSProperties = { padding: '9px 14px', borderRadius: 10, border: 'none', background: 'var(--sg-accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
const giris: React.CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: 10, border: '1px solid var(--sg-line)', fontSize: 15, background: '#fff', color: 'var(--sg-ink)', boxSizing: 'border-box' }

interface Ortak { veri: HastaPaketi; demo: boolean; sozler: Sozler; gonder: (govde: Record<string, unknown>) => Promise<{ ok: boolean; mesaj: string; duzey: string | null; ek?: Record<string, unknown> }>; fotoUrl: (id: string) => string; fotoYukle: (modul: string, dosya: File, etiket: string | null) => Promise<string | null>; fotoSil: (id: string) => Promise<void> }

function Tepki({ t }: { t: { mesaj: string; duzey: string | null } | null }) {
  if (!t) return null
  if (t.duzey === 'acil' || t.duzey === 'hekime_bildir' || t.duzey === 'dikkat') {
    return (
      <div role="alert" style={{ marginTop: 10 }}>
        <UyariIsareti ton={t.duzey} etiket={t.duzey === 'acil' ? 'Acil' : t.duzey === 'hekime_bildir' ? 'Uzmanınıza iletildi' : 'Dikkat'} />
        <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.45, color: 'var(--sg-ink)' }}>{t.mesaj}</p>
      </div>
    )
  }
  return <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--sg-ok)' }}>{t.mesaj}</p>
}

function Gunluk({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const [g, setG] = useState<Record<string, unknown>>({})
  const [t, setT] = useState<{ mesaj: string; duzey: string | null } | null>(null)
  const [gp, setGp] = useState<Record<string, string> | null>((m.ayar.gunPlani as Record<string, string>) || null)
  const son = o.veri.kayitlar.filter((k) => k.modul === m.kod).slice(0, 5)
  const alanlar = m.icerik.alanlar || []
  async function kaydet() {
    const r = await o.gonder({ modul: m.kod, veri: g })
    setT({ mesaj: r.mesaj, duzey: r.duzey })
    if (r.ok) { setG({}); if (r.ek?.gunPlani) setGp(r.ek.gunPlani as Record<string, string>) }
  }
  const hedefler: string[] = []
  if (typeof m.ayar.proteinHedefG === 'number') hedefler.push(`Protein: ${m.ayar.proteinHedefG} g / gün`)
  if (typeof m.ayar.korseSaat === 'number') hedefler.push(`Korse: ${m.ayar.korseSaat} saat / gün`)
  if (typeof m.ayar.hedefSaat === 'number') hedefler.push(`Cihaz: ${m.ayar.hedefSaat} saat / gün`)
  if (typeof m.ayar.uykuHedef === 'number') hedefler.push(`Uyku: ${m.ayar.uykuHedef} saat`)
  if (typeof m.ayar.adimHedef === 'number') hedefler.push(`Adım: ${m.ayar.adimHedef}`)
  if (typeof m.ayar.aktifHedef === 'number') hedefler.push(`Hareket: haftada ${m.ayar.aktifHedef} dakika`)
  if (typeof m.ayar.ogunSaatleri === 'string') hedefler.push(`Öğün saatleri: ${m.ayar.ogunSaatleri}`)
  return (
    <>
      {hedefler.length > 0 && <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--sg-ink)' }}><b>{o.sozler.hedef}:</b> {hedefler.join(' · ')}</p>}
      {gp && (
        <ul style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: 14 }}>
          <li>{o.sozler.kahvalti}: <b>{gp.kahvalti}</b></li>
          <li>{o.sozler.kahve}: <b>{gp.kahve}</b></li>
          <li>{o.sozler.kalsiyum}: <b>{gp.kalsiyumDemir}</b></li>
        </ul>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        {alanlar.map((a) => (
          <label key={a.id} style={{ display: 'grid', gap: 4, fontSize: 14, color: 'var(--sg-ink)' }}>
            <span>{a.etiket}{a.birim ? ` (${a.birim})` : ''}</span>
            {a.tur === 'evet' ? (
              <span style={{ display: 'flex', gap: 8 }}>
                {[true, false].map((v) => (
                  <button key={String(v)} type="button" disabled={o.demo} onClick={() => setG((x) => ({ ...x, [a.id]: v }))} aria-pressed={g[a.id] === v}
                    style={{ ...btn, background: g[a.id] === v ? 'var(--sg-accent)' : '#fff', color: g[a.id] === v ? '#fff' : 'var(--sg-ink)', border: '1px solid var(--sg-line)', fontWeight: 600 }}>{v ? o.sozler.evet : o.sozler.hayir}</button>
                ))}
              </span>
            ) : a.tur === 'olcek' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="range" min={a.min ?? 0} max={a.max ?? 10} step={1} disabled={o.demo} value={typeof g[a.id] === 'number' ? (g[a.id] as number) : 0} onChange={(e) => setG((x) => ({ ...x, [a.id]: Number(e.target.value) }))} style={{ flex: 1 }} />
                <b style={{ minWidth: 24, textAlign: 'right' }}>{typeof g[a.id] === 'number' ? String(g[a.id]) : '–'}</b>
              </span>
            ) : a.tur === 'metin' ? (
              <textarea rows={2} disabled={o.demo} value={String(g[a.id] ?? '')} onChange={(e) => setG((x) => ({ ...x, [a.id]: e.target.value }))} style={giris} />
            ) : (
              <input type={a.tur === 'saat' ? 'time' : 'number'} inputMode={a.tur === 'sayi' ? 'decimal' : undefined} disabled={o.demo} value={String(g[a.id] ?? '')} onChange={(e) => setG((x) => ({ ...x, [a.id]: a.tur === 'sayi' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value }))} style={giris} />
            )}
          </label>
        ))}
      </div>
      {alanlar.length > 0 && <button type="button" style={{ ...btn, marginTop: 12 }} disabled={o.demo} onClick={kaydet}>{o.sozler.kaydet}</button>}
      <Tepki t={t} />
      {son.length > 0 && (
        <details style={{ marginTop: 12, fontSize: 13, color: 'var(--sg-muted)' }}>
          <summary>{o.sozler.sonKayitlar}</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {son.map((k) => (
              <li key={k.id}>{tarihYaz(k.gun)}: {Object.entries(k.veri).map(([id, v]) => `${alanlar.find((a) => a.id === id)?.etiket || id}: ${v === true ? o.sozler.evet : v === false ? o.sozler.hayir : String(v)}`).join(' · ')}</li>
            ))}
          </ul>
        </details>
      )}
      {m.icerik.not && <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--sg-muted)', lineHeight: 1.45 }}>{m.icerik.not}</p>}
    </>
  )
}

function Zaman({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const adimlar = m.zaman || []
  return (
    <>
      {!m.baslangic && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--sg-muted)' }}>{o.sozler.baslangicYok}</p>}
      {m.baslangic && m.baslangicEtiketi && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--sg-muted)' }}>{m.baslangicEtiketi}: {tarihYaz(m.baslangic)}</p>}
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {adimlar.map((a) => {
          const r = DURUM_RENK[a.durum]
          const soz = a.durum === 'gecti' ? o.sozler.gecti : a.durum === 'bugun' ? o.sozler.bugun : a.durum === 'sirada' ? o.sozler.sirada : null
          return (
            <li key={`${a.gun}-${a.baslik}`} data-durum={a.durum} style={{ padding: '10px 12px', borderRadius: 12, background: a.durum === 'bugun' || a.durum === 'sirada' ? r.zemin : 'var(--sg-surface)', border: '1px solid var(--sg-line)', opacity: a.durum === 'gecti' ? 0.75 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14 }}>
                <b style={{ color: 'var(--sg-ink)' }}>{a.baslik}</b>
                <span style={{ color: r.yazi, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{soz ? `${soz} · ` : ''}{a.tarih ? tarihYaz(a.tarih) : `${a.gun}. gün`}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--sg-muted)', marginTop: 4, lineHeight: 1.45 }}>{a.ayrinti}</div>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function Liste({ m, o, satirlar }: { m: HastaPaketModulu; o: Ortak; satirlar: string[] }) {
  const isaretli = useMemo(() => {
    const s = new Map<number, boolean>()
    for (const k of [...o.veri.kayitlar].filter((k) => k.modul === m.kod).reverse()) if (typeof k.veri.madde === 'number') s.set(k.veri.madde as number, k.veri.tamam !== false)
    return s
  }, [o.veri.kayitlar, m.kod])
  const [yerel, setYerel] = useState<Map<number, boolean>>(new Map())
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
      {satirlar.map((s, i) => {
        const tamam = yerel.get(i) ?? isaretli.get(i) ?? false
        return (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45 }}>
            {m.isaretlenir ? (
              <input type="checkbox" checked={tamam} disabled={o.demo} aria-label={s} onChange={async (e) => { const v = e.target.checked; setYerel((x) => new Map(x).set(i, v)); await o.gonder({ modul: m.kod, madde: i, tamam: v }) }} style={{ marginTop: 3, width: 18, height: 18 }} />
            ) : <span aria-hidden style={{ color: 'var(--sg-accent)' }}>•</span>}
            <span style={{ color: 'var(--sg-ink)', textDecoration: tamam ? 'line-through' : 'none' }}>{s}</span>
          </li>
        )
      })}
    </ul>
  )
}

function Program({ m, o, satirlar }: { m: HastaPaketModulu; o: Ortak; satirlar: string[] }) {
  const bugunYapilan = useMemo(() => new Set(o.veri.kayitlar.filter((k) => k.modul === m.kod && k.gun === o.veri.bugun && k.veri.tamam !== false).map((k) => k.veri.madde as number)), [o.veri, m.kod])
  const [yerel, setYerel] = useState<Set<number>>(new Set())
  return (
    <>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {satirlar.map((s, i) => {
          const yapildi = bugunYapilan.has(i) || yerel.has(i)
          return (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--sg-line)', background: yapildi ? 'var(--sg-accent-soft)' : 'var(--sg-surface)', fontSize: 14 }}>
              <span style={{ color: 'var(--sg-ink)', lineHeight: 1.4 }}>{s}</span>
              <button type="button" disabled={o.demo || yapildi} onClick={async () => { setYerel((x) => new Set(x).add(i)); await o.gonder({ modul: m.kod, madde: i }) }} style={{ ...btn, padding: '7px 10px', fontSize: 13, background: yapildi ? 'var(--sg-ok)' : 'var(--sg-accent)', whiteSpace: 'nowrap' }}>{yapildi ? '✓' : o.sozler.bugunYaptim}</button>
            </li>
          )
        })}
      </ul>
      {m.icerik.not && <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--sg-muted)' }}>{m.icerik.not}</p>}
    </>
  )
}

function Foto({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const [riza, setRiza] = useState(false)
  const [aci, setAci] = useState<string>(m.icerik.acilar?.[0] || '')
  const [mesaj, setMesaj] = useState('')
  const fotolar = o.veri.fotolar.filter((f) => f.modul === m.kod)
  const ayHatirlatma = m.icerik.aylar?.length ? `Hatırlatma ayları: ${m.icerik.aylar.join(', ')}. ay` : null
  return (
    <>
      {m.tur === 'tabak' && m.icerik.maddeler && <ul style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: 14, color: 'var(--sg-ink)' }}>{m.icerik.maddeler.map((x) => <li key={x}>{x}</li>)}</ul>}
      {ayHatirlatma && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--sg-muted)' }}>{ayHatirlatma}</p>}
      {m.icerik.acilar && m.icerik.acilar.length > 0 && (
        <label style={{ display: 'grid', gap: 4, fontSize: 14, marginBottom: 8 }}>
          <span>{o.sozler.aci}</span>
          <select value={aci} onChange={(e) => setAci(e.target.value)} disabled={o.demo} style={giris}>{m.icerik.acilar.map((a) => <option key={a} value={a}>{a}</option>)}</select>
        </label>
      )}
      {m.fotoRizaMetni && (
        <label style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--sg-ink)', marginBottom: 8, lineHeight: 1.4 }}>
          <input type="checkbox" checked={riza} disabled={o.demo} onChange={(e) => setRiza(e.target.checked)} style={{ marginTop: 2 }} />
          <span>{m.fotoRizaMetni}</span>
        </label>
      )}
      <label style={{ ...btn, display: 'inline-block', opacity: !riza || o.demo ? 0.5 : 1 }}>
        {o.sozler.fotoSec}
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden disabled={!riza || o.demo} onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ''
          if (!f) return
          const h = await o.fotoYukle(m.kod, f, aci || null)
          setMesaj(h || o.sozler.kaydedildi)
        }} />
      </label>
      {mesaj && <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--sg-muted)' }}>{mesaj}</p>}
      {fotolar.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
          {fotolar.map((f) => (
            <figure key={f.id} style={{ margin: 0, border: '1px solid var(--sg-line)', borderRadius: 12, overflow: 'hidden', background: 'var(--sg-surface)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {!o.demo ? <img src={o.fotoUrl(f.id)} alt={f.etiket || m.baslik} loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} /> : <div style={{ aspectRatio: '1', background: 'var(--sg-bg-deep)' }} />}
              <figcaption style={{ padding: 8, fontSize: 12, color: 'var(--sg-ink)', display: 'grid', gap: 4 }}>
                <span style={{ color: 'var(--sg-muted)' }}>{tarihYaz(f.at)}{f.etiket ? ` · ${f.etiket}` : ''}</span>
                {m.tur === 'tabak' && <span><b>{o.sozler.fotoYorum}:</b> {f.yorum || o.sozler.fotoYorumYok}</span>}
                {m.tur !== 'tabak' && f.yorum && <span><b>{o.sozler.fotoYorum}:</b> {f.yorum}</span>}
                {!o.demo && <button type="button" onClick={() => o.fotoSil(f.id)} style={{ justifySelf: 'start', background: 'none', border: 'none', color: 'var(--sg-coral)', padding: 0, fontSize: 12, cursor: 'pointer' }}>{o.sozler.fotoSil}</button>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {m.icerik.not && <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--sg-muted)' }}>{m.icerik.not}</p>}
    </>
  )
}

function Plan({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const plan = m.ayar.plan as { gunler: Array<{ gun: string; ogunler: Array<{ ad: string; yiyecekler: string[] }> }> } | undefined
  const alisveris = (m.ayar.alisveris || []) as Array<{ grup: string; kalemler: Array<{ ad: string; kez: number }> }>
  const dolu = plan?.gunler.filter((g) => g.ogunler.length) || []
  const [gun, setGun] = useState(0)
  if (!dolu.length) return <p style={{ margin: 0, fontSize: 14, color: 'var(--sg-muted)' }}>{o.sozler.planYok}</p>
  const g = dolu[Math.min(gun, dolu.length - 1)]
  return (
    <>
      <div role="tablist" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
        {dolu.map((d, i) => <button key={d.gun} role="tab" aria-selected={i === gun} type="button" onClick={() => setGun(i)} style={{ ...btn, padding: '6px 10px', fontSize: 13, background: i === gun ? 'var(--sg-accent)' : '#fff', color: i === gun ? '#fff' : 'var(--sg-ink)', border: '1px solid var(--sg-line)' }}>{d.gun.slice(0, 3)}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
        {g.ogunler.map((og) => (
          <div key={og.ad} style={{ padding: '10px 12px', border: '1px solid var(--sg-line)', borderRadius: 12, background: 'var(--sg-surface)' }}>
            <b style={{ fontSize: 14 }}>{og.ad}</b>
            <div style={{ fontSize: 14, color: 'var(--sg-ink)', marginTop: 4, lineHeight: 1.45 }}>{og.yiyecekler.join(', ')}</div>
          </div>
        ))}
      </div>
      {alisveris.length > 0 && (
        <details style={{ marginTop: 12 }} open>
          <summary style={{ fontWeight: 700, fontSize: 14 }}>{o.sozler.alisveris}</summary>
          {alisveris.map((a) => (
            <div key={a.grup} style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{a.grup}</div>
              <ul style={{ listStyle: 'none', margin: '4px 0 0', padding: 0 }}>
                {a.kalemler.map((k) => <li key={k.ad} style={{ fontSize: 14 }}><label style={{ display: 'flex', gap: 8 }}><input type="checkbox" /> {k.ad}{k.kez > 1 ? ` (${k.kez} öğün)` : ''}</label></li>)}
              </ul>
            </div>
          ))}
        </details>
      )}
      {m.icerik.not && <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--sg-muted)' }}>{m.icerik.not}</p>}
    </>
  )
}

function Tarama({ m, o }: { m: HastaPaketModulu; o: Ortak }) {
  const sorular = m.icerik.maddeler || []
  const [c, setC] = useState<Array<boolean | null>>(sorular.map(() => null))
  const [bitti, setBitti] = useState<string | null>(null)
  if (!o.veri.taramaZamani && !bitti) return null
  if (bitti) return <p style={{ margin: 0, fontSize: 14, color: 'var(--sg-ink)', lineHeight: 1.5 }}>{bitti}</p>
  return (
    <>
      <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10 }}>
        {sorular.map((s, i) => (
          <li key={i} style={{ fontSize: 14, color: 'var(--sg-ink)', lineHeight: 1.45 }}>
            {s}
            <span style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {[true, false].map((v) => <button key={String(v)} type="button" disabled={o.demo} aria-pressed={c[i] === v} onClick={() => setC((x) => x.map((y, j) => (j === i ? v : y)))} style={{ ...btn, padding: '6px 12px', background: c[i] === v ? 'var(--sg-accent)' : '#fff', color: c[i] === v ? '#fff' : 'var(--sg-ink)', border: '1px solid var(--sg-line)', fontWeight: 600 }}>{v ? o.sozler.evet : o.sozler.hayir}</button>)}
            </span>
          </li>
        ))}
      </ol>
      <button type="button" style={{ ...btn, marginTop: 12 }} disabled={o.demo || c.some((x) => x === null)} onClick={async () => { const r = await o.gonder({ modul: m.kod, cevaplar: c }); setBitti(r.mesaj) }}>{o.sozler.taramaGonder}</button>
      {m.icerik.not && <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--sg-muted)' }}>{m.icerik.not}</p>}
    </>
  )
}

function Degerler({ o }: { o: Ortak }) {
  if (!o.veri.lab.length) return <p style={{ margin: 0, fontSize: 14, color: 'var(--sg-muted)' }}>{o.sozler.degerYok}</p>
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {o.veri.lab.map((s) => {
        const d = s.noktalar.map((n) => n.deger)
        const min = Math.min(...d), max = Math.max(...d)
        const yol = s.noktalar.map((n, i) => `${i === 0 ? 'M' : 'L'}${s.noktalar.length === 1 ? 50 : (i / (s.noktalar.length - 1)) * 100},${max === min ? 15 : 28 - ((n.deger - min) / (max - min)) * 26}`).join(' ')
        const son = s.noktalar[s.noktalar.length - 1]
        return (
          <div key={s.anahtar} style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10, alignItems: 'center', padding: '8px 10px', border: '1px solid var(--sg-line)', borderRadius: 12, background: 'var(--sg-surface)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{s.ad}</div>
              <div style={{ fontSize: 13, color: 'var(--sg-muted)' }}>{String(son.deger).replace('.', ',')}{s.birim ? ` ${s.birim}` : ''} · {tarihYaz(son.tarih)}{s.noktalar.length > 1 ? ` · ${s.noktalar.length} ölçüm` : ''}</div>
            </div>
            <svg viewBox="0 0 100 30" width="110" height="34" aria-hidden><path d={yol} fill="none" stroke="var(--sg-ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        )
      })}
    </div>
  )
}

function Modul({ m, o, basePath }: { m: HastaPaketModulu; o: Ortak; basePath: string }) {
  const satirlar = Array.isArray(m.ayar.satirlar) && (m.ayar.satirlar as string[]).length ? (m.ayar.satirlar as string[]) : m.icerik.maddeler || []
  const listeSatirlari = m.kod === 'cer-hazirlik' ? [...(m.icerik.maddeler || []), ...((m.ayar.satirlar as string[]) || [])] : satirlar
  if (m.tur === 'tarama' && !o.veri.taramaZamani) return null
  return (
    <SoftPanel className="sg-goz-panel">
      <div data-paket-modul={m.kod}>
        <Baslik m={m} />
        {m.tur === 'zaman' && <Zaman m={m} o={o} />}
        {m.tur === 'liste' && <Liste m={m} o={o} satirlar={listeSatirlari} />}
        {m.tur === 'program' && <Program m={m} o={o} satirlar={satirlar} />}
        {(m.tur === 'gunluk' || m.tur === 'ilac-saati') && <Gunluk m={m} o={o} />}
        {m.tur === 'hatirlatma' && (
          <>
            <Liste m={{ ...m, isaretlenir: false }} o={o} satirlar={satirlar} />
            {(m.icerik.alanlar || []).length > 0 && <div style={{ marginTop: 12 }}><Gunluk m={m} o={o} /></div>}
            <Link href={`${basePath}/doz-takvimi`} className="sg-back-link" style={{ display: 'inline-block', marginTop: 10 }}>{o.sozler.ilacTakvimi} →</Link>
          </>
        )}
        {(m.tur === 'foto' || m.tur === 'tabak') && <Foto m={m} o={o} />}
        {m.tur === 'plan' && <Plan m={m} o={o} />}
        {m.tur === 'tarama' && <Tarama m={m} o={o} />}
        {m.tur === 'biyobelirtec' && <Degerler o={o} />}
      </div>
    </SoftPanel>
  )
}

export function BransPaketiView({ token, basePath, demo, sozler = PAKET_SOZLER }: { token?: string; basePath: string; demo?: HastaPaketi; sozler?: Sozler }) {
  const [veri, setVeri] = useState<HastaPaketi | null>(demo ?? null)
  const [hata, setHata] = useState(false)
  const kok = token ? `/api/portal/hasta/${encodeURIComponent(token)}/brans-paketi` : ''
  const yukle = useCallback(async () => {
    if (!kok) return
    try {
      const r = await portalFetch(kok, { cache: 'no-store' })
      if (!r.ok) { setHata(true); return }
      setVeri(await r.json()); setHata(false)
    } catch { setHata(true) }
  }, [kok])
  useEffect(() => { if (!demo) void yukle() }, [demo, yukle])

  const o: Ortak | null = veri ? {
    veri, demo: !!demo, sozler,
    gonder: async (govde) => {
      if (demo || !kok) return { ok: false, mesaj: sozler.demo, duzey: null }
      const r = await portalFetch(kok, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) return { ok: false, mesaj: String(j.error || sozler.hata), duzey: null }
      void yukle()
      return { ok: true, mesaj: String(j.tepki?.metin || sozler.kaydedildi), duzey: j.tepki?.duzey ?? null, ek: j.tepki }
    },
    fotoUrl: (id) => `${kok}/foto?id=${encodeURIComponent(id)}`,
    fotoYukle: async (modul, dosya, etiket) => {
      if (demo || !kok) return sozler.demo
      const f = new FormData()
      f.set('modul', modul); f.set('riza', '1'); f.set('file', dosya)
      if (etiket) f.set('etiket', etiket)
      const r = await portalFetch(`${kok}/foto`, { method: 'POST', body: f })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) return String(j.error || sozler.hata)
      void yukle()
      return null
    },
    fotoSil: async (id) => {
      if (demo || !kok) return
      await portalFetch(`${kok}/foto?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      void yukle()
    },
  } : null

  if (hata && !veri) return <p style={{ margin: '0 20px 16px', fontSize: 13, color: 'var(--sg-muted)' }}>{sozler.hata}</p>
  if (!o) return <p style={{ margin: '0 20px 16px', fontSize: 13, color: 'var(--sg-muted)' }}>{sozler.yukleniyor}</p>
  if (!o.veri.moduller.length) {
    return o.veri.hazirlaniyor > 0 ? <p style={{ margin: '0 20px 16px', fontSize: 14, color: 'var(--sg-muted)' }}>{sozler.hazirlaniyor}</p> : null
  }
  return (
    <div data-brans-paketi={o.veri.brans || ''} style={{ display: 'grid', gap: 0 }}>
      {demo && <p style={{ margin: '0 20px 12px', fontSize: 12, color: 'var(--sg-muted)' }}>{sozler.demo}</p>}
      {!o.veri.paylasimOnayi && !demo && (
        <p style={{ margin: '0 20px 12px', fontSize: 13, color: 'var(--sg-ink)', lineHeight: 1.45 }}>
          {sozler.onayYok} <Link href={`${basePath}/tercihler`} className="sg-back-link">{sozler.tercihler} →</Link>
        </p>
      )}
      {o.veri.moduller.map((m) => <Modul key={m.kod} m={m} o={o} basePath={basePath} />)}
      <p style={{ margin: '0 20px 16px', fontSize: 12, color: 'var(--sg-muted)' }}>{o.veri.acil}</p>
    </div>
  )
}
