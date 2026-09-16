import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cybhTedaviPlani, hsvSupresyon36hf, NAAT_PAKETLERI } from '../engines/cybh-tedavi'
import { acilKontrasepsiyon, yontemMec, postpartumKontrasepsiyonBaslangic } from '../engines/kontrasepsiyon-mec'
import {
  menorajiTedaviBasamagi, antiDKapaliDongu, usgRaporTaslagi, eDogumSihirbaz,
  csSavunmaPaketi, paketDurum, VARSAYILAN_PAKET, infertiliteSevkPaketi,
  urojinePopqHizli, onkolojiIotaTriyaj, siddetTarama, kokYillikGuvenlik,
} from '../engines/kd-klinik-wow'

describe('cybh tedavi engine', () => {
  it('builds CDC-TR regimens with partner + TOC for chlamydia/gonorrhea', () => {
    const p = cybhTedaviPlani(['chlamydia', 'gonorrhea'])
    assert.equal(p.partnerGerekli, true)
    assert.ok(p.satirlar.length >= 2)
    assert.ok(p.satirlar.some((s) => /Doksisiklin|Seftriakson/.test(s.birinciBasamak)))
    assert.ok(p.tocGorevleri.length >= 1 || p.naatOner.some((n) => n.kod === 'ct_gc'))
    assert.match(p.yazdirilabilirPartner, /Partner/)
  })
  it('switches candida to topical in pregnancy', () => {
    const p = cybhTedaviPlani(['candida'], { gebe: true })
    assert.match(p.satirlar[0].birinciBasamak, /topikal/i)
  })
  it('lists NAAT packages and HSV 36w suppression', () => {
    assert.ok(NAAT_PAKETLERI.length >= 4)
    assert.ok(hsvSupresyon36hf('hsv2').some((x) => /36/.test(x)))
  })
})

describe('kontrasepsiyon MEC + EC', () => {
  it('blocks KOK for ≥35 + heavy smoking', () => {
    const m = yontemMec('kok', { yas: 36, sigaraGunluk: 20, vteOykusu: false, migrenAura: false, taSistolik: 120, taDiastolik: 80, memeCa: false, karacigerAgir: false, postpartumGun: null, emziriyor: false, pidAktif: false, aciklanmamisKanama: false, bmi: 24, gebelikSupheli: false })
    assert.equal(m.kategori, 4)
  })
  it('offers UPA and Cu-IUD in 72–120h window', () => {
    const e = acilKontrasepsiyon({ iliskiSaatOnce: 90, emziriyor: false, kokKullanıyor: false })
    assert.ok(e.secenekler.some((s) => s.kod === 'acil_upa'))
    assert.ok(e.secenekler.some((s) => s.kod === 'acil_cu'))
    assert.match(e.oneri, /72–120|UPA|Cu/)
  })
  it('lists postpartum starts with condom always', () => {
    const pp = postpartumKontrasepsiyonBaslangic(42, true)
    assert.ok(pp.some((x) => x.yontem === 'kondom'))
    assert.ok(pp.some((x) => x.yontem === 'ria_lng'))
  })
})

describe('kd klinik wow', () => {
  it('menoraji ladder puts LNG-IUS first when cavity OK', () => {
    const m = menorajiTedaviBasamagi({ menoraji: true, anemi: 'hafif', gebelikIstegi: false, myomBozucu: false, adenomyozis: false, medikalBasarisiz: false, orneklemeSonucRiskli: false })
    assert.equal(m.basamaklar[0].baslik.includes('LNG'), true)
    assert.equal(m.basamaklar[0].uygun, true)
    assert.ok(m.basamaklar.some((b) => /TXA|Traneksamik/.test(b.baslik)))
  })
  it('anti-D loop creates abortus + 28w tasks for Rh−', () => {
    const a = antiDKapaliDongu({ rhNegatif: true, partnerRhPozitifVeyaBilinmiyor: true, indirektCoombsNegatif: true, tetikler: ['abortus'], antenatalYapildi: false, postpartumYapildi: false })
    assert.ok(a.gorevler.some((g) => g.kod === 'anti_d_28'))
    assert.ok(a.gorevler.some((g) => g.kod === 'anti_d_abortus'))
  })
  it('USG report includes SUT hint and anomaly checklist', () => {
    const r = usgRaporTaslagi('anomali', { Biometri: 'uygun' }, 'plasenta previa şüphesi')
    assert.match(r.sutOneri, /US|anomali|TMFTP/i)
    assert.match(r.govde, /Biometri/)
  })
  it('e-Doğum flags stillbirth notification threshold', () => {
    const e = eDogumSihirbaz({ dogum_tarih_saat: '2026-01-01', dogum_sekli: 'vajinal', dogum_yeri: 'x', gebelik_haftasi: 24, kilo: 600, canli_olu: 'olu', cinsiyet: 'K', anne_tc: '1' })
    assert.equal(e.tamam, true)
    assert.ok(e.uyari.some((u) => /e-Doğum|ölü/i.test(u)))
  })
  it('CS defense requires endikasyon', () => {
    const c = csSavunmaPaketi([], null, false)
    assert.ok(c.eksik.length >= 1)
  })
  it('package ledger detects overrun', () => {
    const d = paketDurum(VARSAYILAN_PAKET.map((k) => ({ ...k, kullanilan: k.kod === 'nst' ? 99 : 0 })))
    assert.match(d.ozet, /aşıldı/i)
  })
  it('infertility sevk ready only when step-1 complete', () => {
    assert.equal(infertiliteSevkPaketi(['sure']).hazir, false)
    assert.equal(infertiliteSevkPaketi(['sure', 'amh', 'tsh_prl', 'semen', 'hsg', 'ovulasyon', 'sevk']).hazir, true)
  })
  it('urojine and IOTA triage escalate', () => {
    assert.equal(urojinePopqHizli({ stresInkontinans: true, sikilik: true, prolapsusSikayet: false }).oncelik, 'yuksek')
    assert.equal(onkolojiIotaTriyaj({ kistSolid: true, asit: true, papiller: false, dopplerGuclu: false, menopoz: true }).sevk, true)
  })
  it('violence yes opens tasks; KOK annual rolls due', () => {
    assert.ok(siddetTarama(true).gorevler.length >= 3)
    const k = kokYillikGuvenlik('2025-01-01', '2026-09-16')
    assert.match(k.due, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(k.maddeler.includes('TA ölçümü'))
  })
})
