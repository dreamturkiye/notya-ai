'use client'

/** AU-QUICK-02 — the Tools-page entry to the procedure-codes screen; drawn only while the server has code data. The word is the pack's. */
import React from 'react'
import { useIslemHazir } from './islemHazir'
import { YOL } from './Kabuk'
import { ulkePaketi } from '@/lib/ulke/ulke'

export function IslemBaglantisi() {
  const hazir = useIslemHazir()
  const t = ulkePaketi().uzanti?.islemKodlari
  if (!hazir || !t) return null
  return <p className="uza-ipucu" data-alan="arac-islem"><a className="uza-baglanti" href={YOL.islemKodlari} style={{ display: 'inline-block', minHeight: 44, lineHeight: '44px' }}>{t.metin.baslik} {'›'}</a></p>
}
