/** Tools the dahiliye-locked prompt may call (W0.1). Keep in sync with /api/doktor/dahiliye adımları. */
export const DAHILIYE_TOOLS = [
  { name: 'dahiliye.serit', description: 'Bugünkü vizit şeridi: KB / HbA1c Δ / LDL / eGFR / gecikmiş görevler / plan taslağı' },
  { name: 'dahiliye.kb', description: 'Ofis KB kaydet → Uzlaşı 2025 evre taslağı + HT planı' },
  { name: 'dahiliye.dm', description: 'DM kartı: HbA1c trend, yıllık tarama görevleri, sınıf önerisi' },
  { name: 'dahiliye.lipid', description: 'Lipid kartı: LDL hedef (hekim), statin/ALT izlem' },
  { name: 'dahiliye.kvr', description: 'KVR: kural kovası (ASKVH/DM+TOD/KBH) → SCORE2 (doğrulanmışsa) → LDL hedef + statin açığı' },
  { name: 'dahiliye.ckd', description: 'KDIGO G×A ısı haritası, plan, nefro sevk paketi' },
  { name: 'dahiliye.evkayit', description: 'Ev KB/glukoz/kilo kaydı ve özeti (beyaz önlük / maskeli)' },
  { name: 'dahiliye.ilacizlem', description: 'İlaç izlem takvimi: hasta_ilaclar → lab izlem görevleri' },
  { name: 'dahiliye.kilit', description: 'Hekim kilidi: kart alanını kilitle (tanı/evre/hedef/kategori)' },
  { name: 'dahiliye.sgkrapor', description: 'SGK ilaç kullanım raporu taslağı (HT/DM/statin/DOAK) kartlardan; hekim kilitler, Medula e-imza ile' },
  { name: 'dahiliye.dmdongu', description: 'DM kapalı döngü: FIB-4, ayak foto görevi, SGLT2/GLP-1 kardiyo-renal bayrak, hipoglisemi riski' },
  { name: 'dahiliye.anemi', description: 'Anemi merdiveni: morfoloji → sonraki test → olası neden (onaylı lab)' },
  { name: 'dahiliye.obezite', description: 'VKİ + TEMD basamakları, farmakoterapi sınıfı, bariatrik değerlendirme sevki, gerekçe metni' },
  { name: 'dahiliye.tarama', description: 'KETEM kolon/meme/serviks due; GGK pozitif → gastro sevk' },
  { name: 'dahiliye.asi', description: 'Erişkin aşı takvimi (HYP): grip, pnömokok, zona, Td, HBV, COVID-19' },
  { name: 'dahiliye.htpanel', description: 'HT başlangıç paneli istemi + 14 gün sonuçlanmayan lab takibi' },
  { name: 'dahiliye.anketsoap', description: 'Portal ön anketini bugünkü muayenenin Subjektif bölümüne ekle' },
  { name: 'dahiliye.sevk', description: 'Sevk oluştur (son onaylı panel eklenir)' },
] as const
export type DahiliyeToolName = (typeof DAHILIYE_TOOLS)[number]['name']
