'use client'

/**
 * Care-plan / between-visit log card on the doctor's patient file.
 *
 * AU-DIETETICS-MEAL-01: dietetics meal plan + food diary via `portal.beslenme`.
 * AU-GOLD-DEPTH-02: every other role with `portal.kocluk` uses the same card shape
 * (resolved by `portalKoclukAyari`) so doctor↔patient coaching is visible on the file —
 * not only on the patient portal. Shared UI never hard-codes a country tool key (wall D7).
 */
import React, { useCallback, useEffect, useState } from 'react'
import type { Uygulama } from './Kabuk'
import { aracYolu, paketAraci } from './aracOrtak'
import { arayuz, araclarMetni } from '@/lib/ulke/arayuz'
import { hesabinAraci } from '@/lib/ulke/araclar/paket'
import { ARAC_KAYDI_API, type AracKaydi } from '@/lib/ulke/araclar/kayitTipleri'
import {
  portalBeslenmeHedefleri,
  portalHastaGunlukSayisi,
  portalOgunPlani,
  portalYemekGunlugu,
} from '@/lib/ulke/portal/beslenme'
import { portalKoclukAyari } from '@/lib/ulke/portal/koclukAyari'
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
  /** "% from the patient" — placeholder is the count of patient-written diary lines. */
  hastaGunlukRozet: string
  hedefBaslik?: string
  hedefYok?: string
  hedefAc?: string
}

/** Pure view: current plan + recent diary (+ goals) from kept results. */
export function BeslenmeDosyaGorunumu({
  metin,
  kayitlar,
  planAraci,
  gunlukAraci,
  hedefAraci,
  hedefAdi,
  hastaId,
}: {
  metin: BeslenmeDosyaMetni
  kayitlar: readonly AracKaydi[] | null
  planAraci: string
  gunlukAraci: string
  hedefAraci?: string
  hedefAdi?: Readonly<Record<string, string>>
  hastaId: string
}) {
  if (!kayitlar) return null
  const plan = portalOgunPlani(kayitlar, planAraci)
  const gunluk = portalYemekGunlugu(kayitlar, gunlukAraci, 8)
  const hastaSayisi = portalHastaGunlukSayisi(kayitlar, gunlukAraci)
  const hedefler =
    hedefAraci && hedefAdi ? portalBeslenmeHedefleri(kayitlar, hedefAraci, hedefAdi) : null
  return (
    <section className="uza-kart" data-alan="beslenme-dosya" data-hasta-gunluk={hastaSayisi}>
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

      <div data-alan="food-diary" style={{ marginBottom: hedefAraci ? 20 : 0 }}>
        <h3 className="uza-alt-baslik" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>{metin.gunlukBaslik}</span>
          {hastaSayisi > 0 ? (
            <span
              className="uza-rozet"
              data-alan="hasta-gunluk-rozet"
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'var(--uza-altin, #c4a35a)',
                color: 'var(--uza-murekkep, #1a1a1a)',
              }}
            >
              {metin.hastaGunlukRozet.replace('%', String(hastaSayisi))}
            </span>
          ) : null}
        </h3>
        {gunluk.length === 0 ? (
          <p className="uza-bos">{metin.gunlukYok}</p>
        ) : (
          <ul className="uza-liste">
            {gunluk.map((x, i) => (
              <li
                key={`${x.gun}-${x.ogun}-${i}`}
                data-gunluk-gun={x.gun}
                data-kim={x.kim}
                style={x.kim === 'hasta' ? { borderLeft: '3px solid var(--uza-altin, #c4a35a)', paddingLeft: 8 } : undefined}
              >
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

      {hedefAraci && metin.hedefBaslik ? (
        <div data-alan="care-goals">
          <h3 className="uza-alt-baslik">{metin.hedefBaslik}</h3>
          {!hedefler || hedefler.length === 0 ? (
            <p className="uza-bos">{metin.hedefYok ?? 'No agreed goals kept yet.'}</p>
          ) : (
            <ul className="uza-liste" data-hedef-sayisi={hedefler.length}>
              {hedefler.map((h) => (
                <li key={h.anahtar}>
                  <span className="uza-liste-ad">{h.etiket}</span>
                </li>
              ))}
            </ul>
          )}
          <p style={{ marginTop: 8 }}>
            <a className="uza-baglanti" href={aracYolu(hedefAraci, hastaId)} data-eylem="care-goals-ac">
              {metin.hedefAc ?? 'Open goals'}
            </a>
          </p>
        </div>
      ) : null}
    </section>
  )
}

/** Card on the patient's file for dietetics OR any role with portal coaching. null when omitted. */
export function BeslenmeDosyaKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const [kayitlar, setKayitlar] = useState<AracKaydi[] | null>(null)
  const { hesap, api, dil } = u
  const icerik = arayuz().araclar ?? null
  const rol = hesap?.rol ?? null
  const ayar = portalKoclukAyari(ulkePaketi(), rol, icerik)
  const katalog = araclarMetni(dil).beslenmeDosya
  const planGorunur = Boolean(ayar && icerik && hesabinAraci(icerik, rol, ayar.planAraci))
  const gunlukVar = Boolean(ayar && icerik && paketAraci(icerik, ayar.gunlukAraci))
  const acik = Boolean(planGorunur && gunlukVar && katalog && ayar)
  const metin: BeslenmeDosyaMetni | null =
    acik && ayar && katalog
      ? {
          baslik: ayar.etiket.sekmeBaslik,
          planBaslik: ayar.etiket.planBaslik,
          planYok: ayar.etiket.planYok,
          gunlukBaslik: ayar.etiket.gunlukBaslik,
          gunlukYok: ayar.etiket.gunlukYok,
          kahvalti: ayar.etiket.kahvalti,
          ogle: ayar.etiket.ogle,
          aksam: ayar.etiket.aksam,
          atistirmalik: ayar.etiket.atistirmalik,
          notlar: ayar.etiket.notlar,
          planAc: katalog.planAc,
          gunlukAc: katalog.gunlukAc,
          ogunAdi: ayar.etiket.ogunAdi,
          kimAdi: ayar.etiket.kimAdi,
          hastaGunlukRozet: katalog.hastaGunlukRozet,
          hedefBaslik: ayar.hedefAraci ? ayar.etiket.hedefBaslik : undefined,
          hedefYok: ayar.hedefAraci ? ayar.etiket.hedefYok : undefined,
          hedefAc: ayar.hedefAraci ? 'Open agreed goals' : undefined,
        }
      : null
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
      hedefAraci={ayar.hedefAraci}
      hedefAdi={ayar.etiket.hedefAdi}
      hastaId={hastaId}
    />
  )
}
