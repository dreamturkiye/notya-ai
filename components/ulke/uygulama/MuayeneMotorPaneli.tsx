'use client'

/**
 * AU gold depth — role visit engine panel on the .ulke Muayene setup screen.
 *
 * Reads `uygulama.muayeneMotorlari[rol]` from the active pack. Shared UI never hard-codes
 * Australian role copy; a pack without motors shows nothing.
 *
 * AU-GOLD-DEPTH-02: each listed Araçlar key deep-links with `aracYolu` (patient-scoped when
 * `hastaId` is known) so the visit screen is a studio launcher, not a dead checklist.
 */
import React from 'react'
import { arayuz } from '@/lib/ulke/arayuz'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { aracYolu, paketAraci } from './aracOrtak'
import { YOL } from './Kabuk'

export type MuayeneMotorSatiri = {
  baslik: string
  kontrol: readonly string[]
  araclar: readonly string[]
}

export function MuayeneMotorPaneli({
  rol,
  hastaId,
}: {
  rol: string | null | undefined
  /** When set, tool chips open on this patient's file context. */
  hastaId?: string | null
}) {
  if (!rol) return null
  const motorlar = ulkePaketi().uygulama?.muayeneMotorlari
  const motor = motorlar?.[rol] as MuayeneMotorSatiri | undefined
  if (!motor) return null
  const icerik = arayuz().araclar
  return (
    <section className="uza-kart" data-alan="muayene-motor" data-rol={rol}>
      <h2 className="uza-h2">{motor.baslik}</h2>
      <p className="uza-aciklama" style={{ marginBottom: 10 }}>
        Visit prompts for this role. Write only what was said. Open a linked tool to keep a structured note — nothing is calculated on this panel.
      </p>
      <ol className="uza-liste" data-alan="muayene-motor-kontrol" style={{ listStyle: 'decimal', paddingLeft: 20 }}>
        {motor.kontrol.map((satir, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            <span className="uza-liste-ad">{satir}</span>
          </li>
        ))}
      </ol>
      {motor.araclar.length ? (
        <div data-alan="muayene-motor-araclar" style={{ marginTop: 14 }}>
          <p className="uza-alt-baslik" style={{ marginBottom: 8 }}>
            Open mid-visit
          </p>
          <ul
            className="uza-liste"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}
          >
            {motor.araclar.map((anahtar) => {
              const arac = icerik ? paketAraci(icerik, anahtar) : null
              const ad = arac?.ad ?? anahtar
              return (
                <li key={anahtar}>
                  <a
                    className="uza-baglanti"
                    href={aracYolu(anahtar, hastaId)}
                    data-arac={anahtar}
                    style={{
                      display: 'inline-block',
                      padding: '6px 10px',
                      border: '1px solid var(--uza-cizgi, rgba(0,0,0,0.12))',
                      borderRadius: 8,
                      textDecoration: 'none',
                    }}
                  >
                    {ad}
                  </a>
                </li>
              )
            })}
          </ul>
          <p className="uza-ipucu" style={{ marginTop: 10 }}>
            <a className="uza-baglanti" href={hastaId ? `${YOL.araclar}?hasta=${encodeURIComponent(hastaId)}` : YOL.araclar}>
              All Araçlar
            </a>
            {' '}({motor.araclar.length} linked here)
          </p>
        </div>
      ) : null}
    </section>
  )
}
