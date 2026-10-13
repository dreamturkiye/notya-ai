/**
 * Public catalogue of the medical tools and the empty slots a country has already written.
 * No new clinical rule is added here: every sentence is the pack's, plus the beta line.
 * A slot stays a slot. Its existing note of what is missing is shown, and the tool is not switched on.
 */
import React from 'react'
import { notFound } from 'next/navigation'
import { ULKE_STIL as S, UlkeKart } from '@/components/ulke/UlkeKart'
import { betaNotu } from '@/lib/ulke/acikIcerik'
import { arayuz, araclarMetni } from '@/lib/ulke/arayuz'
import { alanEtiketi, bicimli, paketinAraci } from '@/lib/ulke/araclar/paket'
import type { AracYuvasi, PaketAraci } from '@/lib/ulke/araclar/tipler'
import type { AramaParametreleri } from '@/lib/ulke/sayfaDili'
import { ulkePaketi, uygulamaDiliSec, uygulamaDilleri } from '@/lib/ulke/ulke'
import { ulkeYolu } from '@/lib/ulke/yol'
import { AKTIF_YASAL } from '@/countries/active/yasal'
import { YASAL_EPOSTA } from '@/lib/ulke/yasal/eposta'
import { YASAL_YOLLAR, type YasalAnahtar } from '@/lib/ulke/yasal/tipler'
import type { DilKodu } from '@/lib/ulke/tipler'

function adres(yol: string, dil: DilKodu, ekstra?: Record<string, string>): string {
  const p = new URLSearchParams(ekstra)
  if (dil !== ulkePaketi().varsayilanDil) p.set('dil', dil)
  const q = p.toString()
  return ulkeYolu(q ? `${yol}?${q}` : yol)
}

function dilPaketi(dil: DilKodu) {
  const k = AKTIF_YASAL
  if (!k?.diller.length) return null
  return k.diller.find((d) => d.kod === dil) ?? k.diller.find((d) => d.kod === ulkePaketi().varsayilanDil) ?? k.diller[0]
}

function AracGovdesi({ p, dil }: { p: PaketAraci; dil: DilKodu }) {
  const icerik = arayuz().araclar
  const x = icerik ? paketinAraci(icerik, p.anahtar) : null
  const m = araclarMetni(dil)
  const metin = p.metin
  const lisans = p.lisans
  return (
    <article id={p.anahtar} data-arac={p.anahtar}>
      <h2 style={{ margin: '28px 0 8px', fontSize: 20 }}>{bicimli(metin.ad, dil)}</h2>
      <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.6 }}>{bicimli(metin.aciklama, dil)}</p>
      {bicimli(metin.not, dil) ? <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.6 }}>{bicimli(metin.not, dil)}</p> : null}
      {bicimli(metin.hastaKapisi, dil) ? <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.6 }}>{bicimli(metin.hastaKapisi, dil)}</p> : null}
      {x ? (
        <ul style={{ margin: '0 0 12px', paddingLeft: 18 }}>
          {x.tanim.alanlar.map((alan) => {
            const etiket = alanEtiketi(x, alan.anahtar, dil, m)
            if (!etiket) return null
            const secenekler = alan.tur === 'secim'
              ? (alan.secenekler ?? []).map((k) => bicimli(metin.secenekler?.[alan.anahtar]?.[k], dil)).filter(Boolean)
              : []
            const aralik = alan.tur === 'puan' && alan.enAz != null && alan.enCok != null ? `${alan.enAz}–${alan.enCok}` : ''
            return (
              <li key={alan.anahtar} style={{ margin: '0 0 8px', fontSize: 15, lineHeight: 1.5 }}>
                {etiket}{aralik ? ` (${aralik})` : ''}
                {secenekler.length ? `: ${secenekler.join(', ')}` : ''}
              </li>
            )
          })}
        </ul>
      ) : null}
      {Object.entries(metin.bantlar ?? {}).map(([k, v]) => {
        const s = bicimli(v, dil)
        return s ? <p key={k} style={{ margin: '0 0 8px', fontSize: 15, lineHeight: 1.5 }}>{s}</p> : null
      })}
      {Object.entries(metin.uyarilar ?? {}).map(([k, v]) => {
        const s = bicimli(v, dil)
        return s ? <p key={k} style={{ margin: '0 0 8px', fontSize: 15, lineHeight: 1.5 }}>{s}</p> : null
      })}
      {x?.tanim.kaynak ? <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5 }}>{x.tanim.kaynak}</p> : null}
      {lisans?.hakSahibi ? <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.5 }}>{lisans.hakSahibi}</p> : null}
      {lisans?.kaynak ? <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.5 }}>{lisans.kaynak}</p> : null}
      {bicimli(lisans?.bildirim, dil) ? <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5 }}>{bicimli(lisans?.bildirim, dil)}</p> : null}
      {p.baglanti ? <p style={{ margin: '0 0 12px' }}><a href={p.baglanti.adres} style={S.baglanti}>{bicimli(metin.baglanti, dil) || p.baglanti.adres}</a></p> : null}
    </article>
  )
}

function YuvaGovdesi({ y }: { y: AracYuvasi }) {
  return (
    <article id={y.anahtar} data-yuva={y.anahtar}>
      <h2 style={{ margin: '28px 0 8px', fontSize: 20 }}>{y.anahtar}</h2>
      <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.6 }}>{y.eksik}</p>
      <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5 }}>{y.kimden}</p>
      {y.lisans?.hakSahibi ? <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.5 }}>{y.lisans.hakSahibi}</p> : null}
      {y.lisans?.kaynak ? <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.5 }}>{y.lisans.kaynak}</p> : null}
    </article>
  )
}

/** A language the signed-in application already has tool text for. The public catalogue uses that text. */
export function tibbiDili(searchParams?: AramaParametreleri): DilKodu {
  const ham = searchParams?.dil
  const istenen = uygulamaDiliSec(Array.isArray(ham) ? ham[0] : ham)
  return arayuz().araclar?.metinler[istenen] ? istenen : ulkePaketi().varsayilanDil
}

export function TibbiSayfa({ searchParams }: { searchParams?: AramaParametreleri }) {
  const icerik = arayuz().araclar
  if (!icerik) notFound()
  const dil = tibbiDili(searchParams)
  const ham = searchParams?.arac
  const anahtar = (Array.isArray(ham) ? ham[0] : ham)?.trim() || ''
  const arac = anahtar ? icerik.araclar.find((p) => p.anahtar === anahtar) : undefined
  const yuva = anahtar && !arac ? icerik.yuvalar.find((y) => y.anahtar === anahtar) : undefined
  if (anahtar && !arac && !yuva) notFound()
  const m = araclarMetni(dil)
  const yasal = dilPaketi(dil)
  const diller = uygulamaDilleri().flatMap((kod) => {
    if (!icerik.metinler[kod]) return []
    const ad = ulkePaketi().dilAdlari[kod]
    return ad ? [{ kod, ad, href: adres('/medical', kod, anahtar ? { arac: anahtar } : undefined) }] : []
  })
  return (
    <UlkeKart dil={dil} genislik={820} anaSayfa={yasal ? { href: adres('/', dil), ad: yasal.geri } : undefined} diller={diller}>
      <p style={S.bilgi} data-beta="evet">{betaNotu(dil)}</p>
      <h1 style={{ margin: '16px 0 12px', fontSize: 28, lineHeight: 1.25 }}>{m.kabuk.araclar}</h1>
      {yasal ? (
        <nav style={{ ...S.alt, textAlign: 'left' }} aria-label={yasal.belgeler[0]?.baslik}>
          {yasal.belgeler.map((b) => (
            <a key={b.anahtar} href={adres(YASAL_YOLLAR[b.anahtar as YasalAnahtar], dil)} style={{ ...S.baglanti, display: 'inline-block', marginRight: 16 }}>{b.baslik}</a>
          ))}
        </nav>
      ) : null}
      <p style={{ margin: '12px 0' }}>
        {Object.values(YASAL_EPOSTA).map((adresEposta) => (
          <a key={adresEposta} href={`mailto:${adresEposta}`} style={{ ...S.baglanti, display: 'inline-block', marginRight: 16 }}>{adresEposta}</a>
        ))}
      </p>
      {arac ? <AracGovdesi p={arac} dil={dil} /> : null}
      {yuva ? <YuvaGovdesi y={yuva} /> : null}
      {anahtar ? <p style={{ marginTop: 20 }}><a href={adres('/medical', dil)} style={S.baglanti}>{m.arac.geri}</a></p> : (
        <>
          <ul style={{ margin: '8px 0 24px', paddingLeft: 18 }}>
            {icerik.araclar.map((p) => (
              <li key={p.anahtar} style={{ margin: '0 0 10px' }}>
                <a href={adres('/medical', dil, { arac: p.anahtar })} style={S.baglanti}>{bicimli(p.metin.ad, dil)}</a>
                <span style={{ display: 'block', fontSize: 14, lineHeight: 1.5 }}>{bicimli(p.metin.aciklama, dil)}</span>
              </li>
            ))}
          </ul>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {icerik.yuvalar.map((y) => (
              <li key={y.anahtar} style={{ margin: '0 0 10px' }}>
                <a href={adres('/medical', dil, { arac: y.anahtar })} style={S.baglanti}>{y.eksik}</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </UlkeKart>
  )
}
