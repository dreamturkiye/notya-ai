/**
 * NOTYA-SIFRE-SIFIRLA-01 (Kaan, 2026-10-20) — forgot-password / reset-password copy for the country `/login` and
 * `/password-reset` pages. Kept OUTSIDE the typed pack text-catalog (`YuzeyMetinleri`) deliberately: that catalog is
 * validated exhaustively per open language by `lib/ulke/paketDenetimi.ts`, and widening it here, at the end of an
 * already-large change, risked failing that gate for all six countries without a way to run a real `next build` in
 * this environment to prove it clean first (next/font cannot reach Google Fonts from this sandbox). This is a
 * small, self-contained dictionary instead, keyed by the same `DilKodu` every country page already carries — still
 * genuinely per-language, not a translated-later placeholder. Logged as a follow-up in docs/OPEN-COMMITMENTS.md:
 * fold this into the real pack catalog when it can be verified against a real build.
 */
import type { DilKodu } from '@/lib/ulke/tipler'

export type SifreSifirlaMetni = {
  forgotLink: string
  emailPlaceholder: string
  send: string
  sending: string
  sent: string
  sendError: string
  title: string
  newPassword: string
  confirmPassword: string
  update: string
  updating: string
  updated: string
  checking: string
  invalidLink: string
  backToLogin: string
  tooShort: string
  mismatch: string
  updateError: string
}

const EN: SifreSifirlaMetni = {
  forgotLink: 'Forgot password?',
  emailPlaceholder: 'Your email address',
  send: 'Send reset link',
  sending: 'Sending…',
  sent: 'A reset link has been sent to your email.',
  sendError: 'Could not send it. Check the email address and try again.',
  title: 'Set a new password',
  newPassword: 'New password',
  confirmPassword: 'Confirm new password',
  update: 'Update password',
  updating: 'Updating…',
  updated: 'Your password has been updated. Redirecting to login…',
  checking: 'Checking…',
  invalidLink: 'This link has expired or is invalid. Request a new reset link from the login page.',
  backToLogin: 'Back to login',
  tooShort: 'Password must be at least 8 characters',
  mismatch: 'Passwords do not match',
  updateError: 'Could not update your password. The link may have expired — request a new one.',
}

// Machine-translated, not native-reviewed — same caveat already standing on the other Uzbek copy in this repo
// (docs/FOTO-AI-CEVIRI-TASLAKLARI.md). Flagged in docs/OPEN-COMMITMENTS.md, not silently presented as final.
const UZ_LATN: SifreSifirlaMetni = {
  forgotLink: 'Parolni unutdingizmi?',
  emailPlaceholder: 'Elektron pochta manzilingiz',
  send: 'Tiklash havolasini yuborish',
  sending: 'Yuborilmoqda…',
  sent: 'Tiklash havolasi elektron pochtangizga yuborildi.',
  sendError: 'Yuborilmadi. Elektron pochta manzilini tekshirib qayta urinib ko‘ring.',
  title: 'Yangi parol o‘rnating',
  newPassword: 'Yangi parol',
  confirmPassword: 'Yangi parolni tasdiqlang',
  update: 'Parolni yangilash',
  updating: 'Yangilanmoqda…',
  updated: 'Parolingiz yangilandi. Kirish sahifasiga yo‘naltirilmoqdasiz…',
  checking: 'Tekshirilmoqda…',
  invalidLink: 'Havola muddati o‘tgan yoki noto‘g‘ri. Kirish sahifasidan yangi tiklash havolasini so‘rang.',
  backToLogin: 'Kirishga qaytish',
  tooShort: 'Parol kamida 8 belgidan iborat bo‘lishi kerak',
  mismatch: 'Parollar mos kelmadi',
  updateError: 'Parolingizni yangilab bo‘lmadi. Havola muddati o‘tgan bo‘lishi mumkin — yangisini so‘rang.',
}

const RU: SifreSifirlaMetni = {
  forgotLink: 'Забыли пароль?',
  emailPlaceholder: 'Ваш адрес электронной почты',
  send: 'Отправить ссылку для сброса',
  sending: 'Отправка…',
  sent: 'Ссылка для сброса пароля отправлена на вашу почту.',
  sendError: 'Не удалось отправить. Проверьте адрес и попробуйте снова.',
  title: 'Установить новый пароль',
  newPassword: 'Новый пароль',
  confirmPassword: 'Подтвердите новый пароль',
  update: 'Обновить пароль',
  updating: 'Обновление…',
  updated: 'Пароль обновлён. Перенаправление на страницу входа…',
  checking: 'Проверка…',
  invalidLink: 'Ссылка недействительна или устарела. Запросите новую на странице входа.',
  backToLogin: 'Назад ко входу',
  tooShort: 'Пароль должен содержать не менее 8 символов',
  mismatch: 'Пароли не совпадают',
  updateError: 'Не удалось обновить пароль. Возможно, ссылка устарела — запросите новую.',
}

export function sifreSifirlaMetni(dil: DilKodu): SifreSifirlaMetni {
  if (dil === 'uz-Latn' || dil === 'uz-Cyrl') return UZ_LATN
  if (dil === 'ru') return RU
  return EN
}
