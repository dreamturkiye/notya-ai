'use client'

/**
 * AU-ARAC-GORUNUM-01 — THE MILESTONE CALENDAR. A patient's file shows ONE tool as an ordered calendar of its own
 * milestones, done/not-done with the date given, instead of in the generic flat list every other kept result still
 * gets (./AracKayitlari.tsx). Which tool, IF ANY, is named by the active pack (`UlkeAraclari.takvimliListeAraci`) —
 * never a literal key here (wall rule D7: this is a KIT file and may name no country's own key). The milestones
 * themselves, their labels and their vaccine content are entirely the pack's own text, read the same way the flat
 * list already reads every other tool's summary (`paketAraci` → the pack's `metin.alanlar`).
 *
 * Reuses the SAME kept-result mechanism as every other tool (lib/ulke/araclar/kayitTipleri.ts, ARAC_KAYDI_API):
 * nothing new is stored, nothing new is computed server-side. This is a presentation-only, additive view: the flat
 * list (./AracKayitlari.tsx → HastaAracKayitlariGorunumu) is untouched and still shows every kept result of every
 * tool, this one included — a doctor who wants the raw submissions still has them.
 */
import React, { useCallback, useEffect, useState } from 'react'
import { Bilgi, tarihYaz, type Uygulama } from './Kabuk'
import { paketAraci } from './aracOrtak'
import { arayuz, araclarMetni, type AraclarMetni } from '@/lib/ulke/arayuz'
import { bicimli } from '@/lib/ulke/araclar/paket'
import { maddeAnahtarlari, maddeTakvimiBosMu, maddeTakvimiDurumu, type MaddeDurumu } from '@/lib/ulke/araclar/maddeTakvimi'
import { ARAC_KAYDI_API, type AracKaydi } from '@/lib/ulke/araclar/kayitTipleri'
import type { UlkeAraclari } from '@/lib/ulke/araclar/tipler'
import type { DilKodu } from '@/lib/ulke/tipler'

/** Pure: the calendar for one patient, given every kept result of theirs. null = this pack names no calendar tool. */
export function TakvimliListeGorunumu({ a, dil, icerik, kayitlar }: { a: AraclarMetni; dil: DilKodu; icerik: UlkeAraclari; kayitlar: readonly AracKaydi[] | null }) {
  const anahtar = icerik.takvimliListeAraci
  const t = a.aracTakvimi
  if (!anahtar || !t) return null
  const x = paketAraci(icerik, anahtar)
  if (!x) return null
  const maddeler = maddeAnahtarlari(x.tanim)
  if (!maddeler.length) return null
  const kendiKayitlari = (kayitlar ?? []).filter((k) => k.arac === anahtar)
  const durum = maddeTakvimiDurumu(kendiKayitlari, maddeler)
  return (
    <section className="uza-kart" data-alan="arac-takvimi" data-arac={anahtar}>
      <h2 className="uza-h2">{bicimli(x.paket.metin.ad, dil)}</h2>
      <p className="uza-aciklama">{bicimli(x.paket.metin.aciklama, dil)}</p>
      {!kayitlar ? <p className="uza-bos" role="status">{t.okunamadi}</p> : (
        <ol className="uza-liste" data-gorunum="takvim">
          {maddeler.map((m, i) => {
            const d: MaddeDurumu = durum[m] ?? { tamam: false, tarih: null }
            const etiket = bicimli(x.paket.metin.alanlar[m], dil)
            return (
              <li key={m} data-madde={m} data-tamam={d.tamam ? 'evet' : 'hayir'}>
                <span className="uza-rozet" data-takvim-nokta={d.tamam ? 'tamam' : 'bekliyor'} aria-hidden="true">{i + 1}</span>
                <span className="uza-liste-ad">
                  {etiket}
                  <span className="uza-liste-alt" data-durum={d.tamam ? (d.tarih ? 'tarihli' : 'tarihsiz') : 'beklemede'}>
                    {d.tamam ? (d.tarih ? t.tarihli.replace('%', tarihYaz(d.tarih)) : t.tarihsiz) : t.beklemede}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
      {kayitlar && maddeTakvimiBosMu(durum) ? <Bilgi>{t.beklemede}</Bilgi> : null}
    </section>
  )
}

/** The card on the patient's file: reads the patient's kept results of every tool and shows the calendar of the one the pack names. null = this pack names no calendar tool: nothing is mounted, nothing is fetched. */
export function TakvimliListeKarti({ u, hastaId }: { u: Uygulama; hastaId: string }) {
  const [kayitlar, setKayitlar] = useState<AracKaydi[] | null>(null)
  const { hesap, api, dil } = u
  const icerik = arayuz().araclar
  const yukle = useCallback(() => {
    api(`${ARAC_KAYDI_API}?hasta=${encodeURIComponent(hastaId)}`).then((r) => { if (r.ok && Array.isArray(r.j.kayitlar)) setKayitlar(r.j.kayitlar) }).catch(() => { /* the card below says so */ })
  }, [api, hastaId])
  useEffect(() => { if (hesap && icerik?.takvimliListeAraci) yukle() }, [hesap, icerik?.takvimliListeAraci, yukle])
  if (!icerik || !icerik.takvimliListeAraci) return null
  return <TakvimliListeGorunumu a={araclarMetni(dil)} dil={dil} icerik={icerik} kayitlar={kayitlar} />
}
