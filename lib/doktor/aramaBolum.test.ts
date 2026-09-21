import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sorguyuAyikla } from './hastaAramaFiltre'
import { aramaBolumuAc, bolumBayraklari, cevapTuru } from './aramaBolum'
import { pediAramaUygula } from '@/specialties/pediatri/engines/aramaBolumu'
import type { PediKohortGirdi } from '@/specialties/pediatri/engines/kohort'
import { gozAramaUygula } from '@/specialties/goz-hastaliklari/engines/aramaBolumu'
import { kdAramaUygula } from '@/specialties/kadin-dogum/engines/aramaBolumu'
import { dahiliyeAramaUygula } from '@/specialties/dahiliye/engines/aramaBolumu'
import { dermAramaUygula } from '@/specialties/dermatoloji/engines/aramaBolumu'

const PAZAR = new Date('2026-09-20T15:00:00+03:00')

function girdi(p: Partial<PediKohortGirdi> & Pick<PediKohortGirdi, 'patientId' | 'ad' | 'dogumIso'>): PediKohortGirdi {
  return {
    cinsiyet: null,
    asilar: [],
    taramalar: [],
    mchat: [],
    gidr: [],
    seanslar: [],
    olcumler: [],
    ilaclar: [],
    bebekGorevleri: [],
    gebelikHaftasi: null,
    dogumKiloGr: null,
    portalVar: false,
    ...p,
  }
}

describe('aramaBolum — kapalı dilim, pediatri pilot', () => {
  it('registry pediatri motorunu statik yüklemez (KD bundle sızıntısı yok)', () => {
    const s = readFileSync(new URL('./aramaBolum.ts', import.meta.url), 'utf8')
    assert.ok(!s.includes('specialties/pediatri'))
    assert.ok(!s.includes('pediKohort'))
  })

  it('KD / göz M-CHAT sorusunda kapalı; pediatri açılır; otit evrenseldir', () => {
    const mchat = sorguyuAyikla('18–24 aylık M-CHAT hiç yapılmamış', PAZAR)
    assert.equal(bolumBayraklari(mchat), true)
    assert.equal(aramaBolumuAc(mchat, 'kadin-hastaliklari-dogum'), 'kapali')
    assert.equal(aramaBolumuAc(mchat, 'kadin-dogum'), 'kapali')
    assert.equal(aramaBolumuAc(mchat, 'goz-hastaliklari'), 'kapali')
    assert.equal(aramaBolumuAc(mchat, 'dahiliye'), 'kapali')
    assert.equal(aramaBolumuAc(mchat, 'pediatri'), 'pediatri')
    assert.equal(cevapTuru(mchat, 'kapali'), 'kapali')

    const otit = sorguyuAyikla('Geçen hafta otit ile gelen 1–5 yaş', PAZAR)
    assert.equal(bolumBayraklari(otit), false)
    assert.equal(aramaBolumuAc(otit, 'pediatri'), null)
    assert.equal(aramaBolumuAc(otit, 'dahiliye'), null)
  })

  it('M-CHAT yok veya riskli; düşük risk elenir', () => {
    const q = sorguyuAyikla('18–24 aylık M-CHAT hiç yapılmamış veya riskli, son 6 ayda muayene', PAZAR)
    const yok = girdi({ patientId: 'a', ad: 'Ali', dogumIso: '2025-03-20', seanslar: ['2026-08-01'] })
    const dusuk = girdi({ patientId: 'b', ad: 'Ece', dogumIso: '2025-03-20', seanslar: ['2026-08-01'], mchat: [{ tarih: '2026-04-01', risk: 'dusuk', puan: 0 }] })
    const risk = girdi({ patientId: 'c', ad: 'Can', dogumIso: '2025-03-20', seanslar: ['2026-08-01'], mchat: [{ tarih: '2026-04-01', risk: 'yuksek', puan: 8 }] })
    const ids = pediAramaUygula([yok, dusuk, risk], q, '2026-09-20', new Set()).map((s) => s.patientId)
    assert.deepEqual(ids.sort(), ['a', 'c'])
  })

  it('profilaksi: D vit + demir varsa elenir; görev yoksa elenir', () => {
    const q = sorguyuAyikla('6–12 aylık D vitamini veya demir kaydı olmayan ve görev bekliyor', PAZAR)
    const bos = girdi({
      patientId: 'd', ad: 'Deniz', dogumIso: '2026-01-20',
      bebekGorevleri: [{ kind: 'dvit', due: '2026-06-01', dueEnd: null, status: 'bekliyor', title: 'D vit' }],
    })
    const dolu = girdi({
      patientId: 'e', ad: 'Ela', dogumIso: '2026-01-20',
      ilaclar: [{ ad: 'Devit D3', aktif: true, baslangic: '2026-02-01', bitis: null }, { ad: 'Ferro Sanol demir', aktif: true, baslangic: '2026-02-01', bitis: null }],
      bebekGorevleri: [{ kind: 'demir', due: '2026-06-01', dueEnd: null, status: 'bekliyor', title: 'Demir' }],
    })
    const gorevsiz = girdi({ patientId: 'f', ad: 'Fikret', dogumIso: '2026-01-20' })
    const ids = pediAramaUygula([bos, dolu, gorevsiz], q, '2026-09-20', new Set()).map((s) => s.patientId)
    assert.deepEqual(ids, ['d'])
  })

  it('portal açık olan izlem/hatırlatma satırına girmez; 7 gün cooldown sayılır', () => {
    const q = sorguyuAyikla('hasta portalı açık olmayan, hatırlatma', PAZAR)
    const acik = girdi({ patientId: 'g', ad: 'Gül', dogumIso: '2025-01-01', portalVar: true })
    const kapali = girdi({ patientId: 'h', ad: 'Hasan', dogumIso: '2025-01-01', portalVar: false })
    const yakin = new Set(['h'])
    const satir = pediAramaUygula([acik, kapali], q, '2026-09-20', yakin)
    assert.equal(satir.length, 1)
    assert.equal(satir[0].patientId, 'h')
    assert.equal(satir[0].hatirlatilabilir, false)
  })
})

describe('aramaBolum — göz / KD / dahiliye / derm motorları', () => {
  it('göz: IVT gecikti + portal yok; OCT satırı elenir; 7 gün cooldown', () => {
    const q = sorguyuAyikla('IVT gecikmiş ve portalı açık olmayan, kaçına hatırlatma gidebilirim?', PAZAR)
    const satirlar = [
      { patientId: 'g1', ad: 'Ayşe', bayraklar: ['ivt_gecikti' as const], enErkenTarih: '2026-09-01', detay: ['IVT OD'], sonVizit: null, portalVar: false },
      { patientId: 'g2', ad: 'Berk', bayraklar: ['ivt_gecikti' as const], enErkenTarih: '2026-09-01', detay: ['IVT OS'], sonVizit: null, portalVar: true },
      { patientId: 'g3', ad: 'Cem', bayraklar: ['ga_oct_gecikti' as const], enErkenTarih: '2026-08-01', detay: ['OCT'], sonVizit: null, portalVar: false },
    ]
    const cikti = gozAramaUygula(satirlar, q, new Set(['g1']))
    assert.deepEqual(cikti.map((s) => s.patientId), ['g1'])
    assert.equal(cikti[0].hatirlatilabilir, false)
  })

  it('göz: IVT penceresi veya gecikmiş — VEYA, tek bayrak yeter', () => {
    const q = sorguyuAyikla('IVT penceresi veya IVT gecikmiş — VEYA listele', PAZAR)
    const satirlar = [
      { patientId: 'p', ad: 'Pelin', bayraklar: ['ivt_penceresi' as const], enErkenTarih: '2026-09-25', detay: [], sonVizit: null, portalVar: false },
      { patientId: 'g', ad: 'Gül', bayraklar: ['ivt_gecikti' as const], enErkenTarih: '2026-09-01', detay: [], sonVizit: null, portalVar: false },
      { patientId: 'o', ad: 'Okan', bayraklar: ['dr_tarama' as const], enErkenTarih: '2026-09-01', detay: [], sonVizit: null, portalVar: false },
    ]
    assert.deepEqual(gozAramaUygula(satirlar, q, new Set()).map((s) => s.patientId).sort(), ['g', 'p'])
  })

  it('KD: smear + portal yok; lohusa satırı elenir', () => {
    const q = sorguyuAyikla('Smear gecikmiş portal açık olmayan', PAZAR)
    const satirlar = [
      { patientId: 'k1', ad: 'Kader', bayraklar: ['serviks_tarama' as const], lohusa: false, oncelik: 1, enErkenTarih: '2025-01-01', detay: ['smear'], sonVizit: null, portalVar: false },
      { patientId: 'k2', ad: 'Lale', bayraklar: ['serviks_tarama' as const], lohusa: false, oncelik: 1, enErkenTarih: '2025-01-01', detay: ['smear'], sonVizit: null, portalVar: true },
      { patientId: 'k3', ad: 'Mine', bayraklar: ['lohusa_1hf' as const], lohusa: true, oncelik: 0, enErkenTarih: '2026-09-18', detay: [], sonVizit: null, portalVar: false },
    ]
    assert.deepEqual(kdAramaUygula(satirlar, q, new Set()).map((s) => s.patientId), ['k1'])
  })

  it('dahiliye: HbA1c >9 portal yok; eGFR satırı elenir', () => {
    const q = sorguyuAyikla('HbA1c >9 ve portalı açık olmayan, hatırlatma kaçına gider?', PAZAR)
    const satirlar = [
      { patientId: 'd1', ad: 'Derya', bayraklar: ['hba1c_9' as const], gecikmisSayi: 0, sonVizit: null, portalVar: false, oncelik: 5 },
      { patientId: 'd2', ad: 'Erol', bayraklar: ['hba1c_9' as const], gecikmisSayi: 0, sonVizit: null, portalVar: true, oncelik: 5 },
      { patientId: 'd3', ad: 'Fırat', bayraklar: ['egfr_45' as const], gecikmisSayi: 0, sonVizit: null, portalVar: false, oncelik: 4 },
    ]
    assert.deepEqual(dahiliyeAramaUygula(satirlar, q, new Set()).map((s) => s.patientId), ['d1'])
  })

  it('derm: TBSE gecikti + portal yok; yama satırı elenir', () => {
    const q = sorguyuAyikla('TBSE gecikmiş portal yok, hatırlatma kaçına gider?', PAZAR)
    const satirlar = [
      { patientId: 't1', ad: 'Tuna', bayraklar: ['tbse_gecikti' as const], enErkenTarih: '2025-01-01', detay: ['TBSE'], sonVizit: null, portalVar: false },
      { patientId: 't2', ad: 'Umut', bayraklar: ['tbse_gecikti' as const], enErkenTarih: '2025-01-01', detay: ['TBSE'], sonVizit: null, portalVar: true },
      { patientId: 't3', ad: 'Veli', bayraklar: ['yama_okuma' as const], enErkenTarih: '2026-09-18', detay: ['D2'], sonVizit: null, portalVar: false },
    ]
    assert.deepEqual(dermAramaUygula(satirlar, q, new Set()).map((s) => s.patientId), ['t1'])
  })
})
