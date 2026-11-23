'use client'
/**
 * ESNEK-MUAYENE-A/B — Ayarlar › Esnek muayene ve el notları (doctor's profile settings; changeable any time).
 * Phase B: "Notya sizi böyle tanıyor" on top — the learned profile, each line correctable / reversible with one tap.
 */
import ElNotuAyarKarti from '@/components/elNotu/ElNotuAyarKarti'
import TanimaKarti from '@/components/esnek/TanimaKarti'
import { ESNEK_API, ESNEK_TR, GOLGE_API } from '@/components/esnek/trEsnek'
import { TR_API, TR_METIN, trGetir } from '@/components/elNotu/trBaglam'
import { KBB_ANATOMI } from '@/core/elNotu/tohum/anatomiKbb'
import { CHROME_FONT } from '@/lib/doktor/chromeTheme'

const ANATOMI = KBB_ANATOMI.map((a) => ({ anahtar: a.anahtar, etiket: a.tr, taraf: a.taraf }))

export default function ElNotuAyarSayfasi() {
  return (
    <div style={{ maxWidth: 720, display: 'grid', gap: 18 }}>
      <div id="tanima"><TanimaKarti metin={ESNEK_TR} getir={trGetir} api={ESNEK_API} golgeApi={GOLGE_API} elNotuApi={TR_API} /></div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: '0', color: '#2e251d' }}>{TR_METIN.ayar.baslik}</h1>
      <ElNotuAyarKarti metin={TR_METIN} getir={trGetir} api={TR_API} anatomi={ANATOMI} />
    </div>
  )
}
