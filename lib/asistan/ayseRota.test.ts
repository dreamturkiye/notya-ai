/**
 * NOTYA-AYSE-GERI-00 — Ayşe routing regression table (docs/ayse-capability-regression-audit.md §4, §8 PR 0).
 *
 * One row = a Turkish sentence a doctor says, the patient state it is said in, and where it must end up:
 * which step of ayseCevapla answers (`rota`), which tool the model request forces (`arac`), and which patient
 * the turn is bound to (`hasta`). The rows come from the audit probes and docs/qa/gokhan-yetenek-talepleri.md.
 *
 * BILINEN_HATALAR lists the KNOWN FAILURES: what the code does today instead of `beklenen`. The test asserts the
 * wrong route exactly, so the table stays green while documenting the defect, and it fails the moment the
 * behaviour changes: the slice that fixes a row deletes its line there (the row then asserts `beklenen`). A row
 * that is not listed is a guard that must keep working.
 *
 * Runs the real /api/asistan/chat handler against an in-memory database and a recording fake model.
 */
import { ortam, sahneHazirla, sahneKur, hastaEkle, adIndeksle, oturumAc, yazi, sonModelIstegi, zorlananArac, sunulanAraclar, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { gercekciHastaEkle, GERCEKCI_HASTA_ADI } from './tests/gercekciHasta'

type Durum = 'yok' | 'acik'
type Beklenti = {
  rota: string
  /** Forced tool: a tool name, 'any', or null (no forced call). Checked only on the model route. */
  arac?: string | null
  /** Patient the turn is bound to (`aktifHasta`), or null for none. Checked only when given. */
  hasta?: string | null
  /** A tool that must be among the offered tools (model route). */
  sunulan?: string
}
type Satir = { soz: string; durum: Durum; beklenen: Beklenti; bugun?: Beklenti; dilim?: string }

const D = GERCEKCI_HASTA_ADI

export const ROTA_TABLOSU: Satir[] = [
  // ── No patient open: a sentence that merely contains a chart word is not a patient search (audit §4.3) ──
  { soz: 'Ali Yılmaz için randevu oluştur', durum: 'yok', beklenen: { rota: 'model', sunulan: 'kontrol_randevusu_olustur' }, dilim: 'S1+S3' },
  { soz: 'Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?', durum: 'yok', beklenen: { rota: 'model', sunulan: 'kontrol_randevusu_olustur' }, dilim: 'S1+S3' },
  { soz: 'Randevu saatini değiştirmek istiyorum', durum: 'yok', beklenen: { rota: 'model', sunulan: 'randevu_tasi' }, dilim: 'S1+S3' },
  { soz: 'Aşı karnesini tablo olarak göster', durum: 'yok', beklenen: { rota: 'model', hasta: null }, dilim: 'S1' },
  { soz: 'İlaç etkileşimi var mı kontrol et', durum: 'yok', beklenen: { rota: 'model' }, dilim: 'S1' },
  { soz: 'Epikriz hazırla', durum: 'yok', beklenen: { rota: 'model' }, dilim: 'S1' },
  { soz: 'Otitte ilk seçenek tedavi nedir', durum: 'yok', beklenen: { rota: 'model' }, dilim: 'S1' },
  { soz: 'Ateşli çocukta parasetamol dozu nedir', durum: 'yok', beklenen: { rota: 'model' }, dilim: 'S1' },
  { soz: 'Tanı koymama yardım eder misin', durum: 'yok', beklenen: { rota: 'model' }, dilim: 'S1' },
  { soz: 'Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz', durum: 'yok', beklenen: { rota: 'model' }, dilim: 'S1' },
  { soz: 'Alerji testi nasıl istenir?', durum: 'yok', beklenen: { rota: 'model' }, dilim: 'S1' },
  // A patient whose first name equals a persona name resolves by that first name (audit §4.3).
  { soz: 'Ayşe’nin son aşı tarihi ne', durum: 'yok', beklenen: { rota: 'hizli-kart', hasta: 'Ayşe Yeşil' }, dilim: 'S1' },
  { soz: 'Ayşe için boğaz kültürü sonucu geldi mi?', durum: 'yok', beklenen: { rota: 'model', hasta: 'Ayşe Yeşil' }, dilim: 'S1' },
  { soz: 'Merhaba Ayşe, nasılsın?', durum: 'yok', beklenen: { rota: 'model', hasta: null } },
  // The vocative stays an address: the live wrong-chart incident (NOTYA-HASTA-ODAK-01) must not come back.
  { soz: 'Ayşe, aşı karnesini gösterir misin?', durum: 'yok', beklenen: { rota: 'model', hasta: null } },
  { soz: 'Ayşe Hanım otitte ilk seçenek ne?', durum: 'yok', beklenen: { rota: 'model', hasta: null } },
  // Explicit count / list questions stay with the search.
  { soz: 'Kaç hastam var?', durum: 'yok', beklenen: { rota: 'arama' } },
  { soz: 'Ateşli hastalarım kimler?', durum: 'yok', beklenen: { rota: 'arama' } },
  { soz: 'Astım tanılı hastaları listele', durum: 'yok', beklenen: { rota: 'arama' } },
  { soz: 'Son 30 günde aşı yapılan hastalar hangileri?', durum: 'yok', beklenen: { rota: 'arama' } },
  { soz: 'Ayşe, kaç hastam var?', durum: 'yok', beklenen: { rota: 'arama', hasta: null } },

  // ── Patient open: cohort-sounding words about the open chart stay on the chart (audit §4.3, PR 9) ──
  { soz: 'Toplam kaç aşısı var', durum: 'acik', beklenen: { rota: 'model', hasta: D }, dilim: 'S1' },
  { soz: 'En çok hangi şikayetle geldi', durum: 'acik', beklenen: { rota: 'model', hasta: D }, dilim: 'S1' },
  { soz: 'Astım tanılı hastaları listele', durum: 'acik', beklenen: { rota: 'arama' } },
  { soz: 'En çok yazdığım antibiyotik hangisi?', durum: 'acik', beklenen: { rota: 'arama' } },
  // A described, unnamed patient is still looked for; a knowledge question with the same words is not.
  { soz: 'Dün gelen ateşli çocuk kimdi?', durum: 'yok', beklenen: { rota: 'arama' } },
  { soz: 'Bronşiolit yönetimini anlat', durum: 'yok', beklenen: { rota: 'model', hasta: null } },

  // ── Patient open: commands reach a tool, forced (audit §4.4, PR 4) ──
  { soz: 'Penisilin alerjisini ekle', durum: 'acik', beklenen: { rota: 'model', arac: 'alerji_ekle', hasta: D }, dilim: 'S3' },
  { soz: 'Kilosunu 12,4 kilo olarak ekle', durum: 'acik', beklenen: { rota: 'model', arac: 'olcum_ekle', hasta: D }, dilim: 'S3' },
  { soz: 'Astım tanısını kronik hastalıklara ekle', durum: 'acik', beklenen: { rota: 'model', arac: 'kronik_hastalik_ekle', hasta: D }, dilim: 'S3' },
  { soz: 'Amoksisilin 250 mg günde iki kez ilaçlarına ekle', durum: 'acik', beklenen: { rota: 'model', arac: 'ilac_ekle', hasta: D }, dilim: 'S3' },
  { soz: 'Ventolini kes', durum: 'acik', beklenen: { rota: 'model', arac: 'ilac_sonlandir', hasta: D }, dilim: 'S3' },
  { soz: 'Ventolinin dozunu 2x2 olarak değiştir', durum: 'acik', beklenen: { rota: 'model', arac: 'ilac_doz_degistir', hasta: D }, dilim: 'S3' },
  { soz: 'Dosyasına not al: annesi sigarayı bıraktı', durum: 'acik', beklenen: { rota: 'model', arac: 'dosya_notu_ekle', hasta: D }, dilim: 'S3' },
  { soz: 'Aşıyı dosyaya gir', durum: 'acik', beklenen: { rota: 'model', arac: 'asi_kaydi_ekle', hasta: D }, dilim: 'S3' },
  { soz: 'Ateşi 38,2, kaydet', durum: 'acik', beklenen: { rota: 'model', arac: 'olcum_ekle', hasta: D }, dilim: 'S3' },
  { soz: 'Yarın saat 14:00 için kontrol randevusu oluştur', durum: 'acik', beklenen: { rota: 'model', arac: 'kontrol_randevusu_olustur', hasta: D }, dilim: 'S3' },
  { soz: 'Haftaya salı 10:30 kontrol randevusu ver', durum: 'acik', beklenen: { rota: 'model', arac: 'kontrol_randevusu_olustur', hasta: D }, dilim: 'S3' },
  { soz: 'Randevusunu perşembeye al', durum: 'acik', beklenen: { rota: 'model', arac: 'randevu_tasi', hasta: D }, dilim: 'S3' },
  { soz: 'Randevu saatini 15:30 olarak değiştir', durum: 'acik', beklenen: { rota: 'model', arac: 'randevu_tasi', hasta: D }, dilim: 'S3' },
  { soz: 'Randevusunu iptal et', durum: 'acik', beklenen: { rota: 'model', arac: 'randevu_iptal', hasta: D }, dilim: 'S3' },
  // Named in the sentence, nothing open: same forced tool, bound to the named patient.
  { soz: `${D} için yarın 11:00’e randevu oluştur`, durum: 'yok', beklenen: { rota: 'model', arac: 'kontrol_randevusu_olustur', hasta: D }, dilim: 'S3' },
  { soz: `${D} dosyasına fıstık alerjisi ekle`, durum: 'yok', beklenen: { rota: 'model', arac: 'alerji_ekle', hasta: D }, dilim: 'S3' },

  // ── Patient open: records on screen (audit §4.4–4.5, PR 5 / PR 6, Dr. Gökhan items 2–4) ──
  { soz: 'Aşılarını göster', durum: 'acik', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },
  { soz: 'Aşı karnesini tablo olarak göster', durum: 'acik', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },
  { soz: 'Bütün muayenelerdeki kilo ölçümlerini sırayla göster', durum: 'acik', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },
  { soz: 'Kilo, boy ve baş çevresi ölçümlerini tablo yap', durum: 'acik', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },
  { soz: 'Tüm antropometrik ölçümlerini göster', durum: 'acik', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },
  { soz: 'Baş çevresi ölçümleri neler', durum: 'acik', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },
  { soz: 'Son muayenedeki boy ve kilo ölçümlerini göster', durum: 'acik', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },
  { soz: 'Son üç muayenesini özetle', durum: 'acik', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },
  { soz: 'Bütün muayenelerini tek tek özetle', durum: 'acik', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },
  { soz: `${D} aşı karnesini tablo olarak göster`, durum: 'yok', beklenen: { rota: 'kayit', hasta: D }, dilim: 'S5' },

  // ── Guards: what works today must keep its route ──
  { soz: 'Kilosu kaç?', durum: 'acik', beklenen: { rota: 'hizli-kart', hasta: D } },
  { soz: 'Alerjisi var mı?', durum: 'acik', beklenen: { rota: 'hizli-kart', hasta: D } },
  { soz: 'Aşıları tam mı?', durum: 'acik', beklenen: { rota: 'model', arac: null, hasta: D } },
  { soz: 'Büyümesi nasıl gidiyor?', durum: 'acik', beklenen: { rota: 'model', arac: null, hasta: D } },
  { soz: `${D} dosyasını aç`, durum: 'yok', beklenen: { rota: 'dosya-ac', hasta: D } },
  { soz: 'Bugün randevum var mı?', durum: 'yok', beklenen: { rota: 'takvim' } },
  { soz: 'Yarın 15:00 boş mu?', durum: 'acik', beklenen: { rota: 'takvim' } },
  { soz: 'Yarın kimler geliyor?', durum: 'yok', beklenen: { rota: 'takvim' } },
  { soz: 'Yarın hangi saatler boş?', durum: 'yok', beklenen: { rota: 'takvim' }, dilim: 'S3' },
  { soz: 'Annesinin adı ne?', durum: 'acik', beklenen: { rota: 'kimlik', hasta: D } },
  { soz: 'Bitcoin almalı mıyım?', durum: 'yok', beklenen: { rota: 'kapsam' } },
]

const MODEL_ARACSIZ: Beklenti = { rota: 'model', arac: null, hasta: null }
const KART: Beklenti = { rota: 'hizli-kart', hasta: D }
const MODEL_SERBEST: Beklenti = { rota: 'model', arac: null, hasta: D }
const MODEL_ANY: Beklenti = { rota: 'model', arac: 'any', hasta: D }

/**
 * KNOWN FAILURES — what `origin/main` at 16948383 does instead of `beklenen`, keyed "durum|soz".
 * The slice that fixes a row deletes its line here. Empty map = restoration complete.
 */
const BILINEN_HATALAR: Record<string, Beklenti> = {
  // S1 (count template) fixed these thirteen rows on 2026-10-01; what is left of them belongs to later slices:
  // S3: with no patient resolved the model is reached, but no tool is offered yet.
  'yok|Ali Yılmaz için randevu oluştur': MODEL_ARACSIZ,
  'yok|Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?': MODEL_ARACSIZ,
  'yok|Randevu saatini değiştirmek istiyorum': MODEL_ARACSIZ,
  // S5: the open chart answers, but with the quick card's short vaccine line instead of the count.
  'acik|Toplam kaç aşısı var': KART,
  // S3: the quick card or the calendar reader answers a command; or the tool call is left to the model.
  'acik|Penisilin alerjisini ekle': KART,
  'acik|Kilosunu 12,4 kilo olarak ekle': KART,
  'acik|Astım tanısını kronik hastalıklara ekle': KART,
  'acik|Amoksisilin 250 mg günde iki kez ilaçlarına ekle': MODEL_SERBEST,
  'acik|Ventolini kes': MODEL_SERBEST,
  'acik|Ventolinin dozunu 2x2 olarak değiştir': MODEL_SERBEST,
  'acik|Dosyasına not al: annesi sigarayı bıraktı': MODEL_SERBEST,
  'acik|Aşıyı dosyaya gir': MODEL_ANY,
  'acik|Ateşi 38,2, kaydet': MODEL_ANY,
  'acik|Yarın saat 14:00 için kontrol randevusu oluştur': { rota: 'takvim' },
  'acik|Haftaya salı 10:30 kontrol randevusu ver': { rota: 'takvim' },
  'acik|Randevusunu perşembeye al': KART,
  'acik|Randevu saatini 15:30 olarak değiştir': KART,
  'acik|Randevusunu iptal et': KART,
  [`yok|${D} için yarın 11:00’e randevu oluştur`]: { rota: 'takvim' },
  [`yok|${D} dosyasına fıstık alerjisi ekle`]: KART,
  'yok|Yarın hangi saatler boş?': { rota: 'model', arac: null, hasta: null },
  // S5: a one-line card answer or a free model answer where a table from the record is asked for.
  'acik|Aşılarını göster': KART,
  'acik|Aşı karnesini tablo olarak göster': MODEL_SERBEST,
  'acik|Bütün muayenelerdeki kilo ölçümlerini sırayla göster': KART,
  'acik|Kilo, boy ve baş çevresi ölçümlerini tablo yap': KART,
  'acik|Tüm antropometrik ölçümlerini göster': KART,
  'acik|Baş çevresi ölçümleri neler': KART,
  'acik|Son muayenedeki boy ve kilo ölçümlerini göster': KART,
  'acik|Son üç muayenesini özetle': MODEL_SERBEST,
  'acik|Bütün muayenelerini tek tek özetle': MODEL_SERBEST,
  [`yok|${D} aşı karnesini tablo olarak göster`]: MODEL_SERBEST,
}
for (const r of ROTA_TABLOSU) {
  const b = BILINEN_HATALAR[`${r.durum}|${r.soz}`]
  if (b) r.bugun = b
}

let s: Sahne
let hasta: string

function sahne(): void {
  s = sahneKur()
  hasta = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
  adIndeksle(s.doktor.id, hasta, D)
  hastaEkle(s.doktor.id, 'Ayşe Yeşil', { dogum: '2021-03-04', cinsiyet: 'female' })
  hastaEkle(s.doktor.id, 'Umutcan Türkoğlu', { dogum: '2019-04-10', cinsiyet: 'male' })
  // Another doctor's patient with a name the rows use: must never resolve for this doctor.
  hastaEkle(s.diger.id, 'Ali Yılmaz', { dogum: '2018-01-01' })
}

async function calistir(r: Satir): Promise<Beklenti> {
  sahne()
  const oturum = r.durum === 'acik' ? oturumAc(s, { id: hasta, ad: D }) : s.oturum
  const y = await yazi(s, r.soz, { oturum })
  const istek = y.rota === 'model' ? sonModelIstegi() : null
  return {
    rota: y.rota,
    arac: y.rota === 'model' ? zorlananArac(istek) : null,
    hasta: y.aktifHasta,
    sunulan: istek ? sunulanAraclar(istek).join(',') : '',
  }
}

function uyuyor(gercek: Beklenti, b: Beklenti): string | null {
  if (gercek.rota !== b.rota) return `rota ${gercek.rota} ≠ ${b.rota}`
  if (b.rota === 'model' && b.arac !== undefined && gercek.arac !== b.arac) return `araç ${gercek.arac} ≠ ${b.arac}`
  if (b.hasta !== undefined && (gercek.hasta ?? null) !== b.hasta) return `hasta ${gercek.hasta} ≠ ${b.hasta}`
  if (b.sunulan && !String(gercek.sunulan || '').split(',').includes(b.sunulan)) return `araç sunulmadı: ${b.sunulan}`
  return null
}

before(async () => { await sahneHazirla() })

describe('Ayşe rota tablosu — cümle, hasta durumu, beklenen rota ve araç', () => {
  for (const r of ROTA_TABLOSU) {
    const etiket = `[${r.durum}] ${r.soz}${r.bugun ? `  (bilinen hata${r.dilim ? `, ${r.dilim}` : ''})` : ''}`
    it(etiket, async () => {
      const gercek = await calistir(r)
      const ozet = JSON.stringify({ rota: gercek.rota, arac: gercek.arac, hasta: gercek.hasta })
      if (!r.bugun) {
        assert.equal(uyuyor(gercek, r.beklenen), null, `${r.soz} → ${ozet}`)
        return
      }
      // Known failure: pinned to today's wrong route. If this assertion fails the behaviour changed — when the row
      // now meets `beklenen`, delete its `bugun`; otherwise a new wrong route appeared.
      const duzeldi = uyuyor(gercek, r.beklenen) === null
      assert.ok(!duzeldi, `${r.soz}: artık doğru rotada — tablodaki "bugun" işaretini kaldırın`)
      assert.equal(uyuyor(gercek, r.bugun), null, `${r.soz}: bilinen hata değişti → ${ozet}`)
    })
  }

  it('her bilinen hata tablodaki bir satıra aittir (yazım hatasıyla sessizce düşmez)', () => {
    const anahtarlar = new Set(ROTA_TABLOSU.map((r) => `${r.durum}|${r.soz}`))
    for (const k of Object.keys(BILINEN_HATALAR)) assert.ok(anahtarlar.has(k), `tabloda yok: ${k}`)
  })
})
