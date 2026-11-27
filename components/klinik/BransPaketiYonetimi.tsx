'use client'
/**
 * BRANS-PAKETI — the professional's control of the patient-portal package (Özel Branşlar › Hasta alanı paketi).
 *  1. Şablonlar: every module of the professional's OWN branş; review, edit once if wanted, accept. Nothing reaches a
 *     patient before acceptance (timestamp recorded) — the treating professional is the reviewer.
 *  2. Hasta: pick a patient → per-module switch (default / on / off), start date, settings (plan, protein target …),
 *     the patient's entries (after the patient's sharing consent), photos + one comment each (Tabağım: no calories).
 * Data: /api/ozel-brans/paket (templates) and /api/ozel-brans/paket/hasta (one patient). Doctor-facing copy only.
 */
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import HastaTypeahead from '@/components/doktor/HastaTypeahead'
import { doktorFetch } from '@/lib/doktor/oturumFetch'
import { UYARI_RENK } from '@/lib/doktor/chromeRenk'
import type { PaketAdim, PaketAlan, PaketBayrak, PaketIcerik } from '@/lib/portal/bransPaketi'

type Sablon = { kod: string; tur: string; baslik: string; aciklama: string; varsayilan: PaketIcerik; icerik: PaketIcerik | null; kabulAt: string | null; duzenlendi: boolean; kaynaklar: string[]; yas: string | null }
type AyarAlani = { id: string; etiket: string; tur: 'sayi' | 'saat' | 'metin' | 'satirlar' | 'evet' | 'plan' }
type HastaModul = { kod: string; tur: string; baslik: string; durumModulu: boolean; varsayilanKapali: boolean; yas: string | null; aktif: boolean; neden: string | null; hazirlaniyor: boolean; kabulAt: string | null; acik: boolean | null; baslangic: string | null; ayar: Record<string, unknown>; ayarlar: AyarAlani[]; baslangicEtiketi: string | null; tarihBekliyor?: boolean; baslangicModulu?: string | null }
type HastaVeri = { brans: string | null; moduller: HastaModul[]; paylasimOnayi: boolean; kayitlar: Array<{ id: string; modul: string; gun: string; veri: Record<string, unknown>; seviye: string | null }>; fotolar: Array<{ id: string; modul: string; etiket: string | null; at: string; yorum: string | null }>; plan: Record<string, unknown> | null; lab: Array<{ anahtar: string; ad: string; birim: string | null; noktalar: Array<{ tarih: string; deger: number }> }>; ilacBesin: Array<{ baslik: string; maddeler: string[]; kaynak: string }> }

const kart: React.CSSProperties = { border: '1px solid rgba(58,44,34,0.12)', borderRadius: 12, padding: 14, background: '#fffdf8', display: 'grid', gap: 8 }
const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: 'none', background: '#2f4334', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', justifySelf: 'start' }
const ikincil: React.CSSProperties = { ...btn, background: '#fff', color: '#3b2e24', border: '1px solid rgba(58,44,34,0.2)' }
const giris: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(58,44,34,0.2)', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }
const h2: React.CSSProperties = { fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, margin: '8px 0 4px', color: '#3b2e24' }
const kucuk: React.CSSProperties = { fontSize: 12, color: '#8b7d70', margin: 0 }

const TUR_ETIKET: Record<string, string> = { zaman: 'Zaman çizelgesi', liste: 'Kontrol listesi', gunluk: 'Günlük', foto: 'Fotoğraf günlüğü', program: 'Program', hatirlatma: 'Hatırlatma', biyobelirtec: 'Değerler', tabak: 'Tabağım', plan: 'Haftalık plan', tarama: 'Tarama soruları', 'ilac-saati': 'İlaç saati' }
const NEDEN: Record<string, string> = { varsayilan: 'varsayılan', uzman: 'sizin açtığınız', tani: 'dosyadaki tanıdan', ilac: 'dosyadaki ilaçtan', gebelik: 'aktif gebelik kaydından' }

function adimMetni(a: PaketAdim[] | undefined) { return (a || []).map((x) => `${x.gun} | ${x.baslik} | ${x.ayrinti}`).join('\n') }
function adimCoz(m: string): PaketAdim[] { return m.split('\n').map((s) => s.split('|').map((x) => x.trim())).filter((p) => p.length >= 2 && p[1]).map((p) => ({ gun: Number(p[0]), baslik: p[1], ayrinti: p[2] || '' })) }

function SablonKarti({ s, yenile }: { s: Sablon; yenile: () => void }) {
  const ic = { ...s.varsayilan, ...(s.icerik || {}) }
  const [ac, setAc] = useState(false)
  const [adim, setAdim] = useState(adimMetni(ic.adimlar))
  const [madde, setMadde] = useState((ic.maddeler || []).join('\n'))
  const [aci, setAci] = useState((ic.acilar || []).join(', '))
  const [ay, setAy] = useState((ic.aylar || []).join(', '))
  const [not, setNot] = useState(ic.not || '')
  const [mesaj, setMesaj] = useState('')
  async function kabul() {
    const icerik: PaketIcerik = {}
    if (s.varsayilan.adimlar) icerik.adimlar = adimCoz(adim)
    if (s.varsayilan.maddeler) icerik.maddeler = madde.split('\n').map((x) => x.trim()).filter(Boolean)
    if (s.varsayilan.acilar) icerik.acilar = aci.split(',').map((x) => x.trim()).filter(Boolean)
    if (s.varsayilan.aylar) icerik.aylar = ay.split(',').map((x) => Number(x.trim())).filter((n) => Number.isInteger(n))
    if (not.trim()) icerik.not = not.trim()
    const r = await doktorFetch('/api/ozel-brans/paket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modul: s.kod, icerik }) })
    const j = await r.json().catch(() => ({}))
    setMesaj(r.ok ? `Kabul edildi${j.duzenlendi ? ' (düzenlenmiş)' : ''} — bu modül hastalarınıza açıldı.` : String(j.error || 'Kaydedilemedi.'))
    if (r.ok) yenile()
  }
  return (
    <div style={kart} data-sablon={s.kod}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <b style={{ color: '#3b2e24' }}>{s.baslik}</b>
        <span style={{ fontSize: 12, color: s.kabulAt ? '#2E6E4E' : '#a45b3e', fontWeight: 700 }}>
          {s.kabulAt ? `Kabul: ${new Date(s.kabulAt).toLocaleString('tr-TR')}${s.duzenlendi ? ' · düzenlendi' : ''}` : 'Kabul bekliyor — hastaya gitmez'}
        </span>
      </div>
      <p style={kucuk}>{TUR_ETIKET[s.tur] || s.tur}{s.yas === 'cocuk' ? ' · yalnız 18 yaş altı (veli dili)' : s.yas === 'eriskin' ? ' · 18 yaş ve üstü' : ''} — {s.aciklama}</p>
      <button type="button" style={ikincil} onClick={() => setAc((x) => !x)}>{ac ? 'Kapat' : 'İncele / düzenle'}</button>
      {ac && (
        <div style={{ display: 'grid', gap: 8 }}>
          {s.varsayilan.adimlar && <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>Adımlar (her satır: gün | başlık | ayrıntı)<textarea rows={8} value={adim} onChange={(e) => setAdim(e.target.value)} style={giris} /></label>}
          {s.varsayilan.maddeler && <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>Maddeler (her satır bir madde{s.tur === 'tarama' ? '; soru sayısı değişmez — yayımlanmış Türkçe form ifadesiyle hizalayabilirsiniz' : ''})<textarea rows={6} value={madde} onChange={(e) => setMadde(e.target.value)} style={giris} /></label>}
          {s.varsayilan.acilar && <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>Fotoğraf açıları (virgülle)<input value={aci} onChange={(e) => setAci(e.target.value)} style={giris} /></label>}
          {s.varsayilan.aylar && <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>Fotoğraf hatırlatma ayları (virgülle)<input value={ay} onChange={(e) => setAy(e.target.value)} style={giris} /></label>}
          <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>Hastaya not<textarea rows={2} value={not} onChange={(e) => setNot(e.target.value)} style={giris} /></label>
          {(s.varsayilan.alanlar || []).length > 0 && (
            <div style={{ fontSize: 13 }}>
              <b>Günlük alanları</b> (güvenlik için sabit):
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{(s.varsayilan.alanlar as PaketAlan[]).map((a) => <li key={a.id}>{a.etiket}</li>)}</ul>
            </div>
          )}
          {(s.varsayilan.bayraklar || []).length > 0 && (
            <div style={{ fontSize: 13 }}>
              <b>Kırmızı bayraklar</b> (size bildirim + hastaya anında metin):
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{(s.varsayilan.bayraklar as PaketBayrak[]).map((b) => <li key={b.id}><span style={{ color: UYARI_RENK[b.duzey].ana, fontWeight: 700 }}>{b.duzey === 'acil' ? 'Acil' : b.duzey === 'hekime_bildir' ? 'Size bildirilir' : 'Dikkat'}</span> — {b.hekim}</li>)}</ul>
            </div>
          )}
          <p style={kucuk}>Kaynak kimlikleri: {s.kaynaklar.join(', ') || '—'} (docs/kaynak). Doz yazılmaz.</p>
        </div>
      )}
      <button type="button" style={btn} onClick={kabul}>{s.kabulAt ? 'Yeniden kabul et' : 'Kabul et ve hastalara aç'}</button>
      {mesaj && <p style={{ ...kucuk, color: '#3b2e24' }}>{mesaj}</p>}
    </div>
  )
}

function FotoKart({ patientId, f, yenile }: { patientId: string; f: HastaVeri['fotolar'][number]; yenile: () => void }) {
  const [url, setUrl] = useState('')
  const [yorum, setYorum] = useState(f.yorum || '')
  const [mesaj, setMesaj] = useState('')
  useEffect(() => {
    let u = ''
    ;(async () => {
      const r = await doktorFetch(`/api/ozel-brans/paket/foto?patientId=${encodeURIComponent(patientId)}&id=${encodeURIComponent(f.id)}`, {})
      if (r.ok) { u = URL.createObjectURL(await r.blob()); setUrl(u) }
    })()
    return () => { if (u) URL.revokeObjectURL(u) }
  }, [patientId, f.id])
  async function kaydet() {
    const r = await doktorFetch('/api/ozel-brans/paket/hasta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, islem: 'yorum', id: f.id, yorum }) })
    const j = await r.json().catch(() => ({}))
    setMesaj(r.ok ? 'Yorum hastaya iletildi.' : String(j.error || 'Kaydedilemedi.'))
    if (r.ok) yenile()
  }
  return (
    <figure style={{ margin: 0, ...kart, padding: 8 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt={f.etiket || 'Hasta fotoğrafı'} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ aspectRatio: '1', background: '#efe7da', borderRadius: 8 }} />}
      <figcaption style={{ fontSize: 12, color: '#8b7d70' }}>{new Date(f.at).toLocaleDateString('tr-TR')}{f.etiket ? ` · ${f.etiket}` : ''}</figcaption>
      <textarea rows={2} value={yorum} onChange={(e) => setYorum(e.target.value)} placeholder="Porsiyon ve tabak dengesi üzerine kısa yorum (kalori yazılmaz)" style={giris} />
      <button type="button" style={btn} onClick={kaydet}>Yorumu gönder</button>
      {mesaj && <p style={kucuk}>{mesaj}</p>}
    </figure>
  )
}

function HastaModulKarti({ patientId, m, yenile }: { patientId: string; m: HastaModul; yenile: () => void }) {
  const [acik, setAcik] = useState<boolean | null>(m.acik)
  const [bas, setBas] = useState(m.baslangic || '')
  const [ayar, setAyar] = useState<Record<string, unknown>>(m.ayar)
  const [mesaj, setMesaj] = useState('')
  async function kaydet() {
    const r = await doktorFetch('/api/ozel-brans/paket/hasta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, islem: 'ayar', modul: m.kod, acik, baslangic: bas || null, ayar }) })
    const j = await r.json().catch(() => ({}))
    setMesaj(r.ok ? 'Kaydedildi.' : String(j.error || 'Kaydedilemedi.'))
    if (r.ok) yenile()
  }
  const durum = m.aktif ? `Açık (${NEDEN[m.neden || ''] || m.neden})` : m.hazirlaniyor ? 'Şablon kabul bekliyor' : m.tarihBekliyor ? (m.baslangicModulu ? 'Bağlı olduğu zaman çizelgesinin tarihi girilince açılır' : 'Tarih girilince açılır') : 'Kapalı'
  return (
    <div style={kart}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <b>{m.baslik}</b>
        <span style={{ fontSize: 12, fontWeight: 700, color: m.aktif ? '#2E6E4E' : '#8b7d70' }}>{durum}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([[null, m.durumModulu ? 'Tanı / ilaca göre' : m.varsayilanKapali ? 'Varsayılan (kapalı)' : 'Varsayılan (açık)'], [true, 'Açık'], [false, 'Kapalı']] as Array<[boolean | null, string]>).map(([v, e]) => (
          <button key={String(v)} type="button" aria-pressed={acik === v} onClick={() => setAcik(v)} style={{ ...ikincil, background: acik === v ? '#2f4334' : '#fff', color: acik === v ? '#fff' : '#3b2e24' }}>{e}</button>
        ))}
      </div>
      {m.baslangicEtiketi && <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>{m.baslangicEtiketi}{m.neden === 'gebelik' && !m.baslangic ? ' (boş bırakılırsa aktif gebelik kaydındaki son adet tarihi kullanılır)' : ''}<input type="date" value={bas} onChange={(e) => setBas(e.target.value)} style={giris} /></label>}
      {m.ayarlar.map((a) => (
        <label key={a.id} style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          {a.etiket}
          {a.tur === 'evet' ? (
            <input type="checkbox" checked={ayar[a.id] === true} onChange={(e) => setAyar((x) => ({ ...x, [a.id]: e.target.checked }))} />
          ) : a.tur === 'satirlar' || a.tur === 'plan' ? (
            <textarea rows={a.tur === 'plan' ? 10 : 5} value={Array.isArray(ayar[a.id]) ? (ayar[a.id] as string[]).join('\n') : String(ayar[a.id] ?? '')} onChange={(e) => setAyar((x) => ({ ...x, [a.id]: e.target.value }))} style={giris}
              placeholder={a.tur === 'plan' ? 'Pazartesi | Kahvaltı | haşlanmış yumurta, beyaz peynir, domates, tam buğday ekmeği\nHer gün | Ara öğün | 1 porsiyon meyve, 10 adet badem' : undefined} />
          ) : (
            <input type={a.tur === 'saat' ? 'time' : a.tur === 'sayi' ? 'number' : 'text'} value={String(ayar[a.id] ?? '')} onChange={(e) => setAyar((x) => ({ ...x, [a.id]: e.target.value }))} style={giris} />
          )}
        </label>
      ))}
      <button type="button" style={btn} onClick={kaydet}>Kaydet</button>
      {mesaj && <p style={kucuk}>{mesaj}</p>}
    </div>
  )
}

function Ic() {
  const onceden = useSearchParams()?.get('patientId') || ''
  const [sablonlar, setSablonlar] = useState<Sablon[]>([])
  const [brans, setBrans] = useState<string | null>(null)
  const [hasta, setHasta] = useState(onceden)
  const [veri, setVeri] = useState<HastaVeri | null>(null)
  const [hata, setHata] = useState('')
  const [yuklendi, setYuklendi] = useState(false)

  const sablonYukle = useCallback(async () => {
    const r = await doktorFetch('/api/ozel-brans/paket', {})
    const j = await r.json().catch(() => ({}))
    if (r.ok) { setSablonlar(j.moduller || []); setBrans(j.brans || null) } else setHata(String(j.error || 'Şablonlar okunamadı.'))
    setYuklendi(true)
  }, [])
  const hastaYukle = useCallback(async () => {
    if (!hasta) { setVeri(null); return }
    const r = await doktorFetch(`/api/ozel-brans/paket/hasta?patientId=${encodeURIComponent(hasta)}`, {})
    const j = await r.json().catch(() => ({}))
    if (r.ok) { setVeri(j); setHata('') } else setHata(String(j.error || 'Hasta alanı okunamadı.'))
  }, [hasta])
  useEffect(() => { void sablonYukle() }, [sablonYukle])
  useEffect(() => { void hastaYukle() }, [hastaYukle])

  if (!yuklendi && !hata) return <p style={kucuk}>Yükleniyor…</p>
  if (yuklendi && !brans && !hata) return <p style={{ ...kucuk, fontSize: 14 }}>Branşınız için hasta alanı paketi henüz hazır değil. Hazır olduğunda şablonlar burada kabulünüze sunulur.</p>
  const bekleyen = sablonlar.filter((s) => !s.kabulAt).length
  const bayrakli = (veri?.kayitlar || []).filter((k) => k.seviye)
  const plan = veri?.plan as { alisveris?: Array<{ grup: string; kalemler: Array<{ ad: string; kez: number }> }> } | null
  return (
    <div style={{ display: 'grid', gap: 14, color: '#3b2e24' }}>
      {hata && <p style={{ color: '#a45b3e', margin: 0 }}>{hata}</p>}
      <section style={{ display: 'grid', gap: 10 }}>
        <h2 style={h2}>Şablonlar {bekleyen ? `· ${bekleyen} kabul bekliyor` : '· hepsi kabul edildi'}</h2>
        <p style={kucuk}>Her modül bir başlangıç şablonudur. İnceleyin, isterseniz düzenleyin ve kabul edin; kabul etmediğiniz modül hiçbir hastaya gitmez. Kabul tarihi kayda geçer. Kabul ettiğiniz modüller hastanızın Sağlığım sayfasında ve Bugün ekranındaki günlük kartta görünür.</p>
        {sablonlar.map((s) => <SablonKarti key={s.kod} s={s} yenile={sablonYukle} />)}
      </section>
      <section style={{ display: 'grid', gap: 10 }}>
        <h2 style={h2}>Hasta</h2>
        <HastaTypeahead id="brans-paketi-hasta" value={hasta} placeholder="Hasta adı veya soyadı yazın / seçin…" onLoadError={(m) => setHata(m)} onChange={(id) => setHasta(id)} />
        {veri && (
          <>
            <p style={{ ...kucuk, color: veri.paylasimOnayi ? '#2E6E4E' : '#a45b3e' }}>{veri.paylasimOnayi ? 'Hasta paylaşım onayı verdi — kayıtlar görünür.' : 'Hasta paylaşım onayı vermedi — günlük kayıtları görünmez (acil uyarılar hastaya her durumda gösterilir).'}</p>
            {bayrakli.length > 0 && (
              <div style={kart}>
                <b>Bayraklı kayıtlar</b>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>{bayrakli.slice(0, 20).map((k) => <li key={k.id}><span style={{ color: UYARI_RENK[(k.seviye as 'acil' | 'hekime_bildir' | 'dikkat') || 'dikkat'].ana, fontWeight: 700 }}>{k.seviye === 'acil' ? 'Acil' : k.seviye === 'hekime_bildir' ? 'Bildirim' : 'Dikkat'}</span> · {k.gun} · {veri.moduller.find((m) => m.kod === k.modul)?.baslik || k.modul}{typeof k.veri.puan === 'number' ? ` · SCOFF ${k.veri.puan}/5 (tanı değildir)` : ''}</li>)}</ul>
              </div>
            )}
            {veri.moduller.map((m) => <HastaModulKarti key={m.kod} patientId={hasta} m={m} yenile={hastaYukle} />)}
            {plan?.alisveris && plan.alisveris.length > 0 && (
              <div style={kart}>
                <b>Plan önizleme — alışveriş listesi (TÜBER 2022 grupları)</b>
                {plan.alisveris.map((a) => <p key={a.grup} style={{ margin: 0, fontSize: 13 }}><b>{a.grup}:</b> {a.kalemler.map((k) => k.ad).join(', ')}</p>)}
              </div>
            )}
            {veri.ilacBesin.length > 0 && (
              <div style={kart}>
                <b>İlaç–besin zamanlaması (dosyadaki ilaçlar)</b>
                {veri.ilacBesin.map((n) => <div key={n.baslik} style={{ fontSize: 13 }}><b>{n.baslik}</b><ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>{n.maddeler.map((x) => <li key={x}>{x}</li>)}</ul><span style={kucuk}>{n.kaynak}</span></div>)}
              </div>
            )}
            {veri.kayitlar.length > 0 && (
              <details style={kart}>
                <summary style={{ fontWeight: 700 }}>Son kayıtlar ({veri.kayitlar.length})</summary>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>{veri.kayitlar.slice(0, 60).map((k) => <li key={k.id}>{k.gun} · {veri.moduller.find((m) => m.kod === k.modul)?.baslik || k.modul}: {Object.entries(k.veri).filter(([x]) => x !== 'cevaplar').map(([x, v]) => `${x}=${v === true ? 'evet' : v === false ? 'hayır' : String(v)}`).join(', ')}</li>)}</ul>
              </details>
            )}
            {veri.fotolar.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {veri.fotolar.map((f) => <FotoKart key={f.id} patientId={hasta} f={f} yenile={hastaYukle} />)}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default function BransPaketiYonetimi() {
  return <Suspense fallback={null}><Ic /></Suspense>
}
