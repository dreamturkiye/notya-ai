/**
 * NOTYA-INTAKE-DENETIM (2026-10-07) — branch questions for the 10 Klinik branches (lib/specialties/klinikDikey.ts).
 *
 * Until now every Klinik branch fell back to 'genel' and its patients got the core form only. Each branch now has
 * its own section, keyed by its Klinik slug, next to the shared core (lib/intake/coreAlanlar.ts). Standard history
 * questions only — no diagnostic claims. Field ids are new and unique; nothing stored is renamed.
 * Clinical review is pending for every section here (docs/INTAKE-DENETIM.md, REVIEW).
 *
 * TUS ≠ Klinik: dermatoloji ≠ klinik-dermatoloji, plastik-cerrahi ≠ estetik-cerrahi, FTR ≠ fizyoterapi,
 * psikiyatri ≠ klinik-psikolog, KBB ≠ odyoloji — each keeps its own section.
 */
import type { IntakeAlan, IntakeBolum } from './coreAlanlar'
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { BASVURU_NEDENI, BRANS_SORULARI, GEBELIK_EMZIRME, SIKAYET_SURESI_STANDART } from './bransSorulari'

const evetHayir = { tur: 'radio' as const, secenekler: ['Hayır', 'Evet'] }
const evetHayirBilmiyorum = { tur: 'radio' as const, secenekler: ['Hayır', 'Evet', 'Bilmiyorum'] }
const AKTIVITE = ['Hiç', '1-2 gün', '3-4 gün', '5 gün ve üzeri']

/** klinik-dermatoloji reuses the dermatoloji questions it shares (same id = same question), without the specialist ones. */
const DERM_ORTAK = ['basvuruNedeni', 'sikayetSuresiDerm', 'ciltTipi', 'lezyonOzellikleri', 'acilBelirtilerDerm', 'yeniIlacDerm', 'yeniIlacListesiDerm', 'gunesMaruziyeti', 'baslikDermGecmisi', 'bilinenDermHastaliklari', 'sistemikTedaviOykusuDerm', 'gebelikDurumuDerm', 'aileCiltKanseri', 'kullanilanUrunler', 'biliknCiltAlerjisi']
const dermOrtak: IntakeAlan[] = DERM_ORTAK.map((id) => BRANS_SORULARI.dermatoloji.alanlar.find((a) => a.id === id)!).filter(Boolean)

export const KLINIK_SORULARI: Record<KlinikYeniSlug, IntakeBolum> = {
  'sac-ekimi': {
    baslik: 'Saç ve Saçlı Deri',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sacDokulmeSuresiSE', etiket: 'Saç dökülmesi ne zamandır var?', tur: 'radio', secenekler: ['1 yıldan az', '1-3 yıl', '3-5 yıl', '5 yıldan uzun'] },
      { id: 'sacDokulmeBolgesiSE', etiket: 'Dökülme en çok hangi bölgede?', tur: 'checkbox-grup', secenekler: ['Ön saç çizgisi', 'Tepe', 'Şakaklar', 'Yaygın / tüm saçlı deri', 'Kaş / sakal', 'Diğer'] },
      { id: 'saclideriSikayetSE', etiket: 'Saçlı deride şikâyetiniz var mı?', tur: 'checkbox-grup', secenekler: ['Kaşıntı', 'Kepek / pullanma', 'Kızarıklık', 'Yara', 'Yok'] },
      { id: 'baslikSacGecmisi', etiket: 'Önceki Tedaviler', tur: 'bolum-basligi' },
      { id: 'oncekiSacTedavisiSE', etiket: 'Saç dökülmesi için daha önce kullandığınız / yaptırdığınız tedaviler', tur: 'checkbox-grup', secenekler: ['Saç losyonu / köpük', 'Ağızdan hap', 'PRP', 'Mezoterapi', 'Saç ekimi', 'Hiçbiri'] },
      { id: 'oncekiSacEkimiSE', etiket: 'Daha önce saç ekimi olduysanız: yılı ve yeri', tur: 'textarea', placeholder: 'Örn. 2021, İstanbul' },
      { id: 'lokalAnesteziSE', etiket: 'Daha önce lokal anestezide (uyuşturma iğnesi) sorun yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Hiç olmadım'] },
      { id: 'keloitSE', etiket: 'Keloit (aşırı skar) eğiliminiz var mı?', ...evetHayirBilmiyorum },
      { id: 'kanSulandiriciSE', etiket: 'Kan sulandırıcı veya aspirin türü ilaç kullanıyor musunuz?', ...evetHayirBilmiyorum },
      GEBELIK_EMZIRME,
      { id: 'baslikSacAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileSacDokulmesiSE', etiket: 'Ailede saç dökülmesi var mı?', tur: 'radio', secenekler: ['Hayır', 'Anne tarafında', 'Baba tarafında', 'Her iki tarafta', 'Bilmiyorum'] },
    ],
  },

  'medikal-estetik': {
    baslik: 'Estetik Uygulama Öncesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'ilgilenilenUygulamaME', etiket: 'İlgilendiğiniz uygulamalar', tur: 'checkbox-grup', secenekler: ['Botulinum toksin', 'Dolgu', 'Cilt yenileme (peeling, lazer)', 'Mezoterapi / PRP', 'Bölgesel incelme', 'Henüz karar vermedim'] },
      { id: 'baslikMEGecmisi', etiket: 'Önceki Uygulamalar ve Sağlık', tur: 'bolum-basligi' },
      { id: 'oncekiUygulamaME', etiket: 'Daha önce yaptırdığınız uygulamalar', tur: 'checkbox-grup', secenekler: ['Botulinum toksin', 'Dolgu', 'Lazer / peeling', 'İp askı', 'Estetik ameliyat', 'Hiçbiri'] },
      { id: 'oncekiUygulamaSorunME', etiket: 'Önceki uygulamalarda sorun yaşadıysanız kısaca yazın', tur: 'textarea' },
      { id: 'ciltHastaligiME', etiket: 'Bilinen cilt hastalıklarınız', tur: 'checkbox-grup', secenekler: ['Akne', 'Rozasea', 'Egzama', 'Sedef (Psoriazis)', 'Vitiligo', 'Yok'] },
      { id: 'ucukME', etiket: 'Sık uçuk çıkar mı?', ...evetHayir },
      { id: 'otoimmunME', etiket: 'Bilinen bir romatizmal / bağışıklık sistemi hastalığınız var mı?', ...evetHayirBilmiyorum },
      { id: 'keloitME', etiket: 'Keloit (aşırı skar) eğiliminiz var mı?', ...evetHayirBilmiyorum },
      { id: 'kanSulandiriciME', etiket: 'Kan sulandırıcı veya aspirin türü ilaç kullanıyor musunuz?', ...evetHayirBilmiyorum },
      GEBELIK_EMZIRME,
    ],
  },

  'estetik-cerrahi': {
    baslik: 'Estetik Cerrahi Görüşmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'ilgilenilenBolgeEC', etiket: 'Hangi bölge için görüşmek istiyorsunuz?', tur: 'checkbox-grup', secenekler: ['Yüz', 'Burun', 'Göz kapağı', 'Meme', 'Karın', 'Vücut şekillendirme', 'Diğer'] },
      { id: 'oncekiEstetikEC', etiket: 'Daha önce geçirdiğiniz estetik işlemler', tur: 'checkbox-grup', secenekler: ['Botoks / Dolgu', 'Meme Estetiği', 'Liposuction', 'Rinoplasti (Burun)', 'Yüz Germe', 'Yok'] },
      { id: 'baslikECGecmisi', etiket: 'Ameliyat Öncesi Sağlık', tur: 'bolum-basligi' },
      { id: 'anesteziSorunuEC', etiket: 'Daha önce anestezide sorun yaşadınız mı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Hiç anestezi almadım'] },
      { id: 'yaraIyilesmeEC', etiket: 'Yara iyileşmesinde sorun (keloit, geç iyileşme) yaşadınız mı?', ...evetHayir },
      { id: 'kanamaBozukluguEC', etiket: 'Bilinen bir kanama / pıhtılaşma bozukluğunuz var mı?', ...evetHayirBilmiyorum },
      { id: 'pihtiOykusuEC', etiket: 'Daha önce bacakta veya akciğerde pıhtı oldu mu?', ...evetHayirBilmiyorum },
      { id: 'kanSulandiriciEC', etiket: 'Kan sulandırıcı veya aspirin türü ilaç kullanıyor musunuz?', ...evetHayirBilmiyorum },
      GEBELIK_EMZIRME,
    ],
  },

  'klinik-dermatoloji': {
    baslik: 'Cilt Şikâyetiniz',
    alanlar: dermOrtak,
  },

  longevity: {
    baslik: 'Yaşam Tarzı ve Önleyici Sağlık',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'aktiviteLG', etiket: 'Haftada kaç gün en az 30 dakika hareket ediyorsunuz?', tur: 'radio', secenekler: AKTIVITE },
      { id: 'uykuSuresiLG', etiket: 'Gece ortalama kaç saat uyuyorsunuz?', tur: 'radio', secenekler: ['5 saatten az', '5-6 saat', '7-8 saat', '8 saatten fazla'] },
      { id: 'stresLG', etiket: 'Son bir ayda stres düzeyiniz', tur: 'radio', secenekler: ['Düşük', 'Orta', 'Yüksek'] },
      { id: 'beslenmeLG', etiket: 'Beslenme düzeninizi kısaca anlatın', tur: 'textarea' },
      { id: 'takviyeLG', etiket: 'Kullandığınız vitamin ve takviyeler', tur: 'textarea', placeholder: 'Adı ve ne sıklıkla — yoksa boş bırakın' },
      { id: 'baslikLGTarama', etiket: 'Tarama ve Kontroller', tur: 'bolum-basligi' },
      { id: 'sonCheckupLG', etiket: 'Son kapsamlı kan tahlili / check-up tarihiniz', tur: 'text', placeholder: 'Örn. 03.2025 veya yaptırmadım' },
      { id: 'taramaLG', etiket: 'Yaptırdığınız tarama testleri', tur: 'checkbox-grup', secenekler: ['Kolonoskopi', 'Mamografi', 'Smear', 'PSA', 'Kemik yoğunluğu', 'Hiçbiri'] },
      GEBELIK_EMZIRME,
      { id: 'baslikLGAile', etiket: 'Aile Öyküsü', tur: 'bolum-basligi' },
      { id: 'aileErkenHastalikLG', etiket: 'Ailede erken yaşta (55-65 yaş öncesi) görülen hastalıklar', tur: 'checkbox-grup', secenekler: ['Kalp krizi / inme', 'Diyabet', 'Kanser', 'Demans', 'Yok', 'Bilmiyorum'] },
    ],
  },

  fizyoterapi: {
    baslik: 'Fizyoterapi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'agriBolgesiFzt', etiket: 'Ağrı / şikâyet hangi bölgede?', tur: 'text' },
      { id: 'sikayetSuresiFzt', etiket: 'Bu şikâyet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'agriSiddetiFzt', etiket: 'Ağrınızın şiddeti (0: yok — 10: dayanılmaz)', tur: 'select', secenekler: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { id: 'gunlukKisitlamaFzt', etiket: 'Günlük yaşamınızı ne kadar kısıtlıyor?', tur: 'radio', secenekler: ['Hiç', 'Az', 'Orta', 'Ciddi şekilde'] },
      { id: 'hekimYonlendirmeFzt', etiket: 'Bir hekim tarafından yönlendirildiniz mi?', tur: 'radio', secenekler: ['Evet', 'Hayır'] },
      { id: 'baslikFztGecmisi', etiket: 'Geçmiş', tur: 'bolum-basligi' },
      { id: 'tetkikFzt', etiket: 'Bu şikâyetle ilgili elinizdeki tetkikler', tur: 'checkbox-grup', secenekler: ['Röntgen', 'MR', 'BT', 'EMG', 'Hiçbiri'] },
      { id: 'bolgeAmeliyatFzt', etiket: 'Bu bölgeden ameliyat oldunuz mu?', ...evetHayir },
      { id: 'oncekiFizyoterapiFzt', etiket: 'Daha önce fizyoterapi aldınız mı?', ...evetHayir },
      { id: 'yardimciCihazFzt', etiket: 'Kullandığınız ortez, protez veya yardımcı cihaz', tur: 'text' },
      GEBELIK_EMZIRME,
    ],
  },

  ergoterapi: {
    baslik: 'Ergoterapi Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sikayetSuresiErg', etiket: 'Bu zorluk ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'zorlanilanAlanErg', etiket: 'Günlük yaşamda zorlandığınız alanlar', tur: 'checkbox-grup', secenekler: ['Giyinme', 'Yemek yeme', 'Kişisel bakım / banyo', 'Yazı yazma / ince el becerileri', 'Ev işleri', 'Okul / iş', 'Oyun / boş zaman', 'Hareket / denge'] },
      { id: 'hekimTanisiErg', etiket: 'Hekiminizin koyduğu bir tanı varsa yazın', tur: 'textarea', placeholder: 'Raporunuz varsa getirmeniz yeterli' },
      { id: 'oncekiTerapiErg', etiket: 'Daha önce aldığınız destekler', tur: 'checkbox-grup', secenekler: ['Ergoterapi', 'Fizyoterapi', 'Dil ve konuşma terapisi', 'Özel eğitim', 'Hiçbiri'] },
      { id: 'yardimciCihazErg', etiket: 'Kullandığınız yardımcı cihaz veya ortez', tur: 'text' },
      { id: 'okulIsErg', etiket: 'Okul / iş durumu', tur: 'text', placeholder: 'Örn. 3. sınıf, masa başı iş, emekli' },
    ],
  },

  diyetisyen: {
    baslik: 'Beslenme Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'boyDy', etiket: 'Boyunuz (cm)', tur: 'text', placeholder: 'Biliyorsanız' },
      { id: 'kiloDy', etiket: 'Kilonuz (kg)', tur: 'text', placeholder: 'Biliyorsanız — klinikte de ölçülür' },
      { id: 'kiloDegisimiDy', etiket: 'Son 6 ayda kilonuz değişti mi?', tur: 'radio', secenekler: ['Değişmedi', 'Arttı', 'Azaldı'] },
      { id: 'ogunDy', etiket: 'Günde kaç öğün yiyorsunuz?', tur: 'radio', secenekler: ['1-2', '3', '4 ve üzeri', 'Düzensiz'] },
      { id: 'suDy', etiket: 'Günlük su tüketiminiz', tur: 'radio', secenekler: ['1 litreden az', '1-2 litre', '2 litreden fazla'] },
      { id: 'ozelBeslenmeDy', etiket: 'Uyguladığınız özel beslenme', tur: 'checkbox-grup', secenekler: ['Vejetaryen', 'Vegan', 'Glutensiz', 'Laktozsuz', 'Yok'] },
      { id: 'besinHassasiyetDy', etiket: 'Besin alerjisi, dokunan veya yiyemediğiniz besinler', tur: 'textarea' },
      { id: 'aktiviteDy', etiket: 'Haftada kaç gün en az 30 dakika hareket ediyorsunuz?', tur: 'radio', secenekler: AKTIVITE },
      { id: 'oncekiDiyetisyenDy', etiket: 'Daha önce diyetisyen desteği aldınız mı?', ...evetHayir },
      GEBELIK_EMZIRME,
    ],
  },

  'klinik-psikolog': {
    baslik: 'Görüşme Öncesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'sureKP', etiket: 'Bu durum ne zamandır sürüyor?', tur: 'radio', secenekler: ['Birkaç gündür', 'Birkaç haftadır', 'Aylardır', 'Yıllardır'] },
      { id: 'zorlanilanAlanKP', etiket: 'Son dönemde sizi en çok zorlayan alanlar', tur: 'checkbox-grup', secenekler: ['İş / okul', 'İlişkiler', 'Aile', 'Uyku', 'Kaygı / endişe', 'Keder / kayıp', 'Diğer'] },
      { id: 'oncekiDestekKP', etiket: 'Daha önce aldığınız destek', tur: 'checkbox-grup', secenekler: ['Psikolojik danışmanlık / terapi', 'Psikiyatrik tedavi', 'Hiçbiri'] },
      { id: 'psikiyatrikIlacKP', etiket: 'Şu anda psikiyatrik ilaç kullanıyor musunuz?', ...evetHayir },
      {
        id: 'guvenlikTaramaKP', etiket: 'Son zamanlarda kendinize zarar verme veya yaşamınızı sonlandırma düşüncesi geldi mi?',
        tur: 'radio', zorunlu: true, secenekler: ['Hayır', 'Evet'],
        yardim: 'Rutin bir güvenlik sorusudur. “Evet” ise formu beklemeyin: 112’yi arayın veya en yakın acile başvurun.',
      },
    ],
  },

  odyoloji: {
    baslik: 'İşitme Değerlendirmesi',
    alanlar: [
      BASVURU_NEDENI,
      { id: 'isitmeKulakOdy', etiket: 'İşitme azlığı hangi kulakta?', tur: 'radio', secenekler: ['Sağ', 'Sol', 'Her iki kulak', 'İşitme azlığım yok', 'Emin değilim'] },
      { id: 'sikayetSuresiOdy', etiket: 'Bu şikâyet ne zamandır var?', ...SIKAYET_SURESI_STANDART },
      { id: 'aniIsitmeKaybiOdy', etiket: 'İşitme azlığı son 3 gün içinde aniden mi başladı?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Emin değilim'], yardim: 'Aniden başlayan işitme kaybında formu beklemeyin; aynı gün bir KBB hekimine veya acile başvurun.' },
      { id: 'cinlamaOdy', etiket: 'Kulak çınlaması var mı?', tur: 'radio', secenekler: ['Hayır', 'Tek kulakta', 'İki kulakta'] },
      { id: 'basDonmesiOdy', etiket: 'Baş dönmesi veya dengesizlik yaşıyor musunuz?', ...evetHayir },
      { id: 'gurultuOdy', etiket: 'Gürültülü ortamda çalışıyor veya sık sık yüksek sese maruz kalıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet', 'Eskiden'] },
      { id: 'baslikOdyGecmisi', etiket: 'Geçmiş', tur: 'bolum-basligi' },
      { id: 'isitmeCihaziOdy', etiket: 'İşitme cihazı kullanıyor musunuz?', tur: 'radio', secenekler: ['Hayır', 'Evet, tek kulak', 'Evet, iki kulak', 'Eskiden kullandım'] },
      { id: 'kulakAmeliyatiOdy', etiket: 'Kulak ameliyatı geçirdiniz mi?', ...evetHayir },
      { id: 'aileIsitmeOdy', etiket: 'Ailede erken yaşta işitme kaybı var mı?', ...evetHayirBilmiyorum },
    ],
  },
}
