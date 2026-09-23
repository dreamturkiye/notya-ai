import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CEK_LISTE_SORU,
  cekAnahtarVar,
  cekBlokDegistir,
  cekBlokSil,
  cekBlokVarMi,
  cekHekimIsaretleri,
  cekListeAsistanCevabi,
  cekListeDogrula,
  cekListeDogrulamaMetni,
  cekListePromptBlogu,
  cekListeSorulduMu,
  cekNotMetni,
  cekOncekiKarsilanan,
  muayeneCekListesi,
} from './muayeneCekListesi'
import { TARAMA_ANAHTARLARI, taramaBuVizitte } from '@/specialties/pediatri/engines/saglamCocukCek'
import { taramaNotSatiri } from '@/specialties/pediatri/engines/gelisimPlan'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

describe('muayene çek listesi — evrensel kutu, branşa özel madde', () => {
  it('Gökhan pediatri listesinde baş çevresi / aşı var; KD ve kardiyolojide yok', () => {
    const ped = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: '2022-01-01' })
    const kd = muayeneCekListesi({ seansBransi: 'kadin-hastaliklari-dogum', hastaDogumIso: '2022-01-01' })
    const kar = muayeneCekListesi({ seansBransi: 'kardiyoloji', hastaDogumIso: '2022-01-01' })
    assert.ok(ped.some((m) => m.id === 'basCevresi'))
    assert.ok(ped.some((m) => m.id === 'asi'))
    assert.ok(ped.some((m) => m.id === 'sikayet'))
    assert.ok(!kd.some((m) => m.id === 'basCevresi' || m.id === 'asi'))
    assert.ok(kd.some((m) => m.id === 'sat' || m.id === 'jine'))
    assert.ok(!kar.some((m) => m.id === 'basCevresi' || m.id === 'asi'))
    assert.ok(kar.some((m) => m.id === 'oskultasyon'))
  })

  it('göz VA/GİB taşır, baş çevresi taşımaz; branşsız yalnız ortak anamnez', () => {
    const goz = muayeneCekListesi({ seansBransi: 'goz-hastaliklari' })
    const bos = muayeneCekListesi({})
    assert.ok(goz.some((m) => m.id === 'va'))
    assert.ok(!goz.some((m) => m.id === 'basCevresi'))
    assert.ok(bos.some((m) => m.id === 'sikayet'))
    assert.ok(!bos.some((m) => m.id === 'basCevresi'))
  })

  it('hekim işareti veya dosya anahtarı doğrular; uydurma yok', () => {
    const maddeler = muayeneCekListesi({ seansBransi: 'pediatri' })
    const d = cekListeDogrula(maddeler, {
      transcript: 'Şikayet: öksürük üç gündür. Boğaz hiperemik.',
      isaretler: { kilo: true },
    })
    assert.equal(d.find((s) => s.id === 'kilo')?.durum, 'hekim')
    assert.equal(d.find((s) => s.id === 'sikayet')?.durum, 'dosyada')
    assert.equal(d.find((s) => s.id === 'basCevresi')?.durum, 'eksik')
    const metin = cekListeDogrulamaMetni(d)
    assert.match(metin, /Baş çevresi/)
    assert.match(metin, /uydurulmadı/)
  })

  it('hazır soru yakalanır; SOAP promptu gövdeye uydurmayı yasaklar', () => {
    assert.equal(cekListeSorulduMu(CEK_LISTE_SORU), true)
    assert.equal(cekListeSorulduMu('çek listesini göster'), true)
    assert.equal(cekListeSorulduMu('alerjisi var mı'), false)
    const p = cekListePromptBlogu(muayeneCekListesi({ seansBransi: 'dahiliye' }), {})
    assert.match(p, /uydurma YASAK/)
    assert.match(p, /aiDegerlendirme/)
  })

  it('Ayşe cevabı madde listeler; boş branş uydurmaz', () => {
    const c = cekListeAsistanCevabi(muayeneCekListesi({ seansBransi: 'pediatri' }))
    assert.match(c, /Baş çevresi/)
    assert.match(c, /Aşı/)
    assert.match(cekListeAsistanCevabi([]), /henüz önerilen/)
  })

  it('UI ve seans omurgası evrensel kutuyu kullanır; pediatri sızıntısı yok', () => {
    const ui = readFileSync(new URL('../../components/doktor/MuayeneCekListesi.tsx', import.meta.url), 'utf8')
    const seans = readFileSync(new URL('../../app/session/new/page.tsx', import.meta.url), 'utf8')
    const ayse = readFileSync(new URL('../../components/doktor/HastaKonsult.tsx', import.meta.url), 'utf8')
    const css = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8')
    assert.match(ui, /CEK_LISTE_BASLIK/)
    assert.match(ui, /data-cek-toggle/)
    assert.match(ui, /data-cek-govde/)
    assert.match(seans, /MuayeneCekListesi/)
    assert.match(seans, /notya-seans-sayfa/)
    assert.match(seans, /notya-seans-aksiyon/)
    assert.match(ayse, /CEK_LISTE_SORU/)
    assert.match(css, /data-cek-govde/)
    assert.match(css, /notya-seans-aksiyon/)
    assert.ok(!/Baş Çevresi/.test(ui))
    assert.ok(!/Baş Çevresi/.test(seans))
    assert.match(seans, /cekListeSifirla/)
    assert.match(seans, /hastaDogumIso/)
  })

  it('yenidoğanda göbek / NTP / 1. hafta izlemi var; 4 yaşta yok; KD yenidoğana sızmaz', () => {
    const gun = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)
    const yenidogan = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: gun(3) })
    const dortYas = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: gun(4 * 365) })
    const kdBebek = muayeneCekListesi({ seansBransi: 'kadin-hastaliklari-dogum', hastaDogumIso: gun(3) })
    assert.ok(yenidogan.some((m) => m.id === 'sc_gobek'))
    assert.ok(yenidogan.some((m) => m.id === 'sc_ntp'))
    assert.ok(yenidogan.some((m) => m.id === 'sc_izlem_hafta1' || /1\.\s*hafta/i.test(m.etiket)))
    assert.ok(yenidogan.some((m) => m.id === 'basCevresi'))
    assert.ok(!dortYas.some((m) => m.id === 'sc_gobek' || m.id === 'sc_ntp'))
    assert.ok(dortYas.some((m) => m.id === 'basCevresi'))
    assert.ok(!kdBebek.some((m) => String(m.id).startsWith('sc_')))
    assert.ok(!kdBebek.some((m) => m.id === 'basCevresi'))
  })

  it('18 aylıkta otizm / M-CHAT hatırlatması var, göbek yok', () => {
    const onsekizIso = new Date(Date.now() - Math.round(18 * 30.4375) * 86_400_000).toISOString().slice(0, 10)
    const onsekiz = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: onsekizIso })
    assert.ok(onsekiz.some((m) => /otizm|M-CHAT/i.test(m.etiket)))
    assert.ok(!onsekiz.some((m) => m.id === 'sc_gobek'))
  })
})

describe('NOTYA-CEK-DOGRULA-02 — çek listesi doğru ve canlı', () => {
  const ZIYARET = '2024-06-15T06:00:00+00:00'
  const ISITME = { tur: 'isitme' as const, tarih: '2024-05-17', sonuc: 'normal' as const }
  const IKI_HAFTA_NOTU = cekNotMetni({
    subjektif: 'Şikayet: 2 haftalık erkek bebeğin rutin sağlam çocuk kontrolü. Göbek düşmüş, göbek bakımı anlatıldı.',
    objektif: 'Batın: Yumuşak. Göbek bölgesinde enfeksiyon bulgusu yok.',
  })
  const bir = (fizik: string) => cekNotMetni({
    subjektif: 'Şikayet: 1 aylık erkek bebeğin rutin sağlam çocuk kontrolü. Özgeçmiş: D vitamini 400 IU/gün kullanıyor.',
    objektif: `Genel durum: iyi. Ön fontanel yaşına uygun. Sarılık yok.\n\n${fizik}`,
    plan: '1. D vitamini 400 IU/gün — devam',
  })
  const ALTI = ['sc_tarama_isitme', 'sc_tarama_dvit', 'sc_tarama_isitme_risk', 'sc_tarama_gidr', 'sc_gobek', 'sc_kalca']

  // Gökhan'ın hastasının kartındaki doğum tarihi vizit günüyle aynı girilmiş (yaş 0 gün → yenidoğan bandı);
  // gerçek 1 aylık bebek (2024-05-15) de aynı sonucu vermeli.
  for (const dogum of ['2024-05-15', '2024-06-15']) {
    it(`Gökhan 1 aylık vizit (doğum ${dogum}): altı madde karşılanır, kalça cümlesi silinince kalça geri gelir`, () => {
      const maddeler = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: dogum, referansIso: ZIYARET, pediKayitlari: { taramalar: [ISITME] } })
      const dosya = [IKI_HAFTA_NOTU, taramaNotSatiri(ISITME.tur, ISITME.sonuc, ISITME.tarih)].join('\n')
      const oncekiIdler = cekOncekiKarsilanan(maddeler, dosya)
      assert.ok(!maddeler.some((m) => /GİDR/.test(m.etiket)), 'GİDR 6–9 ay 1 aylıkta listelenmez')
      assert.ok(!maddeler.some((m) => m.id === 'sc_tarama_isitme'), 'kayıtlı işitme taraması tamam — listelenmez')

      const tam = cekListeDogrula(maddeler, { soap: bir('Kalça muayenesi yapıldı ortolani barlow negatif'), oncekiIdler })
      const eksik = tam.filter((s) => s.durum === 'eksik').map((s) => s.id)
      for (const id of ALTI) assert.ok(!eksik.includes(id), `${id} eksik kalmamalı (eksikler: ${eksik.join(', ')})`)
      assert.equal(tam.find((s) => s.id === 'sc_tarama_dvit')?.durum, 'dosyada')
      assert.equal(tam.find((s) => s.id === 'sc_gobek')?.durum, 'onceki')
      assert.equal(tam.find((s) => s.id === 'sc_tarama_isitme_risk')?.durum, 'onceki')
      assert.match(cekListeDogrulamaMetni(tam), /✓ önceki kayıtta var/)

      const kalcasiz = cekListeDogrula(maddeler, { soap: bir(''), oncekiIdler })
      assert.equal(kalcasiz.find((s) => s.id === 'sc_kalca')?.durum, 'eksik', 'kalça vizit kapsamı — önceki not saymaz')
    })
  }

  it('dosya kapsamı: önceki kayıt yalnız "dosya" maddelerini karşılar; kalça (vizit) önceki notta olsa da eksik', () => {
    const maddeler = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: '2024-05-15', referansIso: ZIYARET })
    const onceki = cekOncekiKarsilanan(maddeler, 'Kalça muayenesinde Ortolani ve Barlow negatif. Göbek düştü. Soygeçmiş: ailede özellik yok.')
    assert.ok(onceki.includes('sc_gobek'))
    assert.ok(onceki.includes('soygecmis'))
    assert.ok(!onceki.includes('sc_kalca'))
    assert.equal(maddeler.find((m) => m.id === 'sc_kalca')?.kapsam, 'vizit')
    assert.equal(maddeler.find((m) => m.id === 'sc_tarama_dvit')?.kapsam, 'dosya')
  })

  it('surekli: gelecekteki pencereler listelenmez; pencere gelince listelenir, kayıt varsa düşer', () => {
    assert.equal(taramaBuVizitte({ durum: 'surekli', pencere: 'en az 3 kez: 6–9 ay · 18. ay · 24–36 ay' }), false)
    assert.equal(taramaBuVizitte({ durum: 'yaklasiyor', pencere: '4. aydan 12. aya' }), false)
    assert.equal(taramaBuVizitte({ durum: 'surekli', pencere: 'her izlemde' }), true)
    assert.equal(taramaBuVizitte({ durum: 'tamam', pencere: 'her izlemde (0–10 yaş)' }), false)
    assert.equal(taramaBuVizitte({ durum: 'gecikti', pencere: '0–30. gün' }), true)
    const yedi = '2024-12-20'
    const gidr = (k?: { tarih: string }[]) => muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: '2024-05-15', referansIso: yedi, pediKayitlari: k ? { gidr: k } : null })
      .some((m) => m.id === 'sc_tarama_gidr')
    assert.equal(gidr(), true, '7 aylıkta GİDR 6–9 ay vadesi geldi')
    assert.equal(gidr([{ tarih: '2024-12-01' }]), false, 'pencerede GİDR kaydı var')
    // 1 aylıkta demir (4. ay) ve 9. ay Hb listelenmez
    const ay1 = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: '2024-05-15', referansIso: ZIYARET })
    assert.ok(!ay1.some((m) => m.id === 'sc_tarama_demir' || m.id === 'sc_tarama_hb' || m.id === 'sc_tarama_otizm'))
    assert.ok(!ay1.some((m) => m.id.startsWith('sc_izlem_sonraki')))
  })

  it('anahtar haritası: tarama kalemleri kod değil gerçek Türkçe terimle bulunur', () => {
    const bulur = (kod: keyof typeof TARAMA_ANAHTARLARI, metin: string) =>
      TARAMA_ANAHTARLARI[kod].anahtarlar.some((a) => cekAnahtarVar(trAramaNormalize(metin), a))
    assert.ok(bulur('dvit', 'D vitamini 400 IU/gün kullanıyor'))
    assert.ok(bulur('dvit', 'Vitamin D damla devam'))
    assert.ok(bulur('dvit', 'Kolekalsiferol 400 ünite'))
    assert.ok(bulur('isitme', 'ABR ile işitme testi bilateral geçti'))
    assert.ok(bulur('isitme', 'Yenidoğan işitme taraması: normal'))
    assert.ok(bulur('kirmizi_refle', 'Gözlerde bilateral kırmızı refleks alındı'))
    assert.ok(bulur('gidr', 'GİDR uygulandı, yaşına uygun'))
    assert.ok(bulur('gidr', 'Gelişim değerlendirmesi yapıldı'))
    assert.ok(bulur('otizm', 'M-CHAT düşük risk'))
    assert.ok(bulur('demir', 'Demir damla başlandı'))
    assert.ok(bulur('hb', 'Hb 11,2 g/dL, Htc %34'))
    assert.ok(bulur('gorme', 'Görme keskinliği Lea sembolleriyle bakıldı'))
    for (const [kod, t] of Object.entries(TARAMA_ANAHTARLARI)) {
      assert.ok(t.anahtarlar.length > 0, kod)
      // Kelime olmayan kodlar (dvit, isitme_risk…) klinik metinde geçmez — anahtar olamaz ("gorme", "demir" Türkçe kelime).
      if (kod === 'dvit' || kod.includes('_')) assert.ok(!t.anahtarlar.includes(kod), `${kod}: kalem kodu anahtar olamaz`)
    }
    assert.ok(!bulur('dvit', 'dvit'), 'kod metinde anlamsız')
    assert.equal(cekAnahtarVar(trAramaNormalize('hastası iyi'), 'asi'), false, 'kelime içi eşleşme yok')
    assert.equal(cekAnahtarVar(trAramaNormalize('Kalçada ortolani negatif'), 'kalca'), true)
  })

  it('blok: LLM kopyası silinir, güncel metin yerine konur, hekim işaretleri geri okunur', () => {
    const maddeler = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: '2024-05-15', referansIso: ZIYARET })
    const eski = cekListeDogrulamaMetni(cekListeDogrula(maddeler, { soap: '', isaretler: { kilo: true } }))
    const ai = `${eski}\n\nÖneri (doktor onayına tabi):\n- Kilo artışı uygun.`
    assert.ok(cekBlokVarMi(ai))
    assert.deepEqual(cekHekimIsaretleri(ai, maddeler), { kilo: true })
    const sil = cekBlokSil(ai)
    assert.ok(!/ÇEK LİSTESİ/.test(sil) && !/✗ eksik/.test(sil))
    assert.match(sil, /^Öneri \(doktor onayına tabi\):/)
    const yeni = cekListeDogrulamaMetni(cekListeDogrula(maddeler, { soap: bir('Kalça: ortolani barlow negatif'), isaretler: { kilo: true } }))
    const d = cekBlokDegistir(ai, yeni)
    assert.equal((d.match(/ÇEK LİSTESİ DOĞRULAMA/g) || []).length, 1)
    assert.match(d, /Kalça muayenesi \(gelişimsel kalça\): ✓ notta var/)
    assert.match(d, /Kilo artışı uygun\./)
    // Blok yoksa başa eklenir; iki kez uygulamak aynı sonucu verir
    assert.equal(cekBlokDegistir('Öneri: x', yeni), `${yeni}\n\nÖneri: x`)
    assert.equal(cekBlokDegistir(d, yeni), d)
  })

  it('tek kaynak: sayfa, onay ve not üretimi aynı fonksiyonu kullanır; LLM bloğu yazamaz', () => {
    const oku = (y: string) => readFileSync(new URL(`../../${y}`, import.meta.url), 'utf8')
    const sayfa = oku('app/dashboard/doktor/notlar/[id]/page.tsx')
    const onay = oku('app/api/notes/[id]/approve/route.ts')
    const son = oku('app/api/sessions/[id]/end/route.ts')
    const get = oku('app/api/notes/[id]/route.ts')
    const konsult = oku('app/api/doktor/not-konsult/route.ts')
    assert.match(sayfa, /cekListeDogrula\(/)
    assert.match(sayfa, /cekBlokDegistir\(/)
    for (const r of [onay, son, get]) assert.match(r, /cekListeVerisiYukle\(/)
    assert.match(onay, /cekBlokDegistir\(/)
    assert.match(konsult, /cekBlokSil\(/)
    assert.match(son, /cekBlokSil\(/)
  })
})
