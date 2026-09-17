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
  { name: 'dahiliye.sevk', description: 'Sevk oluştur (son onaylı panel eklenir)' },
] as const
export type DahiliyeToolName = (typeof DAHILIYE_TOOLS)[number]['name']
