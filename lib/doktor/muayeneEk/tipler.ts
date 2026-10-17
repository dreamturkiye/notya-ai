/**
 * MUAYENE-EKLERI-01 (Dr. Gökhan Mamur, 2026-10-16) — post-muayene "Ekleri Ekle" akışının ortak tipleri.
 *
 * Akış: kayıt kesintisiz → durdur → Ekleri Ekle (yükle, tanı, değerlendir) → entegre muayene raporu → onay → yönlendirme.
 * Bu dosya saf ve istemci-güvenlidir (sunucu / DB bağımlılığı yok); sınıflandırma, hatırlatıcı, güvence ve rapor
 * modülleri aynı tipleri kullanır.
 */

/** Ek türleri. "rontgen" = röntgen / görüntüleme (BT, MR, USG dâhil); foto = klinik / önce-sonra / büyüme fotoğrafı. */
export const EK_TURLERI = ['lab', 'asi', 'foto', 'rontgen', 'ekg', 'epikriz', 'diger'] as const
export type EkTuru = (typeof EK_TURLERI)[number]

export const EK_TUR_ETIKETI: Record<EkTuru, string> = {
  lab: 'Laboratuvar',
  asi: 'Aşı belgesi / barkod',
  foto: 'Klinik fotoğraf',
  rontgen: 'Röntgen / görüntüleme',
  ekg: 'EKG',
  epikriz: 'Epikriz / rapor',
  diger: 'Diğer belge',
}

export function ekTuruMu(x: unknown): x is EkTuru {
  return typeof x === 'string' && (EK_TURLERI as readonly string[]).includes(x)
}

/** Belge kasası kategorisi (medical_documents.category) — lib/doktor/belgeTurleri.ts ORTAK_BELGE_TURLERI ile aynı yazım. */
export const EK_TUR_KASA_KATEGORISI: Record<EkTuru, string> = {
  lab: 'Lab Sonucu',
  asi: 'Aşı karnesi',
  foto: 'Muayene görüntüsü',
  rontgen: 'Röntgen',
  ekg: 'EKG',
  epikriz: 'Epikriz',
  diger: 'Diğer',
}

export type EkKaynak = 'dosya' | 'kamera' | 'barkod'

/** Sınıflandırma sonucu — "sor" true ise hekime tek dokunuşluk "Bu nedir?" gösterilir. */
export interface SiniflandirmaSonucu {
  tur: EkTuru
  /** 0–1. Hekim düzeltmesi/onayı sonrası 1. */
  guven: number
  /** En olasıdan başlayarak (ilk eleman = tur). "Diğer" her zaman arayüzde ayrıca sunulur. */
  adaylar: { tur: EkTuru; guven: number }[]
  sor: boolean
  /** Açıklanabilirlik: hangi ipucu sonucu etkiledi (kısa, PII içermez). */
  nedenler: string[]
}

/** Bir değerlendirme cümlesi/bulgusu. `id` = `EK-<n>.<m>` — rapordaki her yapay zekâ ifadesinin kaynağı. */
export interface EkBulgu {
  id: string
  metin: string
  /** Sistem hesabı mı (tablo/kural), model yorumu mu — arayüzde ayrı gösterilir. */
  kaynak: 'belge' | 'yorum'
  /** Önem: kritik/uyarı/bilgi. */
  duzey: 'kritik' | 'uyari' | 'bilgi'
}

export interface EkLabDegeri {
  test: string
  deger: string
  birim: string | null
  referans: string | null
  bayrak: 'H' | 'L' | 'critical' | 'normal' | 'unknown'
  dogrulanacak: boolean
}

export interface EkAsiSatiri {
  anahtar: string
  asiAdi: string
  dozNo: number | null
  /** YYYY-MM-DD; okunamadıysa null (asla tahmin edilmez). */
  uygulamaTarihi: string | null
  lotNo: string | null
  skt: string | null
  okunamadi: boolean
  neden: string | null
  hamMetin: string | null
  /** Aşı Ulusal Takvimi eşleşmesi (etiket); takvim dışıysa "Takvim dışı aşı". */
  eslesme: string
  /** 'karne' = geçmiş kayıt (dış kurum), 'bu_muayene' = bu muayenede uygulandı. Hekim onayda değiştirebilir. */
  kaynakTuru: 'karne' | 'bu_muayene'
}

export type EkDurum = 'tamam' | 'hata' | 'atlandi'

/** Bir ekin tam değerlendirmesi. Şifreli saklanır (lib/security/encryption). */
export interface EkSonuc {
  tur: EkTuru
  durum: EkDurum
  /** Kısa başlık (örn. "Hemogram — 12.10.2026"). Hasta kimliği içermez. */
  baslik: string
  ozet: string
  bulgular: EkBulgu[]
  /** Hekime gösterilecek uyarılar (düşük okunabilirlik, kimlik uyuşmazlığı, eksik referans…). */
  uyarilar: string[]
  /** Modelin kapsam dışı bıraktığı / kesin söylemediği şeyler. */
  sinirlar: string[]
  labDegerleri?: EkLabDegeri[]
  asiSatirlari?: EkAsiSatiri[]
  /** Rapordaki sayısal ifadelerin doğrulanabileceği değerler (sistem çıkarımı). */
  izinliSayilar: string[]
  /** Değerlendirmenin üretildiği sürüm — önbellek anahtarına girer. */
  surum: string
  /** Hata durumunda hekime gösterilen neden (ham hata metni değil). */
  hataNedeni?: string
  /** Hekimin tür seçimi nasıl belirlendi. */
  turKaynagi?: 'otomatik' | 'hekim' | 'ogrenilen'
}

/** Sunucunun rapora ve SOAP istemine koyduğu, kimlik/numara atanmış ek. */
export interface EkDegerlendirme {
  /** `EK-1` … rapor içi atıf. */
  etiket: string
  belgeId: string
  dosyaAdi: string
  sonuc: EkSonuc
}

/** Değerlendirme sürümü: prompt veya doğrulama değişirse önbellek geçersiz olur. */
export const EK_DEGERLENDIRME_SURUMU = 'ek-v1'

export const AZAMI_EK = 12
export const AZAMI_METIN = 1800
export const AZAMI_BULGU = 24
