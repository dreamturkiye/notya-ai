/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: BASE TOOLS — the same for every role (`roller: null`), and for an account
 * that has chosen no role. MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts).
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { u } from './yardimci'

export const UZ_TEMEL_ARACLAR: readonly PaketAraci[] = [
  {
    // Base: every role gives patients access to their page the same way. The tile's name is the name of the card
    // on the patient's file (../portalMetinleri.ts → erisim.baslik), so the doctor finds the same words there.
    anahtar: 'hasta-portali', roller: null,
    metin: {
      ad: u('Bemor sahifasi', 'Бемор саҳифаси', 'Страница пациента'),
      aciklama: u('Bemorga oʻz sahifasiga kirish bering: havola va PIN-kod bemor kartasida yaratiladi.', 'Беморга ўз саҳифасига кириш беринг: ҳавола ва ПИН-код бемор картасида яратилади.', 'Выдайте пациенту доступ к его странице: ссылка и ПИН-код создаются в карте пациента.'),
      alanlar: {},
      not: u('Tizim bemorga hech narsa yubormaydi: havola va PIN-kodni oʻzingiz berasiz.', 'Тизим беморга ҳеч нарса юбормайди: ҳавола ва ПИН-кодни ўзингиз берасиз.', 'Система ничего не отправляет пациенту: ссылку и ПИН-код вы передаёте сами.'),
    },
  },
  {
    // NOTYA-ULKE-MESAJ-01 — Base: every role keeps its own text blocks the same way. The pack brings NO ready-made
    // template: what is in a doctor's list is what that doctor wrote. The screen's own words: ../sablonMetinleri.ts.
    anahtar: 'sablonlarim', roller: null,
    metin: {
      ad: u('Shablonlarim', 'Шаблонларим', 'Мои шаблоны'),
      aciklama: u('Qayd va xabarlar uchun oʻz tayyor matnlaringiz: yarating, tahrirlang, oʻchiring.', 'Қайд ва хабарлар учун ўз тайёр матнларингиз: яратинг, таҳрирланг, ўчиринг.', 'Ваши собственные готовые тексты для записей и сообщений: создавайте, изменяйте, удаляйте.'),
      alanlar: {},
      not: u('Shablon faqat sizning matningiz: tizim uni oʻzi yozmaydi va hech qayerga oʻzi qoʻymaydi.', 'Шаблон фақат сизнинг матнингиз: тизим уни ўзи ёзмайди ва ҳеч қаерга ўзи қўймайди.', 'Шаблон — только ваш текст: система не пишет его сама и никуда не вставляет его сама.'),
    },
  },
]
