/**
 * BRANS-PAKETI — diyetisyen signature modules ("Beslenmem"). Sources: docs/kaynak/DIYETISYEN-PAKETI-ARASTIRMA.md.
 * Patient copy rules: no calorie counter, no diagnosis words, no drug dose, no gamification of weight; the eating-
 * disorder screen never shows a score; 112 on every acil line. Every module reaches a patient only after the dietitian
 * accepted its template (brans_paket_sablon.kabul_at).
 */
import type { PaketModulTanimi } from '../bransPaketi'
import { SCOFF_SORULARI } from '@/specialties/diyetisyen/engines/tarama'
import { ILAC_DESENLERI } from '@/specialties/diyetisyen/engines/ilacBesin'

const B = 'diyetisyen' as const

export const DIYETISYEN_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'diyet-tabak', brans: B, tur: 'tabak', baslik: 'Tabağım',
    aciklama: 'Öğününüzün fotoğrafını çekin; diyetisyeniniz porsiyon ve tabak dengesi hakkında yorum yazar. Kalori sayılmaz.',
    varsayilan: {
      maddeler: [
        'Tabağın yarısı sebze ve salata',
        'Dörtte biri protein kaynağı (et, tavuk, balık, yumurta, kurubaklagil)',
        'Dörtte biri tam tahıl (bulgur, tam buğday ekmeği, esmer pirinç)',
        'Yanında süt ürünü (yoğurt, ayran) ve su',
      ],
      not: 'Fotoğraflarınızı yalnız siz ve diyetisyeniniz görür. İstediğiniz zaman silebilirsiniz.',
    },
    kaynaklar: ['TUBER-2022'],
    fotoRizaMetni: 'Öğün fotoğraflarımın diyetisyenimle paylaşılmasını kabul ediyorum. Fotoğrafları istediğim zaman silebilirim.',
  },
  {
    kod: 'diyet-plan', brans: B, tur: 'plan', baslik: 'Haftalık planım',
    aciklama: 'Diyetisyeninizin yazdığı haftalık plan ve ondan hazırlanan alışveriş listesi.',
    varsayilan: { not: 'Plan diyetisyeninizindir; değişiklik isterseniz Doktoruma yaz bölümünden yazın.' },
    kaynaklar: ['TUBER-2022'],
    ayarlar: [{ id: 'plan', etiket: 'Haftalık plan (her satır: Gün | Öğün | yiyecekler, virgülle — "Her gün" tüm haftaya yazar)', tur: 'plan' }],
  },
  {
    kod: 'diyet-vucut', brans: B, tur: 'gunluk', baslik: 'Vücut ölçülerim',
    aciklama: 'Kilo ve bel çevresi Bugün sayfasındaki kutucuklardan girilir. Vücut analizi sonuçlarınızı buraya yazabilirsiniz.',
    varsayilan: {
      alanlar: [
        { id: 'yag', etiket: 'Vücut yağ oranı', tur: 'sayi', min: 3, max: 70, birim: '%' },
        { id: 'kas', etiket: 'Kas kütlesi', tur: 'sayi', min: 10, max: 120, birim: 'kg' },
        { id: 'kalca', etiket: 'Kalça çevresi', tur: 'sayi', min: 50, max: 200, birim: 'cm' },
      ],
      not: 'Bu ölçüler bir yarış değildir; değerlendirmeyi diyetisyeninizle birlikte yaparsınız.',
    },
    kaynaklar: ['TEMD-OBEZITE-2024'],
  },
  {
    kod: 'diyet-ilerleme', brans: B, tur: 'foto', baslik: 'İlerleme fotoğraflarım (isteğe bağlı)',
    aciklama: 'İsterseniz aynı açılardan özel fotoğraflar saklayın. Yalnız siz ve diyetisyeniniz görür; istediğiniz zaman silin.',
    varsayilan: { acilar: ['Ön', 'Yan'], not: 'Çekmek zorunlu değildir.' },
    kaynaklar: [],
    varsayilanKapali: true,
    fotoRizaMetni: 'İlerleme fotoğraflarımın diyetisyenimle paylaşılmasını kabul ediyorum. Fotoğrafları istediğim zaman silebilirim.',
  },
  {
    kod: 'diyet-pkos', brans: B, tur: 'gunluk', baslik: 'Döngü ve belirti günlüğüm',
    aciklama: 'Adet döngünüzü ve belirtilerinizi not edin; diyetisyeniniz ve hekiminiz görür. Değerlendirme hekimindir.',
    durum: { tani: /pkos|polikistik\s*over|pcos/i, icd: /^E28\.2/ },
    varsayilan: {
      alanlar: [
        { id: 'adet_basladi', etiket: 'Bugün adetim başladı', tur: 'evet' },
        { id: 'sisme', etiket: 'Şişkinlik', tur: 'olcek' },
        { id: 'yorgunluk', etiket: 'Yorgunluk', tur: 'olcek' },
        { id: 'istah', etiket: 'Tatlı isteği', tur: 'olcek' },
        { id: 'ruh', etiket: 'Ruh hâli (0 çok kötü – 10 çok iyi)', tur: 'olcek' },
        { id: 'not', etiket: 'Not', tur: 'metin' },
      ],
      not: 'Kilo kaybı olmasa da düzenli beslenme ve hareketin yararı vardır.',
    },
    kaynaklar: ['PCOS-2023'],
  },
  {
    kod: 'diyet-tiroid', brans: B, tur: 'ilac-saati', baslik: 'Tiroid ilacım ve kahvaltı',
    aciklama: 'İlacınızı aldığınız saate göre kahvaltı, kahve ve kalsiyum/demir için en erken saatler.',
    durum: { tani: /hipotiroid|hashimoto|tiroidit/i, icd: /^(E03|E06\.3)/, ilac: ILAC_DESENLERI.levotiroksin },
    varsayilan: {
      alanlar: [{ id: 'saat', etiket: 'Bugün ilacımı aldığım saat', tur: 'saat' }],
      not: 'Onaylı ürün bilgisine göre: aç karnına, kahvaltıdan en az yarım saat önce; kalsiyum ve demirle en az 2 saat ara. İsterseniz İlaç hatırlatmaları bölümünden sabah hatırlatması açabilirsiniz. Doz ve ilaç değişikliği hekiminizindir.',
    },
    kaynaklar: ['TITCK-KUB-LT4', 'TEMD-TIROID-2025'],
    ayarlar: [{ id: 'ilacSaati', etiket: 'Hastanın her gün ilacı aldığı saat (SS:DD)', tur: 'saat' }],
  },
  {
    kod: 'diyet-ir', brans: B, tur: 'gunluk', baslik: 'Öğün ritmim',
    aciklama: 'Öğün saatlerinizi ve yemekten sonra kısa yürüyüşlerinizi işaretleyin.',
    durum: { tani: /ins[uü]lin\s*diren|prediyabet|bozulmu[sş]\s*(a[cç]l[iı]k|glukoz)/i, icd: /^R73/ },
    varsayilan: {
      alanlar: [
        { id: 'kahvalti', etiket: 'Kahvaltı saati', tur: 'saat' },
        { id: 'ogle', etiket: 'Öğle saati', tur: 'saat' },
        { id: 'aksam', etiket: 'Akşam saati', tur: 'saat' },
        { id: 'yuruyus', etiket: 'Yemekten sonra 10–15 dakika yürüdüm', tur: 'evet' },
      ],
      not: 'Diyetisyeninizin önerdiği öğün saatlerine yakın kalmak ve yemekten sonra kısa yürüyüş planın parçasıdır.',
    },
    kaynaklar: ['TEMD-OBEZITE-2024', 'ADA-SOC-2026'],
    ayarlar: [{ id: 'ogunSaatleri', etiket: 'Önerilen öğün saatleri (ör. 08:00 · 13:00 · 19:00)', tur: 'metin' }],
  },
  {
    kod: 'diyet-glp1', brans: B, tur: 'gunluk', baslik: 'Protein ve yan etki günlüğüm',
    aciklama: 'Günlük protein hedefiniz ve ilacınızla ilgili yakınmalarınız. Önemli bir belirti olursa diyetisyeniniz haberdar olur.',
    durum: { ilac: ILAC_DESENLERI.glp1 },
    varsayilan: {
      alanlar: [
        { id: 'protein', etiket: 'Bugün aldığım protein', tur: 'sayi', min: 0, max: 400, birim: 'g' },
        { id: 'su', etiket: 'İçtiğim su', tur: 'sayi', min: 0, max: 30, birim: 'bardak' },
        { id: 'bulanti', etiket: 'Bulantı', tur: 'olcek' },
        { id: 'kabizlik', etiket: 'Kabızlık', tur: 'evet' },
        { id: 'kusma', etiket: 'Kustum', tur: 'evet' },
        { id: 'sivi_alamiyorum', etiket: 'Sıvı alamıyorum / içtiğimi tutamıyorum', tur: 'evet' },
        { id: 'karin_agrisi', etiket: 'Şiddetli ya da sırta vuran karın ağrısı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'karin', kosullar: [{ alan: 'karin_agrisi', evet: true }], duzey: 'acil', hasta: 'Şiddetli ya da sırta vuran karın ağrısı acil değerlendirme gerektirir. 112’yi arayın ya da en yakın acile başvurun.', hekim: 'GLP-1 kullanıcısı: şiddetli / sırta vuran karın ağrısı bildirdi.' },
        { id: 'sivi', kosullar: [{ alan: 'kusma', evet: true }, { alan: 'sivi_alamiyorum', evet: true }], duzey: 'hekime_bildir', hasta: 'Kusma ve sıvı alamama bilgisini uzmanınıza ilettik. Bugün hekiminizi arayın; baş dönmesi ya da bilinç bulanıklığı olursa 112.', hekim: 'GLP-1 kullanıcısı: kusma + sıvı alamama (dehidratasyon riski).' },
        { id: 'bulanti', kosullar: [{ alan: 'bulanti', enAz: 8 }], duzey: 'dikkat', hasta: 'Bulantınız yüksek görünüyor. Küçük porsiyonlar ve yavaş yemek yardımcı olabilir; sürerse hekiminize danışın.', hekim: 'GLP-1 kullanıcısı: bulantı ≥ 8/10.' },
      ],
      not: 'İştahınız azalsa da her öğünde bir protein kaynağı planın parçasıdır. İlaç ve doz kararı hekiminizindir.',
    },
    kaynaklar: ['GLP1-ORTAK-2025', 'ADA-SOC-2026'],
    ayarlar: [{ id: 'proteinHedefG', etiket: 'Günlük protein hedefi (g) — diyetisyenin belirlediği', tur: 'sayi' }],
  },
  {
    kod: 'diyet-tarama', brans: B, tur: 'tarama', baslik: 'Beslenme alışkanlıklarım',
    aciklama: 'Kısa sorular. Bu sorular herkese sorulur.',
    varsayilan: {
      maddeler: [...SCOFF_SORULARI],
      not: 'Yanıtlarınızı uzmanınız görür; size bir değerlendirme ya da sonuç gösterilmez.',
    },
    kaynaklar: ['SCOFF-TR', 'TEMD-OBEZITE-2024', 'PCOS-2023'],
  },
]
