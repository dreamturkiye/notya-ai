/**
 * MOBIL-PERSONEL-01 — ONE central permission map for the practice staff roles.
 *
 * Roles (personel.rol, migration 172):
 *   sekreter         front desk / secretary. UNCHANGED: keeps exactly the access it had before this file
 *                    existed (every pratikOturum route that is not doctor-only). It is NOT gated here.
 *   asistan          clinical assistant / nurse: read patient files + notes, add measurements and
 *                    attachments, see appointments. Never approves/signs, never billing/settings/staff.
 *   hasta_danismani  patient liaison: appointments, patient contact + communication, intake forms and
 *                    hasta portalı links. Never clinical note content, billing or settings.
 *
 * To change what a role may do, edit ROL_YETKILERI (who has which capability) or ROTA_YETKILERI
 * (which API path needs which capability). Nothing else in the code base encodes the matrix.
 *
 * Enforcement (server): lib/doktor/pratikOturum.ts calls yolIzniVarMi() for EVERY request that resolves
 * to a staff member. Default-deny: an API path that is not listed in ROTA_YETKILERI is closed to
 * asistan and hasta_danismani (the envanter test makes an unlisted pratikOturum route fail `npm test`).
 * Enforcement (UI): components use izinVarMi() only to hide what the server would refuse anyway.
 *
 * Pure module: no server imports, safe to import from client components.
 */

export const PERSONEL_ROLLERI = ['sekreter', 'asistan', 'hasta_danismani'] as const
export type PersonelRol = (typeof PERSONEL_ROLLERI)[number]
export type PratikRol = 'doktor' | PersonelRol

export function personelRoluMu(x: unknown): x is PersonelRol {
  return typeof x === 'string' && (PERSONEL_ROLLERI as readonly string[]).includes(x)
}

export type Yetki =
  | 'randevu.gor'          // see the calendar / day plan
  | 'randevu.yonet'        // create, move, cancel appointments; portal appointment requests
  | 'hasta.liste'          // patient list + name/contact (no clinical content)
  | 'hasta.kayit'          // register a patient / edit demographics + contact
  | 'hasta.dosya.oku'      // read the clinical patient file (history, medications, labs, growth, vaccines)
  | 'hasta.dosya.yaz'      // edit clinical file content
  | 'not.oku'              // read note content (SOAP)
  | 'not.yaz'              // delete a draft note and other note mutations
  | 'not.onayla'           // approve / sign a note (doctor only, enforced by doktorOturum)
  | 'olcum.ekle'           // add a measurement / vital sign to the file
  | 'ek.ekle'              // upload / read attachments (documents vault)
  | 'iletisim.gonder'      // individual patient communication (SMS / WhatsApp / e-mail queue, consent)
  | 'iletisim.toplu'       // bulk campaigns
  | 'mesaj'                // patient message threads
  | 'intake.oku'           // read intake forms
  | 'intake.yonet'         // create / send intake forms
  | 'portal.baglanti'      // hasta portalı links + portal appointment requests
  | 'gelen_belge'          // incoming documents inbox (also needs the doctor's switch)
  | 'onburo'               // front-desk desk (whispers, konsültan defteri, day plan helpers)
  | 'fatura'               // billing / invoices / payments
  | 'ayar'                 // practice settings (working hours, integrations, communication settings)
  | 'personel.yonet'       // invite / change role / revoke staff
  | 'recete'               // e-reçete, SGK, MBYS, clinical AI actions
  | 'ai.asistan'           // the AI assistant (Ayşe) actions
  | 'hesap.kendi'          // own profile / password / avatar

export const TUM_YETKILER: readonly Yetki[] = [
  'randevu.gor', 'randevu.yonet', 'hasta.liste', 'hasta.kayit', 'hasta.dosya.oku', 'hasta.dosya.yaz',
  'not.oku', 'not.yaz', 'not.onayla', 'olcum.ekle', 'ek.ekle', 'iletisim.gonder', 'iletisim.toplu',
  'mesaj', 'intake.oku', 'intake.yonet', 'portal.baglanti', 'gelen_belge', 'onburo', 'fatura', 'ayar',
  'personel.yonet', 'recete', 'ai.asistan', 'hesap.kendi',
]

/**
 * The matrix. `sekreter` is the pre-MOBIL-PERSONEL-01 behaviour, frozen: a staff member could reach every
 * pratikOturum route that was not guarded by sadeceDoktor() — that is everything below, and nothing
 * above `not.onayla` / `personel.yonet` / `recete` (those routes use doktorOturum or sadeceDoktor).
 */
export const ROL_YETKILERI: Record<PratikRol, readonly Yetki[]> = {
  doktor: TUM_YETKILER,
  sekreter: [
    // MOBIL-PERSONEL-04 (Kaan, 2026-10-16): a sekreter reads no clinical note content and can never delete a note
    // ('not.oku' / 'not.yaz' removed on purpose; routes: /api/notes/*, /api/doktor/son-notlar). Do not add them back.
    'randevu.gor', 'randevu.yonet', 'hasta.liste', 'hasta.kayit', 'hasta.dosya.oku', 'hasta.dosya.yaz',
    'olcum.ekle', 'iletisim.gonder', 'iletisim.toplu', 'mesaj', 'intake.oku',
    'intake.yonet', 'portal.baglanti', 'gelen_belge', 'onburo', 'fatura', 'ayar', 'ai.asistan', 'hesap.kendi',
  ],
  asistan: [
    'randevu.gor', 'hasta.liste', 'hasta.dosya.oku', 'not.oku', 'olcum.ekle', 'ek.ekle', 'intake.oku', 'hesap.kendi',
  ],
  hasta_danismani: [
    'randevu.gor', 'randevu.yonet', 'hasta.liste', 'hasta.kayit', 'iletisim.gonder', 'mesaj', 'intake.oku',
    'intake.yonet', 'portal.baglanti', 'hesap.kendi',
  ],
}

export function izinVarMi(rol: PratikRol | null | undefined, yetki: Yetki): boolean {
  if (!rol) return false
  return (ROL_YETKILERI[rol] || []).includes(yetki)
}

// ─── Route → capability table ────────────────────────────────────────────────────────────────────────

type Kural = {
  /** Path prefix (matched on a segment boundary). Longest match wins. */
  yol: string
  /** Capability for GET/HEAD. */
  oku?: Yetki
  /** Capability for every other method. `null` = nobody but the doctor (and the unchanged secretary). */
  yaz?: Yetki | null
  /** `oku: null` = closed to the new roles. */
  okuKapali?: boolean
  /** true = the unchanged secretary is ALSO refused (only for routes that did not serve her before). */
  sekreterKapali?: boolean
}

const K = (yol: string, oku: Yetki, yaz: Yetki | null, ek: Partial<Kural> = {}): Kural => ({ yol, oku, yaz, ...ek })
const KAPALI = (yol: string): Kural => ({ yol, okuKapali: true, yaz: null })

export const ROTA_YETKILERI: readonly Kural[] = [
  // ── own account (every staff role)
  K('/api/personel/me', 'hesap.kendi', 'hesap.kendi'),
  K('/api/personel/avatar', 'hesap.kendi', 'hesap.kendi'),
  K('/api/doktor/hesap', 'hesap.kendi', 'hesap.kendi'),   // sifre-degistir + oturum (Oturumlar / tüm cihazlardan çıkış)
  K('/api/doktor/mesajlar/unread-count', 'mesaj', 'mesaj'),

  // ── appointments
  K('/api/doktor/randevular', 'randevu.gor', 'randevu.yonet'),
  K('/api/doktor/gun-programi', 'randevu.gor', null),
  K('/api/doktor/calisma-saatleri', 'randevu.gor', 'ayar'),
  K('/api/doktor/randevu-portal/talepler', 'portal.baglanti', 'portal.baglanti'),
  K('/api/doktor/takip', 'randevu.gor', 'randevu.yonet'),
  K('/api/doktor/konsultasyon/defter', 'onburo', 'onburo'),
  K('/api/doktor/randevu-portal/ayar', 'portal.baglanti', 'ayar'),

  // ── patient roster + file
  K('/api/doktor/hastalar', 'hasta.liste', 'hasta.kayit'),
  K('/api/doktor/hastalar/[id]/sessions', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/hastalar/[id]/buyume-egrileri', 'hasta.dosya.oku', null),
  K('/api/doktor/hastalar/[id]/klinik-ozet', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/hastalar/[id]/hedef-boy', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/hastalar/[id]/olcumler', 'olcum.ekle', 'olcum.ekle', { sekreterKapali: true }),
  // MOBIL-PERSONEL-04 (Kaan, 2026-10-16): a sekreter never reads clinical note content and never deletes a note.
  K('/api/doktor/son-notlar', 'not.oku', null, { sekreterKapali: true }),
  K('/api/notes', 'not.oku', 'not.yaz', { sekreterKapali: true }),
  K('/api/doktor/asilar', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/asi-onam', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/dermatoloji', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/gebelik', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/goz', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/kadin-sagligi', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/mchat', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/gelisim-taramasi', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/yenidogan', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/muayene-ekleri', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  K('/api/doktor/documents', 'ek.ekle', 'ek.ekle', { sekreterKapali: true }),
  // deleting an attachment is not part of the assistant's remit
  K('/api/doktor/documents/[id]', 'ek.ekle', null, { sekreterKapali: true }),
  K('/api/doktor/konsultasyon', 'hasta.dosya.oku', 'hasta.dosya.yaz'),
  // FOTO-ARSIV-01: clinical photo archive. The sekreter never viewed clinical photos -> closed to her. asistan: read-only plus
  // the derived thumbnail upload; hasta_danismani has no 'hasta.dosya.oku' -> closed. The AI routes are doctor-only.
  K('/api/doktor/hasta-foto', 'hasta.dosya.oku', null, { sekreterKapali: true }),
  K('/api/doktor/hasta-foto/[id]/[id]/kucuk', 'hasta.dosya.oku', 'ek.ekle', { sekreterKapali: true }),
  { yol: '/api/doktor/hasta-foto/[id]/[id]/ai', okuKapali: true, yaz: null, sekreterKapali: true },
  { yol: '/api/doktor/hasta-foto/[id]/kalite', okuKapali: true, yaz: null, sekreterKapali: true },

  // ── intake + portal
  K('/api/doktor/intake-formlari', 'intake.oku', 'intake.yonet'),

  // ── communication
  K('/api/doktor/iletisim/toplu', 'iletisim.toplu', 'iletisim.toplu'),
  K('/api/doktor/iletisim/ayarlar', 'iletisim.gonder', 'ayar'),
  K('/api/doktor/iletisim', 'iletisim.gonder', 'iletisim.gonder'),
  K('/api/doktor/mesajlar', 'mesaj', 'mesaj'),

  // ── front desk only
  K('/api/doktor/gelen-belgeler', 'gelen_belge', 'gelen_belge'),
  K('/api/doktor/on-buro-fisilti', 'onburo', 'onburo'),
  K('/api/doktor/fisilti', 'onburo', 'onburo'),

  // ── billing
  K('/api/accounting', 'fatura', 'fatura'),

  // ── settings / integrations / staff
  K('/api/entegrasyon/yonetim', 'ayar', 'ayar'),
  K('/api/doktor/personel', 'personel.yonet', 'personel.yonet'),
  K('/api/doktor/erecete-ayar', 'ayar', 'ayar'),

  // ── clinical AI + doctor-only tooling: closed to the new roles (sekreter unchanged)
  KAPALI('/api/doktor/araclar'),
  KAPALI('/api/doktor/medula'),
  KAPALI('/api/doktor/recete-baslik'),
  KAPALI('/api/doktor/rrs'),
  KAPALI('/api/doktor/seans-paketi'),
  KAPALI('/api/doktor/asi-stok'),
  KAPALI('/api/doktor/konsult'),
  KAPALI('/api/doktor/not-konsult'),
  KAPALI('/api/doktor/eylem'),
  KAPALI('/api/doktor/hafiza'),
  KAPALI('/api/doktor/kullanim'),
  KAPALI('/api/doktor/onbellek-isin'),
  KAPALI('/api/doktor/rutin'),
  KAPALI('/api/doktor/ses-profili'),
  KAPALI('/api/asistan'),
  KAPALI('/api/sessions'),
]

function yolEsler(kuralYolu: string, yol: string): boolean {
  // `[id]` in a rule is one path segment.
  const kuralParcalari = kuralYolu.split('/').filter(Boolean)
  const yolParcalari = yol.split('/').filter(Boolean)
  if (yolParcalari.length < kuralParcalari.length) return false
  return kuralParcalari.every((p, i) => (p === '[id]' ? yolParcalari[i].length > 0 : p === yolParcalari[i]))
}

export function kuralBul(yol: string): Kural | null {
  let en: Kural | null = null
  let enUzunluk = -1
  for (const k of ROTA_YETKILERI) {
    if (!yolEsler(k.yol, yol)) continue
    const uzunluk = k.yol.split('/').length
    if (uzunluk > enUzunluk) { en = k; enUzunluk = uzunluk }
  }
  return en
}

export type YolKarari = { izin: true } | { izin: false; neden: 'sinifsiz' | 'kapali' | 'yetki' }

/**
 * May `rol` call `yontem yol`? doktor: always. sekreter: always, except rules marked sekreterKapali
 * (routes that did not serve her before MOBIL-PERSONEL-01). asistan / hasta_danismani: only through the table.
 */
export function yolIzniVarMi(rol: PratikRol, yol: string, yontem: string): YolKarari {
  if (rol === 'doktor') return { izin: true }
  const kural = kuralBul(yol)
  if (rol === 'sekreter') {
    return kural?.sekreterKapali ? { izin: false, neden: 'kapali' } : { izin: true }
  }
  if (!kural) return { izin: false, neden: 'sinifsiz' }
  const okuma = yontem === 'GET' || yontem === 'HEAD' || yontem === 'OPTIONS'
  if (okuma) {
    if (kural.okuKapali || !kural.oku) return { izin: false, neden: 'kapali' }
    return izinVarMi(rol, kural.oku) ? { izin: true } : { izin: false, neden: 'yetki' }
  }
  if (!kural.yaz) return { izin: false, neden: 'kapali' }
  return izinVarMi(rol, kural.yaz) ? { izin: true } : { izin: false, neden: 'yetki' }
}

// ─── Labels (Turkish product; country builds localise via the pack, see MOBIL-PERSONEL-01 parity) ──────

export const ROL_ETIKETI_TR: Record<PersonelRol, string> = {
  sekreter: 'Sekreter',
  asistan: 'Asistan (hemşire / klinik yardımcı)',
  hasta_danismani: 'Hasta danışmanı',
}
export const ROL_KISA_ETIKETI_TR: Record<PersonelRol, string> = {
  sekreter: 'Sekreter',
  asistan: 'Asistan',
  hasta_danismani: 'Hasta danışmanı',
}
export const ROL_ACIKLAMASI_TR: Record<PersonelRol, string> = {
  sekreter: 'Randevu, hasta kaydı, mesaj, gelen belgeler ve faturalama. Mevcut sekreter yetkileri aynen korunur.',
  asistan: 'Hasta dosyası ve notları yalnızca görüntüler; ölçüm/vital ve ek ekler; randevuları görür. Not onaylayamaz, fatura ve ayarlara erişemez.',
  hasta_danismani: 'Randevu, hasta iletişimi, bilgi formları ve hasta portalı bağlantıları. Klinik not içeriğini, faturayı ve ayarları göremez.',
}
export const ROL_ONBURO_ETIKETI_TR: Record<PersonelRol, string> = {
  sekreter: 'ÖN BÜRO',
  asistan: 'ASİSTAN',
  hasta_danismani: 'HASTA DANIŞMANI',
}
export const ROL_DAVET_CUMLESI_TR: Record<PersonelRol, string> = {
  sekreter: 'sekreter olarak çalışmaya davet etti. Randevuları, hasta kayıtlarını ve mesajları yönetebileceksiniz.',
  asistan: 'asistan olarak çalışmaya davet etti. Hasta dosyalarını ve randevuları görüntüleyip ölçüm ve ek ekleyebileceksiniz.',
  hasta_danismani: 'hasta danışmanı olarak çalışmaya davet etti. Randevuları, hasta iletişimini ve bilgi formlarını yönetebileceksiniz.',
}
