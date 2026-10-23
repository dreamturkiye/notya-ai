'use client'

/**
 * AU-CANLI-02 / AU-DEPTH-PARITY-03 — the ASSISTANT PAGE (/asistan) of a country that brings the live assistant.
 *
 * It is NOT a copy of Türkiye's page. It renders through the SAME two views Türkiye's page renders through
 * (components/asistan/AsistanSayfaGorunumu.tsx and YaziliSohbetGorunumu.tsx): layout, bubbles, microphone, status line,
 * written chat, colours and animation are those views', so the two pages cannot drift apart. What is the country's:
 *
 *   the words        the pack's language set (countries/_dil/<language>/uygulama.ts → asistanCanli.sayfa)
 *   the assistant    one colleague per role, named by the pack (the server answers with her name and gender)
 *   the session      ./canliOturum.ts — the country's two voices, its routes (/api/ulke/asistan-canli/*), no patient file
 *   the frame        the kit's own sidebar (Cerceve), as Türkiye's page sits in its doctor chrome
 *
 * FAIL CLOSED: until the server says yes (`hazir: true`) the page shows only the "not available" line — no microphone.
 * The pure view `AsistanGorunumu` renders in a plain test.
 */
import React from 'react'
import AsistanSayfaGorunumu from '@/components/asistan/AsistanSayfaGorunumu'
import YaziliSohbetGorunumu from '@/components/asistan/YaziliSohbetGorunumu'
import type { AsistanSayfaMetni, SesDurumu, YaziliSatir, YaziliSohbetMetni } from '@/components/asistan/asistanSayfaTipleri'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme'
import { rolAdi } from '@/lib/ulke/arayuz'
import type { SohbetBalon } from '@/lib/ulke/asistan/balonlar'
import { Cerceve, Yukleniyor, useUygulama, YOL } from './Kabuk'
import { useCanliOturum, type CanliDurumu, type Hazir, type Metin, type YaziliMesaj } from './canliOturum'

/** The colleague's colour: the application's own accent (Türkiye gives each colleague one; a country's pack has none). */
const RENK = '#0F9B8E'

const SES_DURUMU: Record<CanliDurumu, SesDurumu> = { bosta: 'idle', hata: 'error', baglaniyor: 'connecting', dinliyor: 'listening', konusuyor: 'speaking', sessiz: 'sessiz' }

const adla = (sablon: string, ad: string) => sablon.replace(/\{ad\}/g, ad)

/** The page's sentences in the pack's language. */
export function sayfaMetni(t: Metin): AsistanSayfaMetni {
  const s = t.sayfa
  return {
    durum: { idle: s.baslatIpucu, connecting: t.baglaniyor, listening: t.dinliyor, speaking: (etiket) => adla(s.konusuyorAd, etiket), error: s.durumHata, sessiz: s.durumSessiz },
    dokunBaslat: s.baslatIpucu,
    dokunBitir: s.bitirIpucu,
    geri: s.geri,
    bosIpucu: s.bos,
    // This assistant has no session clock, so the "time is running out" box is never drawn.
    sureUyari: '',
    sureUzat: '',
  }
}

/** The written chat's sentences in the pack's language. */
export function yaziliMetni(t: Metin): YaziliSohbetMetni {
  const s = t.sayfa
  return {
    ac: (ad) => adla(s.yaziAc, ad),
    baslik: s.yaziBaslik,
    kapat: s.yaziKapat,
    bos: (ad) => adla(s.yaziBos, ad),
    bekliyor: (ad) => adla(s.yaziBekliyor, ad),
    mikrofonAc: s.yaziMikrofonAc,
    mikrofonDurdur: s.yaziMikrofonDurdur,
    yerTutucu: s.yaziIpucu,
    yerTutucuDinliyor: s.yaziIpucuDinliyor,
    gonder: s.gonder,
  }
}

export interface AsistanGorunumuProps {
  t: Metin
  hazir: Hazir | null | undefined
  unvan: string
  durum: CanliDurumu
  balonlar: readonly SohbetBalon[]
  hata: string | null
  yazili: { acik: boolean; mesajlar: readonly YaziliMesaj[]; girdi: string; bekliyor: boolean; dinliyor: boolean }
  onYaziliAc: (acik: boolean) => void
  onGirdi: (g: string) => void
  onGonder: () => void
  onMikrofon?: () => void
  onBaslat: () => void
  onBitir: () => void
  onTemizle: () => void
  geriHref: string
  /** A test can start in the wide layout. */
  mobilBaslangic?: boolean
}

/** Pure view. */
export function AsistanGorunumu({ t, hazir, unvan, durum, balonlar, hata, yazili, onYaziliAc, onGirdi, onGonder, onMikrofon, onBaslat, onBitir, onTemizle, geriHref, mobilBaslangic }: AsistanGorunumuProps) {
  if (hazir === undefined) return <p className="uza-bos" role="status">{t.baglaniyor}</p>
  if (hazir === null) return <p className="uza-bos" role="status" data-alan="asistan-yok">{t.sayfa.yok}</p>

  const aktif = durum === 'baglaniyor' || durum === 'dinliyor' || durum === 'konusuyor'
  const satirlar: YaziliSatir[] = yazili.mesajlar.map((m) => ({ sira: m.sira, rol: m.rol, icerik: m.icerik }))
  return (
    <section className="uza-as-kok" data-alan="asistan-sayfa" data-durum={durum}>
      <AsistanSayfaGorunumu
        persona={{ ad: hazir.ad, etiket: hazir.ad, unvan, renk: RENK, kisaAd: hazir.kisaAd }}
        durum={SES_DURUMU[durum]}
        aktif={aktif}
        mesajlar={balonlar.map((b) => ({ id: b.id, role: b.role, text: b.text }))}
        hata={hata ?? ''}
        sureUzatmaGoster={false}
        metin={sayfaMetni(t)}
        onBasla={onBaslat}
        onBitir={onBitir}
        onSureUzat={() => {}}
        geri={(p) => <a href={geriHref} {...p}>‹</a>}
        ustSag={balonlar.length > 0 || yazili.mesajlar.length > 0
          ? <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" data-eylem="temizle" style={{ flexShrink: 0 }} onClick={onTemizle}>{t.sayfa.temizle}</button>
          : null}
        yanKolonBasHarf
        mikrofonAdi={aktif ? t.bitir : t.baslat}
        mobilBaslangic={mobilBaslangic}
        yazili={(
          <>
            <YaziliSohbetGorunumu
              ad={hazir.kisaAd}
              metin={yaziliMetni(t)}
              acik={yazili.acik}
              mesajlar={satirlar}
              girdi={yazili.girdi}
              bekliyor={yazili.bekliyor}
              dinliyor={yazili.dinliyor}
              onAc={onYaziliAc}
              onGirdi={onGirdi}
              onGonder={onGonder}
              onMikrofon={onMikrofon}
            />
            <p data-alan="asistan-canli-not" style={{ margin: '-14px auto 22px', maxWidth: 560, padding: '0 16px', fontSize: 11.5, lineHeight: 1.5, color: CHROME_RENK.muted, textAlign: 'center', userSelect: 'text' }}>{t.not} {t.sayfa.gecmisNotu}</p>
          </>
        )}
      />
    </section>
  )
}

export default function AsistanEkrani() {
  const u = useUygulama('asistan')
  const t = u.m.asistanCanli
  const o = useCanliOturum({ t, api: u.hesap ? u.api : undefined, dil: u.dil })
  if (!u.hesap) return <Yukleniyor m={u.m} dil={u.dil} />
  return (
    <Cerceve dil={u.dil} m={u.m} ad={u.hesap.ad} unvan={rolAdi(u.hesap.rol, u.dil) ?? undefined} aktif="asistan" cikis={u.cikis} kompakt>
      {t ? (
        <AsistanGorunumu t={t} hazir={o.hazir} unvan={rolAdi(u.hesap.rol, u.dil) ?? ''} durum={o.durum} balonlar={o.balonlar} hata={o.hata}
          yazili={o.yazili} onYaziliAc={o.setYaziliAcik} onGirdi={o.setYaziliGirdi} onGonder={() => { void o.yaziliGonder() }} onMikrofon={o.yaziliMikrofon}
          onBaslat={() => { void o.baslat() }} onBitir={() => { void o.bitir() }} onTemizle={o.temizle} geriHref={YOL.bugun} />
      ) : <p className="uza-bos" role="status">{u.m.kabuk.yukleniyor}</p>}
    </Cerceve>
  )
}
