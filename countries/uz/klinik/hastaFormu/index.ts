/**
 * NOTYA-ULKE-INTAKE-01 — Uzbekistan: THE INTAKE FORM's content — the core questions every patient gets, the
 * questions of each of the 40 roles, and the consent sentence. Part of the pack's CLINICAL half: reached only
 * through countries/active/klinik, and only on the server. A role's questions reach a browser only inside a form
 * that was asked for by a doctor of that role (lib/ulke/intake/form.ts).
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * MACHINE-WRITTEN, EVERY SET. AWAITS A LOCAL CLINICIAN. The core set and each of the 40 role sets carries
 * `inceleme: { makineYazimi: true, klinisyen: null }`: written by a machine, read by no clinician practising in
 * Uzbekistan. The same status is in the roles table of docs/COUNTRY-PACK-UZBEKISTAN.md. A set is reviewed when
 * `klinisyen` names the person who read and signed it — and when a set changes, `surum` below changes with it.
 *
 * THE CONSENT SENTENCE IS A DRAFT. NOT READ BY A LAWYER (`hukukcuInceledi: false`; checklist I1, I2). Its stamp is
 * stored with every form it was accepted on, so that a reviewed wording can be told apart from this one.
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * What the form deliberately does not ask, and what a local source must supply first: ./yerelIcerik.ts.
 * The answers are NOT given to the model that writes a visit note (docs/OPEN-COMMITMENTS.md, NOTYA-ULKE-INTAKE-01).
 */
import type { HastaFormuIcerigi } from '@/lib/ulke/intake/tipler'
import { UZ_CEKIRDEK_BOLUMLER } from './cekirdek'
import { UZ_ROL_SORULARI_1 } from './roller1'
import { UZ_ROL_SORULARI_2 } from './roller2'
import { UZ_ROL_SORULARI_3 } from './roller3'
import { MAKINE, u } from './yardimci'

export { UZ_FORM_YEREL_ICERIK, type UzFormYuvasi } from './yerelIcerik'

export const UZ_HASTA_FORMU: HastaFormuIcerigi = {
  surum: 'uz-taslak-2026-10-09',
  riza: {
    surum: 'uz-taslak-2026-10-09',
    hukukcuInceledi: false,
    metin: u(
      'Javoblaringizni faqat shifokoringiz koʻradi. Ular sizning tibbiy maʼlumotlaringiz sifatida himoyalangan holda saqlanadi va koʻrikka tayyorlanish uchun ishlatiladi. Soʻrovnomani toʻldirish ixtiyoriy.',
      'Жавобларингизни фақат шифокорингиз кўради. Улар сизнинг тиббий маълумотларингиз сифатида ҳимояланган ҳолда сақланади ва кўрикка тайёрланиш учун ишлатилади. Сўровномани тўлдириш ихтиёрий.',
      'Ваши ответы увидит только ваш врач. Они хранятся в защищённом виде как ваши медицинские сведения и используются для подготовки к приёму. Заполнять анкету необязательно.',
    ),
    veliMetni: u(
      'Javoblaringizni faqat bolaning shifokori koʻradi. Ular bolaning tibbiy maʼlumotlari sifatida himoyalangan holda saqlanadi va koʻrikka tayyorlanish uchun ishlatiladi. Siz soʻrovnomani bolaning ota-onasi yoki qonuniy vakili sifatida toʻldirasiz. Toʻldirish ixtiyoriy.',
      'Жавобларингизни фақат боланинг шифокори кўради. Улар боланинг тиббий маълумотлари сифатида ҳимояланган ҳолда сақланади ва кўрикка тайёрланиш учун ишлатилади. Сиз сўровномани боланинг ота-онаси ёки қонуний вакили сифатида тўлдирасиз. Тўлдириш ихтиёрий.',
      'Ваши ответы увидит только врач ребёнка. Они хранятся в защищённом виде как медицинские сведения ребёнка и используются для подготовки к приёму. Вы заполняете анкету как родитель или законный представитель ребёнка. Заполнять её необязательно.',
    ),
  },
  cekirdek: { bolumler: UZ_CEKIRDEK_BOLUMLER, inceleme: MAKINE },
  roller: { ...UZ_ROL_SORULARI_1, ...UZ_ROL_SORULARI_2, ...UZ_ROL_SORULARI_3 },
}
