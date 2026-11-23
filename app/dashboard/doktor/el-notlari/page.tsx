'use client'
/**
 * ESNEK-MUAYENE-A/B — El Notları: the paper-and-pen doctor's workspace (doctor and, by the doctor's choice, his secretary).
 * CORE: the same page for all 30 branches + 10 Özel Branşlar (branş differences are data: seed lexicons, templates).
 * Phase B: the shadow-mode upload panel (while shadow mode is in force) and the time meter (today + week).
 */
import ElNotlariMasasi from '@/components/elNotu/ElNotlariMasasi'
import HastaAra from '@/components/elNotu/HastaAra'
import GolgeMasaBolumu from '@/components/esnek/GolgeMasaBolumu'
import ZamanSayaci from '@/components/esnek/ZamanSayaci'
import { ESNEK_TR } from '@/components/esnek/trEsnek'
import { TR_API, TR_METIN, trBugununRandevulari, trGetir, trHastaCevir, trHastaUcu, trNotFormu } from '@/components/elNotu/trBaglam'
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme'

export default function ElNotlariSayfasi() {
  const hastaSec = (onSec: (h: { id: string; ad: string }) => void) => <HastaAra getir={trGetir} uc={trHastaUcu} cevir={trHastaCevir} etiket={TR_METIN.masa.hastaIcinEkle} yer={TR_METIN.toplu.hastaSec} onSec={onSec} />
  return (
    <div style={{ maxWidth: 900, display: 'grid', gap: 14 }}>
      <div>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>{TR_METIN.masa.baslik}</h1>
        <p style={{ fontSize: 14, color: CHROME_RENK.muted, margin: 0 }}>{TR_METIN.masa.alt}</p>
      </div>
      <GolgeMasaBolumu metin={ESNEK_TR} elMetin={TR_METIN} getir={trGetir} api={TR_API} hastaSec={hastaSec} />
      <ElNotlariMasasi metin={TR_METIN} getir={trGetir} api={TR_API}
        yollar={{ notFormu: trNotFormu, hastaDosyasi: (id) => `/dashboard/doktor/hastalar/${encodeURIComponent(id)}`, randevular: trBugununRandevulari }}
        hastaSec={hastaSec} ust={<ZamanSayaci metin={ESNEK_TR} getir={trGetir} api={TR_API} />} />
    </div>
  )
}
