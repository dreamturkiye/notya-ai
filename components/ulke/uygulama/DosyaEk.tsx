'use client'

/**
 * Print, a text copy, an addendum on an approved note, deleting a draft visit, and the quiet panel for the
 * slots that are not built (coding, prescriptions, medicines, claims, state systems).
 *
 * Nothing here turns a slot on. Nothing is sent to a register, a payer or a state system.
 * An approved note's four sections are not edited here: the addendum is a separate field.
 * Machine-written catalogue sentences. A clinician has not signed this wording.
 */
import React, { useState } from 'react'
import { Bilgi, Hata, YOL, type Api } from './Kabuk'
import type { NotDetayi } from './Not'
import { tamAd } from './Hastalar'
import type { UygulamaMetni } from '@/lib/ulke/arayuz'

const BOLUMLER = ['s', 'o', 'a', 'p'] as const

function kopyaMetni(m: UygulamaMetni, not: NotDetayi): string {
  const n = m.not
  const ad = not.muayene.hasta ? tamAd(not.muayene.hasta) : ''
  const satirlar = [n.baslik, ad, n.kopyaIzoh, '']
  for (const b of BOLUMLER) satirlar.push(n[b], not.icerik[b] || '', '')
  if ((not.ekMetin ?? '').trim()) satirlar.push(n.ekBaslik, not.ekMetin ?? '', '')
  return satirlar.join('\n')
}

export function DosyaEk({ m, not, api, yenile }: { m: UygulamaMetni; not: NotDetayi; api: Api; yenile: () => Promise<void> }) {
  const n = m.not
  const [ek, setEk] = useState(not.ekMetin ?? '')
  const [bekliyor, setBekliyor] = useState(false)
  const [onay, setOnay] = useState(false)
  const [iyi, setIyi] = useState<string | null>(null)
  const [kotu, setKotu] = useState<string | null>(null)

  function indir() {
    const blob = new Blob([kopyaMetni(m, not)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'visit-note.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function ekKaydet() {
    setBekliyor(true); setIyi(null); setKotu(null)
    try {
      const r = await api('/api/ulke/not/ek', { method: 'POST', govde: { notId: not.notId, ek } })
      if (r.ok) { setIyi(n.ekKaydedildi); await yenile() }
      else setKotu(r.j.alan === 'taslak' ? n.ekTaslak : n.ekKaydedilemedi)
    } catch { setKotu(m.kabuk.baglanti) }
    setBekliyor(false)
  }

  async function sil() {
    setBekliyor(true); setIyi(null); setKotu(null)
    try {
      const r = await api('/api/ulke/muayene', { method: 'DELETE', govde: { seansId: not.seansId } })
      if (r.ok) {
        const hasta = not.muayene.hasta
        window.location.assign(hasta ? `${YOL.hasta}?id=${hasta.id}` : YOL.bugun)
        return
      }
      setKotu(r.j.code === 'ONAYLI' ? n.silOnayli : n.silinemedi)
      setOnay(false)
    } catch { setKotu(m.kabuk.baglanti) }
    setBekliyor(false)
  }

  return (
    <>
      <section className="uza-kart" data-alan="dosya-kopya">
        <p className="uza-ipucu" style={{ marginTop: 0 }}>{n.kopyaIzoh}</p>
        <div className="uza-eylemler" data-yazdirma-gizle>
          <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => window.print()} data-eylem="yazdir">{n.yazdir}</button>
          <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={indir} data-eylem="disa-aktar">{n.disaAktar}</button>
        </div>
      </section>

      {not.onayli ? (
        <section className="uza-kart" data-alan="not-ek">
          <h2 className="uza-h2">{n.ekBaslik}</h2>
          {(not.ekMetin ?? '').trim() ? <p className="uza-not-metin" data-alan="ek-metin">{not.ekMetin}</p> : null}
          <form className="uza-form" data-yazdirma-gizle onSubmit={(e) => { e.preventDefault(); void ekKaydet() }}>
            <p className="uza-ipucu" style={{ marginTop: 0 }}>{n.ekIzoh}</p>
            <textarea className="uza-girdi" value={ek} onChange={(e) => setEk(e.target.value)} maxLength={4000} rows={4} data-alan="ek-girdi" />
            <Hata>{kotu && !onay ? kotu : null}</Hata>
            <Bilgi>{iyi}</Bilgi>
            <button type="submit" className="uza-dugme" disabled={bekliyor} data-eylem="ek-kaydet">{bekliyor ? m.ayarlar.kaydediliyor : n.ekKaydet}</button>
          </form>
        </section>
      ) : (
        <section className="uza-kart" data-alan="taslak-sil" data-yazdirma-gizle>
          {onay ? (
            <div className="uza-form">
              <p className="uza-ipucu" style={{ marginTop: 0 }}>{n.silOnay}</p>
              <Hata>{kotu}</Hata>
              <div className="uza-eylemler">
                <button type="button" className="uza-dugme" disabled={bekliyor} onClick={() => { void sil() }} data-eylem="sil-onayla">{n.sil}</button>
                <button type="button" className="uza-dugme uza-dugme-cizgi" disabled={bekliyor} onClick={() => setOnay(false)}>{m.yeniHasta.iptal}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="uza-dugme uza-dugme-cizgi" onClick={() => { setOnay(true); setKotu(null) }} data-eylem="sil">{n.sil}</button>
          )}
        </section>
      )}

      <section className="uza-kart" data-alan="kapali-isler" data-yazdirma-gizle>
        <h2 className="uza-h2">{n.kapaliBaslik}</h2>
        <p className="uza-ipucu" style={{ marginTop: 0 }}>{n.kapaliIzoh}</p>
        <ul className="uza-liste">
          {([n.kapaliKodlama, n.kapaliRecete, n.kapaliIlac, n.kapaliTalep, n.kapaliDevlet] as const).map((ad) => (
            <li key={ad}><div className="uza-satir"><span className="uza-liste-ad">{ad}</span><span className="uza-rozet">{n.kapaliBaslik}</span></div></li>
          ))}
        </ul>
      </section>
    </>
  )
}
