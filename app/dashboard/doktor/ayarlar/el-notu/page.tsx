'use client'
/** ESNEK-MUAYENE-A — Ayarlar › Esnek muayene ve el notları (doctor's profile settings; changeable any time). */
import ElNotuAyarKarti from '@/components/elNotu/ElNotuAyarKarti'
import { TR_API, TR_METIN, trGetir } from '@/components/elNotu/trBaglam'
import { KBB_ANATOMI } from '@/core/elNotu/tohum/anatomiKbb'
import { CHROME_FONT } from '@/lib/doktor/chromeTheme'

const ANATOMI = KBB_ANATOMI.map((a) => ({ anahtar: a.anahtar, etiket: a.tr, taraf: a.taraf }))

export default function ElNotuAyarSayfasi() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: '0 0 14px', color: '#2e251d' }}>{TR_METIN.ayar.baslik}</h1>
      <ElNotuAyarKarti metin={TR_METIN} getir={trGetir} api={TR_API} anatomi={ANATOMI} />
    </div>
  )
}
