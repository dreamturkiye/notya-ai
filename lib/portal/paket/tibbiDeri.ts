/**
 * BRANS-PAKETI Phase 2 — dermatoloji (medical) signature modules (batch a). Separate from the Özel Branş "klinik
 * dermatoloji" package (brans-alan-sizmasi: dermatoloji ≠ klinik-dermatoloji — separate module codes, same KINDS / look).
 * Builds on Derim (doctor's control dates, photo notices, treatment reminders) — it adds the patient's own photo diary,
 * daily skin-care diary with drug-reaction red flags, and medicine-bound monitoring reminders (isotretinoin, systemic /
 * biologic treatment) that switch on from the approved medicine list. Physician-accepted templates; no diagnosis, no dose.
 * Sources: docs/kaynak/TIBBI-BRANS-PAKETI-ARASTIRMA.md.
 */
import type { PaketModulTanimi } from '../bransPaketi'
import { ACIL_112, ANAFILAKSI_ALANI, ANAFILAKSI_BAYRAGI, KRIZ_ALANI, KRIZ_BAYRAGI } from './ortak'

export const DERMATOLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'dmt-gunluk', brans: 'dermatoloji', tur: 'gunluk', baslik: 'Cilt günlüğüm',
    aciklama: 'Cildinizin bugünkü hâlini ve bakımınızı bir dakikada kaydedin. Kontrolde hekiminiz değişimi birlikte görür.',
    varsayilan: {
      alanlar: [
        { id: 'durum', etiket: 'Cildimin bugünkü durumu (0 çok iyi – 10 çok kötü)', tur: 'olcek' },
        { id: 'kasinti', etiket: 'Kaşıntı', tur: 'olcek' },
        { id: 'uyku', etiket: 'Kaşıntı yüzünden uykum bölündü', tur: 'evet' },
        { id: 'uyguladim', etiket: 'Tedavimi bugün uyguladım', tur: 'evet' },
        { id: 'nemlendirici', etiket: 'Nemlendiricimi sürdüm', tur: 'evet' },
        { id: 'gunes', etiket: 'Güneş koruyucu kullandım', tur: 'evet' },
        { id: 'soyulma', etiket: 'Derimde soyulma, içi su dolu kabarcıklar ya da ağız / göz / genital bölgede yaralar', tur: 'evet' },
        ANAFILAKSI_ALANI,
        { id: 'enfeksiyon', etiket: 'Lezyonlarda artan ağrı, sarı kabuk, akıntı ya da ateş', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'soyulma', kosullar: [{ alan: 'soyulma', evet: true }], duzey: 'acil', hasta: `Yaygın soyulma, içi su dolu kabarcıklar ya da ağızda / gözde yaralar ciddi bir ilaç tepkisi olabilir: hemen ${ACIL_112} Yeni başladığınız ilacı yanınızda götürün.`, hekim: 'Cilt günlüğü: soyulma / bül / mukoza tutulumu (SJS-TEN?).' },
        ANAFILAKSI_BAYRAGI,
        { id: 'enfeksiyon', kosullar: [{ alan: 'enfeksiyon', evet: true }], duzey: 'hekime_bildir', hasta: 'Lezyonlardaki değişikliği hekiminize ilettik. Fotoğraf günlüğünüze bir fotoğraf eklemeniz değerlendirmeyi kolaylaştırır.', hekim: 'Cilt günlüğü: lezyonlarda enfeksiyon bulgusu (impetijinizasyon / ateş).' },
      ],
    },
    kaynaklar: ['EUROGUIDERM-AD', 'REPO-DERM-TAKVIM'],
  },
  {
    kod: 'dmt-foto', brans: 'dermatoloji', tur: 'foto', serbestEtiket: true, baslik: 'Cilt fotoğraf günlüğüm',
    aciklama: 'Takip edilen bölgenin aynı mesafe ve ışıkta fotoğrafı. Bölgenin adını yazın; yorum ve değerlendirme hekiminizdedir.',
    varsayilan: { acilar: ['Yakın', 'Uzak (bölgenin tamamı)'], not: 'Gün ışığında, flaşsız; her seferinde aynı mesafeden çekin.' },
    kaynaklar: ['REPO-DERM-FOTO'],
    fotoRizaMetni: 'Cilt fotoğraflarımın hekimimle paylaşılmasını kabul ediyorum. Fotoğrafları istediğim zaman silebilirim.',
  },
  {
    kod: 'dmt-ben', brans: 'dermatoloji', tur: 'liste', varsayilanKapali: true, baslik: 'Benlerimi kendim kontrol ediyorum',
    aciklama: 'Ayda bir, iyi ışıkta ve aynayla tüm cildinize bakın. Değişen bir ben görürseniz fotoğraflayıp hekiminize yazın.',
    varsayilan: {
      maddeler: [
        'Asimetri — benin iki yarısı birbirine benzemiyor',
        'Kenar — kenarları düzensiz, girintili ya da bulanık',
        'Renk — birden fazla renk ya da renkte değişim',
        'Çap — yaklaşık 6 mm’den (kurşun kalem silgisinden) büyük',
        'Değişim — büyüme, şekil ya da renk değişikliği, kanama, kaşıntı',
        'Diğerlerine hiç benzemeyen yeni bir ben',
      ],
      not: 'Bu liste bir tanı aracı değildir; değerlendirme hekiminizdedir. Değişen benin fotoğrafını Cilt fotoğraf günlüğüme ekleyin.',
    },
    kaynaklar: ['ABCDE-MELANOM'],
  },
  {
    kod: 'dmt-bakim', brans: 'dermatoloji', tur: 'program', durum: { tani: /atopik|egzama|ekzema/i, icd: /^L20/ }, baslik: 'Günlük cilt bakım rutinim',
    aciklama: 'Hekiminizin önerdiği günlük bakım adımları. Yaptıkça işaretleyin; kuru ve kaşıntılı cilt için düzenli bakım tedavinin bir parçasıdır.',
    varsayilan: {
      maddeler: [
        'Ilık suyla kısa duş (5–10 dakika)',
        'Duştan sonraki üç dakika içinde nemlendirici',
        'Gün içinde kuruyan bölgelere nemlendirici',
        'Yumuşak, pamuklu giysi',
        'Tırnakları kısa tutmak',
      ],
      not: 'Hekiminiz satırları size göre değiştirebilir.',
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel bakım satırları (doz yazılmaz)', tur: 'satirlar' }],
    kaynaklar: ['EUROGUIDERM-AD'],
  },
  {
    kod: 'dmt-izotretinoin', brans: 'dermatoloji', tur: 'hatirlatma',
    durum: { ilac: /izotretinoin|isotretinoin|roaccutane|zoretanin|aknetrent|acnegen|acnetrex/i },
    baslik: 'Tedavi izlem hatırlatmalarım',
    aciklama: 'Hekiminizin bu tedavi için planladığı tahlil, kontrol ve korunma hatırlatmaları.',
    varsayilan: {
      maddeler: [
        'Hekiminizin istediği kan tahlillerini planlanan tarihlerde yaptırın.',
        'Gebelik olasılığı olan hastalarda hekiminizin planladığı gebelik testleri ve etkili korunma tedavi boyunca ve sonrasında sürer.',
        'Tedavi boyunca kan bağışı yapmayın; ilacınızı kimseyle paylaşmayın.',
        'Dudak ve cilt kuruluğu için hekiminizin önerdiği bakımı uygulayın; güneşten korunun.',
        'Ruh hâlinizde değişiklik fark ederseniz hekiminize hemen yazın.',
      ],
      alanlar: [
        { id: 'ruh', etiket: 'Ruh hâlimde belirgin kötüleşme', tur: 'evet' },
        KRIZ_ALANI,
        { id: 'basagri', etiket: 'Geçmeyen şiddetli baş ağrısı ve görme bulanıklığı', tur: 'evet' },
      ],
      bayraklar: [
        KRIZ_BAYRAGI,
        { id: 'basagri', kosullar: [{ alan: 'basagri', evet: true }], duzey: 'hekime_bildir', hasta: 'Baş ağrısı ve görme şikâyetinizi hekiminize ilettik; bugün ulaşın. Kusma ya da görme kaybı eklenirse acile gidin.', hekim: 'İzotretinoin izlemi: şiddetli baş ağrısı + görme bulanıklığı.' },
        { id: 'ruh', kosullar: [{ alan: 'ruh', evet: true }], duzey: 'hekime_bildir', hasta: 'Ruh hâlinizle ilgili bilgiyi hekiminize ilettik; hekiminiz sizinle iletişime geçebilir.', hekim: 'İzotretinoin izlemi: belirgin ruh hâli kötüleşmesi.' },
      ],
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel izlem satırları (ör. "Kan tahlili — 15 Ocak"; doz yazılmaz)', tur: 'satirlar' }],
    kaynaklar: ['MHRA-ISOTRETINOIN', 'TITCK-ISOTRETINOIN-DOGRULANAMADI'],
  },
  {
    kod: 'dmt-sistemik', brans: 'dermatoloji', tur: 'hatirlatma',
    durum: { ilac: /metotreksat|methotrexate|siklosporin|sandimmun|asitretin|neotigason|adalimumab|humira|hyrimoz|amgevita|ustekinumab|stelara|sekukinumab|secukinumab|cosentyx|iksekizumab|ixekizumab|taltz|risankizumab|skyrizi|guselkumab|tremfya|dupilumab|dupixent|omalizumab|xolair|etanersept|etanercept|enbrel|infliksimab|infliximab|remicade/i },
    baslik: 'Sistemik tedavi hatırlatmalarım',
    aciklama: 'Hekiminizin sistemik ya da biyolojik tedaviniz için planladığı izlem. Enjeksiyon saatleriniz İlaç takvimi bölümündedir.',
    varsayilan: {
      maddeler: [
        'Hekiminizin istediği kan tahlillerini planlanan tarihlerde yaptırın.',
        'Ateş, geçmeyen öksürük, idrarda yanma ya da iyileşmeyen yara gibi enfeksiyon belirtilerinde hekiminize yazın.',
        'Herhangi bir aşı olmadan önce hekiminize danışın.',
        'Ameliyat ya da diş çekimi planlanırsa tedavinizi o hekime de söyleyin.',
      ],
      alanlar: [
        { id: 'enfeksiyon', etiket: 'Ateş ya da enfeksiyon belirtisi', tur: 'evet' },
        ANAFILAKSI_ALANI,
      ],
      bayraklar: [
        ANAFILAKSI_BAYRAGI,
        { id: 'enfeksiyon', kosullar: [{ alan: 'enfeksiyon', evet: true }], duzey: 'hekime_bildir', hasta: 'Enfeksiyon belirtisini hekiminize ilettik. Bir sonraki uygulamanız yaklaşıyorsa önce hekiminize danışın.', hekim: 'Sistemik tedavi izlemi: ateş / enfeksiyon belirtisi.' },
      ],
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel izlem satırları (doz yazılmaz)', tur: 'satirlar' }],
    kaynaklar: ['TDD-PSORIAZIS-BIYOLOJIK', 'REPO-BIYOLOJIK-GUVENLIK'],
  },
]
