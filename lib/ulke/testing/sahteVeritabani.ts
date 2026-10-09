/**
 * NOTYA-UZ-MUAYENE-01 — stand-in for a country's Supabase project in tests: auth, tables, storage. TEST CODE.
 *
 * An in-memory database that understands exactly the query methods the application's server code uses and THROWS
 * on any other — an unknown filter cannot be swallowed and turn a broken ownership check into a green test
 * (same rule as lib/security/testing/sahteSupabase.ts). Every query is recorded, so a test can prove that a read
 * of a patient table carried the doctor's id.
 *
 * THE SECOND WALL (NOTYA-ULKE-SABLON-01; one database per country since 2026-10-09, and the country on every row
 * all the same). Every table here is a COUNTRY table, and the stand-in holds the rule the
 * real tables hold with `ulke text not null`: a statement that does not carry the country THROWS — a select, update
 * or delete without `ulke = …`, an insert or upsert whose row has no `ulke`, a function called without `p_ulke`.
 * So every one of the country tests also proves that the statement it exercised was bound to the build's country.
 * Rows of ANOTHER country can sit in the same tables (a test seeds them directly with `tablo(…).push`): the
 * application must behave as if they were not there.
 *
 * Synthetic data only.
 */
export type Satir = Record<string, unknown>
export type SahteHesap = { id: string; email: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
/** `ulke`: the country the statement was bound to (its `ulke = …` filter, the `ulke` of the row it wrote, or `p_ulke`). */
export type SorguKaydi = { tablo: string; islem: string; filtreler: string[]; ulke: string }

/**
 * THE ONE TABLE THAT IS NOT A COUNTRY TABLE a country build is known to reach for, through shared infrastructure it
 * does not own: the model gateway's usage log (lib/ai/kullanim.ts — task, model, token counts, the account's id; no
 * patient data). It has no `ulke` column. A country database does not hold it (the gateway's write fails quietly
 * there; the country's own usage record is `ulke_kullanim_olcumu`). lib/ulke/ulkeVeritabani.paket.test.ts proves it
 * is the only one. Every other table name reaching this stand-in is held to the country rule.
 */
export const ORTAK_ALTYAPI_TABLOLARI: readonly string[] = ['ai_token_kullanim']

/** The country a statement names, or a thrown error: no statement reaches a country table without one. */
function ulkeyiBul(ad: string, islem: string, filtreler: string[], yuk: Satir | Satir[] | null): string {
  if (ORTAK_ALTYAPI_TABLOLARI.includes(ad)) return ''
  if (islem === 'insert' || islem === 'upsert') {
    const ulkeler = [...new Set((Array.isArray(yuk) ? yuk : [yuk ?? {}]).map((y) => y.ulke))]
    if (ulkeler.length !== 1 || typeof ulkeler[0] !== 'string' || !/^[a-z]{2}$/.test(ulkeler[0])) throw new Error(`stand-in database: ${islem} on ${ad} without the country (ulke) on the row`)
    return ulkeler[0]
  }
  const f = filtreler.find((x) => x.startsWith('ulke=eq.'))
  if (!f || !/^[a-z]{2}$/.test(f.slice(8))) throw new Error(`stand-in database: ${islem} on ${ad} without a country filter (ulke = …)`)
  if (islem === 'update' && yuk && !Array.isArray(yuk) && 'ulke' in yuk) throw new Error(`stand-in database: update on ${ad} rewrites the country of a row`)
  return f.slice(8)
}

let sayac = 0
const yeniId = () => `90000000-0000-4000-8000-${String(++sayac).padStart(12, '0')}`

export function sahteVeritabani() {
  const tablolar: Record<string, Satir[]> = {}
  const hesaplar: Record<string, SahteHesap> = {}
  const depo = new Map<string, Blob>()
  const sorgular: SorguKaydi[] = []
  /** Table name → make the next write (or read) on it fail. */
  const boz: { yaz: Set<string>; oku: Set<string> } = { yaz: new Set(), oku: new Set() }
  const tablo = (ad: string) => (tablolar[ad] ??= [])

  /**
   * NOTYA-UZ-RANDEVU-01 — the EXCLUSION CONSTRAINT of migration 135 (`ulke_randevulari_cakisma_yok`): two appointments
   * of one doctor that still hold their time (planned, arrived, done) may not overlap. Checked inside the statement,
   * as the database does, and answered with PostgreSQL's own code — so a test of "two requests at the same moment"
   * is decided here, not by the application's earlier read.
   */
  /** Tables whose key is not a generated `id` (their key is the account, the patient, the visit or the note). */
  const KIMLIKSIZ = new Set(['hasta_ulke_bilgisi', 'hekim_dil_tercihleri', 'hekim_rolu', 'muayene_dil_kaydi', 'not_dil_kaydi', 'hekim_calisma_duzeni', 'ulke_kullanim', 'ulke_kullanim_olcumu'])
  const YER_TUTAN = ['planlandi', 'geldi', 'tamamlandi']
  const cakisma = (ad: string, yeni: Satir, digerleri: Satir[]): { message: string; code: string } | null => {
    if (ad !== 'ulke_randevulari' || !YER_TUTAN.includes(String(yeni.durum ?? 'planlandi'))) return null
    const cakisan = digerleri.some((s) => s.doctor_id === yeni.doctor_id && YER_TUTAN.includes(String(s.durum ?? 'planlandi')) && String(s.baslangic) < String(yeni.bitis) && String(s.bitis) > String(yeni.baslangic))
    return cakisan ? { message: 'conflicting key value violates exclusion constraint "ulke_randevulari_cakisma_yok"', code: '23P01' } : null
  }

  /**
   * NOTYA-ULKE-PORTAL-01 — what migration 137 makes the database refuse, checked inside the statement as the
   * database does (`yeni` is the row as it WOULD be, `digerleri` every other row of the table):
   *   ulke_hasta_ozetleri      the trigger: the note must be this doctor's, about this patient, and APPROVED (23514);
   *                            one summary per note (23505)
   *   ulke_portal_erisimleri   one link per patient that is not withdrawn; a token hash is unique (23505)
   *   ulke_portal_oturumlari   a session hangs from a link of the same country, doctor and patient (23503)
   *   ulke_randevu_istekleri   one unanswered request per patient (23505)
   * and every one of them: the patient must be this doctor's in this country (23503).
   */
  // ───────────────────────── NOTYA-ULKE-KLINIK-01 — migration 145: clinic accounts ─────────────────────────
  const KONUMLAR = ['sahip', 'yonetici', 'hekim', 'muttefik', 'on-buro']
  const YETKI_TURLERI = ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet']
  const GUN31_MS = 31 * 86_400_000
  const ms = (x: unknown) => new Date(String(x)).getTime()
  const uyeKonumu = (ulke: unknown, klinik: unknown, hesap: unknown): string | null => (tablo('ulke_klinik_uyeleri').find((u) => u.ulke === ulke && u.klinik_id === klinik && u.doctor_id === hesap)?.konum as string | undefined) ?? null
  const hesapVar = (ulke: unknown, id: unknown) => tablo('ulke_hesaplari').some((h) => h.id === id && h.ulke === ulke)
  /** The position a capability may be given to: the same table as the trigger ulke_klinik_yetki_kilidi. */
  const turKonumaUygun = (tur: unknown, konum: string | null) => (['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal'].includes(String(tur)) && konum === 'on-buro') || (tur === 'paylasim' && konum === 'muttefik') || (tur === 'vekalet' && ['hekim', 'sahip', 'yonetici'].includes(String(konum)))
  /** ulke_klinik_yonetebilir. */
  const yonetebilir = (yapan: string | null, hedef: string | null) => hedef !== null && hedef !== 'sahip' && (yapan === 'sahip' || (yapan === 'yonetici' && ['hekim', 'muttefik', 'on-buro'].includes(hedef)))
  /**
   * What migration 145 makes the database refuse on a row as it WOULD be: the keys, the checks and the INSERT half of
   * its triggers. (A row a test writes without these columns is not a clinic row yet.)
   */
  const klinikKisiti = (ad: string, yeni: Satir, digerleri: Satir[], islem: 'insert' | 'update'): { message: string; code: string } | null => {
    const hata = (code: string, message: string) => ({ code, message })
    if (ad === 'ulke_klinikler') {
      if (yeni.ad === undefined) return null
      if (!hesapVar(yeni.ulke, yeni.doctor_id)) return hata('23503', 'insert or update on table "ulke_klinikler" violates foreign key constraint "ulke_klinikler_hesap_fk"')
      const adi = String(yeni.ad ?? '').trim()
      if (adi.length < 2 || adi.length > 120) return hata('23514', 'new row for relation "ulke_klinikler" violates check constraint (ad)')
      if (digerleri.some((k) => k.ulke === yeni.ulke && k.doctor_id === yeni.doctor_id)) return hata('23505', 'duplicate key value violates unique constraint "ulke_klinikler_sahip_tekil"')
      return null
    }
    if (ad === 'ulke_klinik_erisim_kayitlari') {
      if (yeni.kisi_id === undefined) return null
      if (!YETKI_TURLERI.includes(String(yeni.tur)) || !['verildi', 'geri-alindi', 'bitti', 'okuma', 'yazma'].includes(String(yeni.olay))) return hata('23514', 'new row for relation "ulke_klinik_erisim_kayitlari" violates check constraint (tur, olay)')
      if (['okuma', 'yazma'].includes(String(yeni.olay)) !== (yeni.ne != null)) return hata('23514', 'new row for relation "ulke_klinik_erisim_kayitlari" violates check constraint (what was read or written)')
      if (yeni.ne != null && !/^[a-z]+(-[a-z]+)*$/.test(String(yeni.ne))) return hata('23514', 'new row for relation "ulke_klinik_erisim_kayitlari" violates check constraint (ne)')
      if (!hesapVar(yeni.ulke, yeni.doctor_id) || !hesapVar(yeni.ulke, yeni.kisi_id) || !hesapVar(yeni.ulke, yeni.alan_id)) return hata('23503', 'insert or update on table "ulke_klinik_erisim_kayitlari" violates foreign key constraint (account)')
      if (yeni.patient_id != null && !tablo('ulke_hastalar').some((h) => h.id === yeni.patient_id && h.doctor_id === yeni.doctor_id && h.ulke === yeni.ulke)) return hata('23503', 'insert or update on table "ulke_klinik_erisim_kayitlari" violates foreign key constraint "ulke_klinik_erisim_kayitlari_hasta_fk"')
      return null
    }
    if (yeni.klinik_id === undefined) return null
    if (ad === 'ulke_klinik_uyeleri') {
      if (!KONUMLAR.includes(String(yeni.konum))) return hata('23514', 'new row for relation "ulke_klinik_uyeleri" violates check constraint (konum)')
      const k = tablo('ulke_klinikler').find((x) => x.id === yeni.klinik_id && x.ulke === yeni.ulke)
      if (!k) return hata('23503', 'ulke_klinik_uyeleri: no such clinic in this country')
      if (islem === 'insert' && (yeni.konum === 'sahip') !== (yeni.doctor_id === k.doctor_id)) return hata('23514', "ulke_klinik_uyeleri: the owner's position belongs to the clinic's owner and to nobody else")
      if (!hesapVar(yeni.ulke, yeni.doctor_id)) return hata('23503', 'insert or update on table "ulke_klinik_uyeleri" violates foreign key constraint "ulke_klinik_uyeleri_hesap_fk"')
      if (digerleri.some((u) => u.ulke === yeni.ulke && u.doctor_id === yeni.doctor_id)) return hata('23505', 'duplicate key value violates unique constraint "ulke_klinik_uyeleri_tek_klinik"')
      return null
    }
    if (ad === 'ulke_klinik_davetleri') {
      if (islem === 'insert') {
        const konum = uyeKonumu(yeni.ulke, yeni.klinik_id, yeni.doctor_id)
        if (!konum || !['sahip', 'yonetici'].includes(konum) || (yeni.konum === 'yonetici' && konum !== 'sahip')) return hata('23514', 'ulke_klinik_davetleri: this member may not issue this invitation')
      }
      if (!['yonetici', 'hekim', 'muttefik', 'on-buro'].includes(String(yeni.konum))) return hata('23514', 'new row for relation "ulke_klinik_davetleri" violates check constraint (konum)')
      if (typeof yeni.kod_hash !== 'string' || !/^[0-9a-f]{64}$/.test(yeni.kod_hash)) return hata('23514', 'new row for relation "ulke_klinik_davetleri" violates check constraint (kod_hash)')
      if (yeni.son_gecerlilik == null) return hata('23502', 'null value in column "son_gecerlilik" of relation "ulke_klinik_davetleri"')
      if (!(ms(yeni.son_gecerlilik) > ms(yeni.created_at)) || ms(yeni.son_gecerlilik) > ms(yeni.created_at) + GUN31_MS) return hata('23514', 'new row for relation "ulke_klinik_davetleri" violates check constraint (expiry)')
      if ((yeni.kullanildi_at == null) !== (yeni.kullanan_id == null)) return hata('23514', 'new row for relation "ulke_klinik_davetleri" violates check constraint (used by)')
      if (digerleri.some((d) => d.kod_hash === yeni.kod_hash)) return hata('23505', 'duplicate key value violates unique constraint "ulke_klinik_davetleri_kod_tekil"')
      return null
    }
    if (ad === 'ulke_klinik_yetkileri') {
      if (islem === 'insert') {
        const alan = uyeKonumu(yeni.ulke, yeni.klinik_id, yeni.alan_id), veren = uyeKonumu(yeni.ulke, yeni.klinik_id, yeni.doctor_id)
        if (!alan || !veren) return hata('23503', 'ulke_klinik_yetkileri: both must be members of the clinic')
        if (veren === 'on-buro') return hata('23514', 'ulke_klinik_yetkileri: a front-desk member has no patients to give a grant for')
        if (!turKonumaUygun(yeni.tur, alan)) return hata('23514', 'ulke_klinik_yetkileri: this capability is not given to a member in that position')
        if (yeni.kaydeden_id !== yeni.doctor_id && uyeKonumu(yeni.ulke, yeni.klinik_id, yeni.kaydeden_id) !== 'sahip') return hata('23514', "ulke_klinik_yetkileri: a grant is entered by the doctor whose patients it is about, or by the clinic's owner")
        if (yeni.iptal_at != null) return hata('23514', 'ulke_klinik_yetkileri: a grant is not born withdrawn')
      }
      if (!YETKI_TURLERI.includes(String(yeni.tur))) return hata('23514', 'new row for relation "ulke_klinik_yetkileri" violates check constraint (tur)')
      if (yeni.doctor_id === yeni.alan_id) return hata('23514', 'new row for relation "ulke_klinik_yetkileri" violates check constraint (to oneself)')
      if ((yeni.tur === 'paylasim') !== (yeni.patient_id != null)) return hata('23514', 'new row for relation "ulke_klinik_yetkileri" violates check constraint (a share names one patient)')
      if ((yeni.tur === 'vekalet') !== (yeni.baslangic != null) || (yeni.baslangic == null) !== (yeni.bitis == null)) return hata('23514', 'new row for relation "ulke_klinik_yetkileri" violates check constraint (cover has a period)')
      if (yeni.bitis != null && (!(ms(yeni.bitis) > ms(yeni.baslangic)) || ms(yeni.bitis) > ms(yeni.baslangic) + GUN31_MS)) return hata('23514', 'new row for relation "ulke_klinik_yetkileri" violates check constraint (period)')
      if (yeni.patient_id != null && !tablo('ulke_hastalar').some((h) => h.id === yeni.patient_id && h.doctor_id === yeni.doctor_id && h.ulke === yeni.ulke)) return hata('23503', 'insert or update on table "ulke_klinik_yetkileri" violates foreign key constraint "ulke_klinik_yetkileri_hasta_fk"')
      if (yeni.iptal_at == null && digerleri.some((y) => y.ulke === yeni.ulke && y.doctor_id === yeni.doctor_id && y.alan_id === yeni.alan_id && y.tur === yeni.tur && (y.patient_id ?? null) === (yeni.patient_id ?? null) && y.iptal_at == null)) return hata('23505', 'duplicate key value violates unique constraint "ulke_klinik_yetkileri_tek_acik"')
      return null
    }
    return null
  }
  /** The UPDATE half of the triggers of migration 145: what a clinic row may never do. */
  const klinikKilidi = (ad: string, eski: Satir, yeni: Satir): { message: string; code: string } | null => {
    const hata = (message: string) => ({ code: '23514', message })
    const farkli = (...k: string[]) => k.some((x) => (eski[x] ?? null) !== (yeni[x] ?? null))
    if (ad === 'ulke_klinikler') return eski.ad !== undefined && farkli('ulke', 'doctor_id', 'id', 'created_at') ? hata('ulke_klinikler: a clinic keeps its country and its owner') : null
    if (ad === 'ulke_klinik_erisim_kayitlari') return eski.kisi_id !== undefined ? hata('ulke_klinik_erisim_kayitlari: a record row does not change') : null
    if (eski.klinik_id === undefined) return null
    if (ad === 'ulke_klinik_uyeleri') {
      if (farkli('ulke', 'klinik_id', 'doctor_id', 'id')) return hata('ulke_klinik_uyeleri: a member never moves to another country, clinic or account')
      if (farkli('konum') && (eski.konum === 'sahip' || yeni.konum === 'sahip')) return hata("ulke_klinik_uyeleri: the owner's position is not changed and not given")
    }
    if (ad === 'ulke_klinik_davetleri') {
      if (farkli('ulke', 'klinik_id', 'doctor_id', 'konum', 'kod_hash', 'son_gecerlilik', 'created_at', 'id')) return hata('ulke_klinik_davetleri: an invitation does not change')
      if ((eski.kullanildi_at != null || eski.iptal_at != null) && farkli('kullanildi_at', 'kullanan_id', 'iptal_at')) return hata('ulke_klinik_davetleri: an invitation is used once or withdrawn once')
      if (yeni.kullanildi_at != null && yeni.iptal_at != null) return hata('ulke_klinik_davetleri: an invitation is used or withdrawn, never both')
    }
    if (ad === 'ulke_klinik_yetkileri') {
      if (farkli('ulke', 'klinik_id', 'doctor_id', 'alan_id', 'tur', 'patient_id', 'baslangic', 'bitis', 'kaydeden_id', 'created_at', 'id')) return hata('ulke_klinik_yetkileri: a grant does not change; a new grant is a new row')
      if (eski.iptal_at != null && farkli('iptal_at', 'iptal_eden_id')) return hata('ulke_klinik_yetkileri: a withdrawn grant stays withdrawn')
    }
    return null
  }
  /**
   * What a DELETE does in migration 145: the record is never deleted by a statement; the owner is not removed from a
   * clinic that exists; a membership takes every grant given by or to it, and the invitations it issued, with it.
   */
  const klinikSilme = (ad: string, silinen: Satir[]): { message: string; code: string } | null => {
    if (ad === 'ulke_klinik_erisim_kayitlari' && silinen.some((s) => s.kisi_id !== undefined)) return { code: '23514', message: 'ulke_klinik_erisim_kayitlari: a record row is not deleted' }
    if (ad !== 'ulke_klinik_uyeleri') return null
    const uyeler = silinen.filter((s) => s.klinik_id !== undefined)
    if (uyeler.some((u) => u.konum === 'sahip' && tablo('ulke_klinikler').some((k) => k.id === u.klinik_id && k.ulke === u.ulke))) return { code: '23514', message: 'ulke_klinik_uyeleri: the owner is not removed from the clinic' }
    for (const u of uyeler) {
      tablolar.ulke_klinik_yetkileri = tablo('ulke_klinik_yetkileri').filter((y) => !(y.ulke === u.ulke && y.klinik_id === u.klinik_id && (y.doctor_id === u.doctor_id || y.alan_id === u.doctor_id)))
      tablolar.ulke_klinik_davetleri = tablo('ulke_klinik_davetleri').filter((d) => !(d.ulke === u.ulke && d.klinik_id === u.klinik_id && d.doctor_id === u.doctor_id))
    }
    return null
  }

  const kisit = (ad: string, yeni: Satir, digerleri: Satir[], islem: 'insert' | 'update' = 'insert'): { message: string; code: string } | null => {
    if (ad.startsWith('ulke_klinik')) return klinikKisiti(ad, yeni, digerleri, islem)
    const c = cakisma(ad, yeni, digerleri)
    if (c) return c
    const hata = (code: string, message: string) => ({ code, message })
    const PORTAL = ['ulke_hasta_ozetleri', 'ulke_portal_erisimleri', 'ulke_portal_oturumlari', 'ulke_portal_kayitlari', 'ulke_randevu_istekleri', 'ulke_hasta_formlari', 'ulke_arac_kayitlari']
    // (A row a test writes without these columns is not a portal row yet; the database would refuse it for a missing column.)
    if (!PORTAL.includes(ad) || yeni.patient_id === undefined) return null
    if (!tablo('ulke_hastalar').some((h) => h.id === yeni.patient_id && h.doctor_id === yeni.doctor_id && h.ulke === yeni.ulke)) return hata('23503', `insert or update on table "${ad}" violates foreign key constraint "${ad}_hasta_fk"`)
    if (ad === 'ulke_hasta_ozetleri' && yeni.note_id !== undefined) {
      const n = tablo('ulke_notlar').find((x) => x.id === yeni.note_id && x.doctor_id === yeni.doctor_id && x.ulke === yeni.ulke)
      const m = n ? tablo('ulke_muayeneler').find((x) => x.id === n.session_id && x.doctor_id === n.doctor_id && x.ulke === n.ulke) : undefined
      if (!n || !m || m.patient_id !== yeni.patient_id) return hata('23514', 'ulke_hasta_ozetleri: the note is not a note of this patient')
      if (!n.approved_at) return hata('23514', 'ulke_hasta_ozetleri: a summary for the patient exists only for an approved note')
      if (digerleri.some((x) => x.ulke === yeni.ulke && x.doctor_id === yeni.doctor_id && x.note_id === yeni.note_id)) return hata('23505', 'duplicate key value violates unique constraint "ulke_hasta_ozetleri_not_tekil"')
    }
    if (ad === 'ulke_portal_erisimleri') {
      if (digerleri.some((x) => x.token_hash === yeni.token_hash)) return hata('23505', 'duplicate key value violates unique constraint "ulke_portal_erisimleri_token_tekil"')
      if (!yeni.iptal_at && digerleri.some((x) => x.doctor_id === yeni.doctor_id && x.patient_id === yeni.patient_id && !x.iptal_at)) return hata('23505', 'duplicate key value violates unique constraint "ulke_portal_erisimleri_tek_acik"')
    }
    if (ad === 'ulke_portal_oturumlari' && !tablo('ulke_portal_erisimleri').some((e) => e.id === yeni.erisim_id && e.ulke === yeni.ulke && e.doctor_id === yeni.doctor_id && e.patient_id === yeni.patient_id)) return hata('23503', 'insert or update on table "ulke_portal_oturumlari" violates foreign key constraint "ulke_portal_oturumlari_erisim_fk"')
    if (ad === 'ulke_randevu_istekleri' && (yeni.durum ?? 'bekliyor') === 'bekliyor' && digerleri.some((x) => x.doctor_id === yeni.doctor_id && x.patient_id === yeni.patient_id && (x.durum ?? 'bekliyor') === 'bekliyor')) return hata('23505', 'duplicate key value violates unique constraint "ulke_randevu_istekleri_tek_bekleyen"')
    // NOTYA-ULKE-INTAKE-01 — migration 138: the checks of ulke_hasta_formlari, its appointment key and "one open form".
    if (ad === 'ulke_hasta_formlari') {
      const d = String(yeni.durum ?? 'bekliyor')
      const acik = (x: Satir) => ['bekliyor', 'taslak'].includes(String(x.durum ?? 'bekliyor'))
      if (!['bekliyor', 'taslak', 'gonderildi', 'iptal'].includes(d)) return hata('23514', 'new row for relation "ulke_hasta_formlari" violates check constraint (durum)')
      if ((d === 'gonderildi') !== Boolean(yeni.gonderildi_at) || (d === 'iptal') !== Boolean(yeni.iptal_at)) return hata('23514', 'new row for relation "ulke_hasta_formlari" violates check constraint (state and its moment)')
      if (yeni.cevaplar_encrypted && !(yeni.riza_at && yeni.riza_surumu && yeni.dil)) return hata('23514', 'new row for relation "ulke_hasta_formlari" violates check constraint (answers without consent)')
      if ((d === 'gonderildi' && !yeni.cevaplar_encrypted) || (d === 'bekliyor' && yeni.cevaplar_encrypted)) return hata('23514', 'new row for relation "ulke_hasta_formlari" violates check constraint (answers and state)')
      if (yeni.randevu_id && !tablo('ulke_randevulari').some((r) => r.id === yeni.randevu_id && r.ulke === yeni.ulke && r.doctor_id === yeni.doctor_id && r.patient_id === yeni.patient_id)) return hata('23503', 'insert or update on table "ulke_hasta_formlari" violates foreign key constraint "ulke_hasta_formlari_randevu_fk"')
      if (acik(yeni) && digerleri.some((x) => x.ulke === yeni.ulke && x.doctor_id === yeni.doctor_id && x.patient_id === yeni.patient_id && acik(x))) return hata('23505', 'duplicate key value violates unique constraint "ulke_hasta_formlari_tek_acik"')
    }
    // NOTYA-ULKE-ARACLAR-01 — migration 139: the checks of ulke_arac_kayitlari.
    if (ad === 'ulke_arac_kayitlari') {
      if (typeof yeni.arac !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(yeni.arac) || yeni.arac.length > 60) return hata('23514', 'new row for relation "ulke_arac_kayitlari" violates check constraint (arac)')
      if (typeof yeni.kayit_encrypted !== 'string' || !yeni.kayit_encrypted) return hata(yeni.kayit_encrypted === '' ? '23514' : '23502', 'new row for relation "ulke_arac_kayitlari" has no content (kayit_encrypted)')
      if (yeni.kapandi_at && !yeni.takip_tarihi) return hata('23514', 'new row for relation "ulke_arac_kayitlari" violates check constraint (a follow-up that does not exist cannot be closed)')
    }
    return null
  }
  /**
   * NOTYA-ULKE-INTAKE-01 — the TRIGGER of migration 138 (`ulke_hasta_formu_kilidi`), which sees the row as it was and
   * as it would be: a form never moves; its question set is fixed; a withdrawn form does not change; a submitted
   * form's answers do not change (it can only be reopened).
   */
  const guncellemeKilidi = (ad: string, eski: Satir, yeni: Satir): { message: string; code: string } | null => {
    if (ad.startsWith('ulke_klinik')) return klinikKilidi(ad, eski, yeni)
    if ((ad !== 'ulke_hasta_formlari' && ad !== 'ulke_arac_kayitlari') || eski.patient_id === undefined) return null
    const hata = (message: string) => ({ code: '23514', message })
    const farkli = (k: string) => (eski[k] ?? null) !== (yeni[k] ?? null)
    // NOTYA-ULKE-ARACLAR-01 — the trigger of migration 139 (`ulke_arac_kaydi_kilidi`).
    if (ad === 'ulke_arac_kayitlari') {
      if (farkli('ulke') || farkli('doctor_id') || farkli('patient_id')) return hata('ulke_arac_kayitlari: a record never moves to another country, doctor or patient')
      if (farkli('arac') || farkli('kayit_encrypted') || farkli('takip_tarihi') || farkli('created_at')) return hata('ulke_arac_kayitlari: the tool, the content and the follow-up day of a record do not change; a new result is a new record')
      if (eski.kapandi_at && farkli('kapandi_at')) return hata('ulke_arac_kayitlari: a follow-up that was closed stays closed')
      return null
    }
    if (farkli('ulke') || farkli('doctor_id') || farkli('patient_id')) return hata('ulke_hasta_formlari: a form never moves to another country, doctor or patient')
    if (farkli('rol') || farkli('soru_surumu') || farkli('veli')) return hata('ulke_hasta_formlari: the question set of a form is fixed when it is asked for')
    if (eski.durum === 'iptal') return hata('ulke_hasta_formlari: a withdrawn form does not change')
    if (eski.durum === 'gonderildi') {
      if (!['gonderildi', 'taslak'].includes(String(yeni.durum))) return hata('ulke_hasta_formlari: a submitted form is not withdrawn')
      if (farkli('cevaplar_encrypted') || farkli('dil') || farkli('riza_surumu') || farkli('riza_at')) return hata('ulke_hasta_formlari: the answers of a submitted form do not change; the doctor reopens the form')
    }
    return null
  }
  /** A row written inside a function, held to the same constraints as a statement. */
  const islevdeEkle = (ad: string, satir: Satir): Satir => {
    const yeni = { id: yeniId(), created_at: new Date().toISOString(), ...satir }
    const c = kisit(ad, yeni, tablo(ad))
    if (c) throw Object.assign(new Error(c.message), { code: c.code })
    tablo(ad).push(yeni)
    return yeni
  }

  /**
   * NOTYA-UZ-RANDEVU-01 — database FUNCTIONS, by name. Each is this file's statement-by-statement copy of the SQL in
   * its migration, run as ONE TRANSACTION: the tables are copied first and put back if any statement fails or the
   * function raises. `boz.yaz` makes a statement on that table fail in the MIDDLE of a function, which is how a test
   * proves "all or nothing". An unknown function name is an error, never a silent success.
   */
  type IslevCevabi = { data: unknown; error: { message: string; code?: string } | null }
  const islevCagrilari: { ad: string; arg: Satir }[] = []
  const islevler: Record<string, (a: Satir) => unknown> = {
    // lib/db/migrations/135_ulke_randevu.sql — ulke_not_onayla. Every statement carries `p_ulke`, as in the SQL.
    ulke_not_onayla: (a) => {
      const yaz = (ad: string) => { if (boz.yaz.has(ad)) throw Object.assign(new Error(`stand-in: ${ad} update failed inside the function`), { code: 'XX000' }) }
      const not = tablo('ulke_notlar').find((n) => n.id === a.p_note_id && n.doctor_id === a.p_doctor_id && n.ulke === a.p_ulke)
      if (!not) return 'NOT_FOUND'
      if (not.approved_at) return 'ONAYLI'
      yaz('ulke_notlar')
      Object.assign(not, { content_subjektif: a.p_s, content_objektif: a.p_o, content_degerlendirme: a.p_a, content_plan: a.p_p, approved_at: a.p_onay_ani, approved_by: a.p_doctor_id })
      const k = a.p_dil_kaydi as Satir | null | undefined
      if (k) {
        yaz('not_dil_kaydi')
        const d = tablo('not_dil_kaydi').find((x) => x.note_id === a.p_note_id && x.doctor_id === a.p_doctor_id && x.ulke === a.p_ulke)
        if (!d) throw Object.assign(new Error('ulke_not_onayla: not_dil_kaydi row missing'), { code: 'P0002' })
        for (const kolon of ['alanlar', 'ikinci_alanlar', 'not_dili', 'ikinci_dil', 'ikinci_s', 'ikinci_o', 'ikinci_a', 'ikinci_p']) if (Object.prototype.hasOwnProperty.call(k, kolon)) d[kolon] = k[kolon] ?? null
        d.updated_at = a.p_onay_ani
      }
      const bagli = tablo('ulke_randevulari').filter((r) => r.session_id === not.session_id && r.doctor_id === a.p_doctor_id && r.ulke === a.p_ulke && ['planlandi', 'geldi'].includes(String(r.durum)))
      if (bagli.length) yaz('ulke_randevulari')
      for (const r of bagli) Object.assign(r, { durum: 'tamamlandi', updated_at: a.p_onay_ani })
      return 'TAMAM'
    },

    // lib/db/migrations/136_ulke_kullanim_olcumu.sql — ulke_kullanim_ekle: adds to the row of (country, account, day, task).
    ulke_kullanim_ekle: (a) => {
      if (boz.yaz.has('ulke_kullanim_olcumu')) throw Object.assign(new Error('stand-in: ulke_kullanim_olcumu write failed inside the function'), { code: 'XX000' })
      const poz = (x: unknown) => Math.max(Number(x ?? 0) || 0, 0)
      let s = tablo('ulke_kullanim_olcumu').find((x) => x.ulke === a.p_ulke && x.doctor_id === a.p_doctor_id && x.gun === a.p_gun && x.gorev === a.p_gorev)
      if (!s) { s = { ulke: a.p_ulke, doctor_id: a.p_doctor_id, gun: a.p_gun, gorev: a.p_gorev, adet: 0, saniye: 0, giris_token: 0, cikis_token: 0 }; tablo('ulke_kullanim_olcumu').push(s) }
      Object.assign(s, { adet: Number(s.adet) + poz(a.p_adet), saniye: Number(s.saniye) + poz(a.p_saniye), giris_token: Number(s.giris_token) + poz(a.p_giris_token), cikis_token: Number(s.cikis_token) + poz(a.p_cikis_token) })
      return null
    },

    // lib/db/migrations/137_ulke_hasta_portali.sql — every statement carries `p_ulke`, as in the SQL.
    ulke_portal_erisim_ver: (a) => {
      if (!tablo('ulke_hastalar').some((h) => h.id === a.p_patient_id && h.doctor_id === a.p_doctor_id && h.ulke === a.p_ulke)) return null
      const bu = (x: Satir) => x.ulke === a.p_ulke && x.doctor_id === a.p_doctor_id && x.patient_id === a.p_patient_id
      for (const o of tablo('ulke_portal_oturumlari')) if (bu(o) && !o.kapandi_at) o.kapandi_at = a.p_simdi
      for (const e of tablo('ulke_portal_erisimleri')) if (bu(e) && !e.iptal_at) e.iptal_at = a.p_simdi
      const yeni = islevdeEkle('ulke_portal_erisimleri', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: a.p_patient_id, token_hash: a.p_token_hash, pin_hash: a.p_pin_hash, hatali_deneme: 0, son_deneme_at: null, kilitlendi_at: null, son_gecerlilik: a.p_son_gecerlilik, iptal_at: null, son_giris_at: null, created_at: a.p_simdi })
      islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: a.p_patient_id, olay: 'erisim', ozet_id: null, created_at: a.p_simdi })
      return yeni.id
    },
    ulke_portal_erisim_iptal: (a) => {
      const bu = (x: Satir) => x.ulke === a.p_ulke && x.doctor_id === a.p_doctor_id && x.patient_id === a.p_patient_id
      const acik = tablo('ulke_portal_erisimleri').filter((e) => bu(e) && !e.iptal_at)
      if (!acik.length) return false
      for (const e of acik) e.iptal_at = a.p_simdi
      for (const o of tablo('ulke_portal_oturumlari')) if (bu(o) && !o.kapandi_at) o.kapandi_at = a.p_simdi
      islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: a.p_patient_id, olay: 'iptal', ozet_id: null, created_at: a.p_simdi })
      return true
    },
    ulke_portal_deneme_al: (a) => {
      const e = tablo('ulke_portal_erisimleri').find((x) => x.token_hash === a.p_token_hash && x.ulke === a.p_ulke)
      if (!e || e.iptal_at || String(e.son_gecerlilik) <= String(a.p_simdi)) return { durum: 'YOK' }
      if (e.kilitlendi_at) return { durum: 'KILITLI' }
      if (Number(e.hatali_deneme) >= Number(a.p_azami)) {
        e.kilitlendi_at = a.p_simdi
        for (const o of tablo('ulke_portal_oturumlari')) if (o.erisim_id === e.id && o.ulke === a.p_ulke && !o.kapandi_at) o.kapandi_at = a.p_simdi
        islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: e.doctor_id, patient_id: e.patient_id, olay: 'kilit', ozet_id: null, created_at: a.p_simdi })
        return { durum: 'KILITLI' }
      }
      if (e.son_deneme_at && new Date(String(a.p_simdi)).getTime() < new Date(String(e.son_deneme_at)).getTime() + Number(a.p_aralik_sn) * 1000) return { durum: 'YAVAS' }
      Object.assign(e, { hatali_deneme: Number(e.hatali_deneme) + 1, son_deneme_at: a.p_simdi })
      return { durum: 'DENE', erisim_id: e.id, doctor_id: e.doctor_id, patient_id: e.patient_id, pin_hash: e.pin_hash }
    },
    ulke_portal_deneme_sonucu: (a) => {
      const e = tablo('ulke_portal_erisimleri').find((x) => x.id === a.p_erisim_id && x.ulke === a.p_ulke)
      if (!e || e.iptal_at || String(e.son_gecerlilik) <= String(a.p_simdi)) return { durum: 'YOK' }
      if (e.kilitlendi_at) return { durum: 'KILITLI' }
      if (a.p_dogru === true) {
        Object.assign(e, { hatali_deneme: 0, son_giris_at: a.p_simdi })
        const bitis = String(a.p_oturum_bitis) < String(e.son_gecerlilik) ? a.p_oturum_bitis : e.son_gecerlilik
        islevdeEkle('ulke_portal_oturumlari', { ulke: a.p_ulke, doctor_id: e.doctor_id, patient_id: e.patient_id, erisim_id: e.id, oturum_hash: a.p_oturum_hash, son_gecerlilik: bitis, kapandi_at: null, created_at: a.p_simdi })
        islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: e.doctor_id, patient_id: e.patient_id, olay: 'giris', ozet_id: null, created_at: a.p_simdi })
        return { durum: 'TAMAM', doctor_id: e.doctor_id, patient_id: e.patient_id }
      }
      if (Number(e.hatali_deneme) >= Number(a.p_azami)) {
        e.kilitlendi_at = a.p_simdi
        for (const o of tablo('ulke_portal_oturumlari')) if (o.erisim_id === e.id && o.ulke === a.p_ulke && !o.kapandi_at) o.kapandi_at = a.p_simdi
        islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: e.doctor_id, patient_id: e.patient_id, olay: 'kilit', ozet_id: null, created_at: a.p_simdi })
        return { durum: 'KILITLI' }
      }
      return { durum: 'YANLIS', kalan: Number(a.p_azami) - Number(e.hatali_deneme) }
    },
    ulke_ozet_paylas: (a) => {
      const z = tablo('ulke_hasta_ozetleri').find((x) => x.id === a.p_ozet_id && x.doctor_id === a.p_doctor_id && x.ulke === a.p_ulke)
      if (!z) return 'NOT_FOUND'
      if (Boolean(z.paylasildi_at) === (a.p_paylas === true)) return 'AYNI'
      if (boz.yaz.has('ulke_hasta_ozetleri')) throw Object.assign(new Error('stand-in: ulke_hasta_ozetleri update failed inside the function'), { code: 'XX000' })
      // the trigger runs on this update too: a summary of a note that is not approved cannot be shared
      const c = kisit('ulke_hasta_ozetleri', { ...z, paylasildi_at: a.p_paylas ? a.p_simdi : null }, tablo('ulke_hasta_ozetleri').filter((x) => x !== z))
      if (c) throw Object.assign(new Error(c.message), { code: c.code })
      Object.assign(z, { paylasildi_at: a.p_paylas ? a.p_simdi : null, updated_at: a.p_simdi })
      if (boz.yaz.has('ulke_portal_kayitlari')) throw Object.assign(new Error('stand-in: ulke_portal_kayitlari insert failed inside the function'), { code: 'XX000' })
      islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: z.patient_id, olay: a.p_paylas ? 'paylasim' : 'geri-alma', ozet_id: a.p_ozet_id, created_at: a.p_simdi })
      return 'TAMAM'
    },
    ulke_randevu_istegi_kabul: (a) => {
      const i = tablo('ulke_randevu_istekleri').find((x) => x.id === a.p_istek_id && x.doctor_id === a.p_doctor_id && x.ulke === a.p_ulke)
      if (!i) return { durum: 'NOT_FOUND' }
      if ((i.durum ?? 'bekliyor') !== 'bekliyor') return { durum: 'CEVAPLANDI' }
      // The appointment is inserted under the no-double-booking constraint: a taken time raises 23P01 and undoes everything.
      const r = islevdeEkle('ulke_randevulari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: i.patient_id, baslangic: a.p_baslangic, bitis: a.p_bitis, neden_encrypted: a.p_neden_encrypted ?? null, durum: 'planlandi', mesai_disi: a.p_mesai_disi === true, session_id: null, created_at: a.p_simdi, updated_at: a.p_simdi })
      if (boz.yaz.has('ulke_randevu_istekleri')) throw Object.assign(new Error('stand-in: ulke_randevu_istekleri update failed inside the function'), { code: 'XX000' })
      Object.assign(i, { durum: 'kabul', randevu_id: r.id, cevap_at: a.p_simdi })
      return { durum: 'TAMAM', randevu_id: r.id }
    },

    // lib/db/migrations/138_ulke_hasta_formu.sql — ulke_hasta_formu_iste. Every statement carries `p_ulke`, as in the SQL.
    ulke_hasta_formu_iste: (a) => {
      const bu = (x: Satir) => x.ulke === a.p_ulke && x.doctor_id === a.p_doctor_id && x.patient_id === a.p_patient_id
      if (!tablo('ulke_hastalar').some((h) => h.id === a.p_patient_id && h.doctor_id === a.p_doctor_id && h.ulke === a.p_ulke)) return { durum: 'NOT_FOUND' }
      if (a.p_randevu_id != null && !tablo('ulke_randevulari').some((r) => r.id === a.p_randevu_id && r.patient_id === a.p_patient_id && r.doctor_id === a.p_doctor_id && r.ulke === a.p_ulke)) return { durum: 'NOT_FOUND' }
      const calisan = tablo('ulke_portal_erisimleri').some((e) => bu(e) && !e.iptal_at && !e.kilitlendi_at && String(e.son_gecerlilik) > String(a.p_simdi))
      const yeniBaglanti = !calisan || a.p_yeni_baglanti === true
      if (yeniBaglanti && (a.p_token_hash == null || a.p_pin_hash == null || a.p_son_gecerlilik == null)) return { durum: 'GECERSIZ' }
      let form = tablo('ulke_hasta_formlari').find((f) => bu(f) && ['bekliyor', 'taslak'].includes(String(f.durum)))
      let yeni = false
      if (!form) {
        if (boz.yaz.has('ulke_hasta_formlari')) throw Object.assign(new Error('stand-in: ulke_hasta_formlari insert failed inside the function'), { code: 'XX000' })
        form = islevdeEkle('ulke_hasta_formlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: a.p_patient_id, randevu_id: a.p_randevu_id ?? null, rol: a.p_rol ?? null, soru_surumu: a.p_soru_surumu, veli: a.p_veli === true, durum: 'bekliyor', cevaplar_encrypted: null, dil: null, riza_surumu: null, riza_at: null, gonderildi_at: null, yeniden_acildi_at: null, iptal_at: null, created_at: a.p_simdi, updated_at: a.p_simdi })
        yeni = true
      } else if (a.p_randevu_id != null && form.randevu_id !== a.p_randevu_id) Object.assign(form, { randevu_id: a.p_randevu_id, updated_at: a.p_simdi })
      if (yeniBaglanti) {
        // ulke_portal_erisim_ver, called from inside: the link before it is withdrawn, its sessions closed, the event recorded.
        if (boz.yaz.has('ulke_portal_erisimleri')) throw Object.assign(new Error('stand-in: ulke_portal_erisimleri insert failed inside the function'), { code: 'XX000' })
        islevler.ulke_portal_erisim_ver({ p_ulke: a.p_ulke, p_doctor_id: a.p_doctor_id, p_patient_id: a.p_patient_id, p_token_hash: a.p_token_hash, p_pin_hash: a.p_pin_hash, p_son_gecerlilik: a.p_son_gecerlilik, p_simdi: a.p_simdi })
      }
      return { durum: 'TAMAM', form_id: form.id, yeni_form: yeni, erisim: yeniBaglanti ? 'YENI' : 'VAR' }
    },

    // lib/db/migrations/145_ulke_klinik.sql — clinic accounts. Every statement carries `p_ulke`, as in the SQL.
    ulke_klinik_kur: (a) => {
      if (!hesapVar(a.p_ulke, a.p_doctor_id)) return { durum: 'NOT_FOUND' }
      if (tablo('ulke_klinik_uyeleri').some((u) => u.ulke === a.p_ulke && u.doctor_id === a.p_doctor_id)) return { durum: 'UYE' }
      const k = islevdeEkle('ulke_klinikler', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, ad: String(a.p_ad ?? '').trim(), created_at: a.p_simdi, updated_at: a.p_simdi })
      if (boz.yaz.has('ulke_klinik_uyeleri')) throw Object.assign(new Error('stand-in: ulke_klinik_uyeleri insert failed inside the function'), { code: 'XX000' })
      islevdeEkle('ulke_klinik_uyeleri', { ulke: a.p_ulke, klinik_id: k.id, doctor_id: a.p_doctor_id, konum: 'sahip', created_at: a.p_simdi, updated_at: a.p_simdi })
      return { durum: 'TAMAM', klinik_id: k.id }
    },
    ulke_klinik_katil: (a) => {
      if (!hesapVar(a.p_ulke, a.p_doctor_id)) return { durum: 'KOD' }
      const d = tablo('ulke_klinik_davetleri').find((x) => x.kod_hash === a.p_kod_hash && x.ulke === a.p_ulke)
      if (!d || d.kullanildi_at != null || d.iptal_at != null || ms(d.son_gecerlilik) <= ms(a.p_simdi)) return { durum: 'KOD' }
      if (tablo('ulke_klinik_uyeleri').some((u) => u.ulke === a.p_ulke && u.doctor_id === a.p_doctor_id)) return { durum: 'UYE' }
      islevdeEkle('ulke_klinik_uyeleri', { ulke: a.p_ulke, klinik_id: d.klinik_id, doctor_id: a.p_doctor_id, konum: d.konum, created_at: a.p_simdi, updated_at: a.p_simdi })
      if (boz.yaz.has('ulke_klinik_davetleri')) throw Object.assign(new Error('stand-in: ulke_klinik_davetleri update failed inside the function'), { code: 'XX000' })
      Object.assign(d, { kullanildi_at: a.p_simdi, kullanan_id: a.p_doctor_id })
      return { durum: 'TAMAM', klinik_id: d.klinik_id, konum: d.konum }
    },
    ulke_klinik_uye_cikar: (a) => {
      const hedef = uyeKonumu(a.p_ulke, a.p_klinik_id, a.p_doctor_id), yapan = uyeKonumu(a.p_ulke, a.p_klinik_id, a.p_yapan_id)
      if (!hedef || !yapan) return 'NOT_FOUND'
      if (hedef === 'sahip') return 'SAHIP'
      if (a.p_yapan_id !== a.p_doctor_id && !yonetebilir(yapan, hedef)) return 'YETKI_YOK'
      const onun = (y: Satir) => y.ulke === a.p_ulke && y.klinik_id === a.p_klinik_id && (y.doctor_id === a.p_doctor_id || y.alan_id === a.p_doctor_id)
      for (const y of tablo('ulke_klinik_yetkileri').filter((x) => onun(x) && x.iptal_at == null)) islevdeEkle('ulke_klinik_erisim_kayitlari', { ulke: y.ulke, doctor_id: y.doctor_id, kisi_id: a.p_yapan_id, alan_id: y.alan_id, patient_id: y.patient_id ?? null, yetki_id: y.id, tur: y.tur, olay: 'bitti', ne: null, created_at: a.p_simdi })
      if (boz.yaz.has('ulke_klinik_uyeleri')) throw Object.assign(new Error('stand-in: ulke_klinik_uyeleri delete failed inside the function'), { code: 'XX000' })
      const uye = tablo('ulke_klinik_uyeleri').filter((u) => u.ulke === a.p_ulke && u.klinik_id === a.p_klinik_id && u.doctor_id === a.p_doctor_id)
      klinikSilme('ulke_klinik_uyeleri', uye)
      tablolar.ulke_klinik_uyeleri = tablo('ulke_klinik_uyeleri').filter((u) => !uye.includes(u))
      return 'TAMAM'
    },
    ulke_klinik_konum_degistir: (a) => {
      const hedef = uyeKonumu(a.p_ulke, a.p_klinik_id, a.p_doctor_id), yapan = uyeKonumu(a.p_ulke, a.p_klinik_id, a.p_yapan_id)
      if (!hedef || !yapan) return 'NOT_FOUND'
      if (hedef === 'sahip' || a.p_konum === 'sahip') return 'SAHIP'
      if (!['yonetici', 'hekim', 'muttefik', 'on-buro'].includes(String(a.p_konum))) return 'YETKI_YOK'
      if (a.p_yapan_id === a.p_doctor_id || !yonetebilir(yapan, hedef) || !yonetebilir(yapan, String(a.p_konum))) return 'YETKI_YOK'
      if (hedef === a.p_konum) return 'AYNI'
      const acik = tablo('ulke_klinik_yetkileri').filter((y) => y.ulke === a.p_ulke && y.klinik_id === a.p_klinik_id && y.iptal_at == null && (y.doctor_id === a.p_doctor_id || y.alan_id === a.p_doctor_id))
      for (const y of acik) islevdeEkle('ulke_klinik_erisim_kayitlari', { ulke: y.ulke, doctor_id: y.doctor_id, kisi_id: a.p_yapan_id, alan_id: y.alan_id, patient_id: y.patient_id ?? null, yetki_id: y.id, tur: y.tur, olay: 'bitti', ne: null, created_at: a.p_simdi })
      if (boz.yaz.has('ulke_klinik_yetkileri')) throw Object.assign(new Error('stand-in: ulke_klinik_yetkileri update failed inside the function'), { code: 'XX000' })
      for (const y of acik) Object.assign(y, { iptal_at: a.p_simdi, iptal_eden_id: a.p_yapan_id })
      const u = tablo('ulke_klinik_uyeleri').find((x) => x.ulke === a.p_ulke && x.klinik_id === a.p_klinik_id && x.doctor_id === a.p_doctor_id) as Satir
      Object.assign(u, { konum: a.p_konum, updated_at: a.p_simdi })
      return 'TAMAM'
    },
    ulke_klinik_yetki_ver: (a) => {
      const veren = uyeKonumu(a.p_ulke, a.p_klinik_id, a.p_doctor_id), alan = uyeKonumu(a.p_ulke, a.p_klinik_id, a.p_alan_id)
      if (!veren || !alan || a.p_doctor_id === a.p_alan_id) return { durum: 'NOT_FOUND' }
      if (a.p_kaydeden_id !== a.p_doctor_id && uyeKonumu(a.p_ulke, a.p_klinik_id, a.p_kaydeden_id) !== 'sahip') return { durum: 'YETKI_YOK' }
      if (!YETKI_TURLERI.includes(String(a.p_tur))) return { durum: 'GECERSIZ' }
      if (veren === 'on-buro' || !turKonumaUygun(a.p_tur, alan)) return { durum: 'KONUM' }
      if ((a.p_tur === 'paylasim') !== (a.p_patient_id != null)) return { durum: 'GECERSIZ' }
      if (a.p_tur === 'vekalet') {
        if (a.p_baslangic == null || a.p_bitis == null || !(ms(a.p_bitis) > ms(a.p_baslangic)) || ms(a.p_bitis) <= ms(a.p_simdi) || ms(a.p_bitis) > ms(a.p_baslangic) + GUN31_MS) return { durum: 'GECERSIZ' }
      } else if (a.p_baslangic != null || a.p_bitis != null) return { durum: 'GECERSIZ' }
      if (a.p_patient_id != null && !tablo('ulke_hastalar').some((h) => h.id === a.p_patient_id && h.doctor_id === a.p_doctor_id && h.ulke === a.p_ulke)) return { durum: 'NOT_FOUND' }
      const varOlan = tablo('ulke_klinik_yetkileri').find((y) => y.ulke === a.p_ulke && y.doctor_id === a.p_doctor_id && y.alan_id === a.p_alan_id && y.tur === a.p_tur && (y.patient_id ?? null) === (a.p_patient_id ?? null) && y.iptal_at == null)
      if (varOlan) {
        if (a.p_tur !== 'vekalet') return { durum: 'VAR', yetki_id: varOlan.id }
        Object.assign(varOlan, { iptal_at: a.p_simdi, iptal_eden_id: a.p_kaydeden_id })
        islevdeEkle('ulke_klinik_erisim_kayitlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, kisi_id: a.p_kaydeden_id, alan_id: a.p_alan_id, patient_id: null, yetki_id: varOlan.id, tur: a.p_tur, olay: 'geri-alindi', ne: null, created_at: a.p_simdi })
      }
      const y = islevdeEkle('ulke_klinik_yetkileri', { ulke: a.p_ulke, klinik_id: a.p_klinik_id, doctor_id: a.p_doctor_id, alan_id: a.p_alan_id, tur: a.p_tur, patient_id: a.p_patient_id ?? null, baslangic: a.p_baslangic ?? null, bitis: a.p_bitis ?? null, kaydeden_id: a.p_kaydeden_id, iptal_at: null, iptal_eden_id: null, created_at: a.p_simdi })
      if (boz.yaz.has('ulke_klinik_erisim_kayitlari')) throw Object.assign(new Error('stand-in: ulke_klinik_erisim_kayitlari insert failed inside the function'), { code: 'XX000' })
      islevdeEkle('ulke_klinik_erisim_kayitlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, kisi_id: a.p_kaydeden_id, alan_id: a.p_alan_id, patient_id: a.p_patient_id ?? null, yetki_id: y.id, tur: a.p_tur, olay: 'verildi', ne: null, created_at: a.p_simdi })
      return { durum: 'TAMAM', yetki_id: y.id }
    },
    ulke_klinik_yetki_geri_al: (a) => {
      const y = tablo('ulke_klinik_yetkileri').find((x) => x.id === a.p_yetki_id && x.ulke === a.p_ulke && (x.doctor_id === a.p_yapan_id || x.alan_id === a.p_yapan_id || x.kaydeden_id === a.p_yapan_id))
      if (!y) return 'NOT_FOUND'
      if (y.iptal_at != null) return 'AYNI'
      Object.assign(y, { iptal_at: a.p_simdi, iptal_eden_id: a.p_yapan_id })
      if (boz.yaz.has('ulke_klinik_erisim_kayitlari')) throw Object.assign(new Error('stand-in: ulke_klinik_erisim_kayitlari insert failed inside the function'), { code: 'XX000' })
      islevdeEkle('ulke_klinik_erisim_kayitlari', { ulke: a.p_ulke, doctor_id: y.doctor_id, kisi_id: a.p_yapan_id, alan_id: y.alan_id, patient_id: y.patient_id ?? null, yetki_id: y.id, tur: y.tur, olay: 'geri-alindi', ne: null, created_at: a.p_simdi })
      return 'TAMAM'
    },
  }
  const rpc = async (ad: string, arg: Satir = {}): Promise<IslevCevabi> => {
    const islev = islevler[ad]
    if (!islev) throw new Error(`stand-in database: function ${ad} is not implemented`)
    if (typeof arg.p_ulke !== 'string' || !/^[a-z]{2}$/.test(arg.p_ulke)) throw new Error(`stand-in database: function ${ad} called without the country (p_ulke)`)
    islevCagrilari.push({ ad, arg })
    sorgular.push({ tablo: `rpc:${ad}`, islem: 'rpc', filtreler: [], ulke: arg.p_ulke })
    const yedek = JSON.stringify(tablolar)
    try {
      return { data: islev(JSON.parse(JSON.stringify(arg)) as Satir), error: null }
    } catch (e) {
      // ROLLBACK: every table is exactly as it was before the function began.
      const eski = JSON.parse(yedek) as Record<string, Satir[]>
      for (const k of Object.keys(tablolar)) delete tablolar[k]
      Object.assign(tablolar, eski)
      return { data: null, error: { message: e instanceof Error ? e.message : 'function failed', code: (e as { code?: string }).code ?? 'XX000' } }
    }
  }

  class Sorgu implements PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }> {
    private filtreler: { ad: string; f: (s: Satir) => boolean }[] = []
    private islem: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
    private yuk: Satir | Satir[] | null = null
    private catisma = 'id'
    private tek: 'single' | 'maybe' | null = null
    private sira: { kolon: string; artan: boolean } | null = null
    private sinir: number | null = null
    private donus = false
    constructor(private ad: string) {}

    select(_kolonlar?: string) { if (this.islem !== 'select') this.donus = true; return this }
    insert(yuk: Satir | Satir[]) { this.islem = 'insert'; this.yuk = yuk; return this }
    update(yuk: Satir) { this.islem = 'update'; this.yuk = yuk; return this }
    upsert(yuk: Satir, s?: { onConflict?: string }) { this.islem = 'upsert'; this.yuk = yuk; this.catisma = s?.onConflict ?? 'id'; return this }
    delete() { this.islem = 'delete'; return this }
    eq(k: string, v: unknown) { this.filtreler.push({ ad: `${k}=eq.${String(v)}`, f: (s) => s[k] === v }); return this }
    in(k: string, v: unknown[]) { this.filtreler.push({ ad: `${k}=in.(${v.join(',')})`, f: (s) => v.includes(s[k]) }); return this }
    neq(k: string, v: unknown) { this.filtreler.push({ ad: `${k}=neq.${String(v)}`, f: (s) => s[k] !== v }); return this }
    lt(k: string, v: string) { this.filtreler.push({ ad: `${k}=lt.${v}`, f: (s) => String(s[k] ?? '') < v }); return this }
    gt(k: string, v: string) { this.filtreler.push({ ad: `${k}=gt.${v}`, f: (s) => String(s[k] ?? '') > v }); return this }
    gte(k: string, v: string) { this.filtreler.push({ ad: `${k}=gte.${v}`, f: (s) => String(s[k] ?? '') >= v }); return this }
    is(k: string, v: null) { this.filtreler.push({ ad: `${k}=is.null`, f: (s) => (s[k] ?? null) === v }); return this }
    not(k: string, op: 'is', v: null) {
      if (op !== 'is' || v !== null) throw new Error(`stand-in database: not(${k}, ${op}, ${String(v)}) is not implemented`)
      this.filtreler.push({ ad: `${k}=not.is.null`, f: (s) => (s[k] ?? null) !== null }); return this
    }
    order(kolon: string, s?: { ascending?: boolean }) { this.sira = { kolon, artan: s?.ascending !== false }; return this }
    limit(n: number) { this.sinir = n; return this }
    single() { this.tek = 'single'; return this }
    maybeSingle() { this.tek = 'maybe'; return this }

    private calistir(): { data: unknown; error: { message: string; code?: string } | null } {
      const filtreAdlari = this.filtreler.map((f) => f.ad)
      sorgular.push({ tablo: this.ad, islem: this.islem, filtreler: filtreAdlari, ulke: ulkeyiBul(this.ad, this.islem, filtreAdlari, this.yuk) })
      const satirlar = tablo(this.ad)
      const uyan = (s: Satir) => this.filtreler.every((f) => f.f(s))
      const yazma = this.islem !== 'select'
      if ((yazma ? boz.yaz : boz.oku).has(this.ad)) return { data: null, error: { message: `stand-in: ${this.ad} ${this.islem} failed`, code: 'XX000' } }
      let sonuc: Satir[]
      if (this.islem === 'select') sonuc = satirlar.filter(uyan)
      else if (this.islem === 'insert') {
        sonuc = (Array.isArray(this.yuk) ? this.yuk : [this.yuk!]).map((y) => ({ ...(KIMLIKSIZ.has(this.ad) ? {} : { id: yeniId() }), created_at: new Date().toISOString(), ...(this.ad === 'ulke_muayeneler' ? { started_at: new Date().toISOString() } : {}), ...y }))
        for (const y of sonuc) { const c = kisit(this.ad, y, satirlar); if (c) return { data: null, error: c } }
        satirlar.push(...sonuc)
      } else if (this.islem === 'upsert') {
        const y = this.yuk as Satir
        const anahtarlar = this.catisma.split(',').map((k) => k.trim())
        const var_ = satirlar.find((s) => anahtarlar.every((k) => s[k] === y[k]))
        if (var_) { Object.assign(var_, y); sonuc = [var_] } else { const yeni = { created_at: new Date().toISOString(), ...y }; satirlar.push(yeni); sonuc = [yeni] }
      } else if (this.islem === 'update') {
        if (!this.filtreler.length) throw new Error(`stand-in database: update on ${this.ad} without a filter`)
        sonuc = satirlar.filter(uyan)
        // A constraint is checked on the row as it WOULD be; a refused statement changes nothing.
        for (const s of sonuc) { const c = guncellemeKilidi(this.ad, s, { ...s, ...this.yuk }) ?? kisit(this.ad, { ...s, ...this.yuk }, satirlar.filter((x) => x !== s), 'update'); if (c) return { data: null, error: c } }
        for (const s of sonuc) Object.assign(s, this.yuk)
      } else {
        if (!this.filtreler.length) throw new Error(`stand-in database: delete on ${this.ad} without a filter`)
        sonuc = satirlar.filter(uyan)
        { const c = klinikSilme(this.ad, sonuc); if (c) return { data: null, error: c } }
        tablolar[this.ad] = tablo(this.ad).filter((s) => !uyan(s))
      }
      if (this.sira) {
        const { kolon, artan } = this.sira
        sonuc = [...sonuc].sort((a, b) => (String(a[kolon] ?? '') < String(b[kolon] ?? '') ? -1 : String(a[kolon] ?? '') > String(b[kolon] ?? '') ? 1 : 0) * (artan ? 1 : -1))
      }
      if (this.sinir !== null) sonuc = sonuc.slice(0, this.sinir)
      const kopya = sonuc.map((s) => ({ ...s }))
      if (this.tek === 'single') return kopya.length === 1 ? { data: kopya[0], error: null } : { data: null, error: { message: 'no rows', code: 'PGRST116' } }
      if (this.tek === 'maybe') return kopya.length > 1 ? { data: null, error: { message: 'multiple rows', code: 'PGRST116' } } : { data: kopya[0] ?? null, error: null }
      return { data: yazma && !this.donus ? null : kopya, error: null }
    }
    then<A = { data: unknown; error: { message: string; code?: string } | null }, B = never>(tamam?: ((d: { data: unknown; error: { message: string; code?: string } | null }) => A | PromiseLike<A>) | null, hata?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
      return new Promise<{ data: unknown; error: { message: string; code?: string } | null }>((coz, ret) => { try { coz(this.calistir()) } catch (e) { ret(e) } }).then(tamam, hata)
    }
  }

  const createClient = () => ({
    auth: {
      getUser: async (jwt?: string) => {
        const u = jwt ? hesaplar[jwt] : undefined
        return u ? { data: { user: { user_metadata: {}, app_metadata: {}, ...u } }, error: null } : { data: { user: null }, error: { message: 'invalid JWT' } }
      },
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: (ad: string) => new Sorgu(ad),
    rpc,
    storage: {
      from: (kova: string) => ({
        download: async (yol: string) => {
          const b = depo.get(`${kova}/${yol}`)
          return b ? { data: b, error: null } : { data: null, error: { message: 'not found' } }
        },
        remove: async (yollar: string[]) => { for (const y of yollar) depo.delete(`${kova}/${y}`); return { data: null, error: null } },
      }),
    },
  })

  return { tablolar, tablo, hesaplar, depo, sorgular, boz, islevCagrilari, createClient }
}
