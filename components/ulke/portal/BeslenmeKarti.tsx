'use client'

/**
 * AU-DIETETICS-MEAL-01 / portal coaching — meal plan, diary, agreed goals and clinic weight on the patient portal.
 * Labels come on the payload (`beslenme.etiket`); this file hard-codes no country tool key.
 */
import React, { useState, type FormEvent } from 'react'
import { Bilgi, Hata } from '../uygulama/Kabuk'
import type { PortalIcerigi } from '@/lib/ulke/portal/tipler'

type Beslenme = NonNullable<PortalIcerigi['beslenme']>

const OGUN_SECENEK = ['kahvalti', 'ogle', 'aksam', 'atistirmalik', 'diger'] as const
const METIN_AZAMI = 280

export function PortalBeslenmeKarti({
  beslenme,
  kaydet,
  mesajaGit,
}: {
  beslenme: Beslenme
  /** Returns true when the diary entry was kept. */
  kaydet: (g: { gun: string; ogun: string; aciklama: string }) => Promise<boolean>
  /** Opens the messages tab (dietitian↔patient coaching loop). */
  mesajaGit?: () => void
}) {
  const e = beslenme.etiket
  const [gun, setGun] = useState(() => new Date().toISOString().slice(0, 10))
  const [ogun, setOgun] = useState<string>('kahvalti')
  const [aciklama, setAciklama] = useState('')
  const [bekliyor, setBekliyor] = useState(false)
  const [bildirim, setBildirim] = useState<'ok' | 'hata' | null>(null)

  const gonder = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!beslenme.gunlukYazabilir || bekliyor) return
    setBekliyor(true)
    setBildirim(null)
    const ok = await kaydet({ gun, ogun, aciklama })
    setBildirim(ok ? 'ok' : 'hata')
    if (ok) setAciklama('')
    setBekliyor(false)
  }

  const plan = beslenme.plan
  return (
    <>
      <section className="uza-kart" data-alan="portal-nutrition-goals">
        <h2 className="uza-h2">{e.hedefBaslik}</h2>
        {beslenme.hedefler.length === 0 ? (
          <p className="uza-bos">{e.hedefYok}</p>
        ) : (
          <ul className="uza-liste" data-hedef-sayisi={beslenme.hedefler.length}>
            {beslenme.hedefler.map((h) => (
              <li key={h.anahtar} data-hedef={h.anahtar}>
                <span className="uza-liste-ad">{h.etiket}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="uza-kart" data-alan="portal-meal-plan">
        <h2 className="uza-h2">{e.planBaslik}</h2>
        {!plan ? (
          <p className="uza-bos">{e.planYok}</p>
        ) : (
          <dl className="uza-bilgiler" data-plan-gun={plan.gun}>
            <dt>{e.kahvalti}</dt><dd data-alan="kahvalti">{plan.kahvalti || '—'}</dd>
            <dt>{e.ogle}</dt><dd data-alan="ogle">{plan.ogle || '—'}</dd>
            <dt>{e.aksam}</dt><dd data-alan="aksam">{plan.aksam || '—'}</dd>
            <dt>{e.atistirmalik}</dt><dd data-alan="atistirmalik">{plan.atistirmalik || '—'}</dd>
            {plan.notlar ? <><dt>{e.notlar}</dt><dd data-alan="notlar">{plan.notlar}</dd></> : null}
          </dl>
        )}
      </section>

      <section className="uza-kart" data-alan="portal-weight">
        <h2 className="uza-h2">{e.agirlikBaslik}</h2>
        {beslenme.agirlik.length === 0 ? (
          <p className="uza-bos">{e.agirlikYok}</p>
        ) : (
          <ul className="uza-liste">
            {beslenme.agirlik.map((x) => (
              <li key={x.gun} data-agirlik-gun={x.gun}>
                <span className="uza-liste-ad">{x.gun}</span>
                <span className="uza-liste-alt">
                  {[
                    x.kiloKg != null ? `${x.kiloKg} ${e.agirlikKg}` : null,
                    x.bmi != null ? `${e.bmiEtiket} ${x.bmi}` : null,
                    x.belCm != null ? `${e.belEtiket} ${x.belCm}` : null,
                  ].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="uza-kart" data-alan="portal-food-diary">
        <h2 className="uza-h2">{e.gunlukBaslik}</h2>
        {beslenme.gunluk.length === 0 ? (
          <p className="uza-bos">{e.gunlukYok}</p>
        ) : (
          <ul className="uza-liste">
            {beslenme.gunluk.map((x, i) => (
              <li key={`${x.gun}-${x.ogun}-${i}`} data-gunluk-gun={x.gun} data-kim={x.kim}>
                <span className="uza-liste-ad">{x.gun} · {e.ogunAdi[x.ogun] ?? x.ogun}</span>
                <span className="uza-liste-alt">{x.aciklama} · {e.kimAdi[x.kim] ?? x.kim}</span>
              </li>
            ))}
          </ul>
        )}

        {beslenme.gunlukYazabilir ? (
          <form onSubmit={gonder} style={{ marginTop: 16, display: 'grid', gap: 10 }} data-alan="portal-diary-form">
            <h3 className="uza-alt-baslik">{e.gunlukEkle}</h3>
            <label className="uza-etiket">
              {e.gun}
              <input className="uza-girdi" type="date" name="gun" value={gun} onChange={(ev) => setGun(ev.target.value)} required />
            </label>
            <label className="uza-etiket">
              {e.ogun}
              <select className="uza-girdi" name="ogun" value={ogun} onChange={(ev) => setOgun(ev.target.value)}>
                {OGUN_SECENEK.map((k) => (
                  <option key={k} value={k}>{e.ogunAdi[k] ?? k}</option>
                ))}
              </select>
            </label>
            <label className="uza-etiket">
              {e.aciklama}
              <textarea className="uza-girdi" name="aciklama" maxLength={METIN_AZAMI} rows={3} value={aciklama} onChange={(ev) => setAciklama(ev.target.value)} required />
            </label>
            <button type="submit" className="uza-dugme" disabled={bekliyor || !aciklama.trim()} data-eylem="diary-kaydet">
              {e.kaydet}
            </button>
            {bildirim === 'ok' ? <Bilgi>{e.kaydedildi}</Bilgi> : null}
            {bildirim === 'hata' ? <Hata>{e.kaydedilemedi}</Hata> : null}
          </form>
        ) : null}
      </section>

      {mesajaGit ? (
        <section className="uza-kart" data-alan="portal-nutrition-message">
          <p className="uza-bos" style={{ marginBottom: 12 }}>{e.mesajIpucu}</p>
          <button type="button" className="uza-dugme" onClick={mesajaGit} data-eylem="beslenme-mesaj">
            {e.mesajCta}
          </button>
        </section>
      ) : null}
    </>
  )
}
