/**
 * NOTYA-ARSIV-01 — an archived muayene is invisible everywhere until it is taken out of the archive.
 *
 *   1. GUARD (same spirit as lib/supabase/noStore.test.ts): every read of `notes` / `sessions` in
 *      doctor-, patient- and AI-facing code goes through lib/doktor/arsiv (arsivsizNotlar /
 *      arsivsizSeanslar). A raw `.from('notes'|'sessions')` read fails this test unless it is in
 *      IZINLI below with a reason (ownership checks, open-one-note-by-id, archive management).
 *      Writes (.insert/.update/.delete/.upsert right after .from) are not reads and are ignored.
 *   2. The helpers against the in-memory Supabase (lib/security/testing/sahteSupabase.ts).
 *   3. Real route handlers: arsivle → dashboard / İnceleme / Ayşe gün özeti drop the muayene;
 *      arsivden-cikar → everything reappears. Synthetic data only.
 *
 *   npm test (--experimental-test-module-mocks)
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { arsivsizIlaclar, arsivsizNotlar, arsivsizSeanslar, seansArsivdeMi } from './arsiv'
import { nottanIlacAktar } from './receteAktarim'

const KOK = resolve(__dirname, '../..')

// ─── 1. Guard ────────────────────────────────────────────────────────────────────────────────

/** Raw reads that legitimately see archived rows. `adet` = number of raw reads in that file. */
const IZINLI: Record<string, { adet: number; neden: string }> = {
  'app/api/doktor/hastalar/[id]/sessions/route.ts': { adet: 1, neden: 'Muayene Geçmişi list — filters archived_at itself (default view archived-free, ?arsiv=1 = Arşivlenenler)' },
  'app/api/doktor/hastalar/[id]/sessions/[sessionId]/arsivle/route.ts': { adet: 1, neden: 'archive management: ownership check + reads archived_at' },
  'app/api/doktor/hastalar/[id]/sessions/[sessionId]/arsivden-cikar/route.ts': { adet: 1, neden: 'archive management: ownership check + reads archived_at' },
  'app/api/doktor/hastalar/[id]/sessions/[sessionId]/kalici-sil/route.ts': { adet: 2, neden: 'archive management: permanent delete of an already-archived muayene' },
  'app/api/notes/[id]/route.ts': { adet: 1, neden: 'open one note by id — allowed for archived, page shows the "Arşivde" banner' },
  'app/api/doktor/medula/recete/route.ts': { adet: 1, neden: 'open one note by id (reçete) — allowed for archived, page shows the "Arşivde" banner' },
  'app/api/notes/[id]/approve/route.ts': { adet: 1, neden: 'doctor action on one note by id (approve), ownership-scoped' },
  'app/api/notes/whatsapp/route.ts': { adet: 1, neden: 'doctor action on one note by id (send), ownership-scoped' },
  'app/api/doktor/not-konsult/route.ts': { adet: 1, neden: 'the note the doctor has open, by id; its patient context comes from hastaDosyaDerleyici (archive-filtered)' },
  'app/api/doktor/rrs/route.ts': { adet: 1, neden: 'note by id → patient ownership check' },
  'app/api/doktor/cihaz-olcum/dosya/route.ts': { adet: 1, neden: 'note by id → its visit id for the document link (ownership-scoped)' },
  'app/api/doktor/belgeler/analiz/onayla/route.ts': { adet: 2, neden: 'writes into the note the doctor targeted by explicit id; auto-targeting above uses the helpers' },
  'lib/doktor/receteAktarim.ts': { adet: 1, neden: 'approval path: the note being approved, by id → hasta_ilaclar' },
  'lib/doktor/hastaSahipligi.ts': { adet: 1, neden: 'ownership check of a session id' },
  'lib/vault/service.ts': { adet: 1, neden: 'ownership check of a visit id before filing a document' },
}

/**
 * NOTYA-ARSIV-02 — raw `hasta_ilaclar` reads that legitimately see an archived muayene's drugs.
 * Everything else (dosya İlaçlar, Sağlığım, Ayşe dossier / etkileşim / eylemler, reçete, search,
 * specialty cards, kohort) must use arsivsizIlaclar. Writes are ignored as above.
 */
const IZINLI_ILAC: Record<string, { adet: number; neden: string }> = {
  'lib/doktor/receteAktarim.ts': { adet: 1, neden: 'approval write path: must see hidden rows so a re-prescription re-claims the row (kaynak_note_id → this live note) instead of duplicating it' },
}

/**
 * NOTYA-ASI-NOT-01 — raw `asilar` reads that legitimately see a vaccine hidden with its archived muayene. Everything
 * else (aşı kartı, Sağlığım / portal karne + PDF, Ayşe dossier / konsült / eylem mükerrer, kohort / Fısıltı / çek
 * listesi, hatırlatma, search) must use arsivsizAsilar. Writes are ignored as above.
 */
const IZINLI_ASI: Record<string, { adet: number; neden: string }> = {
  'lib/doktor/notAsiAktarim.ts': { adet: 1, neden: 'approval write path: must see this note\'s own rows and rows hidden by an archived note so re-approval updates / deletes / re-claims instead of duplicating' },
}

const TARANAN = ['app', 'lib', 'components', 'specialties', 'core']
const ATLA = [/\.test\.tsx?$/, /(^|\/)tests\//, /^lib\/security\/testing\//, /^lib\/doktor\/arsiv\.ts$/]
const OKUMA = /\.from\(\s*['"`](notes|sessions)['"`]\s*\)/g
// Any call taking the table name — `.from('hasta_ilaclar')` and helpers like `countFor('hasta_ilaclar', …)`.
const ILAC_OKUMA = /\(\s*['"`]hasta_ilaclar['"`]\s*[,)]/g
const ASI_OKUMA = /\(\s*['"`]asilar['"`]\s*[,)]/g
const YAZMA = /^\s*\.(insert|update|delete|upsert)\(/

function dosyalar(dizin: string, out: string[] = []): string[] {
  for (const ad of readdirSync(dizin)) {
    const tam = join(dizin, ad)
    if (statSync(tam).isDirectory()) { if (ad !== 'node_modules' && !ad.startsWith('.')) dosyalar(tam, out) }
    else if (/\.(ts|tsx)$/.test(ad)) out.push(tam)
  }
  return out
}

/** file → raw read count (writes excluded). */
export function hamOkumalar(desen: RegExp = OKUMA): Map<string, number> {
  const sayim = new Map<string, number>()
  for (const kok of TARANAN) {
    for (const tam of dosyalar(join(KOK, kok))) {
      const yol = relative(KOK, tam).split('\\').join('/')
      if (ATLA.some((r) => r.test(yol))) continue
      const metin = readFileSync(tam, 'utf8')
      for (const m of metin.matchAll(desen)) {
        const sonra = metin.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 200)
        if (YAZMA.test(sonra)) continue
        sayim.set(yol, (sayim.get(yol) || 0) + 1)
      }
    }
  }
  return sayim
}

describe('NOTYA-ARSIV-01 guard — notes/sessions reads go through lib/doktor/arsiv', () => {
  it('no raw read outside the allowlist', () => {
    const ihlal: string[] = []
    for (const [yol, adet] of hamOkumalar()) {
      const izin = IZINLI[yol]
      if (!izin) ihlal.push(`${yol}: ${adet} raw read(s) — use arsivsizNotlar/arsivsizSeanslar (lib/doktor/arsiv) or allowlist with a reason`)
      else if (adet > izin.adet) ihlal.push(`${yol}: ${adet} raw reads, allowlisted ${izin.adet} — new read must use the helper`)
    }
    assert.deepEqual(ihlal, [], `Archived muayene could leak:\n${ihlal.join('\n')}`)
  })

  it('allowlist is not stale (every entry exists and still has exactly that many raw reads)', () => {
    const sayim = hamOkumalar()
    const eski = Object.entries(IZINLI).filter(([yol, { adet }]) => (sayim.get(yol) || 0) !== adet).map(([yol, { adet }]) => `${yol}: allowlisted ${adet}, found ${sayim.get(yol) || 0}`)
    assert.deepEqual(eski, [])
  })

  it('every allowlist entry has a reason', () => {
    for (const [yol, { neden }] of Object.entries({ ...IZINLI, ...IZINLI_ILAC, ...IZINLI_ASI })) assert.ok(neden.trim().length > 10, yol)
  })
})

describe('NOTYA-ARSIV-02 guard — hasta_ilaclar reads go through arsivsizIlaclar', () => {
  it('no raw hasta_ilaclar read outside the allowlist', () => {
    const ihlal: string[] = []
    for (const [yol, adet] of hamOkumalar(ILAC_OKUMA)) {
      const izin = IZINLI_ILAC[yol]
      if (!izin) ihlal.push(`${yol}: ${adet} raw hasta_ilaclar read(s) — use arsivsizIlaclar (lib/doktor/arsiv) or allowlist with a reason`)
      else if (adet > izin.adet) ihlal.push(`${yol}: ${adet} raw hasta_ilaclar reads, allowlisted ${izin.adet} — new read must use the helper`)
    }
    assert.deepEqual(ihlal, [], `An archived muayene's drug could leak:\n${ihlal.join('\n')}`)
  })

  it('allowlist is not stale', () => {
    const sayim = hamOkumalar(ILAC_OKUMA)
    const eski = Object.entries(IZINLI_ILAC).filter(([yol, { adet }]) => (sayim.get(yol) || 0) !== adet).map(([yol, { adet }]) => `${yol}: allowlisted ${adet}, found ${sayim.get(yol) || 0}`)
    assert.deepEqual(eski, [])
  })

  it('the pattern catches .from() and table-name helpers, not writes', () => {
    const say = (s: string) => [...s.matchAll(ILAC_OKUMA)].filter((m) => !YAZMA.test(s.slice((m.index ?? 0) + m[0].length))).length
    assert.equal(say(`sb.from('hasta_ilaclar').select('*')`), 1)
    assert.equal(say(`countFor('hasta_ilaclar', (q) => q)`), 1)
    assert.equal(say(`sb.from('hasta_ilaclar')\n  .update({ aktif: false })`), 0)
    assert.equal(say(`hedefTablo: 'hasta_ilaclar'`), 0)
  })
})

describe('NOTYA-ASI-NOT-01 guard — asilar reads go through arsivsizAsilar', () => {
  it('no raw asilar read outside the allowlist', () => {
    const ihlal: string[] = []
    for (const [yol, adet] of hamOkumalar(ASI_OKUMA)) {
      const izin = IZINLI_ASI[yol]
      if (!izin) ihlal.push(`${yol}: ${adet} raw asilar read(s) — use arsivsizAsilar (lib/doktor/arsiv) or allowlist with a reason`)
      else if (adet > izin.adet) ihlal.push(`${yol}: ${adet} raw asilar reads, allowlisted ${izin.adet} — new read must use the helper`)
    }
    assert.deepEqual(ihlal, [], `An archived muayene's vaccine could leak:\n${ihlal.join('\n')}`)
  })

  it('allowlist is not stale', () => {
    const sayim = hamOkumalar(ASI_OKUMA)
    const eski = Object.entries(IZINLI_ASI).filter(([yol, { adet }]) => (sayim.get(yol) || 0) !== adet).map(([yol, { adet }]) => `${yol}: allowlisted ${adet}, found ${sayim.get(yol) || 0}`)
    assert.deepEqual(eski, [])
  })
})

// ─── 2. Helpers ──────────────────────────────────────────────────────────────────────────────

describe('NOTYA-ARSIV-01 helpers', () => {
  function kur() {
    const db = new SahteVeritabani()
    const d = randomUUID(), p = randomUUID()
    const acik = db.ekle('sessions', { doctor_id: d, patient_id: p, archived_at: null })
    const arsiv = db.ekle('sessions', { doctor_id: d, patient_id: p, archived_at: '2026-09-23T10:00:00Z' })
    const nAcik = db.ekle('notes', { session_id: acik.id, doctor_id: d, approved_at: null })
    const nArsiv = db.ekle('notes', { session_id: arsiv.id, doctor_id: d, approved_at: null })
    return { db, sb: db.istemci() as never, d, p, acik, arsiv, nAcik, nArsiv }
  }

  it('arsivsizSeanslar drops archived sessions', async () => {
    const { sb, d, acik } = kur()
    const { data } = await arsivsizSeanslar(sb, 'id').eq('doctor_id', d)
    assert.deepEqual((data as { id: string }[]).map((x) => x.id), [acik.id])
  })

  it('arsivsizNotlar drops notes of archived sessions, counts too', async () => {
    const { sb, d, nAcik } = kur()
    const { data } = await arsivsizNotlar(sb, 'id').eq('doctor_id', d)
    assert.deepEqual((data as { id: string }[]).map((x) => x.id), [nAcik.id])
    const { count } = await arsivsizNotlar(sb, 'id', { count: 'exact', head: true }).eq('doctor_id', d).is('approved_at', null)
    assert.equal(count, 1)
  })

  it('an existing sessions!inner(patient_id) embed + sessions.x filter keeps working next to the helper', async () => {
    const { sb, d, p, nAcik } = kur()
    const { data } = await arsivsizNotlar(sb, 'id, sessions!inner(patient_id)').eq('doctor_id', d).eq('sessions.patient_id', p)
    assert.deepEqual((data as { id: string }[]).map((x) => x.id), [nAcik.id])
  })

  it('unarchive → the note is back', async () => {
    const { db, sb, d, arsiv } = kur()
    db.tablo('sessions').find((s) => s.id === arsiv.id)!.archived_at = null
    const { data } = await arsivsizNotlar(sb, 'id').eq('doctor_id', d)
    assert.equal((data as unknown[]).length, 2)
  })

  it('seansArsivdeMi reads object or 1-element array embeds', () => {
    assert.equal(seansArsivdeMi({ archived_at: '2026-09-23' }), true)
    assert.equal(seansArsivdeMi([{ archived_at: null }]), false)
    assert.equal(seansArsivdeMi(null), false)
  })
})

describe('NOTYA-ARSIV-02 — arsivsizIlaclar + re-prescription keeps the row on the live note', () => {
  function kur() {
    const db = new SahteVeritabani()
    const d = randomUUID(), p = randomUUID()
    const sA = db.ekle('sessions', { doctor_id: d, patient_id: p, archived_at: null })
    const sB = db.ekle('sessions', { doctor_id: d, patient_id: p, archived_at: null })
    const ilac = [{ ad: 'Amoksisilin', doz: '250 mg', kullanim: '2x1' }]
    const nA = db.ekle('notes', { session_id: sA.id, doctor_id: d, created_at: '2026-09-01T10:00:00Z', content_ilaclar: ilac, recete_onerisi: [] })
    const nB = db.ekle('notes', { session_id: sB.id, doctor_id: d, created_at: '2026-09-10T10:00:00Z', content_ilaclar: ilac, recete_onerisi: [] })
    const elle = db.ekle('hasta_ilaclar', { doctor_id: d, patient_id: p, ilac_adi: 'Metformin', aktif: true, onay_durumu: 'onayli', kaynak_note_id: null })
    return { db, sb: db.istemci() as never, d, p, sA, sB, nA, nB, elle }
  }
  const gorunen = async (sb: never, d: string) =>
    (((await arsivsizIlaclar(sb, 'id, ilac_adi, kaynak_note_id').eq('doctor_id', d)).data || []) as { ilac_adi: string }[]).map((r) => r.ilac_adi).sort()
  const arsivle = (db: SahteVeritabani, id: string, v: string | null) => { db.tablo('sessions').find((s) => s.id === id)!.archived_at = v }

  it('hides the drug of an archived note, keeps hand-added rows, unarchive brings it back — no row is changed', async () => {
    const { db, sb, d, p, sA, nA } = kur()
    await nottanIlacAktar(sb, { noteId: nA.id, doctorId: d, patientId: p })
    assert.deepEqual(await gorunen(sb, d), ['Amoksisilin', 'Metformin'])
    const once = JSON.stringify(db.tablo('hasta_ilaclar'))
    arsivle(db, sA.id, '2026-09-23T10:00:00Z')
    assert.deepEqual(await gorunen(sb, d), ['Metformin'])
    const { count } = await arsivsizIlaclar(sb, 'id', { count: 'exact', head: true }).eq('doctor_id', d).eq('aktif', true)
    assert.equal(count, 1)
    assert.equal(JSON.stringify(db.tablo('hasta_ilaclar')), once, 'archive is a read filter — rows untouched')
    arsivle(db, sA.id, null)
    assert.deepEqual(await gorunen(sb, d), ['Amoksisilin', 'Metformin'])
  })

  it('same drug re-prescribed unchanged by a later note → kaynak_note_id moves to it; archiving the old note hides nothing', async () => {
    const { db, sb, d, p, sA, sB, nA, nB } = kur()
    await nottanIlacAktar(sb, { noteId: nA.id, doctorId: d, patientId: p })
    const r = await nottanIlacAktar(sb, { noteId: nB.id, doctorId: d, patientId: p })
    assert.deepEqual(r, { aktarilan: 0, atlanan: 1, sonlandirilan: 0, hata: null })
    const satirlar = db.tablo('hasta_ilaclar').filter((x) => x.ilac_adi === 'Amoksisilin')
    assert.equal(satirlar.length, 1, 'no duplicate row')
    assert.equal(satirlar[0].kaynak_note_id, nB.id)
    arsivle(db, sA.id, '2026-09-23T10:00:00Z')
    assert.deepEqual(await gorunen(sb, d), ['Amoksisilin', 'Metformin'], 'the live note still prescribes it')
    arsivle(db, sB.id, '2026-09-23T11:00:00Z')
    assert.deepEqual(await gorunen(sb, d), ['Metformin'])
  })

  it('a hand-added row matched by a note unchanged stays hand-added (kaynak_note_id NULL)', async () => {
    const { db, sb, d, p, sA } = kur()
    const n = db.ekle('notes', { session_id: sA.id, doctor_id: d, content_ilaclar: [{ ad: 'Metformin' }], recete_onerisi: [] })
    await nottanIlacAktar(sb, { noteId: n.id, doctorId: d, patientId: p })
    assert.equal(db.tablo('hasta_ilaclar').find((x) => x.ilac_adi === 'Metformin')!.kaynak_note_id, null)
    arsivle(db, sA.id, '2026-09-23T10:00:00Z')
    assert.deepEqual(await gorunen(sb, d), ['Metformin'])
  })
})

describe("NOTYA-RECETE-02 — revizyonla düşülen ilaç hasta_ilaclar'da sonlandırılır", () => {
  // Kaan (2026-09-24), canlı hata raporu: "tedavimi değiştirdikten sonra ... reçete
  // bölümünde eski ilaçlar devam ediyordu ... Ayşe'ye sordum, o da reçetedeki (eski) ilacı
  // söyledi." Aşağıdaki senaryo bunu birebir sentetik DB'de tekrar eder: aynı not önce bir
  // antibiyotik yazar ve onaylanır, sonra REVIZE EDİLİP FARKLI bir antibiyotikle yeniden
  // onaylanır — eskisi kaybolmalı, hasta_ilaclar'da aktif kalmamalı.
  function kur() {
    const db = new SahteVeritabani()
    const d = randomUUID(), p = randomUUID()
    const s = db.ekle('sessions', { doctor_id: d, patient_id: p, archived_at: null })
    const n = db.ekle('notes', { session_id: s.id, doctor_id: d, created_at: '2026-09-24T10:00:00Z', content_ilaclar: [{ ad: 'Amoksisilin 400 mg/5 mL süspansiyon', doz: '7,5 mL', kullanim: '12 saatte bir' }], recete_onerisi: [] })
    const elle = db.ekle('hasta_ilaclar', { doctor_id: d, patient_id: p, ilac_adi: 'Metformin', aktif: true, onay_durumu: 'onayli', kaynak_note_id: null })
    return { db, sb: db.istemci() as never, d, p, s, n, elle }
  }

  it('aynı not farklı bir ilaçla yeniden onaylanınca eski ilaç sonlandırılır, elle eklenen dokunulmaz', async () => {
    const { db, sb, d, p, n } = kur()
    const ilk = await nottanIlacAktar(sb, { noteId: n.id, doctorId: d, patientId: p })
    assert.deepEqual(ilk, { aktarilan: 1, atlanan: 0, sonlandirilan: 0, hata: null })
    assert.equal(db.tablo('hasta_ilaclar').find((x) => x.ilac_adi === 'Amoksisilin 400 mg/5 mL süspansiyon')!.aktif, true)

    // Revizyon: hekim antibiyotiği değiştirdi — aynı not, YENİ ilaç.
    db.tablo('notes').find((x) => x.id === n.id)!.content_ilaclar = [{ ad: 'Klaritromisin 125 mg/5 mL süspansiyon', doz: '5 mL', kullanim: '12 saatte bir' }]
    const revize = await nottanIlacAktar(sb, { noteId: n.id, doctorId: d, patientId: p })
    assert.deepEqual(revize, { aktarilan: 1, atlanan: 0, sonlandirilan: 1, hata: null })

    const eski = db.tablo('hasta_ilaclar').find((x) => x.ilac_adi === 'Amoksisilin 400 mg/5 mL süspansiyon')!
    assert.equal(eski.aktif, false, 'düşülen ilaç artık aktif olmamalı — Ayşe onu güncel tedavi olarak okumamalı')
    const yeni = db.tablo('hasta_ilaclar').find((x) => x.ilac_adi === 'Klaritromisin 125 mg/5 mL süspansiyon')!
    assert.equal(yeni.aktif, true)
    assert.equal(yeni.kaynak_note_id, n.id)

    // Elle eklenen (kaynak_note_id NULL) hiçbir zaman bu geçişin kurbanı olmaz.
    assert.equal(db.tablo('hasta_ilaclar').find((x) => x.ilac_adi === 'Metformin')!.aktif, true)
  })

  it('başka bir notun ilacı bu notun sonlandırma geçişinden etkilenmez', async () => {
    const { db, sb, d, p, s, n } = kur()
    const digerNot = db.ekle('notes', { session_id: s.id, doctor_id: d, content_ilaclar: [{ ad: 'D vitamini damla' }], recete_onerisi: [] })
    await nottanIlacAktar(sb, { noteId: digerNot.id, doctorId: d, patientId: p })
    assert.equal(db.tablo('hasta_ilaclar').find((x) => x.ilac_adi === 'D vitamini damla')!.aktif, true)

    // n'in kendi ilaç listesi değişip yeniden aktarılıyor — digerNot'un ilacına dokunmamalı.
    db.tablo('notes').find((x) => x.id === n.id)!.content_ilaclar = [{ ad: 'Ibuprofen süspansiyon' }]
    await nottanIlacAktar(sb, { noteId: n.id, doctorId: d, patientId: p })
    assert.equal(db.tablo('hasta_ilaclar').find((x) => x.ilac_adi === 'D vitamini damla')!.aktif, true, 'başka notun ilacı sonlandırılmamalı')
  })

  it('not ilaç listesi tamamen boşaltılırsa notun kendi tüm ilacı sonlandırılır', async () => {
    const { db, sb, d, p, n } = kur()
    await nottanIlacAktar(sb, { noteId: n.id, doctorId: d, patientId: p })
    db.tablo('notes').find((x) => x.id === n.id)!.content_ilaclar = []
    const r = await nottanIlacAktar(sb, { noteId: n.id, doctorId: d, patientId: p })
    assert.deepEqual(r, { aktarilan: 0, atlanan: 0, sonlandirilan: 1, hata: null })
    assert.equal(db.tablo('hasta_ilaclar').find((x) => x.ilac_adi === 'Amoksisilin 400 mg/5 mL süspansiyon')!.aktif, false)
  })
})

// ─── 3. Real routes: archive → hidden everywhere; unarchive → back ──────────────────────────

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-arsiv-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'

let db = new SahteVeritabani()
function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: { getUser: (j?: string) => c().auth.getUser(j) },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  for (const g of new Set([pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module].filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`arşiv testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

describe('NOTYA-ARSIV-01 — real routes (fake DB): arşivle hides, arşivden çıkar restores', () => {
  let NextRequestSinifi: typeof import('next/server').NextRequest
  let R: Record<string, any>
  let gunVerisiDerle: typeof import('./gunOzeti').gunVerisiDerle
  const iste = (yontem: string, yol: string, token: string) =>
    new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: { authorization: `Bearer ${token}` } })
  const coz = async (r: Response | Promise<Response>) => { const y = await r; return { status: y.status, j: await y.json().catch(() => ({})) } }

  before(async () => {
    NextRequestSinifi = (await import('next/server')).NextRequest
    const ice = (y: string) => import(`../../${y}`)
    R = {
      sonNotlar: await ice('app/api/doktor/son-notlar/route'),
      raporlar: await ice('app/api/doktor/raporlar/route'),
      notlar: await ice('app/api/notes/route'),
      notTek: await ice('app/api/notes/[id]/route'),
      arsivle: await ice('app/api/doktor/hastalar/[id]/sessions/[sessionId]/arsivle/route'),
      cikar: await ice('app/api/doktor/hastalar/[id]/sessions/[sessionId]/arsivden-cikar/route'),
      ilaclar: await ice('app/api/doktor/ilaclar/route'),
      approve: await ice('app/api/notes/[id]/approve/route'),
      asilar: await ice('app/api/doktor/asilar/route'),
    }
    ;({ gunVerisiDerle } = await import('./gunOzeti'))
  })

  let s: { d: string; token: string; hasta: string; seans: string; not: string; digerNot: string }
  beforeEach(() => {
    db = new SahteVeritabani()
    const d = randomUUID(), token = 'qa-arsiv-hekim'
    db.kullanicilar.set(token, { id: d })
    db.ekle('users', { id: d, full_name: 'Dr. QA Arşiv', specialty: 'dahiliye' })
    const hasta = db.ekle('patients', { doctor_id: d, is_active: true }).id
    const simdi = new Date().toISOString()
    const seans = db.ekle('sessions', { doctor_id: d, patient_id: hasta, specialty: 'dahiliye', started_at: simdi, archived_at: null }).id
    const diger = db.ekle('sessions', { doctor_id: d, patient_id: hasta, specialty: 'dahiliye', started_at: simdi, archived_at: null }).id
    const not = db.ekle('notes', { session_id: seans, doctor_id: d, approved_at: null, content_subjektif: 'arşivlenecek' }).id
    const digerNot = db.ekle('notes', { session_id: diger, doctor_id: d, approved_at: null, content_subjektif: 'kalıcı' }).id
    // NOTYA-ARSIV-02: one drug written by the note that gets archived, one written by the other note, one by hand.
    db.ekle('hasta_ilaclar', { doctor_id: d, patient_id: hasta, ilac_adi: 'Klaritromisin', aktif: true, onay_durumu: 'onayli', kaynak_note_id: not })
    db.ekle('hasta_ilaclar', { doctor_id: d, patient_id: hasta, ilac_adi: 'Parasetamol', aktif: true, onay_durumu: 'onayli', kaynak_note_id: digerNot })
    db.ekle('hasta_ilaclar', { doctor_id: d, patient_id: hasta, ilac_adi: 'Levotiroksin', aktif: true, onay_durumu: 'onayli', kaynak_note_id: null })
    s = { d, token, hasta, seans, not, digerNot }
  })

  async function durum() {
    const son = await coz(R.sonNotlar.GET(iste('GET', '/api/doktor/son-notlar', s.token)))
    const rap = await coz(R.raporlar.GET(iste('GET', '/api/doktor/raporlar', s.token)))
    const kuyruk = await coz(R.notlar.GET(iste('GET', '/api/notes?pending=true', s.token)))
    const gun = await gunVerisiDerle(db.istemci() as never, s.d)
    const ilac = await coz(R.ilaclar.GET(iste('GET', `/api/doktor/ilaclar?hastaId=${s.hasta}`, s.token)))
    return {
      ilaclar: (ilac.j as { ilac_adi: string }[]).map((x) => x.ilac_adi).sort(),
      sonNotlar: (son.j.notlar as { id: string }[]).map((n) => n.id).sort(),
      bekleyenOnay: rap.j.bekleyenOnay as number,
      buAy: rap.j.buAyMuayene as number,
      kuyruk: (kuyruk.j as { id: string }[]).map((n) => n.id).sort(),
      ayseOnaysiz: gun.onaysizNot,
      ayseBugun: gun.bugunHasta,
    }
  }

  it('archive hides the muayene (and its drugs) on dashboard, İnceleme, Ayşe and İlaçlar; unarchive brings it back', async () => {
    const once = await durum()
    assert.deepEqual(once.sonNotlar, [s.not, s.digerNot].sort())
    assert.equal(once.bekleyenOnay, 2)
    assert.equal(once.buAy, 2)
    assert.equal(once.ayseOnaysiz, 2)
    assert.equal(once.ayseBugun, 2)
    assert.ok(once.kuyruk.includes(s.not), JSON.stringify(once.kuyruk))
    assert.deepEqual(once.ilaclar, ['Klaritromisin', 'Levotiroksin', 'Parasetamol'])

    const a = await coz(R.arsivle.POST(iste('POST', `/api/doktor/hastalar/${s.hasta}/sessions/${s.seans}/arsivle`, s.token), { params: { id: s.hasta, sessionId: s.seans } }))
    assert.equal(a.status, 200)
    const arsivde = await durum()
    assert.deepEqual(arsivde.sonNotlar, [s.digerNot])
    assert.equal(arsivde.bekleyenOnay, 1)
    assert.equal(arsivde.buAy, 1)
    assert.equal(arsivde.ayseOnaysiz, 1)
    assert.equal(arsivde.ayseBugun, 1)
    assert.ok(!arsivde.kuyruk.includes(s.not))
    assert.deepEqual(arsivde.ilaclar, ['Levotiroksin', 'Parasetamol'], 'NOTYA-ARSIV-02: the archived note\'s drug leaves the İlaçlar panel')

    // Direct open by id still works and says "Arşivde"
    const tek = await coz(R.notTek.GET(iste('GET', `/api/notes/${s.not}`, s.token), { params: Promise.resolve({ id: s.not }) }))
    assert.equal(tek.status, 200)
    assert.equal(tek.j.not.arsivde, true)

    const c = await coz(R.cikar.POST(iste('POST', `/api/doktor/hastalar/${s.hasta}/sessions/${s.seans}/arsivden-cikar`, s.token), { params: { id: s.hasta, sessionId: s.seans } }))
    assert.equal(c.status, 200)
    assert.deepEqual(await durum(), once)
    const tek2 = await coz(R.notTek.GET(iste('GET', `/api/notes/${s.not}`, s.token), { params: Promise.resolve({ id: s.not }) }))
    assert.equal(tek2.j.not.arsivde, false)
  })

  it('NOTYA-ASI-NOT-01: approve writes the note vaccine to the aşı kartı; archiving the muayene hides it, unarchive brings it back', async () => {
    const onayla = (govde: unknown) => coz(R.approve.POST(
      new NextRequestSinifi('http://localhost/api/notes/x/approve', { method: 'POST', headers: { authorization: `Bearer ${s.token}`, 'content-type': 'application/json' }, body: JSON.stringify(govde) }),
      { params: { id: s.not } },
    ))
    const kart = async () => (((await coz(R.asilar.GET(iste('GET', `/api/doktor/asilar?patientId=${s.hasta}`, s.token)))).j.asilar || []) as { asi_adi: string }[]).map((x) => x.asi_adi).sort()
    db.ekle('asilar', { doktor_id: s.d, patient_id: s.hasta, asi_adi: 'KKK', doz_no: 1, kategori: 'pediatrik', uygulama_tarihi: '2025-01-01', kaynak: 'kayit', kaynak_note_id: null })

    const a = await onayla({ duzenlemeler: { asilar: [{ asi_adi: 'Hep B', doz_no: 2, uygulama_tarihi: '2026-09-23' }] } })
    assert.equal(a.status, 200, JSON.stringify(a.j))
    assert.equal(a.j.asiAktarim.yazilan, 1)
    assert.deepEqual(await kart(), ['Hepatit B', 'KKK'])
    const satir = db.tablo('asilar').find((x) => x.kaynak_note_id === s.not)!
    assert.equal(satir.kaynak, 'kayit')
    assert.ok(satir.hekim_onay_at)

    // Re-approve unchanged (İnceleme sends no asilar) → synced from the stored list, no duplicate.
    const b = await onayla({ duzenlemeler: {} })
    assert.equal(b.j.asiAktarim.guncellenen, 1)
    assert.equal(db.tablo('asilar').filter((x) => x.asi_adi === 'Hepatit B').length, 1)

    await coz(R.arsivle.POST(iste('POST', 'x', s.token), { params: { id: s.hasta, sessionId: s.seans } }))
    assert.deepEqual(await kart(), ['KKK'], 'the archived muayene\'s vaccine leaves the aşı kartı')
    await coz(R.cikar.POST(iste('POST', 'x', s.token), { params: { id: s.hasta, sessionId: s.seans } }))
    assert.deepEqual(await kart(), ['Hepatit B', 'KKK'])
  })

  it('arsivden-cikar: 404 for a foreign doctor or the wrong patient', async () => {
    db.tablo('sessions').find((x) => x.id === s.seans)!.archived_at = '2026-09-23T10:00:00Z'
    db.kullanicilar.set('qa-yabanci', { id: randomUUID() })
    const yabanci = await coz(R.cikar.POST(iste('POST', 'x', 'qa-yabanci'), { params: { id: s.hasta, sessionId: s.seans } }))
    assert.equal(yabanci.status, 404)
    const yanlisHasta = await coz(R.cikar.POST(iste('POST', 'x', s.token), { params: { id: randomUUID(), sessionId: s.seans } }))
    assert.equal(yanlisHasta.status, 404)
    assert.ok(db.tablo('sessions').find((x) => x.id === s.seans)!.archived_at, 'still archived')
  })
})
