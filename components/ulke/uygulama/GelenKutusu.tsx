'use client'

/**
 * The doctor's MESSAGES page (LOOK-PARITY, Kaan 2026-10-24): the conversations with all their patients in one place,
 * drawn through Türkiye's messages page (components/doktor/MesajlarGorunumu.tsx): the heading with the unread count,
 * the two white cards, the bubbles and the reply box. Nothing else is written here: the data is the country's
 * (GET /api/ulke/hasta-mesajlari?gelen=1 and ?hasta=), every sentence is the pack's (mesajMetni → `gelen`, `hekim`).
 *
 * A message of the patient's is marked as read only when it was drawn here, up to the newest message shown.
 * Nothing is sent to the patient by any channel: the patient reads it on their own page.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Cerceve, tarihYaz, saatYaz, useUygulama, Yukleniyor, YOL } from './Kabuk'
import { rolAdi } from '@/lib/ulke/arayuz'
import { MesajBalonEylemi, MesajBalonlari, MesajBalonu, MesajKartlari, MesajKonuListesi, MesajListeBos, MesajPanelBasligi, MesajPanelBos, MesajSayfaBasligi, MesajYazmaKutusu } from '@/components/doktor/MesajlarGorunumu'
import { CHROME_RENK } from '@/lib/doktor/chromeRenk'
import { mesajMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import { HEKIM_MESAJ_API, type GelenKonu, type HekimMesajGorunumu, type Yazisma } from '@/lib/ulke/mesaj/sabitler'
import { sonMesajAni } from '../mesajOrtak'

const an = (iso: string): string => `${tarihYaz(iso)} ${saatYaz(iso)}`

export default function GelenKutusu() {
  const u = useUygulama('mesajlar')
  const { api, hesap } = u
  const x = mesajMetni(u.dil)
  const [konular, setKonular] = useState<GelenKonu[] | null>(null)
  const [aktifId, setAktifId] = useState<string | null>(null)
  const [dosya, setDosya] = useState<HekimMesajGorunumu | null>(null)
  const [metin, setMetin] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const okunan = useRef('')

  const listele = useCallback(async () => {
    const r = await api(`${HEKIM_MESAJ_API}?gelen=1`)
    if (r.ok && Array.isArray(r.j.konular)) { setKonular(r.j.konular as GelenKonu[]); setHata(null) } else { setKonular([]); setHata(x.hekim.yuklenemedi) }
  }, [api, x.hekim.yuklenemedi])
  useEffect(() => { if (hesap) void listele() }, [hesap, listele])

  const aktif = konular?.find((k) => k.yazismaId === aktifId) ?? null
  const yazisma: Yazisma | null = dosya?.yazismalar.find((y) => y.id === aktifId) ?? null

  const ac = useCallback(async (k: GelenKonu) => {
    setAktifId(k.yazismaId); setHata(null); setDosya(null); setMetin('')
    const r = await api(`${HEKIM_MESAJ_API}?hasta=${encodeURIComponent(k.hastaId)}`)
    if (!r.ok || !Array.isArray(r.j.yazismalar)) { setHata(x.hekim.yuklenemedi); return }
    const g = r.j as unknown as HekimMesajGorunumu
    setDosya(g)
    // "Read up to the newest message I showed": only what this screen drew is marked.
    const son = sonMesajAni(g.yazismalar.filter((y) => y.id === k.yazismaId))
    if (k.okunmamis > 0 && son && son !== okunan.current) {
      okunan.current = son
      const o = await api(HEKIM_MESAJ_API, { method: 'PATCH', govde: { hastaId: k.hastaId, islem: 'okundu', kadar: son } })
      if (o.ok) setKonular((l) => (l ? l.map((e) => (e.hastaId === k.hastaId ? { ...e, okunmamis: 0 } : e)) : l))
      else okunan.current = ''
    }
  }, [api, x.hekim.yuklenemedi])

  async function yanitla() {
    if (!aktif || !metin.trim()) return
    setBekliyor(true); setHata(null)
    const r = await api(HEKIM_MESAJ_API, { method: 'POST', govde: { hastaId: aktif.hastaId, metin } })
    if (r.ok) {
      setMetin('')
      await listele()
      const yeniId = typeof r.j.yazismaId === 'string' ? r.j.yazismaId : aktif.yazismaId
      const g = await api(`${HEKIM_MESAJ_API}?hasta=${encodeURIComponent(aktif.hastaId)}`)
      if (g.ok && Array.isArray(g.j.yazismalar)) { setDosya(g.j as unknown as HekimMesajGorunumu); setAktifId(yeniId) }
    } else {
      const kod = String(r.j.code ?? '')
      setHata(kod === 'BOS' ? x.hekim.bosMesaj : kod === 'UZUN' ? x.hekim.cokUzun.replace('%', '2000') : kod === 'LIMIT' ? x.hekim.limit : x.hekim.gonderilemedi)
    }
    setBekliyor(false)
  }

  async function kapat() {
    if (!aktif || aktif.kapandi) return
    if (!window.confirm(`${x.hekim.kapatUyari}`)) return
    const r = await api(HEKIM_MESAJ_API, { method: 'PATCH', govde: { yazismaId: aktif.yazismaId, islem: 'kapat' } })
    if (r.ok) { await listele(); await ac({ ...aktif, kapandi: new Date().toISOString() }) } else setHata(x.hekim.yapilamadi)
  }

  if (!hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  const g = x.gelen
  const toplamOkunmamis = (konular ?? []).filter((k) => k.okunmamis > 0).length
  return (
    <Cerceve dil={u.dil} m={u.m} ad={hesap.ad} unvan={rolAdi(hesap.rol, u.dil) ?? undefined} aktif="mesajlar" cikis={u.cikis}>
      <div data-alan="gelen-kutusu">
        <MesajSayfaBasligi eyebrow={g.ustYazi} baslik={g.baslik} okunmamis={toplamOkunmamis} alt={g.aciklama} />
        {hata ? <p style={{ color: CHROME_RENK.warn, fontSize: 14 }} role="alert">{hata}</p> : null}
        {konular === null ? <p style={{ color: CHROME_RENK.muted }}>{g.yukleniyor}</p> : null}
        <MesajKartlari
          sol={konular !== null && konular.length === 0 ? (
            <MesajListeBos baslik={g.bosBaslik}>{g.bosGovde}</MesajListeBos>
          ) : (
            <MesajKonuListesi aktifId={aktifId} onSec={(id) => { const k = konular?.find((e) => e.yazismaId === id); if (k) void ac(k) }}
              konular={(konular ?? []).map((k) => ({ id: k.yazismaId, baslik: k.hastaAdi, alt: k.kapandi ? `${an(k.son)} · ${yerine(x.hekim.kapali, tarihYaz(k.kapandi))}` : an(k.son), ozet: k.ozet, okunmamis: k.okunmamis > 0 }))} />
          )}
          sag={!aktif ? (
            <MesajPanelBos>{g.sec}</MesajPanelBos>
          ) : (
            <>
              <MesajPanelBasligi baslik={aktif.hastaAdi}
                alt={<><a href={`${YOL.hasta}?id=${encodeURIComponent(aktif.hastaId)}`} style={{ color: CHROME_RENK.pine, fontWeight: 700 }}>{g.hastaDosyasi}</a>{aktif.kapandi ? ` · ${yerine(x.hekim.kapali, tarihYaz(aktif.kapandi))}` : ''}</>} />
              <MesajBalonlari>
                {(yazisma?.mesajlar ?? []).map((m) => {
                  const karsi = m.gonderen === 'hasta'
                  return <MesajBalonu key={m.id} karsi={karsi} kimden={karsi ? x.hekim.hasta : x.hekim.siz} metin={m.metin} zaman={an(m.an)}
                    veri={{ 'data-mesaj': m.id, 'data-gonderen': m.gonderen }}
                    sag={!karsi ? <span style={{ fontSize: 11, opacity: 0.8 }}>{m.okundu ? x.hekim.okundu : x.hekim.okunmadi}</span> : undefined} />
                })}
              </MesajBalonlari>
              {aktif.kapandi ? null : <div style={{ marginTop: 6 }}><MesajBalonEylemi karsi onClick={() => void kapat()}>{x.hekim.kapat}</MesajBalonEylemi></div>}
              <MesajYazmaKutusu deger={metin} onDegis={(y) => { setMetin(y); setHata(null) }} yerTutucu={g.yanitYer} gonderMetni={bekliyor ? x.hekim.gonderiliyor : g.yanitla}
                onGonder={() => void yanitla()} pasif={bekliyor || !metin.trim()} soluk={bekliyor || !metin.trim()} />
            </>
          )}
        />
      </div>
    </Cerceve>
  )
}
