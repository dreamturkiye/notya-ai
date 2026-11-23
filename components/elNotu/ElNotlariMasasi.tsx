'use client'
/**
 * ESNEK-MUAYENE-A — El Notları masası (doctor and secretary): pages waiting for reading confirmation, hand-note drafts
 * (provenance per sentence, Doğrula, edit, finalize or send to the doctor), the doctor's "Onay bekleyen notlar", batch
 * upload of the day's pages, and the honest daily time line. Country-neutral (words + API + routes injected).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ElNotuMetinleri } from '@/core/elNotu/metinTr'
import type { Kutu } from '@/core/elNotu/tipler'
import { AktifSure } from '@/core/elNotu/zaman'
import { EL_RENK as R } from './renk'
import ElNotuYakala, { dugme, type Getirici } from './ElNotuYakala'
import DogrulaPaneli, { Kirpinti, useSayfaTuvalleri, type DogrulaSatiri, type KaynakGorunumu } from './DogrulaPaneli'
import TopluYukleme, { type RandevuOzeti } from './TopluYukleme'

type Rol = 'doktor' | 'sekreter' | 'asistan' | 'hasta_danismani'
type Ayar = { ayar: { hekimOnayiGerekli: boolean; hazirlayan: 'doktor' | 'sekreter'; tabanDk: number | null }; rol: Rol; kesinlestirebilir: boolean; hazirlayabilir: boolean }
type KaynakListe = KaynakGorunumu & { patient_id: string; session_id: string | null; note_id: string | null; hasta: string; durum: string; sayfa_sayisi: number; created_at: string; acik_dogrula: number }
type TaslakListe = { id: string; sessionId: string; tarih: string; hekimOnayiBekliyor: boolean; hazirlayan: string | null; sikayet: string | null; patientId: string | null; hasta: string }

export type MasaYollari = { notFormu: (noteId: string) => string; hastaDosyasi: (patientId: string) => string; randevular: () => Promise<RandevuOzeti[]> }

export default function ElNotlariMasasi(p: { metin: ElNotuMetinleri; getir: Getirici; api: string; yollar: MasaYollari; hastaSec: (onSec: (h: { id: string; ad: string }) => void) => React.ReactNode; /** ESNEK-MUAYENE-B7: the doctor's time meter, injected by the build (today + week). */ ust?: React.ReactNode }) {
  const M = p.metin
  const [ayar, setAyar] = useState<Ayar | null>(null)
  const [kaynaklar, setKaynaklar] = useState<KaynakListe[]>([])
  const [taslaklar, setTaslaklar] = useState<TaslakListe[]>([])
  const [bekleyen, setBekleyen] = useState<TaslakListe[]>([])
  const [acikTaslak, setAcikTaslak] = useState<string | null>(null)
  const [yakala, setYakala] = useState<{ id: string; ad: string } | null>(null)
  const [sekme, setSekme] = useState<'okuma' | 'taslak' | 'onay' | 'toplu'>('okuma')

  const yukle = useCallback(async () => {
    const [a, k, t] = await Promise.all([
      p.getir(`${p.api}/ayar`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      p.getir(`${p.api}/kaynak?acik=1`).then((r) => (r.ok ? r.json() : { kaynaklar: [] })).catch(() => ({ kaynaklar: [] })),
      p.getir(`${p.api}/taslak?liste=1`).then((r) => (r.ok ? r.json() : { taslaklar: [] })).catch(() => ({ taslaklar: [] })),
    ])
    setAyar(a)
    setKaynaklar((k.kaynaklar || []) as KaynakListe[])
    setTaslaklar((t.taslaklar || []) as TaslakListe[])
    if (a?.rol === 'doktor') {
      const b = await p.getir(`${p.api}/onay-bekleyen`).then((r) => (r.ok ? r.json() : { notlar: [] })).catch(() => ({ notlar: [] }))
      setBekleyen((b.notlar || []).map((n: TaslakListe) => ({ ...n, hekimOnayiBekliyor: true })))
    }
  }, [p])
  useEffect(() => { void yukle() }, [yukle])

  if (!ayar) return <div style={{ color: R.soluk, fontSize: 14 }}>…</div>
  if (!ayar.hazirlayabilir) return <div style={{ color: R.soluk, fontSize: 14 }}>{M.hata.yetki}</div>
  const doktor = ayar.rol === 'doktor'
  const sekmeler: { id: typeof sekme; ad: string; sayi: number }[] = [
    { id: 'okuma', ad: M.masa.okumalar, sayi: kaynaklar.reduce((t, k) => t + k.sorular.length, 0) },
    { id: 'taslak', ad: M.masa.taslaklar, sayi: taslaklar.length },
    ...(doktor ? [{ id: 'onay' as const, ad: M.akis.onayBekleyen, sayi: bekleyen.length }] : []),
    { id: 'toplu', ad: M.toplu.baslik, sayi: 0 },
  ]
  return (
    <div style={{ display: 'grid', gap: 16, color: R.murekkep }}>
      {doktor && p.ust}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {sekmeler.map((s) => (
          <button key={s.id} type="button" onClick={() => setSekme(s.id)} style={{ ...dugme(sekme === s.id ? 'birincil' : 'ikincil'), borderRadius: 999 }}>
            {s.ad}{s.sayi ? ` · ${s.sayi}` : ''}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {p.hastaSec((h) => setYakala(h))}
      </div>

      {sekme === 'okuma' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {!kaynaklar.length && <div style={{ fontSize: 14, color: R.soluk }}>{M.dogrula.bos}</div>}
          {kaynaklar.map((k) => (
            <section key={k.id} style={kart}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 650 }}>{k.hasta || M.toplu.hastaSec} · {new Date(k.created_at).toLocaleString(M.yerel, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                <div style={{ fontSize: 12, color: R.soluk }}>{k.sayfa_sayisi} {M.sayfalar}</div>
              </div>
              <DogrulaPaneli metin={M} getir={p.getir} api={p.api} kaynaklar={[k]} rol={ayar.rol} onDegisti={() => void yukle()} />
              {k.session_id && !k.sorular.some((s) => s.sinif === 'korumali') && (
                <NotuOlustur metin={M} getir={p.getir} api={p.api} sessionId={k.session_id} onHazir={(noteId) => { setAcikTaslak(noteId); setSekme('taslak'); void yukle() }} />
              )}
            </section>
          ))}
        </div>
      )}

      {(sekme === 'taslak' || sekme === 'onay') && (
        <div style={{ display: 'grid', gap: 12 }}>
          {(sekme === 'onay' ? bekleyen : taslaklar).map((t) => (
            <section key={t.id} style={kart}>
              <button type="button" onClick={() => setAcikTaslak(acikTaslak === t.id ? null : t.id)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                <span style={{ fontWeight: 650 }}>{t.hasta} · {new Date(t.tarih).toLocaleDateString(M.yerel)}</span>
                <span style={{ fontSize: 12, color: t.hekimOnayiBekliyor ? R.amber : R.soluk }}>{t.hekimOnayiBekliyor ? M.akis.onayBekleyen : t.sikayet || ''}</span>
              </button>
              {acikTaslak === t.id && <TaslakEditoru metin={M} getir={p.getir} api={p.api} noteId={t.id} ayar={ayar} yollar={p.yollar} onBitti={() => { setAcikTaslak(null); void yukle() }} />}
            </section>
          ))}
          {!(sekme === 'onay' ? bekleyen : taslaklar).length && <div style={{ fontSize: 14, color: R.soluk }}>{sekme === 'onay' ? M.akis.onayBekleyenBos : M.dogrula.bos}</div>}
        </div>
      )}

      {sekme === 'toplu' && <TopluYukleme metin={M} getir={p.getir} api={p.api} randevular={p.yollar.randevular} hastaSec={p.hastaSec} onBitti={() => { setSekme('okuma'); void yukle() }} />}

      {yakala && <ElNotuYakala metin={M} getir={p.getir} api={p.api} patientId={yakala.id} kanal="dosya" onKapat={() => setYakala(null)} onTamam={() => { setYakala(null); void yukle() }} />}
    </div>
  )
}

const kart: React.CSSProperties = { background: R.kagit, border: `1px solid ${R.cizgi}`, borderRadius: 16, padding: 16, display: 'grid', gap: 12 }

export function NotuOlustur(p: { metin: ElNotuMetinleri; getir: Getirici; api: string; sessionId: string; onHazir: (noteId: string) => void }) {
  const [calisiyor, setCalisiyor] = useState(false)
  const [hata, setHata] = useState('')
  return (
    <div>
      <button type="button" style={dugme('birincil')} disabled={calisiyor} onClick={async () => {
        setCalisiyor(true); setHata('')
        try {
          const r = await p.getir(`${p.api}/derle`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: p.sessionId }) })
          const j = await r.json().catch(() => ({}))
          if (!r.ok || !j.noteId) throw new Error(j.error || p.metin.hata.genel)
          p.onHazir(String(j.noteId))
        } catch (e) { setHata(e instanceof Error ? e.message : p.metin.hata.genel) } finally { setCalisiyor(false) }
      }}>{calisiyor ? p.metin.derle.notOlusturuluyor : p.metin.derle.notuOlustur}</button>
      {hata && <div role="alert" style={{ color: R.uyari, fontSize: 13, marginTop: 6 }}>{hata}</div>}
    </div>
  )
}

const ALANLAR = ['subjektif', 'objektif', 'degerlendirme', 'plan'] as const
const KOLON = { subjektif: 'content_subjektif', objektif: 'content_objektif', degerlendirme: 'content_degerlendirme', plan: 'content_plan' } as const
const YT = /⟦([a-z0-9-]+)(?:\|([^⟧]*))?⟧/g

/** A text with ⟦key|reading?⟧ placeholders rendered as amber chips (never as if confirmed). */
function YerTutucuMetni({ metin }: { metin: string }) {
  const parcalar: React.ReactNode[] = []
  let son = 0
  for (const m of metin.matchAll(YT)) {
    if ((m.index ?? 0) > son) parcalar.push(metin.slice(son, m.index))
    parcalar.push(<span key={m.index} style={{ background: R.amberAcik, color: R.amber, borderRadius: 6, padding: '0 6px', fontWeight: 600 }}>{(m[2] || '?').replace(/\?$/, '')}?</span>)
    son = (m.index ?? 0) + m[0].length
  }
  parcalar.push(metin.slice(son))
  return <>{parcalar}</>
}

type TaslakYaniti = {
  not: Record<string, unknown> & { id: string; kaynak_izleri?: Record<string, { cumle: string; etiketler: string[] }[]> | null; kaynak_ozeti?: { kaynaklar?: { id: string; tur: string }[]; dosyaOnerileri?: { tur: 'alerji' | 'aliskanlik' | 'kronik' | 'surekli_ilac'; metin: string }[]; oneriler?: { alan: string; metin: string }[]; uygulananOneriler?: number[] } | null; hekim_onayi_bekliyor?: boolean; taslak_hazirlayan_rol?: string | null }
  sorular: DogrulaSatiri[]
  kaynaklar: (KaynakGorunumu & { tur: string; okuma?: { sayfalar?: { sayfa: number; maskeliBelgeId?: string; satirlar: { normal: string; kutu: Kutu }[]; cizimler: { kutu?: Kutu }[] }[] } | null })[]
}

export function TaslakEditoru(p: { metin: ElNotuMetinleri; getir: Getirici; api: string; noteId: string; ayar: Ayar; yollar: MasaYollari; onBitti: () => void }) {
  const M = p.metin
  const [veri, setVeri] = useState<TaslakYaniti | null>(null)
  const [duz, setDuz] = useState<Record<string, string>>({})
  const [duzenleme, setDuzenleme] = useState(false)
  const [iz, setIz] = useState<{ alan: string; i: number } | null>(null)
  const [mesaj, setMesaj] = useState('')
  const tuvalAl = useSayfaTuvalleri(p.getir, p.api)
  const sure = useRef(new AktifSure())
  const doktor = p.ayar.rol === 'doktor'

  const yukle = useCallback(async () => {
    const r = await p.getir(`${p.api}/taslak?noteId=${encodeURIComponent(p.noteId)}`)
    if (r.ok) setVeri(await r.json())
  }, [p])
  useEffect(() => { void yukle() }, [yukle])
  useEffect(() => () => { const ms = sure.current.al(); if (ms > 0) void p.getir(`${p.api}/sure`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ asama: 'duzenleme', sureMs: ms, noteId: p.noteId }) }).catch(() => undefined) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!veri) return <div style={{ color: R.soluk }}>…</div>

  const n = veri.not
  const kaynakSirasi = n.kaynak_ozeti?.kaynaklar || []
  const acikSoru = veri.sorular.length
  const korumaliAcik = veri.sorular.some((s) => s.sinif === 'korumali' || s.sinif === 'celiski')
  const yerTutucuVar = ALANLAR.some((a) => YT.test(String(duz[a] ?? n[KOLON[a]] ?? '')))
  YT.lastIndex = 0

  /** K<n>.<line> → the crop of that line on its masked page. */
  const izKonumu = (etiket: string): { tuval: Promise<HTMLCanvasElement | null>; kutu: Kutu } | null => {
    const m = /^K(\d+)\.(\d+)$/.exec(etiket); if (!m) return null
    const kaynak = kaynakSirasi[Number(m[1]) - 1]; if (!kaynak) return null
    const k = veri.kaynaklar.find((x) => x.id === kaynak.id); if (!k?.okuma?.sayfalar) return null
    const satirlar: ({ kutu: Kutu; belge?: string } | null)[] = []
    for (const s of k.okuma.sayfalar) {
      for (const l of s.satirlar) if (l.normal.trim()) satirlar.push({ kutu: l.kutu, belge: s.maskeliBelgeId })
      if (s.cizimler.length) { satirlar.push(null); for (const c of s.cizimler) satirlar.push(c.kutu ? { kutu: c.kutu, belge: s.maskeliBelgeId } : null) }
    }
    const hedef = satirlar[Number(m[2]) - 1]
    return hedef ? { tuval: tuvalAl(hedef.belge), kutu: hedef.kutu } : null
  }

  async function kaydet(): Promise<boolean> {
    if (!Object.keys(duz).length) return true
    const r = await p.getir(`${p.api}/taslak`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ noteId: p.noteId, duzenlemeler: duz }) })
    if (!r.ok) { setMesaj(M.hata.genel); return false }
    setDuz({}); setDuzenleme(false); await yukle(); return true
  }
  async function islem(ad: 'kesinlestir' | 'hekime_gonder' | 'iade') {
    sure.current.etkilesim()
    if (!(await kaydet())) return
    const r = await p.getir(`${p.api}/kesinlestir`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ noteId: p.noteId, islem: ad }) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { setMesaj(j.error || M.hata.genel); return }
    setMesaj(ad === 'kesinlestir' ? M.akis.kesinlestirildi : ad === 'hekime_gonder' ? M.akis.hekimeGonderildi : M.akis.iadeEt)
    p.onBitti()
  }

  return (
    <div style={{ display: 'grid', gap: 12 }} onPointerDown={() => sure.current.etkilesim()} onKeyDown={() => sure.current.etkilesim()}>
      {ALANLAR.map((a) => {
        const metin = String(duz[a] ?? n[KOLON[a]] ?? '')
        const izler = n.kaynak_izleri?.[a] || []
        if (!metin && !duzenleme) return null
        return (
          <div key={a}>
            <div style={{ fontSize: 11, fontWeight: 650, color: R.cam, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{({ subjektif: 'S', objektif: 'O', degerlendirme: 'A', plan: 'P' } as const)[a]}</div>
            {duzenleme
              ? <textarea value={metin} onChange={(e) => setDuz((d) => ({ ...d, [a]: e.target.value }))} rows={Math.min(14, Math.max(3, metin.split('\n').length + 1))} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${R.cizgi}`, borderRadius: 10, padding: 10, fontSize: 15, lineHeight: 1.5 }} />
              : (
                <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: R.krem, borderRadius: 10, padding: 10 }}>
                  {izler.length
                    ? izler.map((x, i) => (
                      <span key={i}>
                        <span onClick={() => setIz(iz && iz.alan === a && iz.i === i ? null : { alan: a, i })} style={{ cursor: 'pointer', textDecoration: iz?.alan === a && iz.i === i ? 'underline' : 'none' }} title={M.derle.kaynaktanGeldi}><YerTutucuMetni metin={x.cumle} /></span>{' '}
                        {iz?.alan === a && iz.i === i && (
                          <span style={{ display: 'block', margin: '6px 0' }}>
                            {x.etiketler.map((e) => { const k = izKonumu(e); return k ? <Kirpinti key={e} tuval={k.tuval} kutu={k.kutu} yukseklik={90} /> : <span key={e} style={{ fontSize: 12, color: R.soluk }}>{M.derle.kaynakTuru.transkript}</span> })}
                          </span>
                        )}
                      </span>
                    ))
                    : <YerTutucuMetni metin={metin} />}
                </div>
              )}
          </div>
        )
      })}
      {(n.kaynak_ozeti?.oneriler || []).map((o, i) => (
        <div key={i} style={{ fontSize: 13, border: `1px dashed ${R.cizgi}`, borderRadius: 10, padding: 10 }}><b>{M.derle.yeniKaynakOnerisi}</b><div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{o.metin}</div></div>
      ))}
      {doktor && (n.kaynak_ozeti?.dosyaOnerileri || []).length > 0 && (
        <div style={{ border: `1px solid ${R.cizgi}`, borderRadius: 12, padding: 12, background: '#fff' }}>
          <div style={{ fontWeight: 650, fontSize: 14, marginBottom: 6 }}>{M.derle.dosyaOnerileri}</div>
          {(n.kaynak_ozeti?.dosyaOnerileri || []).map((d, i) => {
            const eklendi = (n.kaynak_ozeti?.uygulananOneriler || []).includes(i)
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: 14 }}><b>{M.derle.dosyaTur[d.tur]}:</b> {d.metin}</span>
                {eklendi ? <span style={{ fontSize: 12, color: R.cam }}>{M.derle.eklendi}</span> : <button type="button" style={dugme('kucuk')} onClick={async () => { await p.getir(`${p.api}/dosya-onerisi`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ noteId: p.noteId, index: i }) }); await yukle() }}>{M.derle.dosyayaEkle}</button>}
              </div>
            )
          })}
        </div>
      )}
      <DogrulaPaneli metin={M} getir={p.getir} api={p.api} kaynaklar={veri.kaynaklar.map((k) => ({ ...k, sorular: veri.sorular.filter((s) => s.kaynak_id === k.id) }))} celiskiler={{ noteId: p.noteId, sorular: veri.sorular.filter((s) => s.kaynak_id === p.noteId) }} rol={p.ayar.rol} onDegisti={() => void yukle()} />
      {(acikSoru > 0 || yerTutucuVar) && <div style={{ fontSize: 13, color: R.amber }}>{korumaliAcik ? M.akis.korumaliAcik : M.akis.acikSoruVar}</div>}
      <div style={{ fontSize: 12, color: R.soluk }}>{M.akis.eRecete}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={dugme('ikincil')} onClick={() => (duzenleme ? void kaydet() : setDuzenleme(true))}>{duzenleme ? M.kaydet : M.dogrula.duzelt}</button>
        {doktor
          ? <>
            <a href={p.yollar.notFormu(p.noteId)} style={{ ...dugme('birincil'), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>{M.akis.onayla}</a>
            {n.hekim_onayi_bekliyor && <button type="button" style={dugme('ikincil')} onClick={() => void islem('iade')}>{M.akis.iadeEt}</button>}
          </>
          : <>
            {p.ayar.kesinlestirebilir && <button type="button" style={dugme('birincil')} disabled={acikSoru > 0 || yerTutucuVar} onClick={() => void islem('kesinlestir')}>{M.akis.kesinlestir}</button>}
            <button type="button" style={dugme(p.ayar.kesinlestirebilir ? 'ikincil' : 'birincil')} onClick={() => void islem('hekime_gonder')}>{M.akis.hekimeGonder}</button>
          </>}
      </div>
      {mesaj && <div role="status" style={{ fontSize: 13 }}>{mesaj}</div>}
    </div>
  )
}
