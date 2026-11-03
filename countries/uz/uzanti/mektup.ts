/** UZ letter studio + honest visit export UI (Latin Uzbek). */
import type { MektupUzantiMetni, PmsEntegrasyonUzanti } from '@/lib/ulke/uzanti/tipler'

export const UZ_MEKTUP: MektupUzantiMetni = {
  baslik: 'Xat studiyasi',
  aciklama: 'Tasdiqlangan tashrifdan xat loyihasi. Har bir so‘zni o‘qib tuzatasiz. Bu yerdan hech narsa yuborilmaydi.',
  turler: [
    { tur: 'gp', ad: 'Shifokorga xat', aciklama: 'Bemornning odatdagi shifokoriga yangilanish' },
    { tur: 'referral', ad: 'Yo‘llanma', aciklama: 'Mutaxassisga yo‘llanma loyihasi' },
    { tur: 'patient', ad: 'Bemorga xat', aciklama: 'Bemor oqiydigan sodda til' },
  ],
  yaz: 'Xat yozish',
  yaziliyor: 'Yozilmoqda…',
  yenidenYaz: 'Qayta yozish',
  etiket: 'Xat',
  kopyala: 'Nusxa',
  kopyalandi: 'Nusxa olindi.',
  indir: 'Yuklab olish (.txt)',
  yazdir: 'Chop etish',
  makine: 'Faqat shu tasdiqlangan qayddan model yozgan. Ishlatishdan oldin tuzating.',
  yazilamadi: 'Xat yozilmadi. Qayta urinib ko‘ring.',
  onayliDegil: 'Avval qaydni tasdiqlang.',
  bos: 'Xat bo‘sh.',
  uyari: 'Faqat loyiha. Notya xat yubormaydi va boshqa tizimga yashirincha yozmaydi.',
  onayla: 'O‘qidim — eksportga qo‘shilsin',
  onaylandi: 'Eksport uchun imzolandi. O‘zgartirsangiz qayta imzolang.',
  onayBekliyor: 'Eksport paketiga kiritishdan oldin imzolang.',
}

export const UZ_EXPORT: PmsEntegrasyonUzanti = {
  baslik: 'Tashrif eksporte',
  aciklama: 'Tasdiqlangan tashrifni o‘zingiz nazorat qiladigan fayl sifatida yuklab oling. Boshqa mahsulotga yashirin sinxron yo‘q.',
  exportBaslik: 'Tashrif eksport paketi',
  exportAciklama: 'Tasdiqlangan qayd (va imzolagan xatlar) JSON sifatida.',
  exportDugme: 'Qanday ishlaydi',
  exportIndiriliyor: 'Tayyorlanmoqda…',
  kalemler: [
    {
      anahtar: 'export-pack',
      ad: 'Tashrif eksport paketi (JSON)',
      durum: 'hazir-export',
      aciklama: 'Har bir tasdiqlangan qaydda tayyor. Tashqi tizimga ulanilmaydi.',
    },
  ],
  uyari: 'Faqat eksport. O‘zingiz joylashtirasiz. “Synced” belgisi yo‘q.',
}
