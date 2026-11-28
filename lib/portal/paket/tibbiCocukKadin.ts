/**
 * BRANS-PAKETI Phase 2 — pediatri and kadın hastalıkları-doğum signature modules (Notya's first market, batch a).
 * Every timeline / checklist is a STARTING TEMPLATE the treating physician accepts (and may edit) before any patient sees
 * it (brans_paket_sablon.kabul_at). Sources and what could not be confirmed: docs/kaynak/TIBBI-BRANS-PAKETI-ARASTIRMA.md.
 *
 * Pediatri: the parent reads the page → every module is `yas: 'cocuk'` (veli wording only under 18, veliDiliMi; an
 * unknown age is treated as adult and gets none of it). It builds ON the existing Büyüme / hedef boy / aşı views (Takip,
 * Aşı Bilgilendirme, Aşı Karnesi) and the fever–medicine card on Bugün — it does not repeat growth numbers or doses.
 * KD: the pregnancy journey starts from the ACTIVE pregnancy record (gebelikler.sat) and builds on Gebeliğim (week,
 * TDT, izlem) — blood pressure stays on Bugün (KD pregnancy thresholds), the PMS/PMDD diary stays KD-TARAMA-01.
 * No diagnosis, no dose, 112 on every acil line.
 */
import type { PaketModulTanimi } from '../bransPaketi'
import { ACIL_112, ANAFILAKSI_ALANI, ANAFILAKSI_BAYRAGI, KRIZ_ALANI, KRIZ_BAYRAGI } from './ortak'

const GELISIM_NOT = 'Her çocuk kendi hızında gelişir; bu liste bir yarış değildir. İşaretleyemediğiniz bir madde varsa bir sonraki kontrolde hekiminize söyleyin. Çocuğunuzun daha önce yaptığı bir beceriyi kaybettiğini fark ederseniz kontrolü beklemeden hekiminize yazın.'

// ─── Pediatri ───────────────────────────────────────────────────────────────────────────────────────────────────────
export const PEDIATRI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'ped-hasta-gun', brans: 'pediatri', tur: 'gunluk', yas: 'cocuk', baslik: 'Hasta gün günlüğü',
    aciklama: 'Çocuğunuz ateşli ya da hasta olduğu günlerde bir dakikada doldurun. Tehlike işaretlerinden birini seçerseniz ne yapmanız gerektiğini hemen gösterir.',
    varsayilan: {
      alanlar: [
        { id: 'ates', etiket: '38 °C ve üzeri ateş', tur: 'evet' },
        { id: 'sivi', etiket: 'Sıvı almayı reddediyor ya da çok az içiyor', tur: 'evet' },
        { id: 'idrar', etiket: 'Her zamankinden çok daha az idrar yapıyor (bezler kuru)', tur: 'evet' },
        { id: 'kusma', etiket: 'Tekrarlayan kusma', tur: 'evet' },
        { id: 'halsiz', etiket: 'Çok halsiz, uyandırmakta zorlanıyorum ya da tepkisiz', tur: 'evet' },
        { id: 'nefes', etiket: 'Hızlı ya da zor nefes alıyor, göğüs içe çekiliyor ya da inliyor', tur: 'evet' },
        { id: 'dokuntu', etiket: 'Üzerine bardak bastırınca solmayan, morumsu döküntü', tur: 'evet' },
        { id: 'nobet', etiket: 'Havale (nöbet) geçirdi', tur: 'evet' },
        { id: 'not', etiket: 'Hekiminize not', tur: 'metin' },
      ],
      bayraklar: [
        { id: 'halsiz', kosullar: [{ alan: 'halsiz', evet: true }], duzey: 'acil', hasta: `Çok halsiz ya da uyandırılması zor bir çocuk acil değerlendirilmelidir: hemen ${ACIL_112}`, hekim: 'Hasta gün günlüğü: letarji / uyandırma güçlüğü.' },
        { id: 'nefes', kosullar: [{ alan: 'nefes', evet: true }], duzey: 'acil', hasta: `Zor ya da hızlı nefes, göğüste içe çekilme acildir: hemen ${ACIL_112}`, hekim: 'Hasta gün günlüğü: solunum sıkıntısı (çekilme / inleme).' },
        { id: 'dokuntu', kosullar: [{ alan: 'dokuntu', evet: true }], duzey: 'acil', hasta: `Bastırınca solmayan döküntü acildir: beklemeden ${ACIL_112}`, hekim: 'Hasta gün günlüğü: solmayan (peteşiyal / purpurik) döküntü.' },
        { id: 'nobet', kosullar: [{ alan: 'nobet', evet: true }], duzey: 'acil', hasta: `Nöbet geçiren çocuğu yan yatırın, ağzına bir şey koymayın ve ${ACIL_112}`, hekim: 'Hasta gün günlüğü: nöbet.' },
        { id: 'susuz', kosullar: [{ alan: 'sivi', evet: true }, { alan: 'idrar', evet: true }], duzey: 'hekime_bildir', hasta: 'Az içip az idrar yapması susuz kalma belirtisi olabilir. Hekiminize ilettik; bugün ulaşın. Ağız kuruluğu, gözyaşsız ağlama ya da halsizlik olursa acile gidin.', hekim: 'Hasta gün günlüğü: sıvı alımı ve idrar azalmış (dehidratasyon?).' },
        { id: 'ates-kusma', kosullar: [{ alan: 'ates', evet: true }, { alan: 'kusma', evet: true }], duzey: 'hekime_bildir', hasta: 'Ateş ve tekrarlayan kusmayı hekiminize ilettik. Sıvıyı az az ve sık verin; kötüleşirse acile gidin.', hekim: 'Hasta gün günlüğü: ateş + tekrarlayan kusma.' },
      ],
      not: 'Ateş düşürücüyü hekiminizin ya da Bugün sayfasındaki ateş kartının tarif ettiği şekilde verin.',
    },
    kaynaklar: ['NICE-NG143', 'SB-IZLEM-PROTOKOLU', 'REPO-ATES-KARTI'],
  },
  {
    kod: 'ped-yenidogan', brans: 'pediatri', tur: 'gunluk', yas: 'cocuk', yasAy: [0, 3], baslik: 'İlk üç ay günlüğü',
    aciklama: 'Yenidoğan döneminin önemli işaretleri. Üç aydan küçük bir bebekte ateş her zaman acildir.',
    varsayilan: {
      alanlar: [
        { id: 'ates', etiket: '38 °C ve üzeri ateş', tur: 'evet' },
        { id: 'emme', etiket: 'Emmesi belirgin azaldı ya da emmiyor', tur: 'evet' },
        { id: 'sarilik', etiket: 'Sarılık artıyor ya da avuç içi / ayak tabanına yayıldı', tur: 'evet' },
        { id: 'gobek', etiket: 'Göbek çevresinde kızarıklık ya da kötü kokulu akıntı', tur: 'evet' },
        { id: 'uyku', etiket: 'Uykuya meyilli, uyandırmakta zorlanıyorum', tur: 'evet' },
        { id: 'kusma', etiket: 'Kusma (her beslenmeden sonra ya da fışkırır gibi)', tur: 'evet' },
        { id: 'ishal', etiket: 'İshal', tur: 'evet' },
        { id: 'islakBez', etiket: 'Islak bez sayısı (24 saat)', tur: 'sayi', min: 0, max: 20 },
      ],
      bayraklar: [
        { id: 'ates', kosullar: [{ alan: 'ates', evet: true }], duzey: 'acil', hasta: `Üç aydan küçük bebekte 38 °C ve üzeri ateş acildir: hemen ${ACIL_112}`, hekim: 'İlk üç ay günlüğü: < 3 ay bebekte ≥ 38 °C ateş.' },
        { id: 'uyku', kosullar: [{ alan: 'uyku', evet: true }], duzey: 'acil', hasta: `Uykuya meyilli, uyandırılması zor bir bebek acil değerlendirilmelidir: hemen ${ACIL_112}`, hekim: 'İlk üç ay günlüğü: uykuya meyil / uyandırma güçlüğü.' },
        { id: 'kusma', kosullar: [{ alan: 'kusma', evet: true }], duzey: 'hekime_bildir', hasta: 'Kusmayı hekiminize ilettik; beklemeden hekiminize başvurun. Bebek gevşek, tepkisiz ya da bezleri kuruysa acile gidin.', hekim: 'İlk üç ay günlüğü: kusma.' },
        { id: 'ishal', kosullar: [{ alan: 'ishal', evet: true }], duzey: 'hekime_bildir', hasta: 'İshali hekiminize ilettik; beklemeden hekiminize başvurun. Emmiyorsa ya da bezleri kuruysa acile gidin.', hekim: 'İlk üç ay günlüğü: ishal.' },
        { id: 'emme', kosullar: [{ alan: 'emme', evet: true }], duzey: 'hekime_bildir', hasta: 'Emmenin azalmasını hekiminize ilettik; bugün ulaşın. Bebek gevşek ya da tepkisizse acile gidin.', hekim: 'İlk üç ay günlüğü: beslenme belirgin azalmış.' },
        { id: 'sarilik', kosullar: [{ alan: 'sarilik', evet: true }], duzey: 'hekime_bildir', hasta: 'Artan sarılığı hekiminize ilettik; bugün değerlendirilmesi gerekir.', hekim: 'İlk üç ay günlüğü: sarılık artıyor / avuç içi-ayak tabanında.' },
        { id: 'gobek', kosullar: [{ alan: 'gobek', evet: true }], duzey: 'hekime_bildir', hasta: 'Göbek çevresindeki değişikliği hekiminize ilettik.', hekim: 'İlk üç ay günlüğü: göbek çevresi kızarıklık / akıntı (omfalit?).' },
      ],
    },
    kaynaklar: ['NICE-NG143', 'SB-IZLEM-PROTOKOLU'],
  },
  {
    kod: 'ped-asi-sonrasi', brans: 'pediatri', tur: 'gunluk', yas: 'cocuk', baslik: 'Aşı sonrası günlüğü',
    aciklama: 'Aşıdan sonraki iki üç gün aşı yerinde kızarıklık, hafif ateş ve huzursuzluk sık görülür ve genelde kendiliğinden geçer. Ciddi işaretlerde ne yapacağınızı burada görürsünüz.',
    varsayilan: {
      alanlar: [
        { id: 'ates', etiket: 'Ateş', tur: 'evet' },
        { id: 'sislik', etiket: 'Aşı yerinde şişlik ya da kızarıklık', tur: 'evet' },
        { id: 'aglama', etiket: 'Üç saatten uzun, teselli edilemeyen ağlama', tur: 'evet' },
        { id: 'gevsek', etiket: 'Gevşek, soluk ve tepkisiz', tur: 'evet' },
        { id: 'nobet', etiket: 'Havale (nöbet)', tur: 'evet' },
        ANAFILAKSI_ALANI,
      ],
      bayraklar: [
        ANAFILAKSI_BAYRAGI,
        { id: 'gevsek', kosullar: [{ alan: 'gevsek', evet: true }], duzey: 'acil', hasta: `Gevşek, soluk ve tepkisiz bir bebek acil değerlendirilmelidir: hemen ${ACIL_112}`, hekim: 'Aşı sonrası: hipotonik-hiporesponsif epizod şüphesi.' },
        { id: 'nobet', kosullar: [{ alan: 'nobet', evet: true }], duzey: 'acil', hasta: `Nöbet geçiren çocuğu yan yatırın ve ${ACIL_112}`, hekim: 'Aşı sonrası: nöbet.' },
        { id: 'aglama', kosullar: [{ alan: 'aglama', evet: true }], duzey: 'hekime_bildir', hasta: 'Uzun süren ağlamayı hekiminize ilettik.', hekim: 'Aşı sonrası: > 3 saat teselli edilemeyen ağlama.' },
        { id: 'ates', kosullar: [{ alan: 'ates', evet: true }], duzey: 'dikkat', hasta: 'Aşıdan sonra hafif ateş sık görülür. 48 saatten uzun sürerse ya da çocuğunuz çok huzursuzsa hekiminize yazın.', hekim: 'Aşı sonrası: ateş.' },
      ],
      not: 'Hangi aşının yapıldığı Aşı Karnesi bölümündedir.',
    },
    kaynaklar: ['SB-ASI-TAKVIMI', 'SB-ASI-SONRASI-ISTENMEYEN-ETKI'],
  },
  {
    kod: 'ped-bebek-gunu', brans: 'pediatri', tur: 'gunluk', yas: 'cocuk', yasAy: [0, 24], baslik: 'Beslenme ve uyku',
    aciklama: 'Bebeğinizin beslenme, bez ve uyku düzeni. Kontrol gününde hekiminiz bu kayıtlara birlikte bakar.',
    varsayilan: {
      alanlar: [
        { id: 'beslenme', etiket: 'Emzirme / mama sayısı (24 saat)', tur: 'sayi', min: 0, max: 24 },
        { id: 'islakBez', etiket: 'Islak bez sayısı (24 saat)', tur: 'sayi', min: 0, max: 20 },
        { id: 'uyku', etiket: 'Toplam uyku', tur: 'sayi', min: 0, max: 24, birim: 'saat' },
        { id: 'ekGida', etiket: 'Yeni denenen yiyecek', tur: 'metin' },
      ],
      not: 'Ek gıdaya hekiminizin önerdiği zamanda başlayın; yeni bir yiyeceği birkaç gün tek başına deneyin.',
    },
    kaynaklar: ['SB-IZLEM-PROTOKOLU'],
  },
  {
    kod: 'ped-gelisim-0-1', brans: 'pediatri', tur: 'liste', yas: 'cocuk', yasAy: [0, 12], isaretlenir: true, baslik: 'Gelişim adımları (0–12 ay)',
    aciklama: 'Çocuğunuzun bu dönemde sık kazandığı beceriler. Gördüğünüzde işaretleyin.',
    varsayilan: {
      maddeler: [
        '2. ay — Yüzünüze bakıp gülümsüyor',
        '2. ay — Sesinize tepki veriyor, sesle sakinleşiyor',
        '4. ay — Yüzüstü yatarken başını ve göğsünü kaldırıyor',
        '4. ay — Oyuncağa uzanıyor, elini ağzına götürüyor',
        '6. ay — Sırtüstünden yüzüstüne dönüyor',
        '6. ay — Sesli gülüyor, ses çıkararak karşılık veriyor',
        '9. ay — Desteksiz oturuyor',
        '9. ay — Adıyla seslenince dönüp bakıyor',
        '12. ay — Tutunarak ayağa kalkıyor, mobilyaya tutunup adım atıyor',
        '12. ay — “Baba”, “mama” gibi heceler söylüyor, el sallıyor',
      ],
      not: GELISIM_NOT,
    },
    kaynaklar: ['CDC-LTSAE-2022', 'REPO-GIDR', 'SB-IZLEM-PROTOKOLU'],
  },
  {
    kod: 'ped-gelisim-1-3', brans: 'pediatri', tur: 'liste', yas: 'cocuk', yasAy: [12, 36], isaretlenir: true, baslik: 'Gelişim adımları (1–3 yaş)',
    aciklama: 'Çocuğunuzun bu dönemde sık kazandığı beceriler. Gördüğünüzde işaretleyin.',
    varsayilan: {
      maddeler: [
        '15. ay — Anne, baba dışında birkaç kelime söylüyor',
        '15. ay — İstediği şeyi parmağıyla gösteriyor',
        '18. ay — Tek başına yürüyor',
        '18. ay — Kaşıkla yemeye çalışıyor',
        '2. yaş — İki kelimeyi birleştiriyor (“su ver”)',
        '2. yaş — Koşuyor, topa tekme atıyor',
        '2. yaş — Başka çocuklarla ilgileniyor',
        '30. ay — Basit yönergeleri anlıyor (“ayakkabını getir”)',
        '3. yaş — Kısa cümlelerle konuşuyor; yabancılar konuşmasının çoğunu anlıyor',
        '3. yaş — Merdiven çıkıyor, üç tekerlekli bisiklete biniyor',
      ],
      not: GELISIM_NOT,
    },
    kaynaklar: ['CDC-LTSAE-2022', 'REPO-GIDR', 'SB-IZLEM-PROTOKOLU'],
  },
  {
    kod: 'ped-gelisim-3-6', brans: 'pediatri', tur: 'liste', yas: 'cocuk', yasAy: [36, 72], isaretlenir: true, baslik: 'Gelişim adımları (3–6 yaş)',
    aciklama: 'Çocuğunuzun bu dönemde sık kazandığı beceriler. Gördüğünüzde işaretleyin.',
    varsayilan: {
      maddeler: [
        '4. yaş — Basit bir olayı ya da hikâyeyi anlatıyor',
        '4. yaş — Tek ayak üzerinde kısa süre duruyor',
        '4. yaş — Oyunlarda sırasını bekliyor',
        '5. yaş — Daire, artı gibi şekilleri çiziyor',
        '5. yaş — Düğme dışında kendi giyinip soyunuyor',
        '5. yaş — Adını ve yaşını söylüyor',
        '6. yaş — Zıplayarak ilerliyor, top yakalıyor',
        '6. yaş — Harflere ve rakamlara ilgi gösteriyor',
      ],
      not: GELISIM_NOT,
    },
    kaynaklar: ['CDC-LTSAE-2022', 'SB-IZLEM-PROTOKOLU'],
  },
]

// ─── Kadın hastalıkları ve doğum ────────────────────────────────────────────────────────────────────────────────────
const G = (hafta: number) => hafta * 7

export const KD_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'kd-gebelik-zaman', brans: 'kadin-hastaliklari-dogum', tur: 'zaman', durum: { gebelik: true }, baslangicKaynagi: 'gebelik',
    baslangicEtiketi: 'Son adet tarihi', baslik: 'Gebelik yolculuğum',
    aciklama: 'Haftanıza göre sıradaki kontrol ve tetkikler. Tarihleri hekiminiz sizin için planlar; bu takvim yol göstericidir.',
    varsayilan: {
      adimlar: [
        { gun: G(6), baslik: 'Gebeliğin doğrulanması', ayrinti: 'İlk kontrolde gebelik kesesi ve kalp atımı ultrasonla görülür; hekiminiz ilk tetkikleri ve folik asit kullanımını planlar.' },
        { gun: G(11), baslik: 'İlk trimester taraması', ayrinti: '11–14. haftalarda hekiminiz isterse ense kalınlığı ölçümü ve ikili tarama yapılır.' },
        { gun: G(16), baslik: 'İkinci trimester', ayrinti: 'Bulantı çoğunlukla azalır. Diş kontrolü için uygun bir dönemdir.' },
        { gun: G(20), baslik: 'Ayrıntılı ultrason ve ilk hareketler', ayrinti: '18–22. haftalarda bebeğin gelişimi ayrıntılı ultrasonla değerlendirilir. İlk gebeliklerde hareketler genelde bu haftalarda hissedilmeye başlar.' },
        { gun: G(24), baslik: 'Gebelik şekeri taraması', ayrinti: '24–28. haftalarda şeker yükleme testi yapılır; hekiminiz hazırlığı söyler.' },
        { gun: G(28), baslik: 'Üçüncü trimester', ayrinti: 'Bebeğinizin hareketlerini her gün izleyin. Kan grubunuz Rh negatifse hekiminiz koruyucu iğneyi planlar.' },
        { gun: G(32), baslik: 'Büyüme kontrolü', ayrinti: 'Tansiyon, kilo ve bebeğin büyümesi değerlendirilir. Doğum planınızı konuşmaya başlayın.' },
        { gun: G(36), baslik: 'Doğuma hazırlık', ayrinti: 'Hastane çantanızı hazırlayın. Doğum belirtilerini ve ne zaman yola çıkacağınızı hekiminizle netleştirin.' },
        { gun: G(40), baslik: 'Tahmini doğum tarihi', ayrinti: 'Doğum bu tarihten iki hafta önce ya da sonra da başlayabilir; hekiminiz izlem sıklığını artırır.' },
      ],
      not: 'Tansiyonunuzu ve kilonuzu Bugün sayfasından girin; hekiminizin gebelik eşikleri orada uygulanır.',
    },
    kaynaklar: ['SB-DOGUM-ONCESI-BAKIM', 'REPO-GEBELIGIM'],
  },
  {
    kod: 'kd-hareket', brans: 'kadin-hastaliklari-dogum', tur: 'gunluk', durum: { gebelik: true }, baslangicKaynagi: 'gebelik', enErkenGun: G(28),
    baslik: 'Bebeğimin hareketleri',
    aciklama: '28. haftadan sonra bebeğinizin hareketlerini her gün izleyin. Önemli olan sayı değil, bebeğinizin kendi düzenidir.',
    varsayilan: {
      alanlar: [
        { id: 'normal', etiket: 'Bugün hareketleri her zamanki gibi', tur: 'evet' },
        { id: 'azaldi', etiket: 'Hareketleri azaldı ya da değişti', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'azaldi', kosullar: [{ alan: 'azaldi', evet: true }], duzey: 'acil', hasta: 'Bebeğinizin hareketleri azaldıysa ya da değiştiyse ertesi günü beklemeyin: hemen doğum yapacağınız hastaneye başvurun; ulaşamıyorsanız 112’yi arayın.', hekim: 'Fetal hareket günlüğü: hareketlerde azalma / değişiklik bildirdi.' },
      ],
      not: 'Hareketleri saymak zorunda değilsiniz; bebeğinizin olağan düzenini tanıyın.',
    },
    kaynaklar: ['RCOG-GTG57', 'SB-DOGUM-ONCESI-BAKIM'],
  },
  {
    kod: 'kd-gebelik-belirti', brans: 'kadin-hastaliklari-dogum', tur: 'gunluk', durum: { gebelik: true }, baslangicKaynagi: 'gebelik',
    baslik: 'Gebelik belirti günlüğüm',
    aciklama: 'Nasıl hissettiğinizi kaydedin. Tehlike işaretlerinden birini seçerseniz ne yapacağınızı hemen gösterir.',
    varsayilan: {
      alanlar: [
        { id: 'bulanti', etiket: 'Bulantı', tur: 'olcek' },
        { id: 'kusma', etiket: 'Hiçbir şey tutamayacak kadar kusma', tur: 'evet' },
        { id: 'sislik', etiket: 'Yüzde ve ellerde ani şişlik', tur: 'evet' },
        { id: 'kanama', etiket: 'Vajinal kanama', tur: 'evet' },
        { id: 'su', etiket: 'Su gelmesi ya da sıvı sızıntısı', tur: 'evet' },
        { id: 'basagri', etiket: 'Geçmeyen şiddetli baş ağrısı, görme bulanıklığı ya da ışık çakması', tur: 'evet' },
        { id: 'karin', etiket: 'Şiddetli ya da geçmeyen karın ağrısı', tur: 'evet' },
        { id: 'kasilma', etiket: '37. haftadan önce düzenli kasılmalar', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'kanama', kosullar: [{ alan: 'kanama', evet: true }], duzey: 'acil', hasta: `Gebelikte kanama acil değerlendirilmelidir: doğum yapacağınız hastaneye gidin ya da ${ACIL_112}`, hekim: 'Gebelik günlüğü: vajinal kanama.' },
        { id: 'su', kosullar: [{ alan: 'su', evet: true }], duzey: 'acil', hasta: `Su geldiğini düşünüyorsanız beklemeden doğum yapacağınız hastaneye gidin; ulaşamıyorsanız ${ACIL_112}`, hekim: 'Gebelik günlüğü: sıvı gelişi (EMR?).' },
        { id: 'basagri', kosullar: [{ alan: 'basagri', evet: true }], duzey: 'acil', hasta: `Şiddetli baş ağrısı ve görme değişikliği yüksek tansiyon belirtisi olabilir: hemen ${ACIL_112}`, hekim: 'Gebelik günlüğü: şiddetli baş ağrısı / görme bozukluğu (preeklampsi?).' },
        { id: 'karin', kosullar: [{ alan: 'karin', evet: true }], duzey: 'acil', hasta: `Şiddetli ya da geçmeyen karın ağrısı acildir: ${ACIL_112}`, hekim: 'Gebelik günlüğü: şiddetli karın ağrısı.' },
        { id: 'kasilma', kosullar: [{ alan: 'kasilma', evet: true }], duzey: 'acil', hasta: `37. haftadan önce düzenli kasılmalar erken doğum belirtisi olabilir: hastaneye gidin ya da ${ACIL_112}`, hekim: 'Gebelik günlüğü: < 37 hafta düzenli kontraksiyon.' },
        { id: 'sislik', kosullar: [{ alan: 'sislik', evet: true }], duzey: 'hekime_bildir', hasta: 'Ani şişliği hekiminize ilettik. Tansiyonunuzu Bugün sayfasından ölçüp girin; baş ağrısı ya da görme değişikliği eklenirse acile gidin.', hekim: 'Gebelik günlüğü: yüz / elde ani ödem.' },
        { id: 'kusma', kosullar: [{ alan: 'kusma', evet: true }], duzey: 'hekime_bildir', hasta: 'Hiçbir şey tutamadığınızı hekiminize ilettik; bugün ulaşın. İdrarınız çok azaldıysa acile gidin.', hekim: 'Gebelik günlüğü: oral alımı engelleyen kusma (hiperemezis?).' },
      ],
    },
    kaynaklar: ['SB-DOGUM-ONCESI-BAKIM', 'SB-ACIL-OBSTETRIK'],
  },
  {
    kod: 'kd-lohusa-zaman', brans: 'kadin-hastaliklari-dogum', tur: 'zaman', varsayilanKapali: true, baslangicEtiketi: 'Doğum günü',
    baslik: 'Doğum sonrası ilk altı hafta',
    aciklama: 'Doğumdan sonraki günlerde neyin olağan olduğunu ve neyin hekime sorulacağını gün gün gösterir.',
    varsayilan: {
      adimlar: [
        { gun: 0, baslik: 'İlk gün', ayrinti: 'İlk 24 saatte hastanede birkaç kez kontrol edilirsiniz (normal doğumdan sonra en az 24 saat, sezaryenden sonra en az 48 saat hastanede kalınır). Kanama adet kanamasından fazla olabilir ve giderek azalır. Hekiminizin izin verdiği ilk fırsatta kalkıp yürümek iyileşmeyi hızlandırır.' },
        { gun: 3, baslik: 'İlk ev kontrolü ve süt gelmesi', ayrinti: 'Doğumdan sonraki 2–5. günler arasında doğum sonu kontrolünüz yapılır (aile hekiminiz ya da hastaneniz). Memelerde dolgunluk ve gerginlik olağandır; sık emzirmek rahatlatır.' },
        { gun: 7, baslik: 'Yara kontrolü', ayrinti: 'Sezaryen ya da dikiş yeriniz hekiminizin planladığı günde kontrol edilir; alınması gereken dikişler genellikle 7. günde alınır. Yarayı kuru ve temiz tutun.' },
        { gun: 10, baslik: 'Duygusal dalgalanmalar', ayrinti: 'İlk günlerde ağlamaklılık, gerginlik ve duygusal dalgalanma sık görülür; genellikle 10–14. günlerde kendiliğinden geçer. Geçmezse ya da ağırlaşırsa hekiminize yazın.' },
        { gun: 15, baslik: 'İkinci doğum sonu kontrolü', ayrinti: '13–17. günler arasında doğum sonu kontrolünüz yapılır. Kanamanız, yaranız, emzirme ve ruh hâliniz konuşulur.' },
        { gun: 21, baslik: 'Kanama azalıyor', ayrinti: 'Akıntı açık renge döner ve azalır; emziren annelerde lekelenme altıncı haftaya kadar sürebilir. Kanama yeniden artarsa hekiminize yazın.' },
        { gun: 42, baslik: 'Son doğum sonu kontrolü', ayrinti: '30–42. günler arasında son doğum sonu kontrolünüz yapılır: genel kontrol, doğum kontrolü seçenekleri ve kalan şikâyetleriniz konuşulur.' },
      ],
    },
    kaynaklar: ['SB-DOGUM-SONRASI-BAKIM'],
  },
  {
    kod: 'kd-lohusa-gunluk', brans: 'kadin-hastaliklari-dogum', tur: 'gunluk', varsayilanKapali: true, baslik: 'Doğum sonrası günlüğüm',
    aciklama: 'Doğumdan sonraki haftalarda kendinizi nasıl hissettiğinizi kaydedin. Tehlike işaretlerinde ne yapacağınızı hemen gösterir.',
    varsayilan: {
      alanlar: [
        { id: 'kanama', etiket: 'Saatte bir pedi dolduran kanama ya da büyük pıhtılar', tur: 'evet' },
        { id: 'ates', etiket: '38 °C ve üzeri ateş', tur: 'evet' },
        { id: 'yara', etiket: 'Sezaryen ya da dikiş yerinde kızarıklık, akıntı ya da açılma', tur: 'evet' },
        { id: 'meme', etiket: 'Memede kızarık, sıcak ve ağrılı bölge', tur: 'evet' },
        { id: 'baldir', etiket: 'Tek bacakta (baldırda) ağrılı şişlik', tur: 'evet' },
        { id: 'nefes', etiket: 'Nefes darlığı ya da göğüs ağrısı', tur: 'evet' },
        { id: 'basagri', etiket: 'Şiddetli baş ağrısı ya da görme bozukluğu', tur: 'evet' },
        { id: 'nobet', etiket: 'Havale (nöbet), bayılma ya da bilinç kaybı', tur: 'evet' },
        { id: 'akinti', etiket: 'Kötü kokulu akıntı', tur: 'evet' },
        { id: 'idrar', etiket: 'İdrar yaparken yanma ya da idrar kaçırma', tur: 'evet' },
        { id: 'cokkun', etiket: 'İki haftadan uzun süren çökkünlük, hiçbir şeyden zevk alamama', tur: 'evet' },
        KRIZ_ALANI,
      ],
      bayraklar: [
        KRIZ_BAYRAGI,
        { id: 'nobet', kosullar: [{ alan: 'nobet', evet: true }], duzey: 'acil', hasta: `Doğumdan sonra havale, bayılma ya da bilinç kaybı acildir: hemen ${ACIL_112}`, hekim: 'Doğum sonrası günlük: nöbet / bilinç kaybı (eklampsi?).' },
        { id: 'akinti', kosullar: [{ alan: 'akinti', evet: true }], duzey: 'hekime_bildir', hasta: 'Kötü kokulu akıntıyı hekiminize ilettik; bugün ulaşın. Ateş eklenirse beklemeden başvurun.', hekim: 'Doğum sonrası günlük: kötü kokulu loşi (endometrit?).' },
        { id: 'idrar', kosullar: [{ alan: 'idrar', evet: true }], duzey: 'hekime_bildir', hasta: 'İdrarla ilgili yakınmanızı hekiminize ilettik.', hekim: 'Doğum sonrası günlük: dizüri / idrar kaçırma.' },
        { id: 'kanama', kosullar: [{ alan: 'kanama', evet: true }], duzey: 'acil', hasta: `Bu kadar yoğun kanama acildir: hemen ${ACIL_112}`, hekim: 'Doğum sonrası günlük: yoğun kanama / pıhtı (PPH?).' },
        { id: 'nefes', kosullar: [{ alan: 'nefes', evet: true }], duzey: 'acil', hasta: `Doğum sonrası nefes darlığı ya da göğüs ağrısı acildir: hemen ${ACIL_112}`, hekim: 'Doğum sonrası günlük: nefes darlığı / göğüs ağrısı.' },
        { id: 'baldir', kosullar: [{ alan: 'baldir', evet: true }], duzey: 'acil', hasta: `Tek bacakta ağrılı şişlik pıhtı belirtisi olabilir: bugün beklemeden ${ACIL_112}`, hekim: 'Doğum sonrası günlük: tek taraflı baldır şişliği (DVT?).' },
        { id: 'basagri', kosullar: [{ alan: 'basagri', evet: true }], duzey: 'acil', hasta: `Doğumdan sonra da yüksek tansiyon görülebilir; şiddetli baş ağrısı ve görme bozukluğu acildir: ${ACIL_112}`, hekim: 'Doğum sonrası günlük: şiddetli baş ağrısı / görme bozukluğu (postpartum preeklampsi?).' },
        { id: 'ates-yara', kosullar: [{ alan: 'ates', evet: true }, { alan: 'yara', evet: true }], duzey: 'hekime_bildir', hasta: 'Ateş ve yara değişikliğini hekiminize ilettik; bugün ulaşın.', hekim: 'Doğum sonrası günlük: ateş + yara bulgusu.' },
        { id: 'meme', kosullar: [{ alan: 'meme', evet: true }], duzey: 'hekime_bildir', hasta: 'Memedeki değişikliği hekiminize ilettik. Emzirmeye devam etmek çoğu zaman yardımcı olur.', hekim: 'Doğum sonrası günlük: memede kızarık, ağrılı bölge (mastit?).' },
        { id: 'yara', kosullar: [{ alan: 'yara', evet: true }], duzey: 'hekime_bildir', hasta: 'Yaranızdaki değişikliği hekiminize ilettik.', hekim: 'Doğum sonrası günlük: yara bulgusu.' },
        { id: 'ates', kosullar: [{ alan: 'ates', evet: true }], duzey: 'hekime_bildir', hasta: 'Ateşinizi hekiminize ilettik.', hekim: 'Doğum sonrası günlük: ≥ 38 °C ateş.' },
        { id: 'cokkun', kosullar: [{ alan: 'cokkun', evet: true }], duzey: 'hekime_bildir', hasta: 'Bunu paylaştığınız için teşekkürler. Doğum sonrası çökkünlük sık görülür ve tedavi edilebilir; hekiminize ilettik.', hekim: 'Doğum sonrası günlük: > 2 hafta çökkünlük / anhedoni (postpartum depresyon taraması önerilir).' },
      ],
    },
    kaynaklar: ['SB-DOGUM-SONRASI-BAKIM', 'SB-ACIL-OBSTETRIK'],
  },
  {
    kod: 'kd-adet', brans: 'kadin-hastaliklari-dogum', tur: 'gunluk', varsayilanKapali: true, yas: 'eriskin', baslik: 'Adet takvimim',
    aciklama: 'Adet günlerinizi, kanama miktarını ve ağrıyı kaydedin. Kontrolde hekiminiz düzeninize birlikte bakar.',
    varsayilan: {
      alanlar: [
        { id: 'adet', etiket: 'Bugün adet kanamam var', tur: 'evet' },
        { id: 'miktar', etiket: 'Kanama miktarı', tur: 'olcek' },
        { id: 'agri', etiket: 'Ağrı', tur: 'olcek' },
        { id: 'yogun', etiket: 'Saatte bir ped ya da tampon değiştirecek kadar kanama', tur: 'evet' },
        { id: 'ara', etiket: 'Adet dışı ya da ilişki sonrası kanama', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'yogun', kosullar: [{ alan: 'yogun', evet: true }], duzey: 'hekime_bildir', hasta: 'Yoğun kanamayı hekiminize ilettik. Baş dönmesi, bayılma hissi ya da çarpıntı olursa acile gidin.', hekim: 'Adet takvimi: saatte bir ped dolduran kanama.' },
        { id: 'ara', kosullar: [{ alan: 'ara', evet: true }], duzey: 'hekime_bildir', hasta: 'Adet dışı kanamayı hekiminize ilettik; değerlendirilmesi önerilir.', hekim: 'Adet takvimi: intermenstrüel / postkoital kanama.' },
      ],
    },
    kaynaklar: ['TJOD-AUK'],
  },
]
