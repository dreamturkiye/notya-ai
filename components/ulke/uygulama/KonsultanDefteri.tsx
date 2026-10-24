'use client'

/**
 * The colleague address book (Türkiye gold: Araçlar › Konsültasyonlar › Defter): the doctor adds, edits and removes the
 * colleagues they trust to consult, with phones, email, address and a note. Private to the signed-in doctor. A phone number
 * must be a real number of this country — the server refuses the rest. Every sentence is the pack's (konsultasyonMetni().defter).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Bilgi, Hata, type Uygulama } from './Kabuk'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { konsultasyonMetni, rolAdi, roller } from '@/lib/ulke/arayuz'
import type { DefterAlani, DefterKaydi } from '@/lib/ulke/uygulama/konsultanDefteri'

const API = '/api/ulke/konsultan-defteri'
type Form = Omit<DefterKaydi, 'id'>
const BOS: Form = { ad: '', brans: '', ofisTelefon: '', telefon: '', whatsapp: '', eposta: '', adres: '', not: '', kurumIci: false }
const sirala = (l: DefterKaydi[]) => [...l].sort((a, b) => a.ad.localeCompare(b.ad))

export function DefterKarti({ k, d, duzenleniyor, duzenle, sil }: { k: DefterKaydi; d: NonNullable<ReturnType<typeof konsultasyonMetni>['defter']>; duzenleniyor: boolean; duzenle: () => void; sil: () => void }) {
  const iletisim = [k.ofisTelefon && `${d.ofisTelefon}: ${k.ofisTelefon}`, k.telefon && `${d.telefon}: ${k.telefon}`, k.whatsapp && `${d.whatsapp}: ${k.whatsapp}`, k.eposta, k.adres].filter(Boolean).join(' · ')
  return (
    <div className="uza-kart" data-defter-kayit={k.id} data-duzenleniyor={duzenleniyor ? '1' : undefined}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
        <strong>{k.ad}</strong>
        {k.brans ? <span className="uza-ipucu" style={{ margin: 0 }}>{k.brans}</span> : null}
        <span className="uza-ipucu" style={{ margin: 0 }}>· {k.kurumIci ? d.kurumIciEtiket : d.disarida}</span>
        {duzenleniyor ? <span className="uza-ipucu" style={{ margin: 0 }}>· {d.duzenleniyor}</span> : null}
      </div>
      <p className="uza-ipucu">{iletisim || d.iletisimYok}</p>
      {k.not ? <p className="uza-not-metin" style={{ whiteSpace: 'pre-wrap' }}>{k.not}</p> : null}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={duzenle} disabled={duzenleniyor} data-eylem="defter-duzenle">{d.duzenleBtn}</button>
        <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={sil} data-eylem="defter-sil">{d.sil}</button>
      </div>
    </div>
  )
}

export function KonsultanDefteri({ u }: { u: Uygulama }) {
  const d = konsultasyonMetni(u.dil).defter
  const { api, hesap } = u
  const [liste, setListe] = useState<DefterKaydi[] | null>(null)
  const [yuklenemedi, setYuklenemedi] = useState(false)
  const [form, setForm] = useState<Form>(BOS)
  const [duzenleId, setDuzenleId] = useState<string | null>(null)
  const [alanHata, setAlanHata] = useState<DefterAlani | null>(null)
  const [genelHata, setGenelHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const bransler = Array.from(new Set(roller().map((r) => rolAdi(r.anahtar, u.dil)).filter((x): x is string => Boolean(x))))
  const [kendi, setKendi] = useState(false)

  const yukle = useCallback(async () => {
    const r = await api(API)
    if (r.ok && Array.isArray(r.j.defter)) { setListe(r.j.defter as DefterKaydi[]); setYuklenemedi(false) } else setYuklenemedi(true)
  }, [api])
  useEffect(() => { if (hesap) yukle().catch(() => setYuklenemedi(true)) }, [hesap, yukle])
  if (!d) return null

  const alanMetni = (a: DefterAlani | null): string | null => a === 'ad' ? d.adHata : a === 'eposta' ? d.epostaHata : a ? d.telefonHata : null
  const sifirla = () => { setKendi(false); setDuzenleId(null); setForm(BOS); setAlanHata(null); setGenelHata(null) }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault()
    if (bekliyor) return
    setAlanHata(null); setGenelHata(null); setBilgi(null); setBekliyor(true)
    try {
      const r = await api(API, { method: duzenleId ? 'PATCH' : 'POST', govde: duzenleId ? { id: duzenleId, ...form } : form })
      if (!r.ok) {
        if (r.j.code === 'GECERSIZ' && typeof r.j.alan === 'string') setAlanHata(r.j.alan as DefterAlani)
        else setGenelHata(r.j.code === 'DOLU' ? d!.dolu : d!.kaydedilemedi)
        return
      }
      const kayit = r.j.kayit as DefterKaydi | undefined
      if (kayit) setListe((l) => sirala(duzenleId ? (l ?? []).map((x) => (x.id === duzenleId ? kayit : x)) : [...(l ?? []), kayit])); else await yukle()
      setBilgi(duzenleId ? d!.guncellendi : d!.eklendi)
      setDuzenleId(null); setForm(BOS)
    } catch { setGenelHata(d!.kaydedilemedi) } finally { setBekliyor(false) }
  }

  async function sil(k: DefterKaydi) {
    if (typeof window !== 'undefined' && !window.confirm(d!.silOnay)) return
    const r = await api(`${API}?id=${encodeURIComponent(k.id)}`, { method: 'DELETE' })
    if (!r.ok) { setGenelHata(d!.kaydedilemedi); return }
    if (duzenleId === k.id) sifirla()
    setListe((l) => (l ?? []).filter((x) => x.id !== k.id)); setBilgi(d!.silindi)
  }

  const metinAlani = (anahtar: DefterAlani & keyof Form, etiket: string, ek?: { type?: string; yer?: string; max?: number; mod?: 'tel' | 'email' }) => (
    <div className="uza-alan" key={anahtar}>
      <label className="uza-etiket" htmlFor={`uza-df-${anahtar}`}>{etiket}</label>
      <input id={`uza-df-${anahtar}`} name={anahtar} className="uza-girdi" type={ek?.type ?? 'text'} inputMode={ek?.mod} autoComplete="off" maxLength={ek?.max} placeholder={ek?.yer}
        value={String(form[anahtar] ?? '')} onChange={(e) => setForm({ ...form, [anahtar]: e.target.value })} aria-invalid={alanHata === anahtar ? true : undefined} />
      {alanHata === anahtar ? <div style={{ marginTop: 6 }}><Hata>{alanMetni(alanHata)}</Hata></div> : null}
    </div>
  )

  return (
    <div data-alan="konsultan-defteri">
      <p className="uza-aciklama">{d.aciklama}</p>
      <section className="uza-kart">
        <h2 className="uza-h2">{duzenleId ? d.duzenle : d.ekle}</h2>
        <form className="uza-form" ref={formRef} onSubmit={(e) => { void kaydet(e) }} noValidate>
          {metinAlani('ad', d.ad, { yer: d.adYer, max: 120 })}
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-df-brans">{d.brans}</label>
            <select id="uza-df-brans" name="bransSecim" className="uza-girdi" value={kendi ? '__diger' : form.brans} onChange={(e) => { if (e.target.value === '__diger') { setKendi(true); setForm({ ...form, brans: '' }) } else { setKendi(false); setForm({ ...form, brans: e.target.value }) } }}>
              <option value="">{d.bransSec}</option>
              {bransler.map((b) => <option key={b} value={b}>{b}</option>)}
              <option value="__diger">{d.bransDiger}</option>
            </select>
            {kendi ? <input id="uza-df-brans-kendi" name="brans" className="uza-girdi" style={{ marginTop: 8 }} type="text" maxLength={80} autoComplete="off" placeholder={d.bransDigerYer} aria-label={d.bransDigerYer} value={form.brans} onChange={(e) => setForm({ ...form, brans: e.target.value })} /> : null}
          </div>
          {metinAlani('ofisTelefon', d.ofisTelefon, { type: 'tel', mod: 'tel', max: 40 })}
          {metinAlani('telefon', d.telefon, { type: 'tel', mod: 'tel', max: 40 })}
          {metinAlani('whatsapp', d.whatsapp, { type: 'tel', mod: 'tel', max: 40 })}
          {metinAlani('eposta', d.eposta, { type: 'email', mod: 'email', max: 160 })}
          {metinAlani('adres', d.adres, { max: 240 })}
          <div className="uza-alan">
            <label className="uza-etiket" htmlFor="uza-df-not">{d.not}</label>
            <textarea id="uza-df-not" name="not" className="uza-girdi" rows={4} maxLength={2000} value={form.not} placeholder={d.notIpucu} onChange={(e) => setForm({ ...form, not: e.target.value })} />
          </div>
          <label className="uza-onay"><input type="checkbox" name="kurumIci" checked={form.kurumIci} onChange={(e) => setForm({ ...form, kurumIci: e.target.checked })} /><span>{d.kurumIci}</span></label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="defter-kaydet">{bekliyor ? d.kaydediliyor : duzenleId ? d.degisiklikKaydet : d.kaydet}</button>
            {duzenleId ? <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={sifirla} disabled={bekliyor}>{d.vazgec}</button> : null}
          </div>
          {genelHata ? <div style={{ marginTop: 10 }}><Hata>{genelHata}</Hata></div> : null}
          <div style={{ marginTop: 10 }}><Bilgi>{bilgi}</Bilgi></div>
        </form>
      </section>
      {yuklenemedi ? <Hata>{d.yuklenemedi}</Hata> : liste === null ? null : liste.length === 0 ? <p className="uza-bos" data-alan="defter-bos">{d.bos}</p> : (
        <>
          <h2 className="uza-h2" style={{ marginTop: 18 }}>{yerine(d.defterSayisi, liste.length)}</h2>
          {liste.map((k) => (
            <DefterKarti key={k.id} k={k} d={d} duzenleniyor={duzenleId === k.id}
              duzenle={() => { setDuzenleId(k.id); setKendi(Boolean(k.brans) && !bransler.includes(k.brans)); setForm({ ad: k.ad, brans: k.brans, ofisTelefon: k.ofisTelefon, telefon: k.telefon, whatsapp: k.whatsapp, eposta: k.eposta, adres: k.adres, not: k.not, kurumIci: k.kurumIci }); setAlanHata(null); setGenelHata(null); setBilgi(null); formRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }) }}
              sil={() => { void sil(k) }} />
          ))}
        </>
      )}
    </div>
  )
}
