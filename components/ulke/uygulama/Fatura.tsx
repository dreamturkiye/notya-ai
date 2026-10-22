'use client'

/**
 * AU-BETA-01 — INVOICES (pack extension `uzanti.fatura`): create an invoice for a patient, tax handling per line with a
 * "tax-free" box, pay, refund (full or partial), reconcile, and connect the doctor's OWN merchant account.
 *
 * THIS PRODUCT IS NOT THE MERCHANT AND HOLDS NO FUNDS (said on the screen). Without a connection payment runs on the DEMO adapter
 * (no network call, no real charge, lib/ulke/fatura/odemeSaglayici.ts). With the doctor's own Stripe restricted key connected it runs on THEIR account, in
 * TEST or LIVE mode (a badge says which; a live key is sent only after the confirmation step below). Initial compliance draft – external legal review later.
 * The free-text item-number field takes whatever the practitioner types; no item description or fee is supplied here.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, Cerceve, Hata, Yukleniyor, useUygulama } from './Kabuk'
import { girdiMetni, rolAdi } from '@/lib/ulke/arayuz'
import { SayiGirisi } from '../girdi/SayiGirisi'
import { faturaToplami, kurusYaz, tutarKurusa } from '@/lib/ulke/fatura/hesap'
import { uzlasmaCsv, type UzlasmaSatiri } from '@/lib/ulke/fatura/odemeSaglayici'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { tarihYaz } from './Kabuk'

type Kalem = { aciklama: string; kalemNo: string; tutar: string; muaf: boolean }
type Fatura = { id: string; no: number; hastaId: string; hastaAdi: string; kalemler: { aciklama: string; kalemNo: string; tutarKurus: number; muaf: boolean }[]; satici: Record<string, string>; tarih: string
  altToplamKurus: number; vergiKurus: number; toplamKurus: number; iadeKurus: number; paraKodu: string; durum: 'taslak' | 'odendi' | 'iptal'; odemeRef: string | null; saglayici: string | null }
type Hasta = { id: string; ad: string }
type Baglanti = { saglayici: 'stripe' | 'tyro'; mod: 'test' | 'live'; sonDort: string; webhookKurulu: boolean; etkin: boolean } | null

export default function FaturaEkrani() {
  const u = useUygulama('fatura')
  const t = ulkePaketi().uzanti?.fatura
  const [faturalar, setFaturalar] = useState<Fatura[] | null>(null)
  const [hastalar, setHastalar] = useState<Hasta[]>([])
  const [baglanti, setBaglanti] = useState<Baglanti>(null)
  const [hastaId, setHastaId] = useState('')
  const [kalemler, setKalemler] = useState<Kalem[]>([{ aciklama: '', kalemNo: '', tutar: '', muaf: t?.varsayilanMuaf ?? true }])
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [uzlasma, setUzlasma] = useState<{ satirlar: UzlasmaSatiri[]; gercek: boolean; not?: string } | null>(null)
  const [webhookGizli, setWebhookGizli] = useState('')
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [tyroId, setTyroId] = useState(''); const [tyroGizli, setTyroGizli] = useState(''); const [tyroKonum, setTyroKonum] = useState('')
  const [gun, setGun] = useState(30)
  const [anahtar, setAnahtar] = useState('')
  const [saglayici, setSaglayici] = useState<'stripe' | 'tyro'>('stripe')
  const [onayAcik, setOnayAcik] = useState(false)
  const [onayKutusu, setOnayKutusu] = useState(false)
  const { api, hesap } = u

  const yukle = useCallback(async () => {
    const [f, h, b] = await Promise.all([api('/api/ulke/fatura'), api('/api/ulke/hastalar'), api('/api/ulke/odeme-baglantisi')])
    if (b.ok) setWebhookUrl((b.j.webhookUrl as string | null) ?? null)
    if (f.ok) { setFaturalar(f.j.faturalar as Fatura[]); setBaglanti((f.j.baglanti as Baglanti) ?? null) } else setFaturalar([])
    if (h.ok && Array.isArray(h.j.hastalar)) setHastalar((h.j.hastalar as { id: string; ad: string }[]).map((x) => ({ id: x.id, ad: x.ad })))
  }, [api])
  useEffect(() => { if (hesap && t) void yukle() }, [hesap, t, yukle])
  if (!u.hesap || !t) return <Yukleniyor m={u.m} dil={u.dil} />
  const x = t.metin
  const saglayicilar = t.saglayicilar ?? ['stripe']
  const kuruslar = kalemler.map((k) => ({ tutarKurus: tutarKurusa(k.tutar) ?? 0, muaf: k.muaf }))
  const onizleme = faturaToplami(kuruslar, t.oranYuzde)
  const para = (k: number, kod = t.paraKodu) => kurusYaz(k, kod)

  async function olustur() {
    setHata(null); setBilgi(null)
    if (!hastaId) { setHata(x.hastaSec); return }
    const temiz = kalemler.map((k) => ({ aciklama: k.aciklama.trim(), kalemNo: k.kalemNo.trim(), tutarKurus: tutarKurusa(k.tutar), muaf: k.muaf }))
    if (temiz.some((k) => !k.aciklama || k.tutarKurus === null)) { setHata(x.hata); return }
    setBekliyor(true)
    const r = await api('/api/ulke/fatura', { method: 'POST', govde: { hastaId, kalemler: temiz } })
    setBekliyor(false)
    if (!r.ok) { setHata(x.hata); return }
    setKalemler([{ aciklama: '', kalemNo: '', tutar: '', muaf: t!.varsayilanMuaf }])
    await yukle()
  }
  async function eylem(id: string, govde: Record<string, unknown>) {
    setHata(null); setBilgi(null); setBekliyor(true)
    const r = await api('/api/ulke/fatura', { method: 'PATCH', govde: { id, ...govde } })
    setBekliyor(false)
    if (!r.ok) { setHata(x.hata); return }
    if (govde.eylem === 'ode' && typeof r.j.url === 'string' && /^https:\/\//.test(r.j.url)) { setBilgi(x.odemeYonlendiriliyor); window.location.assign(r.j.url); return }
    setBilgi(govde.eylem === 'ode' ? (r.j.bekliyor ? x.onayBekliyor : x.odendi) : x.durumlar.odendi); await yukle()
  }
  async function uzlastir() {
    const bit = new Date(); const bas = new Date(bit.getTime() - gun * 86_400_000)
    const gunYaz = (d: Date) => d.toISOString().slice(0, 10)
    const r = await api(`/api/ulke/fatura/uzlasma?from=${gunYaz(bas)}&to=${gunYaz(bit)}`)
    if (r.ok) setUzlasma({ satirlar: r.j.satirlar as UzlasmaSatiri[], gercek: Boolean(r.j.gercek), not: typeof r.j.not === 'string' ? r.j.not : undefined }); else setHata(x.hata)
  }
  function csvIndir() {
    if (!uzlasma) return
    const blob = new Blob([uzlasmaCsv(uzlasma.satirlar, uzlasma.gercek)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'reconciliation.csv'; a.click(); URL.revokeObjectURL(a.href)
  }
  const canliAnahtar = saglayici === 'stripe' && /^rk_live_/i.test(anahtar.trim())
  /** The first press on a LIVE key only opens the confirmation step; nothing is sent until the box is ticked and the confirm button pressed. */
  function kaydetIstendi() {
    if (canliAnahtar) { setHata(null); setOnayKutusu(false); setOnayAcik(true); return }
    void baglantiKaydet(false)
  }
  async function baglantiKaydet(canliOnay: boolean) {
    setHata(null); setBekliyor(true)
    const r = await api('/api/ulke/odeme-baglantisi', { method: 'POST', govde: saglayici === 'stripe' ? { saglayici, anahtar, webhookGizli, ...(canliOnay ? { canliOnay: true } : {}) } : { saglayici, istemciId: tyroId, istemciGizli: tyroGizli, konumId: tyroKonum, webhookGizli } })
    setBekliyor(false); setAnahtar(''); setWebhookGizli(''); setTyroGizli(''); setOnayAcik(false); setOnayKutusu(false)
    if (r.ok) { const b = r.j.baglanti as Baglanti; setBaglanti(b); setWebhookUrl((r.j.webhookUrl as string | null) ?? null); setBilgi(b?.mod === 'live' ? x.canliKaydedildi : x.testNotu) }
    else setHata(r.j.code === 'SIR_ANAHTAR' ? x.sirAnahtar : r.j.code === 'WEBHOOK_GEREKLI' ? x.webhookGerekli : r.j.code === 'ANAHTAR_REDDEDILDI' ? x.anahtarReddedildi : r.j.code === 'IZIN_YOK' ? x.izinYok : x.hata)
  }
  async function baglantiSil() { await api('/api/ulke/odeme-baglantisi', { method: 'DELETE' }); setBaglanti(null); setWebhookUrl(null) }

  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} unvan={rolAdi(u.hesap.rol, u.dil) ?? undefined} aktif="fatura" cikis={u.cikis}>
      <h1 className="uza-h1">{x.baslik}</h1>
      <p className="uza-aciklama">{x.aciklama}</p>
      {baglanti?.etkin ? null : <div role="note" className="uza-bilgi-kutu" data-alan="fatura-demo">{x.demoNotu}</div>}
      <Hata>{hata}</Hata><Bilgi>{bilgi}</Bilgi>

      <section className="uza-kart" data-alan="fatura-baglanti">
        <h2 className="uza-h2">{x.baglantiBaslik}</h2>
        <p className="uza-not-metin">{x.baglantiAciklama}</p>
        {baglanti ? (
          <>
            <p className="uza-not-metin" data-alan="baglanti-durumu"><strong data-alan="baglanti-modu" data-mod={baglanti.mod} role="status" style={{ marginRight: 8, padding: '2px 8px', borderRadius: 4, border: '1px solid currentColor' }}>{baglanti.mod === 'live' ? x.modEtiketCanli : x.modEtiketTest}</strong>{x.baglantiVar.replace('%1', baglanti.saglayici).replace('%2', baglanti.sonDort)} <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={baglantiSil}>{x.baglantiSil}</button></p>
            <div role="note" className="uza-bilgi-kutu" data-alan="baglanti-etkin">{baglanti.etkin ? x.canliNotu : x.tyroBekliyor}</div>
            {webhookUrl ? <p className="uza-ipucu" data-alan="webhook-url">{x.webhookUrlEtiket} <code>{webhookUrl}</code></p> : null}
            {!baglanti.webhookKurulu ? <p className="uza-ipucu" data-alan="webhook-yok">{x.webhookYok}</p> : null}
          </>
        ) : (
          <form className="uza-form" onSubmit={(e) => { e.preventDefault(); kaydetIstendi() }}>
            {saglayicilar.length > 1 ? (
              <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-sag">{x.baglantiSaglayici}</label>
                <select id="uza-sag" className="uza-girdi" value={saglayici} onChange={(e) => setSaglayici(e.target.value as 'stripe' | 'tyro')}><option value="stripe">Stripe</option>{saglayicilar.includes('tyro') ? <option value="tyro">Tyro (needs Tyro partner onboarding)</option> : null}</select></div>
            ) : null}
            {saglayici === 'stripe' ? (
              <>
                <p className="uza-ipucu">{x.izinler}</p>
                {webhookUrl ? <p className="uza-ipucu" data-alan="webhook-url-once">{x.webhookUrlEtiket} <code>{webhookUrl}</code></p> : null}
                <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-anahtar">{x.baglantiAnahtar}</label>
                  <input id="uza-anahtar" className="uza-girdi" type="password" autoComplete="off" value={anahtar} onChange={(e) => setAnahtar(e.target.value)} maxLength={300} /></div>
              </>
            ) : (
              <>
                <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-ty1">{x.tyroIstemci}</label><input id="uza-ty1" className="uza-girdi" autoComplete="off" value={tyroId} onChange={(e) => setTyroId(e.target.value)} maxLength={300} /></div>
                <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-ty2">{x.tyroGizli}</label><input id="uza-ty2" className="uza-girdi" type="password" autoComplete="off" value={tyroGizli} onChange={(e) => setTyroGizli(e.target.value)} maxLength={300} /></div>
                <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-ty3">{x.tyroKonum}</label><input id="uza-ty3" className="uza-girdi" autoComplete="off" value={tyroKonum} onChange={(e) => setTyroKonum(e.target.value)} maxLength={300} /></div>
              </>
            )}
            <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-whs">{x.webhookEtiket}</label>
              <input id="uza-whs" className="uza-girdi" type="password" autoComplete="off" value={webhookGizli} onChange={(e) => setWebhookGizli(e.target.value)} maxLength={300} /></div>
            {canliAnahtar ? <div role="note" className="uza-bilgi-kutu" data-alan="canli-uyari"><strong>{x.modEtiketCanli}</strong> {!webhookGizli.trim() ? x.webhookGerekli : null}</div> : null}
            {onayAcik ? (
              <div role="alertdialog" aria-labelledby="uza-onay-b" className="uza-bilgi-kutu" data-alan="canli-onay">
                <h3 id="uza-onay-b" className="uza-h2">{x.canliOnayBaslik}</h3>
                <p className="uza-not-metin">{x.canliOnayMetin}</p>
                <label className="uza-onay"><input type="checkbox" checked={onayKutusu} onChange={(e) => setOnayKutusu(e.target.checked)} data-alan="canli-onay-kutu" /><span>{x.canliOnayKutu}</span></label>
                <div className="uza-eylemler">
                  <button type="button" className="uza-dugme" disabled={bekliyor || !onayKutusu} onClick={() => void baglantiKaydet(true)} data-eylem="canli-onayla">{x.canliOnayDugme}</button>
                  <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => { setOnayAcik(false); setOnayKutusu(false) }}>{x.canliOnayVazgec}</button>
                </div>
              </div>
            ) : (
              <button type="submit" className="uza-dugme" disabled={bekliyor || (saglayici === 'stripe' ? !anahtar.trim() || (canliAnahtar && !webhookGizli.trim()) : !(tyroId.trim() && tyroGizli.trim() && tyroKonum.trim()))}>{x.baglantiKaydet}</button>
            )}
          </form>
        )}
      </section>

      <section className="uza-kart" data-alan="fatura-yeni">
        <h2 className="uza-h2">{x.yeni}</h2>
        <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-fh">{x.hasta}</label>
          <select id="uza-fh" className="uza-girdi" value={hastaId} onChange={(e) => setHastaId(e.target.value)}><option value="">{x.hastaSec}</option>{hastalar.map((h) => <option key={h.id} value={h.id}>{h.ad}</option>)}</select></div>
        {kalemler.map((k, i) => (
          <fieldset key={i} className="uza-alan" data-kalem={i}>
            <input className="uza-girdi" aria-label={x.kalemAciklama} placeholder={x.kalemAciklamaIpucu} maxLength={200} value={k.aciklama} onChange={(e) => setKalemler(kalemler.map((y, j) => j === i ? { ...y, aciklama: e.target.value } : y))} />
            <input className="uza-girdi" aria-label={x.kalemNo} placeholder={x.kalemNoIpucu} maxLength={40} value={k.kalemNo} onChange={(e) => setKalemler(kalemler.map((y, j) => j === i ? { ...y, kalemNo: e.target.value } : y))} />
            <SayiGirisi id={`uza-ft-${i}`} deger={k.tutar} degistir={(metin) => setKalemler(kalemler.map((y, j) => j === i ? { ...y, tutar: metin } : y))} m={girdiMetni(u.dil)} ek={{ 'aria-label': x.kalemTutar, placeholder: '0.00' }} />
            <label className="uza-onay"><input type="checkbox" checked={k.muaf} onChange={(e) => setKalemler(kalemler.map((y, j) => j === i ? { ...y, muaf: e.target.checked } : y))} /><span>{x.vergiMuaf}</span></label>
            {kalemler.length > 1 ? <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={() => setKalemler(kalemler.filter((_, j) => j !== i))}>{x.kalemSil}</button> : null}
          </fieldset>
        ))}
        <p className="uza-ipucu">{x.vergiMuafIpucu}</p>
        <div className="uza-eylemler"><button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => setKalemler([...kalemler, { aciklama: '', kalemNo: '', tutar: '', muaf: t.varsayilanMuaf }])}>{x.kalemEkle}</button></div>
        <p className="uza-not-metin" data-alan="fatura-onizleme">{x.altToplam}: {para(onizleme.altToplamKurus)} · {t.vergiAdi} ({t.oranYuzde}%): {para(onizleme.vergiKurus)} · {x.toplam}: {para(onizleme.toplamKurus)}</p>
        <p className="uza-ipucu">{x.vergiNotu}</p>
        <button type="button" className="uza-dugme" disabled={bekliyor} onClick={() => void olustur()} data-eylem="fatura-olustur">{bekliyor ? x.olusturuluyor : x.olustur}</button>
      </section>

      <section className="uza-kart" data-alan="fatura-liste">
        {faturalar === null ? <p className="uza-bos">…</p> : faturalar.length === 0 ? <p className="uza-bos">{x.bos}</p> : (
          <ul className="uza-liste">{faturalar.map((f) => {
            const sKimlik = t.saticiKimlikAlani ? f.satici[t.saticiKimlikAlani] : undefined
            return (
              <li key={f.id} data-fatura={f.id}>
                <div className="uza-satir">
                  <span className="uza-liste-ad">#{f.no} · {f.hastaAdi} · {tarihYaz(f.tarih)}
                    <span className="uza-liste-alt">{x.durumlar[f.durum]} · {para(f.toplamKurus, f.paraKodu)}{f.iadeKurus ? ` · refunded ${para(f.iadeKurus, f.paraKodu)}` : ''}</span>
                    {t.saticiKimlikAlani ? <span className="uza-liste-alt">{(t.saticiAdAlani ? f.satici[t.saticiAdAlani] : '') ?? ''} {sKimlik ? `· ${x.saticiKimlik}: ${sKimlik}` : `· ${x.saticiEksik}`}</span> : null}
                    {f.kalemler.map((k, i) => <span key={i} className="uza-liste-alt">{k.aciklama}{k.kalemNo ? ` (${k.kalemNo})` : ''} — {para(k.tutarKurus, f.paraKodu)} {k.muaf ? `(${t.vergiAdi}-free)` : `(+${t.vergiAdi})`}</span>)}
                  </span>
                  {f.durum === 'taslak' && f.saglayici ? <span className="uza-liste-alt" data-alan="fatura-bekliyor">{x.onayBekliyor}</span> : null}
                  {f.durum === 'taslak' ? <button type="button" className="uza-dugme uza-dugme-kucuk" disabled={bekliyor} onClick={() => void eylem(f.id, { eylem: 'ode' })} data-eylem="fatura-ode">{x.ode}</button> : null}
                  {f.durum === 'odendi' && f.iadeKurus < f.toplamKurus ? (
                    <>
                      <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => void eylem(f.id, { eylem: 'iade', kurus: f.toplamKurus - f.iadeKurus })} data-eylem="fatura-iade-tam">{x.iadeTam}</button>
                      <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" disabled={bekliyor} onClick={() => { const v = tutarKurusa(window.prompt(x.iadeTutar, '') ?? ''); if (v) void eylem(f.id, { eylem: 'iade', kurus: v }) }} data-eylem="fatura-iade-kismi">{x.iadeKismi}</button>
                    </>
                  ) : null}
                </div>
              </li>
            )
          })}</ul>
        )}
      </section>

      <section className="uza-kart" data-alan="fatura-uzlasma">
        <h2 className="uza-h2">{x.uzlasmaBaslik}</h2>
        <p className="uza-ipucu">{baglanti?.etkin ? x.uzlasmaGercekNotu : x.uzlasmaNotu}</p>
        <div className="uza-alan"><label className="uza-etiket" htmlFor="uza-aralik">{x.uzlasmaAralik}</label>
          <select id="uza-aralik" className="uza-girdi" value={gun} onChange={(e) => setGun(Number(e.target.value))}><option value={7}>{x.aralik7}</option><option value={30}>{x.aralik30}</option><option value={90}>{x.aralik90}</option></select></div>
        <div className="uza-eylemler">
          <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => void uzlastir()}>{x.uzlasmaCalistir}</button>
          {uzlasma ? <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={csvIndir}>{x.csv}</button> : null}
        </div>
        {uzlasma && !uzlasma.gercek ? <div role="note" className="uza-bilgi-kutu" data-alan="uzlasma-demo">{x.uzlasmaDemoEtiketi}</div> : null}
        {uzlasma?.not ? <p className="uza-ipucu">{uzlasma.not}</p> : null}
        {uzlasma ? <ul className="uza-liste">{uzlasma.satirlar.map((s) => <li key={s.faturaId || s.ref}><div className="uza-satir"><span className="uza-liste-ad">{s.no ? `#${s.no}` : s.ref} · {para(s.faturaToplamKurus || s.saglayici?.tutarKurus || 0)}<span className="uza-liste-alt">{x.uzlasmaSonuclari[s.sonuc]}</span></span></div></li>)}</ul> : null}
      </section>
    </Cerceve>
  )
}
