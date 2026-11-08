'use client'

/**
 * ULKE-BRANS-DERINLIK-09 (Kaan, 2026-11-08) — THE SPECIALTY TAB of the patient's file: the account's own role's scores and
 * calculators kept on this patient, one section per tool, newest first, with the change against the time before
 * (lib/ulke/araclar/uzmanlikSekmesi.ts works it out). The same card in every country (one look); the words are the pack's
 * (`araclarMetni(dil).kayit.uzmanlik*`). A pack without those words, or a role without specialty tools, has no tab.
 *
 * PERFORMANCE (performans-butcesi-koruma): loaded behind its tab with next/dynamic by the patient file; it reads the kept
 * results through ./kayitOkuma.ts, which shares ONE request with the "Tools" card — no second round trip.
 */
import React, { useEffect, useState } from 'react'
import { tarihYaz, type Uygulama } from './Kabuk'
import { birimOrtami, yazici } from './aracOrtak'
import { arayuz, araclarMetni, type AraclarMetni } from '@/lib/ulke/arayuz'
import { yerine } from '@/lib/ulke/arayuz/yerTutucu'
import type { AracKaydi } from '@/lib/ulke/araclar/kayitTipleri'
import { bicimli, sayiMetni } from '@/lib/ulke/araclar/paket'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import { uzmanlikBolumleri } from '@/lib/ulke/araclar/uzmanlikSekmesi'
import type { DilKodu } from '@/lib/ulke/tipler'
import { hastaKayitlariniOku } from './kayitOkuma'

/** Pure: the sections, or the pack's "nothing kept yet". */
export function UzmanlikSonuclariGorunumu({ a, dil, icerik, rol, kayitlar }: { a: AraclarMetni; dil: DilKodu; icerik: UlkeAraclari; rol: string | null; kayitlar: readonly AracKaydi[] | null }) {
  const k = a.kayit
  const bolumler = uzmanlikBolumleri(icerik, rol, kayitlar)
  const y = yazici(icerik, dil), o = birimOrtami(icerik)
  return (
    <section className="uza-kart" data-alan="hasta-uzmanlik" data-rol={rol ?? undefined}>
      {k.uzmanlikAciklama ? <p className="uza-aciklama">{k.uzmanlikAciklama}</p> : null}
      {kayitlar === null ? null : !bolumler.length ? <p className="uza-bos" data-uzmanlik="bos">{k.uzmanlikBos ?? k.dosyaBos}</p> : bolumler.map((b) => (
        <div key={b.arac.tanim.anahtar} data-uzmanlik-arac={b.arac.tanim.anahtar} style={{ marginTop: 14 }}>
          <h3 className="uza-h2" style={{ fontSize: 16 }}>{bicimli(b.arac.paket.metin.ad, dil)}</h3>
          <ul className="uza-liste">
            {b.satirlar.map((s) => (
              <li key={s.id} data-kayit={s.id}>
                <div className="uza-satir">
                  <span className="uza-saat">{tarihYaz(s.gun)}</span>
                  <span className="uza-liste-ad">
                    {s.sayilar.slice(0, 3).map((x) => `${bicimli(b.arac.paket.metin.sayilar?.[x.anahtar], dil)}: ${sayiMetni(x, a, y, o)}`).join(' · ')}
                    {s.bant ? <span className="uza-liste-alt">{bicimli(b.arac.paket.metin.bantlar?.[s.bant], dil)}</span> : null}
                  </span>
                  {s.fark !== null && k.uzmanlikFark ? <span className="uza-rozet" data-fark={s.fark > 0 ? 'artti' : s.fark < 0 ? 'azaldi' : 'ayni'}>{yerine(k.uzmanlikFark, `${s.fark > 0 ? '+' : ''}${y.sayi(s.fark, Math.min(2, s.sayilar[0]?.ondalik ?? 0))}`)}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

/** The card: reads the kept results (shared request) and draws the role's sections. */
export function UzmanlikSonuclariKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const [kayitlar, setKayitlar] = useState<AracKaydi[] | null>(null)
  const { hesap, api } = u
  useEffect(() => {
    if (!hesap) return
    let iptal = false
    hastaKayitlariniOku(api, hastaId).then((l) => { if (!iptal) setKayitlar(l ?? []) }).catch(() => { if (!iptal) setKayitlar([]) })
    return () => { iptal = true }
  }, [hesap, api, hastaId])
  const icerik = arayuz().araclar
  if (!icerik || !hesap) return null
  return <UzmanlikSonuclariGorunumu a={araclarMetni(u.dil)} dil={u.dil} icerik={icerik} rol={hesap.rol} kayitlar={kayitlar} />
}
