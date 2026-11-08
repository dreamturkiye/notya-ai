'use client'

/**
 * ULKE-BRANS-DERINLIK-09 (Kaan, 2026-11-08) — THE DOCTOR'S PREVIEW OF THE PATIENT PAGE, with example data
 * (lib/ulke/portal/demo.ts). The patient page's own view (components/ulke/portal) inside its own frame: the same look the
 * patient gets (one look), for the doctor's role and in the doctor's form. Read-only: every control of the page is inert,
 * nothing is read from the server, nothing is stored or sent. Loaded with next/dynamic only when the doctor opens it.
 */
import React from 'react'
import { portalMetni, randevuMetni, rolAdi } from '@/lib/ulke/arayuz'
import { portalDemoIcerigi, portalDemoMetni } from '@/lib/ulke/portal/demo'
import { ozellikAcik } from '@/lib/ulke/ulke'
import type { DilKodu } from '@/lib/ulke/tipler'
import { PortalSayfaGorunumu, portalAcilNumarasi } from '../portal/PortalSayfasi'

const bos = () => { /* the preview changes nothing */ }

export function PortalOnizleme({ dil, rol, hekimAdi, bugun, kapat }: { dil: DilKodu; rol: string | null; hekimAdi: string; bugun: string; kapat: () => void }) {
  const m = portalDemoMetni(dil)
  const icerik = portalDemoIcerigi({ rol, dil, hekimAdi, rolAdi: (rol ? rolAdi(rol, dil) : null) ?? '', bugun })
  if (!m || !icerik) return null
  return (
    <section className="uza-kart" data-alan="portal-onizleme" data-ornek="evet" aria-label={m.onizle}>
      <div className="uza-baslik-satiri">
        <p className="uza-ipucu" style={{ margin: 0 }}>{m.uyari}</p>
        <button type="button" className="uza-dugme uza-dugme-cizgi uza-dugme-kucuk" onClick={kapat} data-eylem="onizleme-kapat">{m.kapat}</button>
      </div>
      <div style={{ border: '1px solid var(--uza-cizgi)', borderRadius: 12, padding: 12, marginTop: 10 }} ref={(el) => { el?.setAttribute('inert', '') }}>
        <PortalSayfaGorunumu p={portalMetni(dil)} r={ozellikAcik('randevu') ? randevuMetni(dil) : null} icerik={icerik} acilNumara={portalAcilNumarasi()}
          form={{ gunler: [], neden: '' }} setForm={bos} istekGonder={(e) => e.preventDefault()} istekBekliyor={false} istekHatasi={null} cikis={bos} />
      </div>
    </section>
  )
}
