/**
 * NOTYA-AYSE-STANDART-01 — denetim: Dr. Gökhan standardının deterministik katmanı (soruTuruBul + kanitBlogu +
 * acikIsleriBul) dört sentetik pediatri dosyasında altın beklentilere karşı. Model yok, veritabanı yok.
 *
 * Her beklenti standarttaki bir kuraldır: planlandı ≠ uygulandı; istendi → "sonuç yok"; akut antibiyotik aylar/günler
 * sonra aktif değil; alerji-reçete çatışması sonda; çelişen kayıt gizlenmez; eşdeğer terimle önceki ataklar bulunur.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { soruTuruBul, type SoruTuru } from './soruTuru'
import { kanitBlogu } from './kanit'
import { dosyaSorguKuralBlogu, GENEL_KURALLAR, SORU_SABLONLARI } from './kurallar'
import { parametreSec, TEMEL_SORGU } from './parametreler'
import { FIKSTURLER, DENETIM_BUGUN } from './denetim/fikstur'
import { olaylariKur, hastaKur, ilacDurumu, type HamDosya } from '@/lib/doktor/dosyaOlaylari'
import { acikIsleriBul } from '@/lib/doktor/acikIsler'
import { planIfadesiSinifla, planIfadeleriniCikar, asiTamBeyaniMi } from '@/lib/doktor/planIfadesi'
import { esanlamGenislet, esanlamGruplariBul, SIKAYET_GRUPLARI } from '@/lib/klinik/sikayetEsanlam'
import { DENETIM_SORULARI, cevabiPuanla } from './denetim/puanla'

type Anahtar = keyof typeof FIKSTURLER

function dosya(k: Anahtar | HamDosya) {
  const ham = typeof k === 'string' ? FIKSTURLER[k] : k
  const olaylar = olaylariKur(ham, DENETIM_BUGUN)
  const hasta = hastaKur(ham, DENETIM_BUGUN)
  return { olaylar, hasta, kanit: (t: SoruTuru, mesaj?: string) => kanitBlogu(t, olaylar, hasta, { mesaj }), isler: () => acikIsleriBul(olaylar, 26, hasta.brans, hasta) }
}

/** Kanıt kısmı — cevap şablonu hariç (şablon standardın cümlelerini örnek olarak taşır). */
const kanitKismi = (blok: string) => blok.split('[CEVAP ŞABLONU')[0]

/** BASLIK satırının altındaki "- " maddeleri. */
function bolum(metin: string, baslik: string): string {
  const satirlar = metin.split('\n')
  const i = satirlar.findIndex((x) => x.startsWith(baslik))
  if (i < 0) return ''
  const out: string[] = []
  for (const x of satirlar.slice(i + 1)) { if (!x.startsWith('- ')) break; out.push(x) }
  return out.join('\n')
}

// ─── Altın beklentiler: fikstür × soru → içermeli / içermemeli ───────────────────────────────────────────
interface Beklenti { tur: SoruTuru; mesaj?: string; icermeli: string[]; icermemeli?: string[] }
const ALTIN: Record<Anahtar, Beklenti[]> = {
  a: [
    { tur: 'ozet', icermeli: ['TEKRARLAYAN PATERN: Otit', 'Hepatit B 2. doz — planlandı', 'Kilo persentili p53 → p10', 'M-CHAT', 'Ferritin — istendi, sonuç yok'] },
    { tur: 'degisim', icermeli: ['ÖNCEKİ VİZİTTE (20.06.2026) PLANLANANLAR', 'Ferritin — istendi', 'gerçekleştiğine dair kayıt bulamadım', 'Kilo: 11,6 → 11,2 kg'] },
    { tur: 'buyume', icermeli: ['Neyzi', 'Kilo persentili p53 → p10 (20.03.2026 → 16.09.2026)', 'z −1,29', 'Anne-baba boyu dosyada yok'] },
    { tur: 'asi', icermeli: ['Hepatit B 2. doz — planlandı', 'uygulandığına dair kayıt bulamadım', 'Hepatit B 1. doz — uygulandı', 'Hepatit B 3. doz — zamanı geçmiş', 'RİSK BAZLI / TAKVİM DIŞI'], icermemeli: ['Hepatit B 2. doz — uygulandı', 'Hepatit B 3. doz — uygulandı'] },
    { tur: 'lab', icermeli: ['DEMİR PANELİ', 'Ferritin — istendi, sonuç yok', 'H/L işaretine güvenme', 'Hemoglobin, Hematokrit, MCV, RDW, Lökosit (WBC), Trombosit (PLT) — istendi (20.06.2026) → sonuç 25.06.2026'] },
    { tur: 'ilac', icermeli: ['SÜRESİ DOLMUŞ / TAMAMLANMIŞ — aktif sayılmadı:\n- Amoksisilin', 'reçete tarihindeki kilo 11,2 kg (16.09.2026)', 'GÜNCEL KİLO: 11,2 kg'] },
    { tur: 'benzer', mesaj: 'Daha önce kulak ağrısıyla geldi mi?', icermeli: ['Otit / kulak ağrısı', '10.11.2025 [eşleşen', '20.03.2026 [eşleşen: "kulagini cekistir"]', '16.09.2026 [eşleşen', 'Toplam: 3 vizit'], icermemeli: ['20.06.2026 [eşleşen'] },
    { tur: 'gelisim', icermeli: ['GİDR yaş basamağı', 'Gelişimsel tarama planlanmış (16.09.2026: "M-CHAT planlandı"); tamamlanmış sonuç dosyada görünmüyor', 'Otizm değerlendirmesi'], icermemeli: ['M-CHAT-R/F: düşük risk'] },
    { tur: 'takip', icermeli: ['1) BUGÜN:', 'Hepatit B 2. doz — planlandı', 'Ferritin — istendi, sonuç yok', 'Kontrol 26.09.2026 için planlanmıştı', '2) YAKIN ZAMANDA:', 'Tekrarlayan patern: Otit'] },
    { tur: 'gozden-kacan', icermeli: ['AŞI (eksik / planlanmış-uygulanmamış):', 'SONUCU OLMAYAN / TAKİPSİZ TEST:', 'BÜYÜME / GELİŞİM:', 'TEKRARLAYAN PATERN:'], icermemeli: ['belirgin bir açık güvenlik problemi'] },
  ],
  b: [
    { tur: 'asi', icermeli: ['6\'lı karma dönemi', 'OPA (oral polio) 1. doz — uygulandı (26.07.2026', 'EKSİK / ZAMANI GELMİŞ (takvime göre, aşı tablosunda kayıt yok):\n- (yok)'], icermemeli: ['zamanı geçmiş', 'planlandı ('] },
    { tur: 'ilac', icermeli: ['AKTİF İLAÇLAR (ilaç kaydında aktif ve süresi dolmamış):\n- D vitamini damla', 'Demir damla'] },
    { tur: 'gelisim', icermeli: ['GİDR (6-8 ay): sevk önerilmedi', 'bu pencerede kayıtlı'], icermemeli: ['Regresyon'] },
    { tur: 'takip', icermeli: ['Kontrol 24.09.2026 için planlanmıştı (10.09.2026 notu: "2 hafta sonra kontrol"); sonraki vizit kaydı yok'], icermemeli: ['zamanı geçmiş', 'istendi, sonuç yok', 'Büyüme:'] },
    { tur: 'buyume', icermeli: ['Kilo 8,3 kg'], icermemeli: ['Kayma:'] },
  ],
  c: [
    { tur: 'ozet', icermeli: ['ALERJİ: Alerji: Penisilin', 'DEMİR EKSİKLİĞİ / ANEMİ notlarda', '⚠ Alerji ile çelişen ilaç: Amoksisilin'] },
    { tur: 'lab', icermeli: ['Hemoglobin: 10,2 g/dL (08.02.2026) → 12,1 g/dL (05.06.2026) — yükseliş', 'Ferritin: 6 ng/mL (08.02.2026) → 28 ng/mL (05.06.2026) — yükseliş', 'Ferritin — istendi (10.02.2026) → sonuç 05.06.2026', 'İLGİLİ TANI / NOT: demir eksikliği'], icermemeli: ['istendi, sonuç yok'] },
    { tur: 'ilac', icermeli: ['AKTİF İLAÇLAR (ilaç kaydında aktif ve süresi dolmamış):\n- Amoksisilin 250 mg/5 ml', 'SÜRESİ DOLMUŞ / TAMAMLANMIŞ — aktif sayılmadı:\n- Demir (II) sülfat', '⚠ Alerji ile çelişen ilaç: Amoksisilin', 'Penisilin'] },
    { tur: 'gozden-kacan', icermeli: ['HASTA GÜVENLİĞİ:', 'Penisilin'] },
    { tur: 'asi', icermeli: ['EKSİK / ZAMANI GELMİŞ (takvime göre, aşı tablosunda kayıt yok):\n- (yok)'] },
  ],
  d: [
    { tur: 'asi', icermeli: ['KKK (kızamık-kızamıkçık-kabakulak) 1. doz — zamanı geçmiş', '⚠ Çelişen kayıt: 10.06.2025 tarihli notta "aşıları tam" yazıyor', 'KKK'], icermemeli: ['KKK (kızamık-kızamıkçık-kabakulak) 1. doz — uygulandı'] },
    { tur: 'gozden-kacan', icermeli: ['ÇELİŞEN KAYIT:', 'KKK'] },
    { tur: 'ozet', icermeli: ['Çelişen kayıt', 'eksik / zamanı gelmiş: KKK'] },
  ],
}

describe('NOTYA-AYSE-STANDART-01 — altın beklentiler (fikstür × soru)', () => {
  for (const [k, beklentiler] of Object.entries(ALTIN) as [Anahtar, Beklenti[]][]) {
    for (const b of beklentiler) {
      it(`(${k}) Soru ${SORU_SABLONLARI[b.tur].no} ${b.tur}`, () => {
        const blok = kanitKismi(dosya(k).kanit(b.tur, b.mesaj))
        for (const s of b.icermeli) assert.ok(blok.includes(s), `(${k}/${b.tur}) içermeli: ${s}\n---\n${blok}`)
        for (const s of b.icermemeli || []) assert.ok(!blok.includes(s), `(${k}/${b.tur}) içermemeli: ${s}\n---\n${blok}`)
      })
    }
  }
})

describe('Kanıt bloğu — standart kuralları', () => {
  it('(a) amoksisilin AKTİF bölümünde değil (10 gün önce, 10 günlük kür)', () => {
    const blok = dosya('a').kanit('ilac')
    const aktif = bolum(blok, 'AKTİF İLAÇLAR')
    assert.ok(aktif.includes('(yok)'), aktif)
    assert.ok(!/amoksisilin/i.test(aktif), aktif)
  })
  it('hiçbir blok "yapılmadı" demez ve hasta adını içermez (KVKK — ad yalnız kurallar bloğunda)', () => {
    for (const k of Object.keys(FIKSTURLER) as Anahtar[]) {
      const d = dosya(k)
      for (const t of Object.keys(SORU_SABLONLARI) as SoruTuru[]) {
        const blok = d.kanit(t, 'Daha önce kulak ağrısıyla geldi mi?')
        assert.ok(!/yapılmadı|uygulanmadı|uydurdum/i.test(blok), `${k}/${t}`)
        assert.ok(!blok.includes(FIKSTURLER[k].hasta.ad), `${k}/${t} adı içeriyor`)
        assert.ok(blok.includes(`[CEVAP ŞABLONU — Soru ${SORU_SABLONLARI[t].no}]`), `${k}/${t} şablon yok`)
      }
    }
  })
  it('Soru 10 — açık iş yoksa standardın cümlesi', () => {
    const b = FIKSTURLER.b
    const temiz: HamDosya = { ...b, vizitler: b.vizitler.map((v) => ({ ...v, plan: 'D vitamini devam.' })) }
    const blok = kanitKismi(dosya(temiz).kanit('gozden-kacan'))
    assert.ok(blok.includes('Dosyada şu anda belirgin bir açık güvenlik problemi veya takip edilmemiş önemli bulgu saptamadım.'), blok)
  })
  it('Soru 8 — gelişim sorusu yalnız pediatri parametresinde (erişkin kardiyoloji hastasına GİDR yok)', () => {
    const eriskin: HamDosya = { ...FIKSTURLER.c, brans: 'Kardiyoloji', hasta: { ...FIKSTURLER.c.hasta, dogumIso: '1970-01-01' } }
    const d = dosya(eriskin)
    const blok = kanitKismi(d.kanit('gelisim'))
    assert.ok(blok.includes('bu branşın bölüm sorusu değil'), blok)
    assert.ok(!/GİDR yaş basamağı|M-CHAT-R\/F uygulayın/.test(blok), blok)
    assert.equal(parametreSec('Kardiyoloji', '1970-01-01', DENETIM_BUGUN), TEMEL_SORGU)
  })
  it('Soru 4 — erişkin / tanımsız branş: takvim yok cümlesi (uydurma eksik aşı yok)', () => {
    const eriskin: HamDosya = { ...FIKSTURLER.d, brans: 'Dahiliye', hasta: { ...FIKSTURLER.d.hasta, dogumIso: '1980-05-05' } }
    const blok = dosya(eriskin).kanit('asi')
    assert.ok(blok.includes('erişkin aşı takvimi parametreleri henüz tanımlı değil'), blok)
    assert.ok(!blok.includes('zamanı geçmiş'), blok)
    const buyume = dosya(eriskin).kanit('buyume')
    assert.ok(/Kilo: 12,5 kg \(10\.06\.2025\) → 14,6 kg/.test(buyume), buyume)
  })
  it('Göz hekimi çocuk hastada pediatri parametresi almaz; aile hekimi alır (pediatrikBaglamMi)', () => {
    assert.equal(parametreSec('Göz Hastalıkları', '2024-07-20', DENETIM_BUGUN), TEMEL_SORGU)
    assert.equal(parametreSec('Aile Hekimliği', '2024-07-20', DENETIM_BUGUN).anahtar, 'pediatri')
    assert.equal(parametreSec('Pediatri', null, DENETIM_BUGUN).anahtar, 'pediatri')
  })
  it('kurallar bloğu: GENEL KURALLAR + CEVAP STANDARDI + ad ilk cümlede', () => {
    const k = dosyaSorguKuralBlogu('QA Çocuk A DENETIM-A')
    for (const g of GENEL_KURALLAR) assert.ok(k.includes(g))
    assert.ok(k.includes('ÖNCE DOĞRUDAN CEVAP'))
    assert.ok(k.includes('"QA Çocuk A DENETIM-A" adıyla başlar'))
    assert.ok(k.includes('"yapılmadı" DEME'))
  })
})

describe('acikIsleriBul — öncelik ve kayıt kuralı', () => {
  it('(a) bugün: planlanmış Hep B + istenmiş ferritin + gecikmiş kontrol; yakında: büyüme, M-CHAT, tekrarlayan otit', () => {
    const i = dosya('a').isler()
    const bugun = i.bugun.map((x) => x.metin).join('\n')
    const yakinda = i.yakinda.map((x) => x.metin).join('\n')
    assert.ok(bugun.includes('Hepatit B 2. doz — planlandı'), bugun)
    assert.ok(bugun.includes('Ferritin — istendi, sonuç yok'), bugun)
    assert.ok(bugun.includes('Kontrol 26.09.2026 için planlanmıştı'), bugun)
    assert.ok(/Kilo persentili p53 → p10.*aşağı/.test(yakinda), yakinda)
    assert.ok(yakinda.includes('M-CHAT-R/F) planlandı'), yakinda)
    assert.ok(yakinda.includes('Tekrarlayan patern: Otit'), yakinda)
    // Hep B 2. doz hem "planlandı" hem "eksik" diye iki kez sayılmaz.
    assert.equal(i.bugun.filter((x) => x.metin.startsWith('Hepatit B 2. doz')).length, 1, bugun)
  })
  it('(b) sağlıklı bebek: yalnız açık kontrol', () => {
    const i = dosya('b').isler()
    assert.equal(i.bugun.length, 1, JSON.stringify(i))
    assert.equal(i.bugun[0].tur, 'kontrol-planli')
    assert.equal(i.yakinda.length, 0, JSON.stringify(i.yakinda))
  })
  it('(c) alerji-reçete çatışması güvenlik maddesidir', () => {
    const g = dosya('c').isler().bugun.find((x) => x.guvenlik)
    assert.ok(g && /Amoksisilin/.test(g.metin) && /Penisilin/.test(g.metin), JSON.stringify(g))
  })
  it('(d) çelişen kayıt bugün listesinde', () => {
    assert.ok(dosya('d').isler().bugun.some((x) => x.tur === 'celiski' && x.metin.includes('KKK')))
  })
  it('kayıt yoksa tamamlanmış sayılmaz: sonraki notta "yapıldı" yazması aşı satırı değildir', () => {
    const ham: HamDosya = {
      ...FIKSTURLER.a,
      vizitler: [...FIKSTURLER.a.vizitler, { id: 'a-v5', tarih: '2026-09-20T10:00:00Z', subjektif: 'Kontrol.', plan: 'Hepatit B 2. doz yapıldı.' }],
    }
    const hep = dosya(ham).isler().bugun.find((x) => x.tur === 'asi-plan-kaydi-yok')
    assert.ok(hep && hep.metin.includes('aşı tablosunda uygulama satırı yok'), JSON.stringify(hep))
  })
})

describe('planIfadesi — planlandı / istendi / uygulandı ayrımı', () => {
  const vakalar: [string, string, string][] = [
    ['Bugün Hepatit B 2. dozunu yapacağız.', 'asi', 'planlandi'],
    ['Hepatit B 2. doz uygulandı.', 'asi', 'uygulandi'],
    ['KKK aşısı önerildi.', 'asi', 'onerildi'],
    ['Ferritin istendi.', 'lab', 'istendi'],
    ['Hemogram bakılacak.', 'lab', 'istendi'],
    ['M-CHAT planlandı.', 'tarama', 'planlandi'],
    ['Çocuk nöroloji konsültasyonu istendi.', 'konsultasyon', 'istendi'],
    ['1 hafta sonra kontrol.', 'kontrol', 'randevu'],
    ['Amoksisilin başlandı.', 'ilac', 'recete'],
    ['Aşı ateş nedeniyle yapılmadı.', 'asi', 'belirsiz'],
    ['Batın USG istendi.', 'goruntuleme', 'istendi'],
  ]
  for (const [cumle, konu, durum] of vakalar) {
    it(`"${cumle}" → ${konu}/${durum}`, () => {
      const p = planIfadesiSinifla(cumle)
      assert.ok(p, cumle)
      assert.equal(p!.konu, konu)
      assert.equal(p!.durum, durum)
    })
  }
  it('fiilsiz parça sonraki fiili alır; lab kalemleri ayrı olay', () => {
    const p = planIfadeleriniCikar('Ferritin ve hemogram istendi.')
    assert.equal(p.length, 2)
    assert.deepEqual(p[0].labAnahtarlari, ['Ferritin'])
    assert.ok(p[1].labAnahtarlari!.includes('Hb'))
    assert.ok(p.every((x) => x.durum === 'istendi'))
  })
  it('"10 gün sonra kontrol" sayısı korunur; düz "Kontrol." plan değildir', () => {
    assert.equal(planIfadesiSinifla('10 gün sonra kontrol.')!.cumle, '10 gün sonra kontrol')
    assert.equal(planIfadesiSinifla('Kontrol.'), null)
  })
  it('Hep B serolojisi aşı değil lab', () => {
    assert.equal(planIfadesiSinifla('Hepatit B serolojisi istendi.')!.konu, 'lab')
  })
  it('aşı beyanı', () => {
    assert.ok(asiTamBeyaniMi('Aşıları tam, sağlam çocuk kontrolü.'))
    assert.ok(!asiTamBeyaniMi('Aşı takvimi soruldu.'))
  })
})

describe('ilacDurumu — okuma anında durum', () => {
  it('süresi dolan kür tamamlandı; akut ilaç süresiz ve eski → belirsiz; kesilen → kesildi; kronik → aktif', () => {
    assert.equal(ilacDurumu({ ilac_adi: 'Amoksisilin', kullanim_sikli: '2x1, 10 gün', baslangic_tarihi: '2026-09-16', aktif: true }, DENETIM_BUGUN).durum, 'tamamlandi')
    assert.equal(ilacDurumu({ ilac_adi: 'Amoksisilin', kullanim_sikli: '2x1, 10 gün', baslangic_tarihi: '2026-09-20', aktif: true }, DENETIM_BUGUN).durum, 'aktif')
    assert.equal(ilacDurumu({ ilac_adi: 'Azitromisin', kullanim_sikli: '1x1', baslangic_tarihi: '2026-05-01', aktif: true }, DENETIM_BUGUN).durum, 'belirsiz')
    assert.equal(ilacDurumu({ ilac_adi: 'Montelukast', kullanim_sikli: '1x1', baslangic_tarihi: '2026-01-01', aktif: false, bitis_tarihi: '2026-06-01' }, DENETIM_BUGUN).durum, 'kesildi')
    assert.equal(ilacDurumu({ ilac_adi: 'Levotiroksin', kullanim_sikli: '1x1', baslangic_tarihi: '2025-01-01', aktif: true }, DENETIM_BUGUN).durum, 'aktif')
    assert.equal(ilacDurumu({ ilac_adi: 'Demir damla', kullanim_sikli: '1x1, 3 ay', baslangic_tarihi: '2026-02-10', aktif: true }, DENETIM_BUGUN).durum, 'tamamlandi')
  })
})

describe('soruTuruBul — 10 kanonik soru + paraphrase + tek bilgilik sorular', () => {
  const vakalar: [string, SoruTuru | null][] = [
    ['Bu hastayı bana kısaca özetler misin?', 'ozet'],
    ['Hocam şey, bu çocuğu kısaca anlatır mısın', 'ozet'],
    ['Son muayeneden bu yana neler değişmiş?', 'degisim'],
    ['Geçen seferden beri ne değişti?', 'degisim'],
    ['Büyümesi nasıl gidiyor?', 'buyume'],
    ['Kilo alıyor mu?', 'buyume'],
    ['Persentili nasıl?', 'buyume'],
    ['Aşıları yaşına göre tam mı? Eksik aşısı var mı?', 'asi'],
    ['Ayşe aşı karnesi nasıl', 'asi'],
    ['Aşı durumu ne?', 'asi'],
    ['Son lab sonuçlarında dikkat etmem gereken bir şey var mı?', 'lab'],
    ['Tahlillerine baktın mı?', 'lab'],
    ['Şu anda kullandığı ilaçlar neler ve dozları nedir?', 'ilac'],
    ['Hangi ilaçları kullanıyor?', 'ilac'],
    ['Daha önce aynı şikayetle geldi mi?', 'benzer'],
    ['Daha önce kulak ağrısıyla geldi mi?', 'benzer'],
    ['Benzer bir şikayeti olmuş muydu', 'benzer'],
    ['Gelişimi yaşına uygun mu?', 'gelisim'],
    ['Konuşuyor mu?', 'gelisim'],
    ['M-CHAT yapılmış mı?', 'gelisim'],
    ['Bugün yapmam veya takip etmem gereken bir şey var mı?', 'takip'],
    ['Bekleyen bir şey var mı?', 'takip'],
    ['Gözümden kaçabilecek önemli bir şey var mı?', 'gozden-kacan'],
    ['Atladığım bir şey var mı Ayşe?', 'gozden-kacan'],
    // Tek bilgilik → HIZLI KART / kimlik yolu (null)
    ['Kan grubu ne?', null],
    ['Alerjisi var mı?', null],
    ['Son vizit ne zaman?', null],
    ['Annesinin telefonu ne?', null],
    ['Kilosu kaç?', null],
    ['Merhaba Ayşe', null],
  ]
  for (const [m, beklenen] of vakalar) {
    it(`"${m}" → ${beklenen}`, () => assert.equal(soruTuruBul(m), beklenen))
  }
})

describe('sikayetEsanlam', () => {
  it('≥ 25 grup; otit grubu Dr. Gökhan eşdeğerlerini kapsar', () => {
    assert.ok(SIKAYET_GRUPLARI.length >= 25, String(SIKAYET_GRUPLARI.length))
    const t = esanlamGenislet('kulak ağrısı')
    for (const x of ['otit', 'aom', 'otalji', 'kulak cekistir', 'tm hiperem', 'tm bombe', 'orta kulak enfeksiyon']) assert.ok(t.includes(x), x)
  })
  it('kısaltma tam sözcük: "görme" GÖR değildir, "AOM\'u" AOM\'dur', () => {
    assert.ok(!esanlamGruplariBul('görme taraması').some((g) => g.id === 'reflu'))
    assert.ok(esanlamGruplariBul("AOM'u var").some((g) => g.id === 'otit'))
    assert.ok(esanlamGruplariBul('ateşi var').some((g) => g.id === 'ates'))
  })
})

describe('ayseCevapla bağlantısı (kaynak metin)', () => {
  const kaynak = readFileSync(new URL('../ayseCevapla.ts', import.meta.url), 'utf8')
  it('dosya sorusu HIZLI KART yolunu atlar, kanıt + kurallar dosyaEk\'e girer', () => {
    assert.ok(kaynak.includes('soruTuruBul(String(message || ""))'))
    assert.ok(kaynak.includes('const kesinHam = sorgu ? null : dosyaSoruCevap('))
    assert.ok(kaynak.includes('dosyaSorguKuralBlogu(aktifAd)'))
    assert.ok(kaynak.includes('kanitBlogu(soruTuru, sorgu.olaylar, sorgu.hasta'))
  })
})

describe('canlı denetim puanlayıcısı (puanla.ts)', () => {
  it('10 soru standart sırasıyla', () => {
    assert.deepEqual(DENETIM_SORULARI.map((s) => SORU_SABLONLARI[s.tur].no), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
  it('iyi cevap tam puan; "yapılmadı" ve "uydurdum" puan kaybettirir', () => {
    const iyi = cevabiPuanla('asi', 'QA Çocuk A için Hepatit B ikinci dozu planlanmış; uygulandığına dair kayıt bulamadım.\n**Dayanak:** 16.09.2026 notu.', { hastaAdi: 'QA Çocuk A' })
    assert.equal(iyi.puan, iyi.azami, JSON.stringify(iyi.kurallar))
    const kotu = cevabiPuanla('asi', 'Hepatit B ikinci dozu yapılmadı. Önceki listeyi uydurdum.')
    assert.ok(kotu.puan < kotu.azami)
    assert.ok(kotu.kurallar.some((k) => !k.gecti && k.kural.includes('yapılmadı')))
    assert.ok(kotu.kurallar.some((k) => !k.gecti && k.kural.includes('uydurdum')))
  })
  it('açık iş sorusunda Dikkat/Takip bölümü aranır', () => {
    const p = cevabiPuanla('takip', 'QA Çocuk A için bugün iki açık iş var.\n- Ferritin sonucu yok.')
    assert.ok(p.kurallar.some((k) => !k.gecti && k.kural.includes('Dikkat')))
  })
})
