/**
 * NOTYA-SES-BAGLAM-KUCULT-01 — gerçekçi büyüklükte SENTETİK pediatri hastası (QA fikstürü, gerçek kişi değildir).
 *
 * Sesli dosya özetinin ölçümü ve güvenlik testi için: 3 yılda 14 onaylı vizit (tam SOAP), 5 kayıtlı ilaç, 18 aşı,
 * 22 lab satırı, dolu ilk kayıt formu, cihaz kiloları, görüntüleme, belge, randevu. Güvenlik olguları bilerek konur:
 *   - penisilin alerjisi + son 90 günde Augmentin reçetesi         → alerji çatışması
 *   - aktif Tegretol (karbamazepin) + son reçete Klacid (klaritromisin) → ciddi etkileşim (ilaç tablosu)
 *   - vizit 12'de KRİTİK bulgu (SpO₂ %91), acil bayraklı EEG değerlendirmesi
 *   - vizit planlarında mg/kg ibuprofen (G3 güvenlik sinyali)
 */
import type { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'

export const GERCEKCI_HASTA_ADI = 'Deniz Aksoy'

/** Güvenlik olgularının kısa özette mutlaka görünen parçaları (test bunları arar). */
export const GUVENLIK_OLGULARI = {
  alerji: 'Penisilin',
  alerjiCatismasi: 'Alerji ile çelişen ilaç: Augmentin',
  aktifIlaclar: ['Tegretol', 'Pulmicort', 'Singulair', 'Ventolin', 'Ferrum'],
  etkilesim: 'Klacid',
  kritik: 'SpO₂ %91',
  acilBelge: 'fokal epileptiform',
  kronik: 'Epilepsi',
  kilo: '24,6 kg',
  kanGrubu: 'A Rh+',
  mgKg: 'mg/kg',
} as const

const gunOnce = (n: number, saat = 9) => {
  const d = new Date(Date.now() - n * 86400000)
  d.setUTCHours(saat, 0, 0, 0)
  return d.toISOString()
}

const VIZITLER: { gun: number; s: string; o: string; a: string; p: string; tani: string; icd: string; ilac?: { ad: string; doz: string; kullanim: string }[]; kilo: number; boy: number; ates?: number; kritik?: string[] }[] = [
  { gun: 1080, s: 'Anne 4 yaşındaki oğlunun 2 gündür 38,5 derece ateşi, burun akıntısı ve öksürüğü olduğunu belirtiyor. İştahı azalmış, sıvı alımı yeterli. Kusma, ishal yok. Kreşe gidiyor, sınıfta benzer hastalar var.', o: 'Genel durum iyi, bilinç açık. Farenks hiperemik, tonsiller hipertrofik eksüdasız. Bilateral timpan membranlar doğal. Akciğer sesleri doğal, ral ronküs yok. Kapiller dolum < 2 sn.', a: 'Akut üst solunum yolu enfeksiyonu, viral etiyoloji düşünüldü. Dehidratasyon bulgusu yok.', p: 'Semptomatik tedavi. Parasetamol 15 mg/kg/doz ateşte, günde en fazla 4 doz. Bol sıvı, burun lavajı. 3 gün içinde düzelmezse ya da solunum sıkıntısı olursa kontrol.', tani: 'Akut nazofarenjit', icd: 'J00', ilac: [{ ad: 'Calpol', doz: '15 mg/kg', kullanim: 'ateşte 6 saatte bir' }], kilo: 16.2, boy: 103, ates: 38.5 },
  { gun: 1010, s: 'Gece başlayan, sabaha karşı artan hırıltılı solunum ve kuru öksürük. Son 6 ayda 3. atak. Ailede babada astım öyküsü var. Evde sigara içilmiyor.', o: 'Solunum sayısı 32/dk, hafif subkostal çekilme. Bilateral yaygın ekspiratuvar wheezing, ekspiryum uzun. SpO₂ %95. Nabız 118/dk.', a: 'Tekrarlayan wheezing atağı, hafif-orta şiddette; erken çocukluk astımı açısından değerlendirilmeli.', p: 'Salbutamol inhaler 2 puf aralıklı ile 20 dakikada bir 3 kez, sonra 4 saatte bir. Kontrol 1 hafta sonra. Tekrarlayan atak nedeniyle kontrol edici tedavi planlanacak.', tani: 'Wheezing atağı', icd: 'R06.2', ilac: [{ ad: 'Ventolin inhaler', doz: '100 mcg', kullanim: '2 puf 4 saatte bir' }], kilo: 16.8, boy: 104 },
  { gun: 1000, s: 'Wheezing kontrolü. Atak sonrası öksürük azalmış, gece uyanması yok. İnhaler tekniği anneye gösterildi.', o: 'Solunum sesleri doğal, wheezing yok. SpO₂ %98.', a: 'Wheezing atağı gerilemiş. Astım tanısı ile kontrol edici tedaviye başlanması uygun.', p: 'Budesonid inhaler 200 mcg günde 2 kez hazneli. Montelukast 4 mg akşam. 3 ay sonra kontrol. Astım eylem planı verildi.', tani: 'Astım', icd: 'J45.9', ilac: [{ ad: 'Pulmicort', doz: '200 mcg', kullanim: 'günde 2 kez' }, { ad: 'Singulair', doz: '4 mg', kullanim: 'akşam' }], kilo: 16.9, boy: 104 },
  { gun: 900, s: 'Astım kontrolü. Son 3 ayda atak yok, egzersizde hafif öksürük. İlaçlarını düzenli kullanıyor.', o: 'Akciğer sesleri doğal. Büyüme persentilleri uygun.', a: 'Astım kontrol altında.', p: 'Mevcut tedavi devam. 4 yaş aşıları yapıldı. 6 ay sonra kontrol.', tani: 'Astım, kontrol altında', icd: 'J45.9', kilo: 17.6, boy: 107 },
  { gun: 760, s: 'Okulda öğretmeni ara ara dalıp gittiğini, seslenince tepki vermediğini fark etmiş. Günde birkaç kez, birkaç saniye sürüyor. Düşme, kasılma yok.', o: 'Nörolojik muayene doğal. Hiperventilasyon ile 8 saniyelik bakakalma epizodu gözlendi.', a: 'Absans nöbet şüphesi. EEG ve çocuk nöroloji konsültasyonu gerekli.', p: 'EEG istendi. Çocuk nöroloji konsültasyonu. Nöbet anında yapılacaklar anlatıldı; banyo ve yüzmede gözetim.', tani: 'Absans nöbet şüphesi', icd: 'G40.3', kilo: 18.9, boy: 110 },
  { gun: 730, s: 'EEG sonucu ve nöroloji görüşü ile geldi. Nöroloji karbamazepin başlamış, ilk haftada hafif uyku hali olmuş.', o: 'Nörolojik muayene doğal. Ataksi yok.', a: 'Epilepsi, antiepileptik tedavi altında. Nöroloji takibinde.', p: 'Tegretol 100 mg günde 2 kez devam, nöroloji dozu yönetiyor. Karbamazepin düzeyi, hemogram ve karaciğer enzimleri 1 ay sonra. Makrolid ve bazı antibiyotiklerle etkileşim anneye anlatıldı.', tani: 'Epilepsi', icd: 'G40.9', ilac: [{ ad: 'Tegretol', doz: '100 mg', kullanim: 'günde 2 kez' }], kilo: 19.1, boy: 111 },
  { gun: 700, s: 'Kontrol tetkikleri için geldi. Nöbet sıklığı belirgin azalmış. Uyku hali geçmiş.', o: 'Genel durum iyi. Deri döküntüsü yok.', a: 'Epilepsi, tedaviye yanıtlı. Tetkikler normal sınırda.', p: 'Tedavi devam. Hemogram, AST, ALT 3 ayda bir. Nöroloji kontrolü 3 ay sonra.', tani: 'Epilepsi', icd: 'G40.9', kilo: 19.4, boy: 112 },
  { gun: 560, s: 'Sağ kulak ağrısı, 39 derece ateş, huzursuzluk. 1 gündür.', o: 'Sağ timpan membran hiperemik, bombe. Sol doğal. Farenks hafif hiperemik.', a: 'Sağ akut otitis media. Penisilin alerjisi nedeniyle alternatif antibiyotik.', p: 'Sefdinir 14 mg/kg/gün tek doz 10 gün. İbuprofen 10 mg/kg/doz ağrı ve ateşte, 8 saatte bir. Karbamazepin ile etkileşim açısından makrolid tercih edilmedi. 10 gün sonra kontrol.', tani: 'Akut otitis media', icd: 'H66.9', ilac: [{ ad: 'Omnicef', doz: '14 mg/kg/gün', kullanim: 'günde 1 kez 10 gün' }, { ad: 'Pedifen', doz: '10 mg/kg', kullanim: '8 saatte bir' }], kilo: 20.2, boy: 114, ates: 39 },
  { gun: 545, s: 'Otit kontrolü. Ağrı ve ateş geçmiş.', o: 'Sağ timpan membran doğal, efüzyon yok.', a: 'Akut otitis media iyileşmiş.', p: 'Tedavi tamamlandı. Rutin izlem.', tani: 'Otitis media, iyileşmiş', icd: 'H66.9', kilo: 20.3, boy: 114 },
  { gun: 400, s: 'Solukluk ve yorgunluk. Et ve yeşillik tüketimi az, günde 700 ml süt içiyor.', o: 'Konjonktivalar soluk. Dalak ele gelmiyor. Üfürüm yok.', a: 'Beslenmeye bağlı demir eksikliği anemisi düşünüldü.', p: 'Hemogram, ferritin, serum demiri, demir bağlama kapasitesi istendi. Süt günde 500 ml ile sınırlandı. Demir 3 mg/kg/gün başlandı; 1 ay sonra hemogram kontrolü.', tani: 'Demir eksikliği anemisi', icd: 'D50.9', ilac: [{ ad: 'Ferrum Hausmann şurup', doz: '3 mg/kg/gün', kullanim: 'günde 1 kez aç karnına' }], kilo: 21.4, boy: 117 },
  { gun: 365, s: 'Anemi kontrolü. Demiri düzenli içiyor, iştahı artmış.', o: 'Solukluk azalmış.', a: 'Demir tedavisine yanıt var.', p: 'Demir 3 ay daha devam, depolar dolunca ferritin kontrolü. 6 yaş aşıları yapıldı.', tani: 'Demir eksikliği anemisi, tedavide', icd: 'D50.9', kilo: 21.8, boy: 118 },
  { gun: 120, s: 'Üst solunum yolu enfeksiyonu sonrası 2 gündür artan nefes darlığı, konuşurken kesiliyor. Evde salbutamol 4 saatte bir kullanmış, yanıt kısmi.', o: 'Solunum sayısı 38/dk, interkostal ve subkostal çekilme. Yaygın wheezing. SpO₂ %91 oda havasında. Nabız 132/dk.', a: 'Orta-ağır astım atağı. Oksijen gereksinimi sınırda.', p: 'Acilde nebül salbutamol 3 doz ve oral prednizolon 1 mg/kg verildi, SpO₂ %95\'e yükseldi. Prednizolon 1 mg/kg/gün 3 gün. Kontrol edici tedavi basamağı artırılacak. 48 saat sonra kontrol, kötüleşirse acil.', tani: 'Astım atağı', icd: 'J45.9', ilac: [{ ad: 'Deltacortril', doz: '1 mg/kg/gün', kullanim: '3 gün' }], kilo: 23.9, boy: 122, kritik: ['SpO₂ %91 oda havasında — orta-ağır astım atağı, acil nebül tedavisi verildi'] },
  { gun: 60, s: 'Boğaz ağrısı ve ateş, 38,8 derece. Kardeşinde streptokok faranjiti var.', o: 'Tonsiller hipertrofik, eksüdalı. Servikal lenfadenopati. Hızlı strep testi pozitif.', a: 'Streptokokal tonsillofarenjit.', p: 'Augmentin BID 45 mg/kg/gün 10 gün — anne penisilin alerjisini bu vizitte hatırlamadı, reçete kaydı düzeltilecek. İbuprofen 10 mg/kg/doz ateşte. 2 gün sonra telefonla kontrol.', tani: 'Streptokokal farenjit', icd: 'J02.0', ilac: [{ ad: 'Augmentin BID', doz: '45 mg/kg/gün', kullanim: 'günde 2 kez 10 gün' }], kilo: 24.2, boy: 123, ates: 38.8 },
  { gun: 20, s: 'Sinüzit düşünülen 12 gündür süren burun akıntısı, gece öksürüğü, alında ağrı. Nöbet yok.', o: 'Pürülan postnazal akıntı. Maksiller bölgede hassasiyet. Akciğer sesleri doğal.', a: 'Akut bakteriyel rinosinüzit. Penisilin alerjisi mevcut.', p: 'Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek. 10 gün sonra kontrol, 3 ay sonra astım ve epilepsi izlemi.', tani: 'Akut sinüzit', icd: 'J01.9', ilac: [{ ad: 'Klacid', doz: '15 mg/kg/gün', kullanim: 'günde 2 kez 10 gün' }], kilo: 24.6, boy: 124 },
]

const ASILAR: [string, number | null, number][] = [
  ['Hepatit B', 1, 2555], ['Hepatit B', 2, 2525], ['BCG', null, 2495], ['DaBT-İPA-Hib-HepB', 1, 2495], ['KPA', 1, 2495],
  ['DaBT-İPA-Hib-HepB', 2, 2435], ['KPA', 2, 2435], ['Hepatit B', 3, 2375], ['DaBT-İPA-Hib-HepB', 3, 2375],
  ['KKK', 1, 2190], ['Suçiçeği', 1, 2190], ['KPA', 3, 2190], ['Hepatit A', 1, 2190], ['DaBT-İPA-Hib', 4, 2010],
  ['OPA', 1, 2010], ['Hepatit A', 2, 2010], ['KKK', 2, 900], ['DaBT-İPA', 5, 900],
]

const LAB: [string, number, string, number, number | null, number | null][] = [
  ['Hb', 12.1, 'g/dL', 700, 11.5, 15.5], ['WBC', 7.8, '10^3/µL', 700, 5, 14.5], ['PLT', 310, '10^3/µL', 700, 150, 450], ['AST', 28, 'U/L', 700, 0, 40], ['ALT', 19, 'U/L', 700, 0, 40],
  ['Karbamazepin', 6.8, 'mg/L', 700, 4, 12], ['Hb', 9.8, 'g/dL', 400, 11.5, 15.5], ['MCV', 68, 'fL', 400, 77, 95], ['RDW', 17.2, '%', 400, 11.5, 14.5],
  ['Ferritin', 5, 'ng/mL', 400, 7, 140], ['Fe', 22, 'µg/dL', 400, 50, 120], ['TIBC', 460, 'µg/dL', 400, 250, 400], ['Hb', 11.6, 'g/dL', 365, 11.5, 15.5],
  ['MCV', 74, 'fL', 365, 77, 95], ['Ferritin', 18, 'ng/mL', 300, 7, 140], ['Hb', 12.4, 'g/dL', 300, 11.5, 15.5], ['AST', 31, 'U/L', 300, 0, 40],
  ['ALT', 22, 'U/L', 300, 0, 40], ['Karbamazepin', 7.4, 'mg/L', 300, 4, 12], ['CRP', 38, 'mg/L', 120, 0, 5], ['WBC', 14.2, '10^3/µL', 120, 5, 14.5], ['D vitamini', 18, 'ng/mL', 300, 30, 100],
]

/** Hastayı ve bütün dosyasını `db`'ye yazar; hasta id'sini döndürür. */
export function gercekciHastaEkle(db: SahteVeritabani, encrypt: (s: string) => string, doktorId: string): string {
  const hasta = db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: GERCEKCI_HASTA_ADI })),
    dob_encrypted: encrypt(gunOnce(365 * 7 + 40).slice(0, 10)),
    gender_encrypted: encrypt('male'),
    phone_encrypted: encrypt('0532 700 44 55'),
    notes_encrypted: encrypt(JSON.stringify({ anneAdi: 'QA-Anne-Selin', babaAdi: 'QA-Baba-Murat', kanGrubu: 'A Rh+' })),
    created_at: gunOnce(1085),
  }).id as string
  // NOTYA-CHECKPOINT-KARSILASTIRMA-01: no blind name index at this commit (the resolver reads patient names directly).

  db.ekle('hasta_intake_formlari', {
    patient_id: hasta, doktor_id: doktorId, created_at: gunOnce(1085),
    form_data_encrypted: encrypt(JSON.stringify({
      ad: 'Deniz', soyad: 'Aksoy', tcKimlik: '12345678950', telefon: '0532 700 44 55', veliYakinligi: 'anne', veliAd: 'Selin',
      cinsiyet: 'Erkek', kanGrubu: 'A Rh+', alerjiVarMi: 'Evet', alerjiAciklama: 'Penisilin (ürtiker, 3 yaşında amoksisilin sonrası)',
      kronikHastaliklar: [], kullaniyorMu: 'Hayır', kullanilanIlaclar: '', gecirilmisAmeliyatlar: 'Yok',
      aileOykusu: 'Babada astım, anneannede tip 2 diyabet', sigara: 'Evde içilmiyor', alkol: 'Yok',
      gebelikHaftasiPed: '38', dogumKilosuPed: '3250 g', dogumBoyuPed: '50 cm', dogumSekliPed: 'Normal doğum',
      dogumSonrasiPed: 'Sorunsuz', basvuruNedeniPed: 'Genel sağlık takibi', anneBoyu: '165', babaBoyu: '178',
      emzirmeSuresi: '14 ay', ekGidaBaslangic: '6. ay', uykuDuzeni: 'Gece 10 saat, tek başına uyuyor', okulDurumu: 'İlkokul 1. sınıf, başarılı',
      gelisimBasamaklari: 'Yürüme 12. ay, ilk kelimeler 11. ay, iki kelimelik cümle 22. ay', ekranSuresi: 'Günde 2 saat', sporAktivite: 'Yüzme kursu (gözetimli)',
    })),
  })

  VIZITLER.forEach((v, i) => {
    const seans = db.ekle('sessions', { patient_id: hasta, doctor_id: doktorId, created_at: gunOnce(v.gun), status: 'completed', specialty: 'pediatri', session_type: 'muayene', archived_at: null }).id
    db.ekle('notes', {
      session_id: seans, doctor_id: doktorId, patient_id: hasta, created_at: gunOnce(v.gun, 10), approved_at: gunOnce(v.gun, 11),
      content_subjektif: v.s, content_objektif: v.o, content_degerlendirme: v.a, content_plan: v.p, content_tani: v.tani,
      basvuru_yakinmasi: v.s.split('.')[0],
      icd10_codes: [{ code: v.icd, description_tr: v.tani }],
      content_ilaclar: v.ilac || [],
      vitaller: { kilo: v.kilo, boy: v.boy, ...(v.ates ? { ates: v.ates } : {}) },
      kritik_bulgular: v.kritik || null,
      _sira: i,
    })
  })

  const ilaclar: [string, string | null, string, string, number][] = [
    ['Tegretol', 'karbamazepin', '200 mg', 'günde 2 kez', 730],
    ['Pulmicort', 'budesonid', '200 mcg', 'günde 2 kez hazneli', 1000],
    ['Singulair', 'montelukast', '5 mg', 'akşam', 1000],
    ['Ventolin inhaler', 'salbutamol', '100 mcg', 'gerektiğinde 2 puf', 1010],
    ['Ferrum Hausmann şurup', 'demir polimaltoz', '3 mg/kg/gün', 'günde 1 kez', 90],
  ]
  for (const [ad, etken, doz, kullanim, gun] of ilaclar) {
    db.ekle('hasta_ilaclar', { patient_id: hasta, doctor_id: doktorId, ilac_adi: ad, etken_madde: etken, doz, kullanim_sikli: kullanim, kullanim, baslangic_tarihi: gunOnce(gun).slice(0, 10), bitis_tarihi: null, aktif: true, durum: 'aktif', created_at: gunOnce(gun) })
  }

  for (const [ad, doz, gun] of ASILAR) db.ekle('asilar', { patient_id: hasta, doktor_id: doktorId, asi_adi: ad, doz_no: doz, uygulama_tarihi: gunOnce(gun).slice(0, 10), kaynak: 'klinik', kaynak_note_id: null, created_at: gunOnce(gun) })

  LAB.forEach(([key, deger, birim, gun, alt, ust], i) => {
    db.ekle('lab_satirlar', { id: `lab-${i}`, patient_id: hasta, doctor_id: doktorId, canonical_key: key, kanonik_deger: deger, kanonik_birim: birim, value_text: `${deger} ${birim}`, numune_tarihi: gunOnce(gun).slice(0, 10), onayli: true, ref_low: alt, ref_high: ust })
  })

  for (const [kilo, gun] of [[23.9, 120], [24.2, 60], [24.6, 20]] as const) {
    db.ekle('cihaz_olcumleri', { patient_id: hasta, doctor_id: doktorId, tur: 'kilo', deger: kilo, birim: 'kg', cihaz: { ad: 'Terazi', uretici: 'QA', model: 'T1' }, profil: 'weight', kaynak: 'ble', alindi: gunOnce(gun), onaylandi: true })
  }

  db.ekle('belge_analizleri', {
    patient_id: hasta, doctor_id: doktorId, modality_final: 'eeg', durum: 'onaylandi', onaylandi_at: gunOnce(745),
    sonuc: { ozet: 'Uyanıklık EEG: 3 Hz jeneralize diken-dalga deşarjları ve sol temporal fokal epileptiform aktivite.', acil_bayrak: true, engines_used: ['claude'] },
    hekim_tanisi: [{ ad: 'Absans epilepsi', icd10: 'G40.3' }], hekim_ozet: 'EEG: jeneralize 3 Hz diken-dalga ve sol temporal fokal epileptiform aktivite; nöroloji takibi.',
  })
  db.ekle('belge_analizleri', {
    patient_id: hasta, doctor_id: doktorId, modality_final: 'akciger-grafisi', durum: 'onaylandi', onaylandi_at: gunOnce(121),
    sonuc: { ozet: 'Bilateral peribronşiyal kalınlaşma, konsolidasyon yok.', acil_bayrak: false, engines_used: ['claude'] },
    hekim_tanisi: [{ ad: 'Astım atağı', icd10: 'J45.9' }], hekim_ozet: 'PA akciğer grafisi: peribronşiyal kalınlaşma, pnömoni yok.',
  })
  for (const [tip, bolge, gun, yorum] of [['Röntgen', 'Akciğer PA', 121, 'Peribronşiyal kalınlaşma, konsolidasyon yok.'], ['EEG', 'Uyanıklık', 745, 'Jeneralize 3 Hz diken-dalga.'], ['USG', 'Batın', 380, 'Hepatosplenomegali yok.']] as const) {
    db.ekle('goruntu_calisma', { patient_id: hasta, doctor_id: doktorId, tip, modalite: tip, bolge, tarih: gunOnce(gun).slice(0, 10), onay_durum: 'hekim', hekim_yorum: yorum, created_at: gunOnce(gun) })
  }
  for (const [baslik, gun] of [['Çocuk nöroloji konsültasyon yanıtı', 735], ['Acil servis epikrizi — astım atağı', 119], ['Okul sağlık raporu', 200], ['Aşı karnesi fotoğrafı', 900]] as const) {
    db.ekle('hasta_belgeler', { patient_id: hasta, doctor_id: doktorId, baslik, created_at: gunOnce(gun), ai_ozet: { ozet: `${baslik}: ayrıntılar belgede; hekim tarafından görüldü.` } })
  }
  db.ekle('randevular', { patient_id: hasta, doktor_id: doktorId, baslangic: new Date(Date.now() + 10 * 86400000).toISOString(), tur: 'kontrol', durum: 'planli' })
  db.ekle('randevular', { patient_id: hasta, doktor_id: doktorId, baslangic: new Date(Date.now() + 80 * 86400000).toISOString(), tur: 'astım izlem', durum: 'planli' })
  return hasta
}
