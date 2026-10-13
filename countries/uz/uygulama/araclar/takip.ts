/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: THE FOLLOW-UP LIST (the kit's tile `takip-paneli`), and who sees it.
 *
 * THE TOOL OF EVERY ROLE THAT CAN KEEP A RESULT, NOT BASE. The list shows results kept on a patient with a follow-up
 * day the clinician entered. Only a tool of the account's own role can be kept, so the list is given to exactly the
 * roles that have at least one such tool here. That is every role of the pack: the 40 doctor roles (the body mass
 * index is a tool of every doctor role) and the two allied professions, which now have a session or safety record of
 * their own. It is not `sinif: 'hekimler'`, because that class cannot include an allied profession.
 * countries/uz/uygulama/araclar/araclar.test.ts holds this to the pack: role by role, the list is shown exactly
 * where a result can be kept; and the pack check holds the class to the pack's doctor roles on the day one is added.
 *
 * It stands in for the per-specialty follow-up ("cohort") panels of the pre-split application with ONE list. What it
 * is NOT: it has no column of any one disease, no reference range, no proposed interval and no reminder to the
 * patient — the day is the doctor's, and the system sends nothing.
 *
 * MACHINE-WRITTEN. AWAITS NATIVE REVIEW (see ./index.ts). Cyrillic derived from the Latin text by rule.
 */
import type { PaketAraci } from '@/lib/ulke/araclar/tipler'
import { UZ_ROL_ANAHTARLARI } from '../../klinik/rolListesi'
import { u } from './yardimci'

/** The roles that have at least one tool whose result can be kept: every role of the pack, in the pack's order. */
export const UZ_TAKIP_ROLLERI: readonly string[] = UZ_ROL_ANAHTARLARI

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
