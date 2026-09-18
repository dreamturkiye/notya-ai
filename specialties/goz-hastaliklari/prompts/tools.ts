/** GOZ-PROMPTS-LOCK — göz adımları (app/api/doktor/goz/route.ts). Uygulamada hekim çalıştırır; prompt yalnız ilgili adımı önerir. */
export const GOZ_TOOLS = [
  { name: 'goz.serit', description: 'Vizit şeridi: son VA ve GİB (OD/OS), hedef, DR evresi, sıradaki enjeksiyon, geciken görev' },
  { name: 'goz.olcum', description: 'Bilateral VA / GİB kaydet (hekimin ölçtüğü değer)' },
  { name: 'goz.olcum_nota', description: 'Son VA / GİB satırını bugünkü notun Objektif bölümüne ekle' },
  { name: 'goz.fundus', description: 'Göz dibi muayene kaydı: OD/OS disk (3C) → damar → makula → perifer' },
  { name: 'goz.fundus_nota', description: 'Son göz dibi satırını bugünkü notun Objektif bölümüne ekle' },
  { name: 'goz.kopya', description: 'Son muayeneden kopyala — taslak, hekim onaylı' },
  { name: 'goz.glokom', description: 'Glokom kartı: GİB serisi hedefle karşılaştırma, tetkik görevleri (tanı/hedef hekimin)' },
  { name: 'goz.dr', description: 'Diyabetik retinopati: hekimin girdiği evreye göre kontrol aralığı (TEMD / ICO)' },
  { name: 'goz.dr_sevk_kapat', description: 'Dahiliye göz dibi sevkini kapat + dahiliyeye geri bildirim' },
  { name: 'goz.enjeksiyon', description: 'İntravitreal enjeksiyon planı / kaydı (karar ve doz hekimin)' },
  { name: 'goz.sgk_kapi', description: 'SUT 4.2.33 kapı kontrolü: basamak, rapor, aralık' },
  { name: 'goz.sgkrapor', description: 'SGK rapor taslağı (anti-VEGF, implant, GİL) — hekim kilitler' },
  { name: 'goz.sgkrapor_kilit', description: 'Rapor taslağını hekim kilitler (eksik varsa uyarır)' },
  { name: 'goz.katarakt', description: 'Katarakt / GİL ön-op kontrol listesi' },
  { name: 'goz.goruntu_okuma', description: 'OCT / fundus / ön segment: asistan veya Ayşe taslağı, uzman onayı, yan yana karşılaştırma' },
  { name: 'goz.kontrol', description: 'Portal kontrol hatırlatması' },
  { name: 'goz.pediatrik', description: 'Ambliyopi / şaşılık izlem + SB görme taraması sevk eşikleri' },
  { name: 'goz.onsegment', description: 'Kuru göz / kontakt lens / alerjik konjonktivit protokol kartı' },
  { name: 'goz.kuru_goz', description: 'Kuru göz OSDI / Schirmer / TBUT kaydı (tanı yok)' },
  { name: 'goz.acil', description: 'Acil kırmızı bayrak kapısı: gecikmesiz 112 / acil yönlendirme' },
  { name: 'goz.intake_nota', description: 'Ön anket yanıtları → bugünkü notun Subjektif bölümüne (hasta beyanı)' },
  { name: 'goz.gorev', description: 'Göz görevleri: tamamla / ertele' },
] as const

export type GozToolName = (typeof GOZ_TOOLS)[number]['name']
