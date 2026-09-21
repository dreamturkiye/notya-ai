/**
 * Pediatri search chapter — KPA delay, M-CHAT, Neyzi kayması, profilaksi, izlem+portal.
 * Called only when pediatrikBaglamMi is true. Other branşlar never load this.
 */
import { asiPlani, onerilenDonem, dozKisa, type SeriKod } from './asiPlan'
import { persentilKaymalari, olcumSatirlari } from './buyume'
import { gunFarki } from './girdi'
import type { PediKohortGirdi, PediKohortBayrak } from './kohort'
import { pediKohortSatiri } from './kohort'
import type { SorguAyik } from '@/lib/doktor/hastaAramaFiltre'

export interface PediAramaSatir {
  patientId: string
  ad: string
  ozet: string
  sira: string
  hatirlatilabilir: boolean
}

const DVIT_RE = /d\s*-?\s*vit|vitamin\s*d|\bd3\b|devit/i
const DEMIR_RE = /demir|ferr|maltofer|\biron\b/i

export function pediBolumGerekliMi(q: SorguAyik): boolean {
  return q.seriGecikme || Boolean(q.mchat) || q.persentilEsik != null
    || q.bayrakVe.some((b) => ['asi_gecikti', 'izlem_kacti', 'persentil_kaymasi', 'profilaksi', 'tarama_gecikti'].includes(b))
    || q.portalYok || q.hatirlatmaSay
}

export function pediAramaUygula(
  girdiler: PediKohortGirdi[],
  q: SorguAyik,
  bugun: string,
  yakinHatirlatma: Set<string>,
): PediAramaSatir[] {
  const cikti: PediAramaSatir[] = []
  for (const g of girdiler) {
    const ay = Math.floor(gunFarki(g.dogumIso, bugun) / 30.44)
    if (q.yas && (ay < q.yas.minAy || ay > q.yas.maxAy)) continue

    if (q.pencere && q.ziyaret) {
      const son = [...g.seanslar].sort().pop()
      if (!son || son < q.pencere.basGun || son > q.pencere.bitGun) {
        if (q.mchat) {
          const altiAy = gunEkleGun(bugun, -180)
          if (!g.seanslar.some((s) => s >= altiAy)) continue
        } else if (!q.seriGecikme && q.persentilEsik == null && !q.bayrakVe.includes('profilaksi')) {
          continue
        }
      }
    }

    const parca: string[] = []
    let sira = '9999-12-31'

    if (q.seriGecikme && q.seri) {
      const plan = asiPlani({
        dogumIso: g.dogumIso, bugunIso: bugun, donem: onerilenDonem(g.dogumIso, g.asilar),
        dogumKiloGr: g.dogumKiloGr, gebelikHaftasi: g.gebelikHaftasi, kayitlar: g.asilar,
      })
      const seri = plan.seriler.find((s) => s.seri === (q.seri as SeriKod))
      if (!seri) continue
      const yapilan = seri.dozlar.filter((d) => d.durum === 'yapildi')
      if (!yapilan.length) continue
      const geciken = seri.dozlar.filter((d) => d.durum === 'gecikti' && (d.no === 2 || d.no === 3 || d.no > 1))
      if (!geciken.length) continue
      const ilk = [...geciken].sort((a, b) => a.onerilen.localeCompare(b.onerilen))[0]
      sira = ilk.onerilen
      parca.push(`KPA: ${geciken.map((d) => `${dozKisa(d)} önerilen ${d.onerilen}`).join(', ')}`)
    }

    if (q.mchat) {
      const son = [...g.mchat].sort((a, b) => a.tarih.localeCompare(b.tarih)).pop()
      const yok = !son
      const riskli = Boolean(son && son.risk && son.risk !== 'dusuk')
      if (!yok && !riskli) continue
      parca.push(yok ? 'M-CHAT kayıtta yok' : `M-CHAT ${son!.risk} risk`)
    }

    if (q.persentilEsik != null) {
      if (!g.cinsiyet || g.olcumler.length < 2) continue
      const satirlar = olcumSatirlari('neyzi', g.cinsiyet, g.dogumIso, g.olcumler)
      const altiAy = gunEkleGun(bugun, -180)
      const kayma = persentilKaymalari(satirlar, q.persentilEsik).filter((k) => k.sonTarih >= altiAy)
      if (!kayma.length) continue
      parca.push(kayma.map((k) => `${k.param} p${Math.round(k.pOnce)}→p${Math.round(k.pSon)} (${k.oncekiTarih}–${k.sonTarih})`).join(' · '))
    }

    if (q.bayrakVe.includes('profilaksi') && !q.seriGecikme) {
      const dvit = g.ilaclar.some((i) => i.aktif && DVIT_RE.test(i.ad))
      const demir = g.ilaclar.some((i) => i.aktif && DEMIR_RE.test(i.ad))
      const gorev = g.bebekGorevleri.some((x) => /bekliyor|gecik/.test(x.status))
      if (dvit && demir) continue
      if (!gorev) continue
      parca.push([!dvit ? 'D vit yok' : '', !demir ? 'demir yok' : '', 'görev bekliyor/gecikmiş'].filter(Boolean).join(' · '))
    }

    const kohort = (q.bayrakVe.includes('izlem_kacti') || q.portalYok)
      ? pediKohortSatiri(g, bugun)
      : null
    if (q.bayrakVe.includes('izlem_kacti') && kohort && !kohort.bayraklar.includes('izlem_kacti')) continue
    if (q.bayrakVe.includes('asi_gecikti') && !q.seriGecikme && kohort && !kohort.bayraklar.includes('asi_gecikti')) continue
    if (q.portalYok && g.portalVar) continue
    if (kohort) parca.push(...kohort.detay)
    if (kohort?.enErkenTarih) sira = kohort.enErkenTarih

    if (!parca.length && (q.seriGecikme || q.mchat || q.persentilEsik)) continue

    cikti.push({
      patientId: g.patientId,
      ad: g.ad,
      ozet: parca.filter(Boolean).join(' · '),
      sira,
      hatirlatilabilir: !yakinHatirlatma.has(g.patientId),
    })
  }
  return cikti.sort((a, b) => a.sira.localeCompare(b.sira) || a.ad.localeCompare(b.ad, 'tr'))
}

function gunEkleGun(gun: string, n: number): string {
  const d = new Date(`${gun}T12:00:00+03:00`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

export function pediBayrakTipleri(): PediKohortBayrak[] {
  return ['asi_gecikti', 'izlem_kacti', 'persentil_kaymasi', 'profilaksi', 'tarama_gecikti']
}
