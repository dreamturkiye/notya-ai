/**
 * NOTYA-ULKE-ARACLAR-01 — Uzbekistan: THE FOLLOW-UP LIST (the kit's tile `takip-paneli`), and who sees it.
 *
 * THE TOOL OF EVERY DOCTOR ROLE, NOT BASE (`sinif: 'hekimler'`). The list shows results a doctor KEPT on a patient
 * with a follow-up day the doctor entered. Only a tool of the account's own role can be kept, so the list is given
 * to exactly the roles that have at least one such tool here. Since 2026-10-10 (NOTYA-ULKE-UYGULA-UZ) that is every
 * one of the 40 doctor roles: the body mass index (./kendi/metinler.ts) is a tool of every doctor role, and the tools
 * audit of that day made the list "a tile of every doctor role" with the core set. The two allied professions have
 * no tool whose result can be kept and do not see it. Before that day 26 of the 42 roles saw it (22 of 40 before the
 * audit's decisions on roles were applied).
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
import { UZ_HEKIM_ROLLERI } from '../../klinik/rolListesi'
import { u } from './yardimci'

/** The roles that have at least one tool whose result can be kept: every doctor role. */
export const UZ_TAKIP_ROLLERI: readonly string[] = UZ_HEKIM_ROLLERI

export const UZ_TAKIP_ARACLARI: readonly PaketAraci[] = [
  {
    anahtar: 'takip-paneli', roller: UZ_TAKIP_ROLLERI, sinif: 'hekimler',
    metin: {
      ad: u('Nazorat roʻyxati', 'Назорат рўйхати', 'Список контроля'),
      aciklama: u('Bemor kartasida saqlangan natijalar boʻyicha oʻzingiz belgilagan nazorat sanalari: muddati oʻtganlari belgilanadi.', 'Бемор картасида сақланган натижалар бўйича ўзингиз белгилаган назорат саналари: муддати ўтганлари белгиланади.', 'Даты контроля, которые вы сами указали для результатов, сохранённых в картах пациентов: просроченные отмечены.'),
      alanlar: {},
      not: u('Roʻyxat faqat siz belgilagan sanalarni koʻrsatadi; tizim sana taklif qilmaydi va bemorga hech narsa yubormaydi.', 'Рўйхат фақат сиз белгилаган саналарни кўрсатади; тизим сана таклиф қилмайди ва беморга ҳеч нарса юбормайди.', 'Список показывает только указанные вами даты; система дату не предлагает и ничего не отправляет пациенту.'),
    },
  },
]
