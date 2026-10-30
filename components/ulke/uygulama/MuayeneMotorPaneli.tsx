'use client'

/**
 * AU gold depth — role visit engine panel on the .ulke Muayene setup screen.
 *
 * Reads `uygulama.muayeneMotorlari[rol]` from the active pack. Shared UI never hard-codes
 * Australian role copy; a pack without motors shows nothing.
 */
import React from 'react'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { YOL } from './Kabuk'

export type MuayeneMotorSatiri = {
  baslik: string
  kontrol: readonly string[]
  araclar: readonly string[]
}

export function MuayeneMotorPaneli({ rol }: { rol: string | null | undefined }) {
  if (!rol) return null
  const motorlar = ulkePaketi().uygulama?.muayeneMotorlari
  const motor = motorlar?.[rol] as MuayeneMotorSatiri | undefined
  if (!motor) return null
  return (
    <section className="uza-kart" data-alan="muayene-motor" data-rol={rol}>
      <h2 className="uza-h2">{motor.baslik}</h2>
      <p className="uza-aciklama" style={{ marginBottom: 10 }}>
        Visit prompts for this role. Write only what was said. Linked tools open on Araçlar — nothing is calculated here.
      </p>
      <ol className="uza-liste" data-alan="muayene-motor-kontrol" style={{ listStyle: 'decimal', paddingLeft: 20 }}>
        {motor.kontrol.map((satir, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            <span className="uza-liste-ad">{satir}</span>
          </li>
        ))}
      </ol>
      {motor.araclar.length ? (
        <p className="uza-ipucu" style={{ marginTop: 12 }}>
          Related tools:{' '}
          <a className="uza-baglanti" href={YOL.araclar} data-alan="muayene-motor-araclar">
            open Araçlar
          </a>
          {' '}({motor.araclar.length} for this role)
        </p>
      ) : null}
    </section>
  )
}
