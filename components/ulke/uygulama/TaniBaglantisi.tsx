'use client'

/** AU-QUICK-01 — the Tools-page entry to the diagnosis-codes screen; drawn only while the server has code data. The word is the pack's. */
import React from 'react'
import { useTaniHazir } from './taniHazir'
import { YOL } from './Kabuk'
import { ulkePaketi } from '@/lib/ulke/ulke'

export function TaniBaglantisi() {
  const hazir = useTaniHazir()
  const t = ulkePaketi().uzanti?.taniKodlari
  if (!hazir || !t) return null
  return <p className="uza-ipucu" data-alan="arac-tani"><a className="uza-baglanti" href={YOL.taniKodlari} style={{ display: 'inline-block', minHeight: 44, lineHeight: '44px' }}>{t.metin.baslik} {'›'}</a></p>
}
