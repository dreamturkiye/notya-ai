/**
 * BRANS-PAKETI Phase 2 batch (b) — nöroloji and psikiyatri. Psikiyatri content stays ONLY on the psikiyatri doctor's
 * token (PSIK-EXCEPTIONAL-01: mental-health content is never carried to another branş) — the registry gate does this.
 * Crisis copy: the page is not an emergency service → 112. Physician-accepted templates; no diagnosis, no dose.
 */
import type { PaketModulTanimi } from '../bransPaketi'
import { ACIL_112, KRIZ_ALANI, KRIZ_BAYRAGI } from './ortak'

// ─── Nöroloji ───────────────────────────────────────────────────────────────────────────────────────────────────────
export const NOROLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'nor-bas-agrisi', brans: 'noroloji', tur: 'gunluk', baslik: 'Baş ağrısı günlüğüm',
    aciklama: 'Ağrılı günleri, süreyi ve tetikleyicileri kaydedin. Hekiminiz tedaviyi bu kayda göre ayarlar.',
    varsayilan: {
      alanlar: [
        { id: 'siddet', etiket: 'Ağrı şiddeti', tur: 'olcek' },
        { id: 'sure', etiket: 'Süre', tur: 'sayi', min: 0, max: 72, birim: 'saat' },
        { id: 'ilac', etiket: 'Ağrı kesici aldım', tur: 'evet' },
        { id: 'bulanti', etiket: 'Bulantı ya da ışığa / sese hassasiyet', tur: 'evet' },
        { id: 'tetik', etiket: 'Tetikleyici (uykusuzluk, açlık, adet, stres…)', tur: 'metin' },
        { id: 'ani', etiket: 'Hayatımın en şiddetli, aniden başlayan baş ağrısı', tur: 'evet' },
        { id: 'noro', etiket: 'Konuşma bozukluğu, yüzde kayma ya da kol / bacakta güçsüzlük', tur: 'evet' },
        { id: 'ates', etiket: 'Baş ağrısıyla birlikte ateş ve ense sertliği', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'ani', kosullar: [{ alan: 'ani', evet: true }], duzey: 'acil', hasta: `Aniden başlayan çok şiddetli baş ağrısı acildir: hemen ${ACIL_112}`, hekim: 'Baş ağrısı günlüğü: thunderclap baş ağrısı (SAK?).' },
        { id: 'noro', kosullar: [{ alan: 'noro', evet: true }], duzey: 'acil', hasta: `Bu belirtiler inme olabilir; saati not edin ve hemen ${ACIL_112}`, hekim: 'Baş ağrısı günlüğü: fokal nörolojik bulgu.' },
        { id: 'ates', kosullar: [{ alan: 'ates', evet: true }], duzey: 'acil', hasta: `Ateş ve ense sertliğiyle baş ağrısı acildir: ${ACIL_112}`, hekim: 'Baş ağrısı günlüğü: ateş + ense sertliği (menenjit?).' },
      ],
      not: 'Ayda on günden fazla ağrı kesici kullanmak baş ağrısını artırabilir; bunu hekiminizle konuşun.',
    },
    kaynaklar: ['TND-MIGREN', 'ICHD-3'],
  },
  {
    kod: 'nor-nobet', brans: 'noroloji', tur: 'gunluk',
    durum: { tani: /epilep|nöbet|nobet|konv[uü]lz/i, icd: /^(G40|G41|R56)/, ilac: /levetirasetam|levetiracetam|keppra|valproat|depakin|convulex|karbamazepin|tegretol|lamotrijin|lamictal|okskarbazepin|trileptal|lakozamid|vimpat|topiramat|topamax|brivarasetam|briviact|perampanel|fycompa/i },
    baslik: 'Nöbet günlüğüm', aciklama: 'Nöbetleri ve ilacınızı aldığınız günleri kaydedin. Nöbeti gören biri de doldurabilir.',
    varsayilan: {
      alanlar: [
        { id: 'aldim', etiket: 'İlacımı bugün aldım', tur: 'evet' },
        { id: 'nobet', etiket: 'Bugün nöbet geçirdim', tur: 'evet' },
        { id: 'sure', etiket: 'Nöbet süresi', tur: 'sayi', min: 0, max: 60, birim: 'dakika' },
        { id: 'tetik', etiket: 'Olası tetikleyici (uykusuzluk, atlanan doz, ateş…)', tur: 'metin' },
        { id: 'uzun', etiket: 'Nöbet beş dakikadan uzun sürdü ya da ayılmadan ardı ardına geldi', tur: 'evet' },
        { id: 'yaralanma', etiket: 'Nöbette yaralandım, başımı çarptım ya da suya düştüm', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'uzun', kosullar: [{ alan: 'uzun', evet: true }], duzey: 'acil', hasta: `Beş dakikadan uzun süren ya da ardı ardına gelen nöbet acildir: ${ACIL_112}`, hekim: 'Nöbet günlüğü: > 5 dk / küme nöbet (status?).' },
        { id: 'sure', kosullar: [{ alan: 'sure', enAz: 5 }], duzey: 'acil', hasta: `Beş dakikadan uzun süren nöbet acildir: ${ACIL_112}`, hekim: 'Nöbet günlüğü: nöbet süresi ≥ 5 dk.' },
        { id: 'yaralanma', kosullar: [{ alan: 'yaralanma', evet: true }], duzey: 'hekime_bildir', hasta: 'Yaralanmayı hekiminize ilettik. Başınızı çarptıysanız ve baş ağrısı, kusma ya da uyku hali varsa acile gidin.', hekim: 'Nöbet günlüğü: nöbetle yaralanma.' },
        { id: 'nobet', kosullar: [{ alan: 'nobet', evet: true }], duzey: 'hekime_bildir', hasta: 'Nöbetinizi hekiminize ilettik.', hekim: 'Nöbet günlüğü: nöbet bildirdi.' },
      ],
      not: 'Nöbet geçiren kişiyi yan yatırın, başını koruyun, ağzına bir şey koymayın ve süreyi tutun.',
    },
    kaynaklar: ['TND-EPILEPSI-2021', 'ILAE'],
  },
  {
    kod: 'nor-inme', brans: 'noroloji', tur: 'liste', durum: { tani: /inme|serebrovask|felç|fel[cç]|iskemik atak|tia\b/i, icd: /^(I6[3-4]|G45)/ }, baslik: 'İnme belirtilerini tanıyorum',
    aciklama: 'Yeni bir inmede her dakika önemlidir. Bu listeyi evdekilerle paylaşın.',
    varsayilan: {
      maddeler: [
        'Yüz — gülümseyince bir taraf düşüyor mu?',
        'Kol — iki kolu kaldırınca biri aşağı mı düşüyor?',
        'Konuşma — konuşma bozuk ya da anlaşılmıyor mu?',
        'Bu belirtilerden biri aniden başladıysa saati not edin ve hemen 112’yi arayın.',
        'Ani görme kaybı, ani denge kaybı ya da ani şiddetli baş ağrısı da inme belirtisi olabilir.',
      ],
    },
    kaynaklar: ['SB-TND-INME', 'ESO'],
  },
]

// ─── Psikiyatri ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const PSIKIYATRI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'psi-gunluk', brans: 'psikiyatri', tur: 'gunluk', baslik: 'Duygu durum günlüğüm',
    aciklama: 'Her gün bir dakika: ruh hâlinizi, uykunuzu ve ilacınızı kaydedin. Görüşmede hekiminizle birlikte bakarsınız.',
    varsayilan: {
      alanlar: [
        { id: 'ruh', etiket: 'Ruh hâli (0 çok kötü – 10 çok iyi)', tur: 'olcek' },
        { id: 'kaygi', etiket: 'Kaygı / gerginlik', tur: 'olcek' },
        { id: 'uyku', etiket: 'Uyku', tur: 'sayi', min: 0, max: 24, birim: 'saat' },
        { id: 'ilac', etiket: 'İlacımı bugün aldım', tur: 'evet' },
        { id: 'yanetki', etiket: 'Fark ettiğim yan etki', tur: 'metin' },
        KRIZ_ALANI,
      ],
      bayraklar: [KRIZ_BAYRAGI],
      not: 'İlacınızı kendiniz kesmeyin ya da değiştirmeyin; yan etkiyi hekiminize yazın.',
    },
    kaynaklar: ['TPD', 'SB-RUH-SAGLIGI'],
  },
  {
    kod: 'psi-guvenlik', brans: 'psikiyatri', tur: 'liste', baslik: 'Güvenlik planım',
    aciklama: 'Zor anlarda ne yapacağınızı önceden yazın. Planı hekiminizle birlikte kişiselleştirin.',
    varsayilan: {
      maddeler: [
        'Zor bir anın yaklaştığını gösteren işaretlerim',
        'Kendimi sakinleştirmek için yapabileceklerim (yürüyüş, nefes, müzik…)',
        'Arayabileceğim ya da yanına gidebileceğim kişiler',
        'Ortamımı güvenli hale getirmek için yapabileceklerim',
        'Acil durumda: 112’yi arayın ya da en yakın acil servise gidin.',
      ],
      not: 'Hekiminiz bu satırları sizinle birlikte doldurduğunuz kişisel planla değiştirebilir.',
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastayla birlikte yazılan kişisel güvenlik planı satırları', tur: 'satirlar' }],
    kaynaklar: ['STANLEY-BROWN-SPI', 'TPD'],
  },
  {
    kod: 'psi-uyku', brans: 'psikiyatri', tur: 'program', varsayilanKapali: true, baslik: 'Uyku düzenim',
    aciklama: 'Uykuyu düzenlemeye yardım eden günlük alışkanlıklar. Yaptıkça işaretleyin.',
    varsayilan: {
      maddeler: [
        'Her gün aynı saatte kalktım',
        'Öğleden sonra kafein almadım',
        'Yatmadan bir saat önce ekranı bıraktım',
        'Gün içinde gün ışığında yürüdüm',
      ],
    },
    kaynaklar: ['TPD'],
  },
]
