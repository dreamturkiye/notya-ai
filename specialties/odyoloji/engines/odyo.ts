/** ODYLOJI-EXCEPTIONAL-01 — eşik kaydı; işitme kaybı tanısı hekimde. KBB araçlarına sızmaz. */
export const HEKIM_KILIT = 'Saf ses ortalaması eşik kaydıdır, işitme kaybı tanısı değildir. Cihaz ve SUT hekim raporuna bağlıdır.'
export const ACIL_METIN = 'Saatler/günler içinde ani işitme kaybı veya yüz felci eşliği: KBB acil — 112 / aynı gün KBB.'

export function ptaKayit(db: number): { bant: string; ozet: string } | { hata: string } {
  if (!(db >= -10 && db <= 120)) return { hata: 'Eşik −10 ile 120 dB arasında olmalı.' }
  const bant = db <= 25 ? 'normal sınırda kayıt' : db <= 40 ? 'hafif eşik bandı' : db <= 70 ? 'orta eşik bandı' : 'ileri eşik bandı'
  return { bant, ozet: `Kayıtlı saf ses ortalaması ${db} dB — ${bant}. Bu bir tanı değildir; sınıflama hekimindir.` }
}

export function cihazListe(hekimRapor: boolean): { ozet: string } {
  return {
    ozet: hekimRapor
      ? 'Uzman hekim raporu var olarak işaretli — SUT kontrol listesi hekim + odyolog birlikte tamamlar; cihaz markası/bedel yazılmaz.'
      : 'Uzman hekim raporu yok — SGK cihaz süreci açılamaz. Eşik kaydı tutulur, tanı/cihaz iddiası yok.',
  }
}

export function sessizOdaKayit(metrekare: number, tarama: boolean): { ozet: string } | { hata: string } {
  if (!(metrekare > 0 && metrekare < 80)) return { hata: 'Oda m² girin (29.03.2025 md.11 — ≥3 m² sessiz oda).' }
  const uygun = metrekare >= 3
  return {
    ozet: uygun
      ? `Sessiz oda ${metrekare} m² — md.11 tabanı karşılandı.${tarama ? ' Tarama kaydı (tanı değil).' : ''} Kayıp tanısı yok.`
      : `Sessiz oda ${metrekare} m² — md.11 ≥3 m² şartı zayıf. Eşik alınır, iddia yok.`,
  }
}

export const INTAKE_ACIL = [
  'Saatler / günler içinde ani işitme kaybı',
  'Yüz felci ile birlikte işitme kaybı',
  'Akıntılı, ağrılı kulak + ateş',
  'Yok',
]
