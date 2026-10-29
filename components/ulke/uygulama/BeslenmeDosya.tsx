'use client'

/**
 * AU-DIETETICS-MEAL-01 — current meal plan + recent food diary on the dietitian's patient file.
 *
 * Tool keys come from the pack (`uygulama.portal.beslenme`); this file never hard-codes a country key (wall D7).
 * Mounted only when the signed-in role can open the meal-plan tool (`hesabinAraci`).
 */
import React, { useCallback, useEffect, useState } from 'react'
import type { Uygulama } from './Kabuk'
import { aracYolu, paketAraci } from './aracOrtak'
import { arayuz, araclarMetni } from '@/lib/ulke/arayuz'
import { hesabinAraci } from '@/lib/ulke/araclar/paket'
import { ARAC_KAYDI_API, type AracKaydi } from '@/lib/ulke/araclar/kayitTipleri'
import { portalOgunPlani, portalYemekGunlugu } from '@/lib/ulke/portal/beslenme'
import { ulkePaketi } from '@/lib/ulke/ulke'

export type BeslenmeDosyaMetni = {
  baslik: string
  planBaslik: string
  planYok: string
  gunlukBaslik: string
  gunlukYok: string
  kahvalti: string
  ogle: string
  aksam: string
  atistirmalik: string
  notlar: string
  planAc: string
  gunlukAc: string
  ogunAdi: Readonly<Record<string, string>>
  kimAdi: Readonly<Record<string, string>>
}

/** Pure view: current plan + recent diary from kept results. */
export function BeslenmeDosyaGorunumu({
  metin,
  kayitlar,
  planAraci,
  gunlukAraci,
  hastaId,
}: {
  metin: BeslenmeDosyaMetni
  kayitlar: readonly AracKaydi[] | null
  planAraci: string
  gunlukAraci: string
  hastaId: string
}) {
  if (!kayitlar) return null
  const plan = portalOgunPlani(kayitlar, planAraci)
  const gunluk = portalYemekGunlugu(kayitlar, gunlukAraci, 8)
  return (
    <section className="uza-kart" data-alan="beslenme-dosya">
      <h2 className="uza-h2">{metin.baslik}</h2>

      <div data-alan="meal-plan" style={{ marginBottom: 20 }}>
        <h3 className="uza-alt-baslik">{metin.planBaslik}</h3>
        {!plan ? (
          <p className="uza-bos">{metin.planYok}</p>
        ) : (
          <dl className="uza-bilgiler" data-plan-gun={plan.gun}>
            <dt>{metin.kahvalti}</dt><dd data-alan="kahvalti">{plan.kahvalti || '—'}</dd>
            <dt>{metin.ogle}</dt><dd data-alan="ogle">{plan.ogle || '—'}</dd>
            <dt>{metin.aksam}</dt><dd data-alan="aksam">{plan.aksam || '—'}</dd>
            <dt>{metin.atistirmalik}</dt><dd data-alan="atistirmalik">{plan.atistirmalik || '—'}</dd>
            {plan.notlar ? <><dt>{metin.notlar}</dt><dd data-alan="notlar">{plan.notlar}</dd></> : null}
          </dl>
        )}
        <p style={{ marginTop: 8 }}>
          <a className="uza-baglanti" href={aracYolu(planAraci, hastaId)} data-eylem="meal-plan-ac">{metin.planAc}</a>
        </p>
      </div>

      <div data-alan="food-diary">
        <h3 className="uza-alt-baslik">{metin.gunlukBaslik}</h3>
        {gunluk.length === 0 ? (
          <p className="uza-bos">{metin.gunlukYok}</p>
        ) : (
          <ul className="uza-liste">
            {gunluk.map((x, i) => (
              <li key={`${x.gun}-${x.ogun}-${i}`} data-gunluk-gun={x.gun}>
                <span className="uza-liste-ad">{x.gun} · {metin.ogunAdi[x.ogun] ?? x.ogun}</span>
                <span className="uza-liste-alt">{x.aciklama} · {metin.kimAdi[x.kim] ?? x.kim}</span>
              </li>
            ))}
          </ul>
        )}
        <p style={{ marginTop: 8 }}>
          <a className="uza-baglanti" href={aracYolu(gunlukAraci, hastaId)} data-eylem="food-diary-ac">{metin.gunlukAc}</a>
        </p>
      </div>
    </section>
  )
}

/** Card on the patient's file for dietetics. null when pack/role/catalogue omit it. */
export function BeslenmeDosyaKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const [kayitlar, setKayitlar] = useState<AracKaydi[] | null>(null)
  const { hesap, api, dil } = u
  const ayar = ulkePaketi().uygulama?.portal?.beslenme
  const icerik = arayuz().araclar
  const metin = araclarMetni(dil).beslenmeDosya
  const rol = hesap?.rol ?? null
  const planGorunur = Boolean(ayar && icerik && hesabinAraci(icerik, rol, ayar.planAraci))
  const gunlukVar = Boolean(ayar && icerik && paketAraci(icerik, ayar.gunlukAraci))
  const acik = Boolean(planGorunur && gunlukVar && metin)
  const yukle = useCallback(() => {
    api(`${ARAC_KAYDI_API}?hasta=${encodeURIComponent(hastaId)}`)
      .then((r) => { if (r.ok && Array.isArray(r.j.kayitlar)) setKayitlar(r.j.kayitlar) })
      .catch(() => { /* no card content without a readable list */ })
  }, [api, hastaId])
  useEffect(() => { if (hesap && acik) yukle() }, [hesap, acik, yukle])
  if (!acik || !metin || !ayar) return null
  return (
    <BeslenmeDosyaGorunumu
      metin={metin}
      kayitlar={kayitlar}
      planAraci={ayar.planAraci}
      gunlukAraci={ayar.gunlukAraci}
      hastaId={hastaId}
    />
  )
}
