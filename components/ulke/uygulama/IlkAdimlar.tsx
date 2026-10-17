'use client'

/**
 * YENI-DOKTOR-UX-2026-10 — the first-run checklist on the home of a NEW account: specialty, first patient, first
 * appointment (where the country has appointments), first visit. Each row is a link to the right screen and keeps
 * a tick once done. The card hides itself when every step is done, when the account stops being new (3 visits),
 * and when the doctor dismisses it (per device). Every sentence is the pack's own (`m.ilkAdimlar`); a pack that
 * has not filled the section shows no card. Data comes in one request (/api/ulke/ilk-adimlar) and only as
 * booleans; a failed request shows nothing — the card never blocks the home.
 */

import React, { useEffect, useState } from 'react'
import type { Api } from './Kabuk'
import { YOL } from './Kabuk'
import { takvimYolu } from './randevuOrtak'
import { ozellikAcik } from '@/lib/ulke/ulke'
import { roller, type UygulamaMetni } from '@/lib/ulke/arayuz'

export const ILK_ADIM_GIZLE_ANAHTAR = 'notya_ilk_adimlar_gizli'

type Durum = { hasta: boolean; muayene: boolean; randevu: boolean | null; yeniHesap: boolean }

export function IlkAdimlarKarti({ m, api, rolTamam }: { m: UygulamaMetni; api: Api; rolTamam: boolean }) {
  const sozler = m.ilkAdimlar
  const [durum, setDurum] = useState<Durum | null>(null)
  const [gizlendi, setGizlendi] = useState(true) // hidden on the first paint — no hydration mismatch

  useEffect(() => {
    try {
      setGizlendi(window.localStorage.getItem(ILK_ADIM_GIZLE_ANAHTAR) === '1')
    } catch {
      setGizlendi(false)
    }
  }, [])

  useEffect(() => {
    if (!sozler) return
    let iptal = false
    api('/api/ulke/ilk-adimlar')
      .then((r) => {
        if (iptal || !r.ok) return
        const j = r.j as Partial<Durum>
        setDurum({
          hasta: j.hasta === true,
          muayene: j.muayene === true,
          randevu: typeof j.randevu === 'boolean' ? j.randevu : null,
          yeniHesap: j.yeniHesap === true,
        })
      })
      .catch(() => {
        /* the card stays away */
      })
    return () => {
      iptal = true
    }
  }, [api, sozler])

  if (!sozler || !durum || !durum.yeniHesap || gizlendi) return null

  // The specialty step exists only where the pack asks the question at all.
  const satirlar: { anahtar: 'rol' | 'hasta' | 'randevu' | 'muayene'; tamam: boolean; href: string }[] = [
    ...(roller().length ? [{ anahtar: 'rol' as const, tamam: rolTamam, href: YOL.ayarlar }] : []),
    { anahtar: 'hasta', tamam: durum.hasta, href: YOL.yeniHasta },
    ...(ozellikAcik('randevu') && durum.randevu !== null ? [{ anahtar: 'randevu' as const, tamam: durum.randevu, href: takvimYolu({ yeni: '1' }) }] : []),
    { anahtar: 'muayene', tamam: durum.muayene, href: YOL.hastalar },
  ]
  if (satirlar.every((s) => s.tamam)) return null
  const tamamSayisi = satirlar.filter((s) => s.tamam).length
  const oran = sozler.tamamOrani.replace('%1', String(tamamSayisi)).replace('%2', String(satirlar.length))

  function gizle() {
    setGizlendi(true)
    try {
      window.localStorage.setItem(ILK_ADIM_GIZLE_ANAHTAR, '1')
    } catch {
      /* state carries the session */
    }
  }

  return (
    <div
      data-alan="ilk-adimlar"
      style={{
        background: 'var(--uza-kagit)',
        border: '1px solid var(--uza-cizgi)',
        borderRadius: 20,
        boxShadow: '0 16px 34px rgba(58,44,34,0.06)',
        padding: '18px 20px 10px',
        fontFamily: 'var(--uza-sans)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ fontFamily: 'var(--uza-serif)', fontSize: 19, fontWeight: 600, color: 'var(--uza-murekkep)', flex: 1, minWidth: 180 }}>{sozler.baslik}</div>
        <span style={{ fontSize: 12.5, color: 'var(--uza-soluk)', fontVariantNumeric: 'tabular-nums' }}>{oran}</span>
        <button type="button" data-eylem="ilk-adimlar-gizle" onClick={gizle} style={{ border: 'none', background: 'transparent', color: 'var(--uza-soluk)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', minHeight: 40, padding: '0 6px', fontFamily: 'var(--uza-sans)' }}>
          {sozler.gizle}
        </button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--uza-soluk)', marginBottom: 8 }}>{sozler.aciklama}</div>
      <div>
        {satirlar.map((s, i) => {
          const soz = sozler.adimlar[s.anahtar]
          return (
            <a
              key={s.anahtar}
              href={s.href}
              data-adim={s.anahtar}
              data-tamam={s.tamam ? 'evet' : 'hayir'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 48,
                padding: '8px 6px',
                borderBottom: i < satirlar.length - 1 ? '1px solid var(--uza-cizgi)' : 'none',
                textDecoration: 'none',
                fontFamily: 'var(--uza-sans)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  background: s.tamam ? '#E4F3F1' : '#FFFFFF',
                  border: s.tamam ? '1.5px solid var(--uza-cam)' : '1.5px solid var(--uza-cizgi)',
                  color: s.tamam ? 'var(--uza-cam)' : 'var(--uza-soluk)',
                }}
              >
                {s.tamam ? '✓' : ''}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 650, color: s.tamam ? 'var(--uza-soluk)' : 'var(--uza-murekkep)', textDecoration: s.tamam ? 'line-through' : 'none' }}>{soz.etiket}</span>
                {!s.tamam && <span style={{ display: 'block', fontSize: 12, color: 'var(--uza-soluk)', marginTop: 1 }}>{soz.aciklama}</span>}
              </span>
              {!s.tamam && <span style={{ color: 'var(--uza-cam)', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{'›'}</span>}
            </a>
          )
        })}
      </div>
    </div>
  )
}
