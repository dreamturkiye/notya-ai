'use client'

/**
 * PREMATUR-ULKE-01 — Obstetrics and gynaecology › the early-birth record of a pregnancy, and the doctor's own list of pregnancies
 * with a reason to be watched. Türkiye's own screen (specialties/kadin-dogum/ui/.../ErkenDogumPaneli: the pregnancy, the cervical
 * length trend, the steroid log, the facts, the flags with their sources) with the pack's words and the pack's thresholds.
 *
 *   /tools?arac=erken-dogum&hasta=<id>   the record of that pregnancy
 *   /tools?arac=erken-dogum              the doctor's own pregnancies with a reason, the shortest cervix first
 *
 * DECISION SUPPORT AND A RECORD. A cervical length is shown against the thresholds the country's source states; progesterone, steroid
 * and magnesium are FACTS THE DOCTOR ENTERS, never something this screen proposes; there is no dose field, nothing is ordered, no
 * cerclage is suggested, nothing is sent. Where the pack states no thresholds, the screen says "follow your local protocol" and still
 * keeps the record and the trend. NO WORD IS WRITTEN HERE: every sentence is the pack's.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Bilgi, Hata, tarihYaz, type Uygulama } from './Kabuk'
import { aracYolu } from './aracOrtak'
import { Istatistik, Katlanir, KaynakListesi, Rozet, UcDurum, type Ton } from './PrematurOrtak'
import { TarihGirisi } from '../girdi/TarihGirisi'
import { GIRDI_GECERSIZ } from '@/lib/ulke/arayuz/zamanGirdisi'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import type { PrematurMetni } from '@/lib/ulke/prematur/metin'
import { ERKEN_DOGUM_API, PREMATUR_ARACLARI, type PrematurPaketi } from '@/lib/ulke/prematur/paket'
import type { GebelikGirdisi, GebelikKohortYuku, GebelikYuku } from '@/lib/ulke/prematur/apiTipleri'
import { erkenDogumDegerlendir, gestasyonGunuTarihte, type BayrakDurum, type Yontem } from '@/lib/ulke/prematur/erkenDogum'
import { gebelikTemizle } from '@/lib/ulke/prematur/gebelik'
import { bayrakSatirlari, gebelikKohortu } from '@/lib/ulke/prematur/gorunum'
import { gestasyonMetni } from '@/lib/ulke/prematur/yas'

type M = PrematurMetni
const TON: Record<BayrakDurum, Ton> = { karsilandi: 'uyari', karsilanmadi: 'notr', belirsiz: 'notr', yerel: 'uyari' }
const BAYRAK_SIRASI = ['kisa_serviks', 'progesteron_degerlendirme', 'cok_kisa_serviks', 'onceki_spontan_preterm', 'cogul_gebelik', 'pprom'] as const

export function ErkenDogumPaneli({ u, hastaId, paket }: { u: Uygulama; hastaId: string | null; paket: PrematurPaketi }) {
  const m = paket.metinler[u.dil]
  if (!m) return null
  return hastaId ? <Gebelik u={u} hastaId={hastaId} paket={paket} m={m} /> : <Kohort u={u} paket={paket} m={m} />
}

function Kohort({ u, paket, m }: { u: Uygulama; paket: PrematurPaketi; m: M }) {
  const [y, setY] = useState<GebelikKohortYuku | null>(null)
  const [hata, setHata] = useState(false)
  useEffect(() => {
    let iptal = false
    u.api(ERKEN_DOGUM_API).then((r) => { if (!iptal) { if (r.ok) setY(r.j as GebelikKohortYuku); else setHata(true) } }).catch(() => { if (!iptal) setHata(true) })
    return () => { iptal = true }
  }, [u])
  const satirlar = useMemo(() => (y ? gebelikKohortu(y.satirlar, y.bugun, paket.erkenDogum) : []), [y, paket])
  const g = m.gebelik
  if (hata) return <Hata>{m.ortak.yuklenemedi}</Hata>
  if (!y) return <p className="uza-ipucu">{m.ortak.yukleniyor}</p>
  return (
    <section className="uza-kart" data-bolum="erken-dogum-kohort">
      <h2 className="uza-h2">{g.kohortBaslik}</h2>
      {y.depo ? null : <Bilgi>{m.ortak.depoYok}</Bilgi>}
      {y.depo && !satirlar.length ? <p className="uza-ipucu" data-alan="kohort-bos">{g.kohortBos}</p> : null}
      <div style={{ display: 'grid', gap: 10 }}>
        {satirlar.map((k) => (
          <div key={k.satir.hastaId} data-hasta={k.satir.hastaId} style={{ border: '1px solid rgba(58,44,34,0.08)', borderRadius: 12, padding: '10px 14px' }}>
            <a className="uza-baglanti" href={aracYolu(PREMATUR_ARACLARI.gebelik, k.satir.hastaId)} style={{ fontWeight: 700 }}>{k.satir.ad}</a>
            <div className="uza-ipucu">{yerine(g.gestasyonBugun, k.sonuc.gestasyonGun == null ? '—' : gestasyonMetni(k.sonuc.gestasyonGun))}</div>
            {k.sonuc.kohortNedenleri.map((n, i) => (
              <div key={i} className="uza-ipucu">{n.kod === 'kisa-serviks' ? yerine(g.kohortNeden.kisaServiks, n.mm, n.gestasyon) : n.kod === 'pprom' ? g.kohortNeden.pprom : yerine(g.kohortNeden.oykuOlcumYok, n.gestasyon)}</div>
            ))}
          </div>
        ))}
      </div>
      <p className="uza-ipucu">{g.kohortNot}</p>
      <p className="uza-ipucu" data-karar>{g.karar}</p>
    </section>
  )
}

function Gebelik({ u, hastaId, paket, m }: { u: Uygulama; hastaId: string; paket: PrematurPaketi; m: M }) {
  const [y, setY] = useState<GebelikYuku | null>(null)
  const [e, setE] = useState<GebelikGirdisi | null>(null)
  const [hata, setHata] = useState<'yuk' | 'kayit' | string | null>(null)
  const [yaziliyor, setYaziliyor] = useState(false)
  const [kirli, setKirli] = useState(false)
  // The measurement being typed and the dates being typed.
  const [yeni, setYeni] = useState<{ tarih: string; hf: string; gun: string; mm: string; yontem: Yontem }>({ tarih: '', hf: '', gun: '0', mm: '', yontem: 'transvajinal' })
  const [steroidTarih, setSteroidTarih] = useState('')
  const g = m.gebelik, o = m.ortak
  useEffect(() => {
    let iptal = false
    setHata(null)
    u.api(`${ERKEN_DOGUM_API}?hasta=${encodeURIComponent(hastaId)}`).then((r) => { if (!iptal) { if (r.ok) { const j = r.j as GebelikYuku; setY(j); setE(j.e) } else setHata('yuk') } }).catch(() => { if (!iptal) setHata('yuk') })
    return () => { iptal = true }
  }, [u, hastaId])

  const temiz = useMemo(() => (y && e ? gebelikTemizle(e, y.bugun) : null), [y, e])
  const sonuc = useMemo(() => (y && temiz ? erkenDogumDegerlendir({ sat: temiz.e.sat, tdt: temiz.e.tdt, cogulTipi: temiz.e.cogulTipi, durum: temiz.e.durum, kayit: temiz.e.kayit }, y.bugun, paket.erkenDogum) : null), [y, temiz, paket])
  if (hata === 'yuk') return <Hata>{o.yuklenemedi}</Hata>
  if (!y || !e || !temiz || !sonuc) return <p className="uza-ipucu">{o.yukleniyor}</p>

  const degistir = (d: Partial<GebelikGirdisi>) => { setE({ ...e, ...d }); setKirli(true) }
  const kayitDegistir = (d: Partial<GebelikGirdisi['kayit']>) => degistir({ kayit: { ...e.kayit, ...d } })
  const tarihDeger = (v: string) => (v === GIRDI_GECERSIZ ? '' : v)
  const bayrak = (k: string) => sonuc.bayraklar.find((b) => b.kod === k)

  const olcumEkle = () => {
    const tarih = tarihDeger(yeni.tarih)
    const otomatik = tarih ? gestasyonGunuTarihte(e.sat, e.tdt, tarih) : null
    const gestasyonGun = yeni.hf ? Number(yeni.hf) * 7 + Number(yeni.gun) : otomatik
    kayitDegistir({ serviks: [...e.kayit.serviks, { id: `${tarih}-${yeni.yontem}`, tarih, gestasyonGun: gestasyonGun ?? 0, mm: Number(yeni.mm.replace(',', '.')), yontem: yeni.yontem }] })
    setYeni({ tarih: '', hf: '', gun: '0', mm: '', yontem: yeni.yontem })
  }
  const kaydet = async () => {
    setYaziliyor(true); setHata(null)
    try {
      const r = await u.api(ERKEN_DOGUM_API, { method: 'PUT', govde: { hastaId, e } })
      if (r.ok) { const j = r.j as GebelikYuku; setY(j); setE(j.e); setKirli(false) }
      else setHata(r.status === 400 && typeof r.j.alan === 'string' ? r.j.alan : 'kayit')
    } catch { setHata('kayit') } finally { setYaziliyor(false) }
  }
  const hataMetni = hata === 'kayit' ? o.kaydedilemedi : hata
    ? ({ 'serviks-tarih': g.hata.serviksTarih, 'serviks-ileri': g.hata.serviksIleri, 'serviks-mm': g.hata.serviksMm, 'serviks-gestasyon': g.hata.serviksGestasyon, 'steroid-tarih': g.hata.steroidTarih, 'steroid-ileri': g.hata.steroidIleri, 'ileri-tarih': g.hata.ileriTarih, 'gebelik-tarih': g.hata.gebelikTarih } as Record<string, string>)[hata] ?? o.kaydedilemedi
    : temiz.hata ? ({ 'serviks-tarih': g.hata.serviksTarih, 'serviks-ileri': g.hata.serviksIleri, 'serviks-mm': g.hata.serviksMm, 'serviks-gestasyon': g.hata.serviksGestasyon, 'steroid-tarih': g.hata.steroidTarih, 'steroid-ileri': g.hata.steroidIleri, 'ileri-tarih': g.hata.ileriTarih, 'gebelik-tarih': g.hata.gebelikTarih } as Record<string, string>)[temiz.hata] ?? null : null

  return (
    <>
      {y.depo ? null : <Bilgi>{o.depoYok}</Bilgi>}
      <section className="uza-kart" data-bolum="erken-dogum-gebelik">
        <h2 className="uza-h2">{g.gebelik}{y.hasta.ad ? ` · ${y.hasta.ad}` : ''}</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <Istatistik deger={sonuc.gestasyonGun == null ? '—' : `${gestasyonMetni(sonuc.gestasyonGun)} ${o.hafta}`} etiket={g.gestasyonEtiket} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <TarihGirisi id="ed-sat" etiket={g.sat} deger={e.sat ?? ''} degistir={(v) => degistir({ sat: tarihDeger(v) || null })} m={u.m.girdi} alan="ed-sat" />
          <TarihGirisi id="ed-tdt" etiket={g.tdt} deger={e.tdt ?? ''} degistir={(v) => degistir({ tdt: tarihDeger(v) || null })} m={u.m.girdi} alan="ed-tdt" />
          <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{g.cogulTipi}</span>
            <select className="uza-girdi" data-alan="ed-cogul" value={e.cogulTipi ?? ''} onChange={(ev) => degistir({ cogulTipi: (ev.target.value || null) as GebelikGirdisi['cogulTipi'] })}>
              <option value="">{g.cogulSecenek.bos}</option><option value="tekil">{g.cogulSecenek.tekil}</option><option value="ikiz">{g.cogulSecenek.ikiz}</option><option value="ucuz-ve-ustu">{g.cogulSecenek.ucuzVeUstu}</option>
            </select></label>
          <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{g.durum}</span>
            <select className="uza-girdi" data-alan="ed-durum" value={e.durum} onChange={(ev) => degistir({ durum: ev.target.value === 'dogum_yapti' ? 'dogum_yapti' : 'aktif' })}>
              <option value="aktif">{g.durumSecenek.aktif}</option><option value="dogum_yapti">{g.durumSecenek.dogumYapti}</option>
            </select></label>
          <UcDurum ad="ed-oyku" etiket={g.oncekiPreterm} deger={e.kayit.oncekiSpontanPreterm} degistir={(d) => kayitDegistir({ oncekiSpontanPreterm: d })} o={o} />
        </div>
        <p className="uza-ipucu">{g.gebelikNotu}</p>
        {sonuc.eksikVeri.length ? <Bilgi>{yerine(g.eksikVeri, sonuc.eksikVeri.map((k) => ({ 'gebelik-baslangici': g.eksik.gebelikBaslangici, oyku: g.eksik.oyku, 'serviks-olcumu': g.eksik.serviksOlcumu })[k]).join(', '))}</Bilgi> : null}
      </section>

      <section className="uza-kart" data-bolum="erken-dogum-serviks">
        <h2 className="uza-h2">{g.serviksBaslik}</h2>
        {sonuc.trend.length ? (
          <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            {sonuc.trend.map((t) => (
              <div key={t.id} data-olcum={t.id} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <b>{t.mm} {o.mm}</b><span className="uza-ipucu">{tarihYaz(t.tarih)} {'·'} {t.gestasyon} {'·'} {g.yontem[t.yontem]}{t.pencerede ? ` · ${g.trendPencere}` : ''}{t.fark != null ? ` · ${yerine(g.trendFark, t.fark > 0 ? `+${t.fark}` : String(t.fark), t.gunAralik ?? '')}` : ''}</span>
                <button type="button" className="uza-dugme uza-dugme-cizgi" style={{ minHeight: 32 }} onClick={() => kayitDegistir({ serviks: e.kayit.serviks.filter((x) => x.id !== t.id) })}>{g.olcumSil}</button>
              </div>
            ))}
          </div>
        ) : <p className="uza-ipucu">{g.olcumYok}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, alignItems: 'end' }}>
          <TarihGirisi id="ed-olcum" etiket={g.olcumTarih} deger={yeni.tarih} degistir={(v) => setYeni({ ...yeni, tarih: v })} m={u.m.girdi} alan="ed-olcum-tarih" />
          <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{g.olcumGestasyon}</span>
            <span style={{ display: 'flex', gap: 6 }}>
              <input className="uza-girdi" data-alan="ed-olcum-hf" inputMode="numeric" style={{ width: 70 }} value={yeni.hf} onChange={(ev) => setYeni({ ...yeni, hf: ev.target.value })} />
              <select className="uza-girdi" data-alan="ed-olcum-gun" value={yeni.gun} onChange={(ev) => setYeni({ ...yeni, gun: ev.target.value })}>{[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={String(d)}>{d}</option>)}</select>
            </span></label>
          <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{g.olcumMm}</span><input className="uza-girdi" data-alan="ed-olcum-mm" inputMode="decimal" value={yeni.mm} onChange={(ev) => setYeni({ ...yeni, mm: ev.target.value })} /></label>
          <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{g.olcumYontem}</span>
            <select className="uza-girdi" data-alan="ed-olcum-yontem" value={yeni.yontem} onChange={(ev) => setYeni({ ...yeni, yontem: ev.target.value === 'transabdominal' ? 'transabdominal' : 'transvajinal' })}>
              <option value="transvajinal">{g.yontem.transvajinal}</option><option value="transabdominal">{g.yontem.transabdominal}</option>
            </select></label>
        </div>
        <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi" data-eylem="olcum-ekle" disabled={!yeni.mm || !yeni.tarih || yeni.tarih === GIRDI_GECERSIZ} onClick={olcumEkle}>{g.olcumEkle}</button></div>
      </section>

      <section className="uza-kart" data-bolum="erken-dogum-steroid">
        <h2 className="uza-h2">{g.steroidBaslik}</h2>
        {sonuc.steroid.guncel ? <p className="uza-ipucu" data-alan="steroid-guncel">{yerine(g.steroidGuncel, sonuc.steroid.guncel.gestasyon, g.steroidPencere[sonuc.steroid.guncel.pencere])}</p> : null}
        {sonuc.steroid.satirlar.length ? (
          <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
            {sonuc.steroid.satirlar.map((s) => (
              <div key={s.tarih} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span>{yerine(g.steroidSatir, tarihYaz(s.tarih), s.gestasyon, g.steroidPencere[s.pencere])}{s.oncekindenGun != null ? ` · ${yerine(g.steroidTekrar, s.oncekindenGun)}` : ''}</span>
                <button type="button" className="uza-dugme uza-dugme-cizgi" style={{ minHeight: 32 }} onClick={() => kayitDegistir({ steroid: { ...e.kayit.steroid, kurlar: e.kayit.steroid.kurlar.filter((x) => x.tarih !== s.tarih) } })}>{g.steroidSil}</button>
              </div>
            ))}
          </div>
        ) : <p className="uza-ipucu">{g.steroidYok}</p>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
          <TarihGirisi id="ed-steroid" etiket={g.steroidTarih} deger={steroidTarih} degistir={setSteroidTarih} m={u.m.girdi} alan="ed-steroid-tarih" />
          <button type="button" className="uza-dugme uza-dugme-cizgi" data-eylem="steroid-ekle" disabled={!steroidTarih || steroidTarih === GIRDI_GECERSIZ} onClick={() => { kayitDegistir({ steroid: { yapildi: true, kurlar: [...e.kayit.steroid.kurlar, { id: steroidTarih, tarih: steroidTarih }] } }); setSteroidTarih('') }}>{g.steroidEkle}</button>
        </div>
      </section>

      <section className="uza-kart" data-bolum="erken-dogum-olgular">
        <h2 className="uza-h2">{g.olgularBaslik}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <UcDurum ad="ed-pprom" etiket={g.pprom} deger={e.kayit.pprom.var} degistir={(d) => kayitDegistir({ pprom: { var: d, tarih: d ? e.kayit.pprom.tarih : null } })} o={o} />
          {e.kayit.pprom.var ? <TarihGirisi id="ed-pprom-t" etiket={g.pprom_tarih} deger={e.kayit.pprom.tarih ?? ''} degistir={(v) => kayitDegistir({ pprom: { var: true, tarih: tarihDeger(v) || null } })} m={u.m.girdi} alan="ed-pprom-tarih" /> : null}
          <UcDurum ad="ed-mg" etiket={g.magnezyum} deger={e.kayit.magnezyum.verildi} degistir={(d) => kayitDegistir({ magnezyum: { verildi: d, tarih: d ? e.kayit.magnezyum.tarih : null } })} o={o} />
          {e.kayit.magnezyum.verildi ? <TarihGirisi id="ed-mg-t" etiket={g.magnezyum_tarih} deger={e.kayit.magnezyum.tarih ?? ''} degistir={(v) => kayitDegistir({ magnezyum: { verildi: true, tarih: tarihDeger(v) || null } })} m={u.m.girdi} alan="ed-mg-tarih" /> : null}
          <UcDurum ad="ed-prog" etiket={g.progesteron} deger={e.kayit.progesteron.kullaniyor} degistir={(d) => kayitDegistir({ progesteron: { kullaniyor: d, baslangic: d ? e.kayit.progesteron.baslangic : null, yol: d ? e.kayit.progesteron.yol : null } })} o={o} />
          {e.kayit.progesteron.kullaniyor ? (
            <>
              <TarihGirisi id="ed-prog-t" etiket={g.progesteron_baslangic} deger={e.kayit.progesteron.baslangic ?? ''} degistir={(v) => kayitDegistir({ progesteron: { ...e.kayit.progesteron, baslangic: tarihDeger(v) || null } })} m={u.m.girdi} alan="ed-prog-tarih" />
              <label style={{ display: 'grid', gap: 4 }}><span className="uza-etiket">{g.progesteron_yol}</span>
                <select className="uza-girdi" data-alan="ed-prog-yol" value={e.kayit.progesteron.yol ?? ''} onChange={(ev) => kayitDegistir({ progesteron: { ...e.kayit.progesteron, yol: (ev.target.value || null) as GebelikGirdisi['kayit']['progesteron']['yol'] } })}>
                  <option value="">{g.yol.bos}</option><option value="vajinal">{g.yol.vajinal}</option><option value="im">{g.yol.im}</option><option value="oral">{g.yol.oral}</option>
                </select></label>
            </>
          ) : null}
        </div>
        <p className="uza-ipucu">{g.olguNot}</p>
      </section>

      {hataMetni ? <Hata>{hataMetni}</Hata> : null}
      <div className="uza-eylemler" style={{ marginBottom: 14 }}><button type="button" className="uza-dugme" data-eylem="gebelik-kaydet" disabled={yaziliyor || !y.depo || !kirli || Boolean(temiz.hata)} onClick={() => void kaydet()}>{yaziliyor ? o.kaydediliyor : g.kaydet}</button></div>

      <section className="uza-kart" data-bolum="erken-dogum-bayraklar">
        <h2 className="uza-h2">{g.bayrakBaslik}</h2>
        {sonuc.serviksYerel ? <Bilgi>{g.yerelNot}</Bilgi> : null}
        <div style={{ display: 'grid', gap: 10 }}>
          {BAYRAK_SIRASI.map((k) => {
            const b = bayrak(k)
            if (!b) return null
            return (
              <div key={k} data-bayrak={k} data-durum={b.durum} style={{ border: '1px solid rgba(58,44,34,0.08)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}><b>{g.bayrak[k]}</b><Rozet ton={TON[b.durum]}>{g.bayrakDurum[b.durum]}</Rozet></div>
                {bayrakSatirlari(b, g, tarihYaz).map((s, i) => <div key={i} className="uza-ipucu">{s}</div>)}
              </div>
            )
          })}
        </div>
        {sonuc.progesteron.kayit !== 'girilmedi' && sonuc.progesteron.kayit === 'var' ? <p className="uza-ipucu">{g.progesteron}: {o.evet}{sonuc.progesteron.baslangic ? ` · ${tarihYaz(sonuc.progesteron.baslangic)}` : ''}{sonuc.progesteron.gestasyon ? ` (${sonuc.progesteron.gestasyon})` : ''}{sonuc.progesteron.yol ? ` · ${g.yol[sonuc.progesteron.yol]}` : ''}</p> : null}
        <Katlanir baslik={g.kaynakBaslik}><KaynakListesi kaynaklar={paket.erkenDogum.kaynaklar} o={o} dil={u.dil} /></Katlanir>
      </section>
      <p className="uza-ipucu" data-karar>{g.karar} {g.kapsam}</p>
    </>
  )
}
