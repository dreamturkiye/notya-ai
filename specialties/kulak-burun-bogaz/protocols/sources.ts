/**
 * KBB-GORUNTU-OKUMA-01 — kaynak hiyerarşisi (TR önce), göz bölümünün sources.ts deseniyle aynı: rol /
 * kimlik / yıl yazılır, kitap veya kılavuz metni gömülmez. `dogrulama`: 'birincil' = birincil metin
 * okunup ilgili madde doğrulandı; 'ikincil' = uluslararası derinlik, çakışmada TR kaynağı kazanır;
 * 'hekim' = bu repoda doğrulanamadı, hekim teyit eder.
 */
export type KbbRef = 'TKBBD' | 'LITFL_NASOLARYNGOSCOPY' | 'SGK_SUT'

export interface KbbKaynak { ref: KbbRef; ad: string; rol: 'tr-dernek' | 'uluslararasi' | 'tr-yasal'; dogrulama: 'birincil' | 'ikincil' | 'hekim'; not?: string }

export const KBB_KAYNAKLAR: Record<KbbRef, KbbKaynak> = {
  TKBBD: {
    ref: 'TKBBD', ad: 'Türk Kulak Burun Boğaz ve Baş Boyun Cerrahisi Derneği — standart otoskopik muayene terminolojisi (kulak zarı/ışık üçgeni, dış kulak yolu bulguları)',
    rol: 'tr-dernek', dogrulama: 'hekim', not: 'otoskopi.ts motorunda zaten kullanılıyordu (KBB-EXCEPTIONAL-01); burada aynen devam ediyor, kopyalanmadı',
  },
  LITFL_NASOLARYNGOSCOPY: {
    ref: 'LITFL_NASOLARYNGOSCOPY', ad: "Nickson C. \"Flexible Nasopharyngolaryngoscopy.\" Life in the Fast Lane (LITFL) Critical Care Compendium, 2026 (litfl.com/flexible-nasopharyngolaryngoscopy)",
    rol: 'uluslararasi', dogrulama: 'ikincil',
    not: 'Muayene sırası (burun boşluğu → nazofarinks → orofarinks/hipofarinks → supraglottis → glottis) ve vokal kord hareketliliği terminolojisi (abdüksiyon/addüksiyon, simetri, parezi/paralizi) buradan — resmî TKBBD/dernek protokolü ile karşılaştırılmadı, hekim teyit eder. 2026-10-14 okundu.',
  },
  SGK_SUT: { ref: 'SGK_SUT', ad: 'SGK Sağlık Uygulama Tebliği — KBB endoskopi/muayene işlem kodları', rol: 'tr-yasal', dogrulama: 'hekim', not: 'Güncel metin hekim/idare tarafından doğrulanır' },
}

export type Dipnot = { ref: KbbRef; not: string }
export const KAYNAK_SIRASI: KbbRef[] = ['TKBBD', 'SGK_SUT', 'LITFL_NASOLARYNGOSCOPY']
