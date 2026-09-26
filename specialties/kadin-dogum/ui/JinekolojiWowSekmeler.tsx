/**
 * NOTYA-JINE-04 / KD-05 — Sprint UI: CYBH tedavi, EC/MEC, menoraji ladder, USG rapor,
 * Anti-D loop, e-Doğum, paket, CS savunma, ürojine/onkoloji, infertilite, şiddet.
 */
'use client'
import React, { useState } from 'react'
import { toolsInput } from '@/lib/doktor/toolsUi'
import { USG_SABLONLARI, type UsgSablonKod } from '../engines/kd-klinik-wow'
import { YONTEM_KATALOG } from '../engines/kontrasepsiyon-mec'
import { NAAT_PAKETLERI } from '../engines/cybh-tedavi'
import type { Dipnot } from '../engines/jinekoloji-v2'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Calistir = (body: Record<string, unknown>, ok?: string) => Promise<unknown>

type EnabizPaketUi = {
  tur?: string
  kanal?: string
  live_write?: boolean
  kopya_metin?: string
  eksikler?: string[]
  uretildi_at?: string
}

function enabizIndir(paket: unknown, ad: string) {
  if (!paket || typeof paket !== 'object') return
  const blob = new Blob([JSON.stringify(paket, null, 2)], { type: 'application/json;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = ad
  a.click()
  URL.revokeObjectURL(a.href)
}

async function enabizKopyala(paket: EnabizPaketUi | null | undefined) {
  const t = paket?.kopya_metin
  if (!t) return
  try { await navigator.clipboard.writeText(t) } catch { /* ignore */ }
}

const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' }
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 }
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted }
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }
const chk = (label: string, v: boolean, on: (x: boolean) => void) => (
  <label key={label} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 8px', color: v ? '#0F9B8E' : CHROME_RENK.muted }}>
    <input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label}
  </label>
)

function Kaynak({ dip, acik }: { dip?: Dipnot[] | null; acik: boolean }) {
  if (!acik || !dip?.length) return null
  return <div style={{ ...kucuk, marginTop: 4, borderLeft: '2px solid rgba(15,155,142,0.5)', paddingLeft: 8 }}>{dip.map((d, i) => <div key={i}><b>{d.ref}</b> — {d.not}</div>)}</div>
}

export const WOW_SEKME = [
  'CYBH tedavi', 'Acil KB / MEC', 'Menoraji tedavi', 'USG rapor', 'Anti-D döngü',
  'e-Doğum', 'Paket', 'C/S savunma', 'Ürojine / Onkoloji', 'İnfertilite+', 'Şiddet / KOK yıllık',
] as const

export type WowVeri = {
  cybhTedavi?: Record<string, unknown> | null
  acil?: Record<string, unknown> | null
  menoraji?: Record<string, unknown> | null
  usg?: Record<string, unknown>[]
  antiD?: Record<string, unknown> | null
  eDogum?: Record<string, unknown> | null
  paket?: Record<string, unknown> | null
  cs?: Record<string, unknown> | null
  urojine?: Record<string, unknown> | null
  onkoloji?: Record<string, unknown> | null
  infertilite?: Record<string, unknown> | null
  siddet?: Record<string, unknown> | null
  kokYillik?: { due: string; maddeler: string[] } | null
}

export function JinekolojiWowSekmeler({
  sekme, wow, calistir, kaynakAcik, etkenler,
}: {
  sekme: string
  wow: WowVeri
  calistir: Calistir
  kaynakAcik: boolean
  etkenler: readonly string[]
}) {
  const [f, setF] = useState<Record<string, unknown>>({})
  const s = (k: string) => (f[k] as string) ?? ''
  const b = (k: string) => !!f[k]
  const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }))
  const etk = () => ((f.etk as string[]) || [])

  if (sekme === 'CYBH tedavi') {
    const plan = wow.cybhTedavi as { satirlar?: { baslik: string; birinciBasamak: string; alternatif?: string; gebe?: string; partner: string; toc?: string; notlar: string[] }[]; partnerGerekli?: boolean; yazdirilabilirPartner?: string; naatOner?: { ad: string; ornek: string }[]; tocGorevleri?: string[] } | null
    return (
      <div>
        <div style={etiket}>CYBH tedavi motoru <span style={kucuk}>· CDC-TR doz kartı + NAAT + TOC + partner yazdırılabilir not · hekim reçete eder</span></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {etkenler.map((e) => chk(e, etk().includes(e), (x) => set('etk', x ? [...etk(), e] : etk().filter((y) => y !== e))))}
          {chk('gebe', b('gebe'), (x) => set('gebe', x))}
        </div>
        <div style={satir}>
          <button type="button" onClick={() => calistir({ adim: 'cybh_tedavi', etkenler: etk(), gebe: b('gebe') }, 'Tedavi planı üretildi; TOC/partner görevleri açıldı.')} style={btn}>Plan üret</button>
          <button type="button" onClick={() => calistir({ adim: 'cybh_tedavi', etkenler: etk(), gebe: b('gebe'), partnerYazdir: true }, 'Partner notu günün notuna işlendi.')} style={ghost}>Partner notunu kaydet</button>
        </div>
        <div style={{ ...kucuk, marginTop: 8 }}>NAAT paketleri: {NAAT_PAKETLERI.map((n) => n.ad).join(' · ')}</div>
        {plan?.satirlar?.map((r) => (
          <div key={r.baslik} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 0', fontSize: 12, color: CHROME_RENK.ink }}>
            <b>{r.baslik}</b>
            <div style={{ color: '#0F9B8E' }}>1. basamak: {r.birinciBasamak}</div>
            {r.alternatif && <div style={kucuk}>Alt: {r.alternatif}</div>}
            <div style={{ color: '#FBBF24' }}>Partner: {r.partner}</div>
            {r.toc && <div style={kucuk}>TOC: {r.toc}</div>}
            {r.notlar?.map((n) => <div key={n} style={kucuk}>• {n}</div>)}
          </div>
        ))}
        {plan?.naatOner?.length ? <div style={{ ...kucuk, marginTop: 6 }}>Önerilen NAAT: {plan.naatOner.map((n) => `${n.ad} (${n.ornek})`).join('; ')}</div> : null}
        {plan?.yazdirilabilirPartner && <pre style={{ ...kucuk, whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.25)', padding: 8, borderRadius: 8, marginTop: 8 }}>{plan.yazdirilabilirPartner}</pre>}
      </div>
    )
  }

  if (sekme === 'Acil KB / MEC') {
    const acil = wow.acil as { secenekler?: { ad: string; pencere: string; etkinlik: string; not: string }[]; oneri?: string; sonrasi?: string[]; mec?: { yontem: string; kategori: number; engeller: string[]; dikkat: string[]; not: string }; postpartum?: { yontem: string; baslangic: string; not: string }[] } | null
    return (
      <div>
        <div style={etiket}>Acil kontrasepsiyon + yöntem MEC + postpartum başlangıç</div>
        <div style={satir}>
          <input value={s('saat')} onChange={(e) => set('saat', e.target.value)} placeholder="ilişkiden saat" style={{ ...toolsInput, width: 120 }} />
          {chk('emziriyor', b('emz'), (x) => set('emz', x))}
          <button type="button" onClick={() => calistir({ adim: 'acil_kb', iliskiSaatOnce: s('saat'), emziriyor: b('emz') }, 'EC seçenekleri hazır.')} style={btn}>EC değerlendir</button>
        </div>
        <div style={satir}>
          <select value={s('ym')} onChange={(e) => set('ym', e.target.value)} style={{ ...toolsInput, width: 'auto' }}>
            <option value="">MEC yöntem</option>
            {YONTEM_KATALOG.map((y) => <option key={y.kod} value={y.kod} style={{ color: '#000' }}>{y.ad}</option>)}
          </select>
          <input value={s('sig')} onChange={(e) => set('sig', e.target.value)} placeholder="sigara/gün" style={{ ...toolsInput, width: 90 }} />
          <input value={s('pp')} onChange={(e) => set('pp', e.target.value)} placeholder="PP gün" style={{ ...toolsInput, width: 80 }} />
          {chk('VTE', b('vte'), (x) => set('vte', x))}{chk('aura', b('aura'), (x) => set('aura', x))}{chk('PID aktif', b('pid'), (x) => set('pid', x))}
          <button type="button" onClick={() => calistir({ adim: 'yontem_mec', yontem: s('ym'), kontrol: { sigaraGunluk: s('sig'), postpartumGun: s('pp'), vteOykusu: b('vte'), migrenAura: b('aura'), pidAktif: b('pid'), emziriyor: b('emz') } }, 'MEC sonucu.')} style={ghost}>MEC çalıştır</button>
          <button type="button" onClick={() => calistir({ adim: 'postpartum_kb', postpartumGun: s('pp') || '42', emziriyor: b('emz') }, 'PP başlangıç listesi.')} style={ghost}>PP başlangıç</button>
        </div>
        {acil?.oneri && <div style={{ fontSize: 12, color: CHROME_RENK.ink, marginTop: 8 }}><b>{acil.oneri}</b></div>}
        {acil?.secenekler?.map((c) => <div key={c.ad} style={{ fontSize: 12, color: CHROME_RENK.ink, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 0' }}><b>{c.ad}</b> · {c.pencere} · {c.etkinlik}<div style={kucuk}>{c.not}</div></div>)}
        {acil?.sonrasi?.map((x) => <div key={x} style={kucuk}>→ {x}</div>)}
        {acil?.mec && <div style={{ marginTop: 8, fontSize: 12, color: acil.mec.kategori >= 4 ? '#F87171' : acil.mec.kategori === 3 ? '#FBBF24' : '#0F9B8E' }}>MEC {YONTEM_KATALOG.find((y) => y.kod === acil.mec!.yontem)?.ad ?? acil.mec.yontem}: kat {acil.mec.kategori} — {acil.mec.not}{acil.mec.engeller?.map((e) => <div key={e}>✖ {e}</div>)}{acil.mec.dikkat?.map((e) => <div key={e}>⚠ {e}</div>)}</div>}
        {acil?.postpartum?.map((p) => <div key={p.yontem} style={{ fontSize: 12, color: CHROME_RENK.ink }}>{YONTEM_KATALOG.find((y) => y.kod === p.yontem)?.ad ?? p.yontem}: {p.baslangic} <span style={kucuk}>{p.not}</span></div>)}
      </div>
    )
  }

  if (sekme === 'Menoraji tedavi') {
    const m = wow.menoraji as { basamaklar?: { sira: number; baslik: string; detay: string; doz?: string; uygun: boolean; gerekce: string }[]; kirmizi?: string[]; dipnotlar?: Dipnot[] } | null
    return (
      <div>
        <div style={etiket}>Menoraji tedavi basamağı (LNG-IUS → TXA → NSAİİ → KOK/progestin → cerrahi)</div>
        <div style={satir}>
          {chk('menoraji', b('men'), (x) => set('men', x))}
          {chk('gebelik isteği', b('gi'), (x) => set('gi', x))}
          {chk('bozucu myom', b('my'), (x) => set('my', x))}
          {chk('adenomyozis', b('ad'), (x) => set('ad', x))}
          {chk('medikal başarısız', b('mb'), (x) => set('mb', x))}
          {chk('örnekleme riskli', b('or'), (x) => set('or', x))}
          <select value={s('anemi')} onChange={(e) => set('anemi', e.target.value)} style={{ ...toolsInput, width: 'auto' }}>
            {['bilinmiyor', 'yok', 'hafif', 'orta', 'agir'].map((a) => <option key={a} value={a} style={{ color: '#000' }}>{a}</option>)}
          </select>
          <button type="button" onClick={() => calistir({ adim: 'menoraji_tedavi', girdi: { menoraji: b('men'), anemi: s('anemi') || 'bilinmiyor', gebelikIstegi: b('gi'), myomBozucu: b('my'), adenomyozis: b('ad'), medikalBasarisiz: b('mb'), orneklemeSonucRiskli: b('or') } }, 'Tedavi basamakları hazır.')} style={btn}>Basamaklandır</button>
        </div>
        {m?.kirmizi?.map((k) => <div key={k} style={{ color: '#F87171', fontSize: 12 }}>✖ {k}</div>)}
        {m?.basamaklar?.map((x) => (
          <div key={x.sira} style={{ fontSize: 12, color: x.uygun ? CHROME_RENK.ink : CHROME_RENK.muted, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
            <b>{x.sira}. {x.baslik}</b> {x.uygun ? '✓' : '—'}<div style={kucuk}>{x.detay}{x.doz ? ` · ${x.doz}` : ''} · {x.gerekce}</div>
          </div>
        ))}
        <Kaynak dip={m?.dipnotlar} acik={kaynakAcik} />
      </div>
    )
  }

  if (sekme === 'USG rapor') {
    const son = (wow.usg || [])[0] as { baslik?: string; govde?: string; sutOneri?: string; bayraklar?: string[]; enabiz?: EnabizPaketUi } | undefined
    return (
      <div>
        <div style={etiket}>1-tap USG rapor + SUT önerisi <span style={kucuk}>· e-Nabız FHIR DiagnosticReport (canlı yazım yok)</span></div>
        <div style={satir}>
          <select value={s('usg')} onChange={(e) => set('usg', e.target.value)} style={{ ...toolsInput, width: 'auto' }}>
            <option value="">şablon</option>
            {USG_SABLONLARI.map((u) => <option key={u.kod} value={u.kod} style={{ color: '#000' }}>{u.ad}</option>)}
          </select>
          <input value={s('crl')} onChange={(e) => set('crl', e.target.value)} placeholder="CRL/biyometri" style={{ ...toolsInput, width: 120 }} />
          <input value={s('not')} onChange={(e) => set('not', e.target.value)} placeholder="hekim notu" style={{ ...toolsInput, minWidth: 180 }} />
          <button type="button" disabled={!s('usg')} onClick={() => calistir({ adim: 'usg_rapor', sablon: s('usg') as UsgSablonKod, olcumler: { CRL: s('crl') }, hekimNotu: s('not') }, 'Rapor taslağı + e-Nabız FHIR paket kaydedildi.')} style={btn}>Rapor üret</button>
        </div>
        {son?.baslik && (
          <div style={{ marginTop: 8, fontSize: 12, color: CHROME_RENK.ink }}>
            <b>{son.baslik}</b>
            <div style={{ color: '#FBBF24' }}>SUT: {son.sutOneri}</div>
            {son.bayraklar?.map((x) => <div key={x} style={{ color: '#F87171' }}>⚠ {x}</div>)}
            <pre style={{ ...kucuk, whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.25)', padding: 8, borderRadius: 8 }}>{son.govde}</pre>
            {son.enabiz && (
              <div style={satir}>
                <button type="button" onClick={() => enabizIndir(son.enabiz, `enabiz-usg-${(son.enabiz?.uretildi_at || '').slice(0, 10) || 'paket'}.json`)} style={ghost}>⬇ e-Nabız FHIR JSON</button>
                <button type="button" onClick={() => enabizKopyala(son.enabiz)} style={ghost}>📋 MBYS için kopyala</button>
                <span style={kucuk}>{son.enabiz.kanal} · live_write={String(son.enabiz.live_write)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (sekme === 'Anti-D döngü') {
    const a = wow.antiD as { gorevler?: { ad: string; dueHint: string }[]; dozNotu?: string } | null
    return (
      <div>
        <div style={etiket}>Anti-D kapalı döngü (abortus / kanama / postpartum)</div>
        <div style={satir}>
          {chk('Rh−', b('rh'), (x) => set('rh', x))}
          {chk('partner Rh+ / bilinmiyor', b('pr'), (x) => set('pr', x))}
          {chk('Coombs−', b('cb'), (x) => set('cb', x))}
          {chk('antenatal yapıldı', b('ant'), (x) => set('ant', x))}
          {[['abortus', 'abortus'], ['ektopik', 'ektopik'], ['kanama_antepartum', 'AP kanama'], ['postpartum_rh_pos', 'PP Rh+ bebek'], ['amniyosentez', 'amnio'], ['travma_karin', 'travma']].map(([k, ad]) => chk(ad, ((f.tet as string[]) || []).includes(k), (x) => set('tet', x ? [...((f.tet as string[]) || []), k] : ((f.tet as string[]) || []).filter((y) => y !== k))))}
          <button type="button" onClick={() => calistir({ adim: 'anti_d_loop', rhNegatif: b('rh'), partnerRhPozitifVeyaBilinmiyor: b('pr'), indirektCoombsNegatif: b('cb'), antenatalYapildi: b('ant'), postpartumYapildi: false, tetikler: f.tet || [] }, 'Anti-D görevleri açıldı.')} style={btn}>Döngüyü çalıştır</button>
        </div>
        {a?.dozNotu && <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{a.dozNotu}</div>}
        {a?.gorevler?.map((g) => <div key={g.ad} style={{ fontSize: 12, color: CHROME_RENK.ink }}>• {g.ad} <span style={kucuk}>({g.dueHint})</span></div>)}
      </div>
    )
  }

  if (sekme === 'e-Doğum') {
    const e = wow.eDogum as { alanlar?: { etiket: string; deger: string; eksik: boolean }[]; tamam?: boolean; uyari?: string[]; enabiz?: EnabizPaketUi } | null
    return (
      <div>
        <div style={etiket}>e-Doğum sihirbazı <span style={kucuk}>· MoH DBS / USS alanları — canlı yazım yok, format-hazır JSON</span></div>
        <div style={satir}>
          <input value={s('dz')} onChange={(e) => set('dz', e.target.value)} placeholder="doğum tarih-saat" style={{ ...toolsInput, width: 160 }} />
          <select value={s('sekil')} onChange={(e) => set('sekil', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">şekil</option><option value="vajinal" style={{ color: '#000' }}>vajinal</option><option value="cs" style={{ color: '#000' }}>C/S</option></select>
          <input value={s('hf')} onChange={(e) => set('hf', e.target.value)} placeholder="hf" style={{ ...toolsInput, width: 60 }} />
          <input value={s('kilo')} onChange={(e) => set('kilo', e.target.value)} placeholder="g" style={{ ...toolsInput, width: 70 }} />
          <select value={s('canli')} onChange={(e) => set('canli', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="canli" style={{ color: '#000' }}>canlı</option><option value="olu" style={{ color: '#000' }}>ölü</option></select>
          <input value={s('cin')} onChange={(e) => set('cin', e.target.value)} placeholder="cinsiyet" style={{ ...toolsInput, width: 90 }} />
          <button type="button" onClick={() => calistir({ adim: 'e_dogum', payload: { dogum_tarih_saat: s('dz'), dogum_sekli: s('sekil'), gebelik_haftasi: s('hf'), kilo: s('kilo'), canli_olu: s('canli') || 'canli', cinsiyet: s('cin'), dogum_yeri: 'klinik', anne_tc: 'hasta' } }, 'e-Doğum USS paketi hazır.')} style={btn}>Paket oluştur</button>
        </div>
        {e?.tamam === false && <div style={{ color: '#FBBF24', fontSize: 12 }}>Eksik zorunlu alanlar var</div>}
        {e?.uyari?.map((u) => <div key={u} style={{ color: '#F87171', fontSize: 12 }}>⚠ {u}</div>)}
        {e?.alanlar?.map((a) => <div key={a.etiket} style={{ fontSize: 12, color: a.eksik ? '#F87171' : CHROME_RENK.ink }}>{a.eksik ? '✖' : '✓'} {a.etiket}: {a.deger || '—'}</div>)}
        {e?.enabiz && (
          <div style={satir}>
            <button type="button" onClick={() => enabizIndir(e.enabiz, `enabiz-e_dogum-${(e.enabiz?.uretildi_at || '').slice(0, 10) || 'paket'}.json`)} style={ghost}>⬇ e-Nabız / e-Doğum JSON</button>
            <button type="button" onClick={() => enabizKopyala(e.enabiz)} style={ghost}>📋 Forma kopyala</button>
            <span style={kucuk}>{e.enabiz.kanal} · eksik {e.enabiz.eksikler?.length || 0}</span>
          </div>
        )}
      </div>
    )
  }

  if (sekme === 'Paket') {
    const p = wow.paket as { satirlar?: { ad: string; limit: number; kullanilan: number; kalan: number; asildi: boolean }[]; ozet?: string } | null
    return (
      <div>
        <div style={etiket}>Özel gebelik paketi defteri (vizit / US / NST kota)</div>
        <div style={satir}>
          <input value={s('vizit')} onChange={(e) => set('vizit', e.target.value)} placeholder="vizit kullanılan" style={{ ...toolsInput, width: 120 }} />
          <input value={s('usgK')} onChange={(e) => set('usgK', e.target.value)} placeholder="US kullanılan" style={{ ...toolsInput, width: 110 }} />
          <input value={s('nst')} onChange={(e) => set('nst', e.target.value)} placeholder="NST kullanılan" style={{ ...toolsInput, width: 110 }} />
          <button type="button" onClick={() => calistir({ adim: 'paket', kullanilan: { vizit: Number(s('vizit') || 0), usg: Number(s('usgK') || 0), nst: Number(s('nst') || 0) } }, 'Paket güncellendi.')} style={btn}>Güncelle</button>
        </div>
        {p?.ozet && <div style={{ fontSize: 12, color: '#FBBF24' }}>{p.ozet}</div>}
        {p?.satirlar?.map((x) => <div key={x.ad} style={{ fontSize: 12, color: x.asildi ? '#F87171' : CHROME_RENK.ink }}>{x.ad}: {x.kullanilan}/{x.limit} (kalan {x.kalan})</div>)}
      </div>
    )
  }

  if (sekme === 'C/S savunma') {
    const c = wow.cs as { checklist?: string[]; metin?: string; eksik?: string[] } | null
    return (
      <div>
        <div style={etiket}>C/S endikasyon savunma paketi (GÖREN)</div>
        <div style={satir}>
          <input value={s('end')} onChange={(e) => set('end', e.target.value)} placeholder="endikasyonlar (virgülle)" style={{ ...toolsInput, minWidth: 260 }} />
          <input value={s('karar')} onChange={(e) => set('karar', e.target.value)} placeholder="karar ISO zaman" style={{ ...toolsInput, width: 180 }} />
          {chk('fetal distres', b('fd'), (x) => set('fd', x))}
          <button type="button" onClick={() => calistir({ adim: 'cs_savunma', endikasyonlar: s('end').split(',').map((x) => x.trim()).filter(Boolean), kararAt: s('karar') || new Date().toISOString(), fetalDistres: b('fd') }, 'Savunma notu hazır.')} style={btn}>Paket oluştur</button>
        </div>
        {c?.eksik?.map((e) => <div key={e} style={{ color: '#F87171', fontSize: 12 }}>✖ {e}</div>)}
        {c?.checklist?.map((x) => <div key={x} style={{ fontSize: 12, color: CHROME_RENK.muted }}>□ {x}</div>)}
        {c?.metin && <pre style={{ ...kucuk, whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.25)', padding: 8, borderRadius: 8 }}>{c.metin}</pre>}
      </div>
    )
  }

  if (sekme === 'Ürojine / Onkoloji') {
    const u = wow.urojine as { oncelik?: string; gorevler?: string[]; not?: string } | null
    const o = wow.onkoloji as { risk?: string; sevk?: boolean; not?: string[] } | null
    return (
      <div>
        <div style={etiket}>Ürojinekoloji + over kitle IOTA basit triyaj (sevk kalitesi)</div>
        <div style={satir}>
          {chk('stres IK', b('sik'), (x) => set('sik', x))}{chk('sıkışma', b('sik2'), (x) => set('sik2', x))}{chk('prolapsus', b('pro'), (x) => set('pro', x))}
          <input value={s('pvr')} onChange={(e) => set('pvr', e.target.value)} placeholder="PVR ml" style={{ ...toolsInput, width: 80 }} />
          <button type="button" onClick={() => calistir({ adim: 'urojine', stresInkontinans: b('sik'), sikilik: b('sik2'), prolapsusSikayet: b('pro'), residual: s('pvr') }, 'Ürojine kartı.')} style={ghost}>Ürojine</button>
        </div>
        <div style={satir}>
          {chk('solid', b('sol'), (x) => set('sol', x))}{chk('asit', b('asit'), (x) => set('asit', x))}{chk('papiller', b('pap'), (x) => set('pap', x))}{chk('güçlü Doppler', b('dop'), (x) => set('dop', x))}{chk('menopoz', b('mp'), (x) => set('mp', x))}
          <input value={s('ca')} onChange={(e) => set('ca', e.target.value)} placeholder="CA-125" style={{ ...toolsInput, width: 80 }} />
          <button type="button" onClick={() => calistir({ adim: 'onkoloji_iota', kistSolid: b('sol'), asit: b('asit'), papiller: b('pap'), dopplerGuclu: b('dop'), menopoz: b('mp'), ca125: s('ca') }, 'IOTA triyaj.')} style={btn}>Onkoloji triyaj</button>
        </div>
        {u && <div style={{ fontSize: 12, color: CHROME_RENK.ink }}>Ürojine öncelik: {u.oncelik}{u.gorevler?.map((g) => <div key={g}>• {g}</div>)}<div style={kucuk}>{u.not}</div></div>}
        {o && <div style={{ fontSize: 12, color: o.sevk ? '#F87171' : '#0F9B8E' }}>Over risk: {({ benign_olasi: 'benign olası', ara: 'ara grup', yuksek: 'yüksek' } as Record<string, string>)[o.risk ?? ''] ?? o.risk} {o.sevk ? '→ SEVK' : ''}{o.not?.map((n) => <div key={n} style={kucuk}>{n}</div>)}</div>}
      </div>
    )
  }

  if (sekme === 'İnfertilite+') {
    const inf = wow.infertilite as { eksik?: string[]; sevkMetni?: string; hazir?: boolean } | null
    const kodlar = ['sure', 'amh', 'tsh_prl', 'semen', 'hsg', 'ovulasyon', 'tvus', 'hsg_sonuc', 'sevk']
    return (
      <div>
        <div style={etiket}>İnfertilite 1. basamak (HSG sonucu + sevk paketi) — IVF lab yok</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {kodlar.map((k) => chk(k, ((f.inf as string[]) || []).includes(k), (x) => set('inf', x ? [...((f.inf as string[]) || []), k] : ((f.inf as string[]) || []).filter((y) => y !== k))))}
        </div>
        <div style={satir}><button type="button" onClick={() => calistir({ adim: 'infertilite_sevk', tamamlanan: f.inf || [] }, 'Sevk paketi güncellendi.')} style={btn}>Sevk paketi</button></div>
        {inf && <div style={{ fontSize: 12, color: inf.hazir ? '#0F9B8E' : '#FBBF24' }}>{inf.sevkMetni}{inf.eksik?.map((e) => <div key={e}>✖ {e}</div>)}</div>}
      </div>
    )
  }

  if (sekme === 'Şiddet / KOK yıllık') {
    const sid = wow.siddet as { durum?: string; gorevler?: string[]; not?: string } | null
    const kok = wow.kokYillik
    return (
      <div>
        <div style={etiket}>Şiddet tarama (JINE-03) + KOK yıllık TA/kilo</div>
        <div style={satir}>
          <button type="button" onClick={() => calistir({ adim: 'siddet', evet: null }, 'Sorulmadı kaydı.')} style={ghost}>Sorulmadı</button>
          <button type="button" onClick={() => calistir({ adim: 'siddet', evet: false }, 'Hayır kaydı.')} style={ghost}>Hayır</button>
          <button type="button" onClick={() => calistir({ adim: 'siddet', evet: true }, 'Şiddet yolu açıldı — sevk görevleri.')} style={btn}>Evet — sevk</button>
          <input type="date" value={s('kokb')} onChange={(e) => set('kokb', e.target.value)} style={{ ...toolsInput, width: 140 }} />
          <button type="button" onClick={() => calistir({ adim: 'kok_yillik', baslangic: s('kokb') }, 'KOK yıllık güvenlik görevi.')} style={ghost}>KOK yıllık görev</button>
        </div>
        {sid && <div style={{ fontSize: 12, color: sid.durum === 'evet' ? '#F87171' : CHROME_RENK.muted }}>{({ sorulmadi: 'Sorulmadı', hayir: 'Hayır', evet: 'Evet' } as Record<string, string>)[sid.durum ?? ''] ?? sid.durum}: {sid.not}{sid.gorevler?.map((g) => <div key={g}>• {g}</div>)}</div>}
        {kok && <div style={{ fontSize: 12, color: CHROME_RENK.ink }}>KOK yıllık due {kok.due}: {kok.maddeler.join(', ')}</div>}
      </div>
    )
  }

  return null
}
