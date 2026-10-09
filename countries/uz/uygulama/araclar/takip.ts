/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: THE FOLLOW-UP LIST (the kit's tile `takip-paneli`), and who sees it.
 *
 * ROLE TOOL, NOT BASE. The list shows results a doctor KEPT on a patient with a follow-up day the doctor entered.
 * Only a tool of the account's own role can be kept, so the list is given to exactly the roles that have at least
 * one such tool here — 23 of the 40. For the other 17 it would stay empty for ever, and an empty tile is not a tool.
 * countries/uz/uygulama/araclar/araclar.test.ts holds this list to the pack: a role that gains its first tool, or
 * loses its last, must be added or removed here or the test fails.
 *
 * It stands in for the per-specialty follow-up ("cohort") panels of the pre-split application with ONE list. What it
 * is NOT: it has no column of any one disease, no reference range, no proposed interval and no reminder to the
 * patient — the day is the doctor's, and the system sends nothing.
 *
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts). Cyrillic derived from the Latin text by rule.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { u } from './yardimci'

/** The roles that have at least one tool whose result can be kept. */
export const UZ_TAKIP_ROLLERI: readonly string[] = [
  'acil-tip', 'anestezi', 'beyin-cerrahisi', 'cocuk-cerrahisi', 'genel-cerrahi', 'gogus-cerrahisi', 'gogus-hastaliklari', 'goz-hastaliklari',
  'dahiliye', 'dermatoloji', 'endokrinoloji', 'enfeksiyon-hastaliklari', 'kalp-damar-cerrahisi', 'kulak-burun-bogaz', 'nefroloji', 'onkoloji',
  'ortopedi', 'pediatri', 'plastik-cerrahi', 'radyoloji', 'romatoloji', 'uroloji', 'spor-hekimligi',
]

export const UZ_TAKIP_ARACLARI: readonly PaketAraci[] = [
  {
    anahtar: 'takip-paneli', roller: UZ_TAKIP_ROLLERI,
    metin: {
      ad: u('Nazorat roʻyxati', 'Назорат рўйхати', 'Список контроля'),
      aciklama: u('Bemor kartasida saqlangan natijalar boʻyicha oʻzingiz belgilagan nazorat sanalari: muddati oʻtganlari belgilanadi.', 'Бемор картасида сақланган натижалар бўйича ўзингиз белгилаган назорат саналари: муддати ўтганлари белгиланади.', 'Даты контроля, которые вы сами указали для результатов, сохранённых в картах пациентов: просроченные отмечены.'),
      alanlar: {},
      not: u('Roʻyxat faqat siz belgilagan sanalarni koʻrsatadi; tizim sana taklif qilmaydi va bemorga hech narsa yubormaydi.', 'Рўйхат фақат сиз белгилаган саналарни кўрсатади; тизим сана таклиф қилмайди ва беморга ҳеч нарса юбормайди.', 'Список показывает только указанные вами даты; система дату не предлагает и ничего не отправляет пациенту.'),
    },
  },
]
