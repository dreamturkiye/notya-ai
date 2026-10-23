'use client'

/**
 * Türkiye's wiring of the shared assistant page (AU-DEPTH-PARITY-03). The page (app/asistan/page.tsx) and the written chat
 * (YaziliSohbet.tsx) keep their session in AsistanOturumContext; this file turns that session into the props of the two
 * shared views (AsistanSayfaGorunumu, YaziliSohbetGorunumu) and holds TÜRKİYE'S WORDS. A country's page does the same with
 * its own session and its own language set — the look is the views', so it is the same.
 *
 * Pure with respect to the session: both components take it as a prop, so a plain test renders them (the markup is pinned
 * by lib/asistan/asistanSayfa.test.ts). Only types are taken from the context module here — it is not loaded.
 */
import React from 'react'
import Link from 'next/link'
import { PERSONAS, PERSONA_ORDER, type Persona } from '@/lib/asistan/personaEngine'
import { SPECIALTY_MAP } from '@/lib/doktor/specialties'
import { formatColleagueTabLabel, formatColleagueDisplayName } from '@/lib/colleagueAddress'
import { EylemKarti, EylemToplu } from '@/components/core/EylemKarti'
import AsistanSayfaGorunumu from '@/components/asistan/AsistanSayfaGorunumu'
import YaziliSohbetGorunumu from '@/components/asistan/YaziliSohbetGorunumu'
import type { AsistanSayfaMetni, PersonaSecenegi, SayfaPersona, YaziliSatir, YaziliSohbetMetni } from '@/components/asistan/asistanSayfaTipleri'
import type { AsistanOturumDegeri } from '@/components/asistan/AsistanOturumContext'

export const TR_SAYFA_METNI: AsistanSayfaMetni = {
  durum: {
    idle: 'Konuşmayı başlatmak için dokunun',
    connecting: 'Bağlanıyor...',
    listening: 'Dinliyor — konuşabilirsiniz',
    speaking: (etiket) => `${etiket} konuşuyor...`,
    error: 'Tekrar deneyin',
    sessiz: 'Sessizde — yazılı sohbet açık. Devam için mikrofona dokunun',
  },
  dokunBaslat: 'Konuşmayı başlatmak için dokunun',
  dokunBitir: 'Bitirmek için dokunun',
  geri: 'Ana sayfaya dön',
  bosIpucu: '1:1 sesli görüşme — doğal konuşun',
  sureUyari: 'Süre 5 dakika içinde dolacak',
  sureUzat: '+30 dakika uzat',
}

export const TR_YAZILI_METNI: YaziliSohbetMetni = {
  ac: (ad) => `💬 Yazılı sohbet — sesli sorun, ${ad} yazsın`,
  acEk: '(hasta dosyası bilinciyle)',
  baslik: '💬 Yazılı sohbet',
  aktifHasta: 'aktif hasta',
  kapat: 'Kapat ✕',
  bos: (ad) => `Hastanın adını söylemeniz yeterli: “Mehmet Yılmaz kaç kez geldi?”, “son hastamın ilaçları neydi?” — ${ad} dosyadan cevaplar, ilaç etkileşimlerinde kendiliğinden uyarır.`,
  bekliyor: (ad) => `${ad} dosyaya bakıyor…`,
  mikrofonAc: 'Sesle sorun',
  mikrofonDurdur: 'Dinlemeyi durdur',
  yerTutucu: 'Sorunuzu yazın ya da 🎤 ile söyleyin',
  yerTutucuDinliyor: 'Dinliyorum…',
  gonder: 'Sor',
}

/** A Turkish persona as the page view draws her. */
export function trPersonaGorunumu(p: Persona): SayfaPersona {
  return { ad: p.name, etiket: formatColleagueTabLabel(p.name), unvan: p.title, renk: p.color, foto: p.photo, kisaAd: p.shortName }
}

function trPersonaSecenekleri(aktifKey: string): PersonaSecenegi[] {
  const cikti: PersonaSecenegi[] = []
  for (const key of PERSONA_ORDER) {
    const p = PERSONAS[key]
    if (!p) continue
    const branş = SPECIALTY_MAP[p.primarySpecialty]?.label || p.primarySpecialty
    cikti.push({ key, etiket: `${formatColleagueDisplayName(p.name)} · ${branş}`, baslik: `${p.name} — ${branş}`, renk: p.color, aktif: aktifKey === key })
  }
  return cikti
}

type Oturum = Pick<AsistanOturumDegeri, 'persona' | 'personaKey' | 'status' | 'isActive' | 'messages' | 'errorMsg' | 'sureUzatmaGoster' | 'sesKarti' | 'startConversation' | 'stopConversation' | 'switchPersona' | 'sureUzat' | 'sesKartiniKapat' | 'yazili' | 'setYaziliAcik' | 'setYaziliGirdi' | 'yaziliGonder' | 'yaziliMikrofon'>

/** The written chat under the page — Türkiye's words, the patient-action cards and the link under an answer. */
export function YaziliSohbetTR({ o }: { o: Oturum }) {
  const { acik, mesajlar, girdi, bekliyor, dinliyor, aktifHasta } = o.yazili
  const satirlar: YaziliSatir[] = mesajlar.map((m) => ({
    sira: m.sira,
    rol: m.rol,
    icerik: m.icerik,
    ek: (
      <>
        {m.oneriler?.length && m.hasta ? (
          m.oneriler.length > 1 ? <EylemToplu oneriler={m.oneriler} hasta={m.hasta} /> : <EylemKarti oneri={m.oneriler[0]} hasta={m.hasta} />
        ) : null}
        {m.yonlendirme?.yol && m.yonlendirme.etiket ? (
          <div style={{ marginTop: 6 }}>
            {/* NOTYA-ASISTAN-YUZEN-01: next/link — tam sayfa yüklemesi sohbeti öldürürdü. */}
            <Link href={m.yonlendirme.yol} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: '#0F9B8E', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
              {m.yonlendirme.etiket} ›
            </Link>
          </div>
        ) : null}
      </>
    ),
  }))
  return (
    <YaziliSohbetGorunumu
      ad={o.persona.shortName}
      metin={TR_YAZILI_METNI}
      acik={acik}
      mesajlar={satirlar}
      girdi={girdi}
      bekliyor={bekliyor}
      dinliyor={dinliyor}
      aktifHasta={aktifHasta}
      onAc={o.setYaziliAcik}
      onGirdi={(g) => o.setYaziliGirdi(g)}
      onGonder={() => { void o.yaziliGonder() }}
      onMikrofon={o.yaziliMikrofon}
    />
  )
}

/** Türkiye's assistant page, for a session. */
export function AsistanSayfaTR({ o, mobilBaslangic }: { o: Oturum; mobilBaslangic?: boolean }) {
  return (
    <AsistanSayfaGorunumu
      persona={trPersonaGorunumu(o.persona)}
      personalar={trPersonaSecenekleri(o.personaKey)}
      onPersona={(key) => o.switchPersona(key)}
      durum={o.status}
      aktif={o.isActive}
      mesajlar={o.messages}
      hata={o.errorMsg}
      sureUzatmaGoster={o.sureUzatmaGoster}
      metin={TR_SAYFA_METNI}
      onBasla={() => { void o.startConversation() }}
      onBitir={() => { void o.stopConversation() }}
      onSureUzat={() => o.sureUzat(30)}
      kart={o.sesKarti ? <EylemKarti oneri={o.sesKarti.oneri} hasta={o.sesKarti.hasta} onSonuc={o.sesKartiniKapat} /> : null}
      geri={(p) => <Link href="/dashboard/doktor" {...p}>‹</Link>}
      yazili={<YaziliSohbetTR o={o} />}
      mobilBaslangic={mobilBaslangic}
    />
  )
}
