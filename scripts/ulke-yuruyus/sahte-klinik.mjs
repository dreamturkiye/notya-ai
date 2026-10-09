/**
 * NOTYA-ULKE-KLINIK-01 — what migration 145 (clinic accounts) puts in the database, for the walk-through's stand-in
 * (./sahte-supabase.mjs). Never deployed, never a dependency of the application.
 *
 * The same statements, in the same order, as lib/db/migrations/145_ulke_klinik.sql and as the test suite's stand-in
 * (lib/ulke/testing/sahteVeritabani.ts): the keys and checks of the five tables, the triggers (a clinic keeps its
 * owner; a member never moves; the owner is not removed; an invitation and a grant do not change; a record row is
 * neither changed nor deleted), what a removed membership takes with it (every grant given by or to it, the
 * invitations it issued), and the six functions. The real proof of the SQL is scripts/ulke-goc-kaniti.mjs on a
 * local PostgreSQL; this file only lets a browser walk the screens.
 */
import { randomUUID } from 'node:crypto'

const KONUMLAR = ['sahip', 'yonetici', 'hekim', 'muttefik', 'on-buro']
const YETKI_TURLERI = ['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal', 'paylasim', 'vekalet']
const GUN31_MS = 31 * 86_400_000
const ms = (x) => new Date(String(x)).getTime()
const hata = (code, message) => Object.assign(new Error(message), { code })

/** `tablo(ad)` → the rows of a table; `tablolar` → the object that holds them (a delete replaces a table's array). */
export function klinikVeritabani({ tablo, tablolar }) {
  const uyeKonumu = (ulke, klinik, hesap) => tablo('ulke_klinik_uyeleri').find((u) => u.ulke === ulke && u.klinik_id === klinik && u.doctor_id === hesap)?.konum ?? null
  const hesapVar = (ulke, id) => tablo('ulke_hesaplari').some((h) => h.id === id && h.ulke === ulke)
  const turKonumaUygun = (tur, konum) => (['on-buro-randevu', 'on-buro-hasta', 'on-buro-portal'].includes(String(tur)) && konum === 'on-buro') || (tur === 'paylasim' && konum === 'muttefik') || (tur === 'vekalet' && ['hekim', 'sahip', 'yonetici'].includes(String(konum)))
  const yonetebilir = (yapan, hedef) => hedef !== null && hedef !== 'sahip' && (yapan === 'sahip' || (yapan === 'yonetici' && ['hekim', 'muttefik', 'on-buro'].includes(hedef)))
  const hastaVar = (ulke, hekim, hasta) => tablo('ulke_hastalar').some((h) => h.id === hasta && h.doctor_id === hekim && h.ulke === ulke)

  /** The keys, the checks and the INSERT half of the triggers, on a row as it WOULD be. null = accepted. */
  function kisit(ad, yeni, digerleri, islem) {
    if (ad === 'ulke_klinikler') {
      if (!hesapVar(yeni.ulke, yeni.doctor_id)) return hata('23503', 'insert or update on table "ulke_klinikler" violates foreign key constraint "ulke_klinikler_hesap_fk"')
      const adi = String(yeni.ad ?? '').trim()
      if (adi.length < 2 || adi.length > 120) return hata('23514', 'new row for relation "ulke_klinikler" violates check constraint (ad)')
      if (digerleri.some((k) => k.ulke === yeni.ulke && k.doctor_id === yeni.doctor_id)) return hata('23505', 'duplicate key value violates unique constraint "ulke_klinikler_sahip_tekil"')
      return null
    }
    if (ad === 'ulke_klinik_erisim_kayitlari') {
      if (!YETKI_TURLERI.includes(String(yeni.tur)) || !['verildi', 'geri-alindi', 'bitti', 'okuma', 'yazma'].includes(String(yeni.olay))) return hata('23514', 'new row for relation "ulke_klinik_erisim_kayitlari" violates check constraint (tur, olay)')
      if (['okuma', 'yazma'].includes(String(yeni.olay)) !== (yeni.ne != null)) return hata('23514', 'new row for relation "ulke_klinik_erisim_kayitlari" violates check constraint (what was read or written)')
      if (yeni.ne != null && !/^[a-z]+(-[a-z]+)*$/.test(String(yeni.ne))) return hata('23514', 'new row for relation "ulke_klinik_erisim_kayitlari" violates check constraint (ne)')
      if (!hesapVar(yeni.ulke, yeni.doctor_id) || !hesapVar(yeni.ulke, yeni.kisi_id) || !hesapVar(yeni.ulke, yeni.alan_id)) return hata('23503', 'insert or update on table "ulke_klinik_erisim_kayitlari" violates foreign key constraint (account)')
      if (yeni.patient_id != null && !hastaVar(yeni.ulke, yeni.doctor_id, yeni.patient_id)) return hata('23503', 'insert or update on table "ulke_klinik_erisim_kayitlari" violates foreign key constraint "ulke_klinik_erisim_kayitlari_hasta_fk"')
      return null
    }
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
      if (yeni.patient_id != null && !hastaVar(yeni.ulke, yeni.doctor_id, yeni.patient_id)) return hata('23503', 'insert or update on table "ulke_klinik_yetkileri" violates foreign key constraint "ulke_klinik_yetkileri_hasta_fk"')
      if (yeni.iptal_at == null && digerleri.some((y) => y.ulke === yeni.ulke && y.doctor_id === yeni.doctor_id && y.alan_id === yeni.alan_id && y.tur === yeni.tur && (y.patient_id ?? null) === (yeni.patient_id ?? null) && y.iptal_at == null)) return hata('23505', 'duplicate key value violates unique constraint "ulke_klinik_yetkileri_tek_acik"')
      return null
    }
    return null
  }

  /** The UPDATE half of the triggers: what a clinic row may never do. null = accepted. */
  function kilit(ad, eski, yeni) {
    const farkli = (...k) => k.some((x) => (eski[x] ?? null) !== (yeni[x] ?? null))
    if (ad === 'ulke_klinikler') return farkli('ulke', 'doctor_id', 'id', 'created_at') ? hata('23514', 'ulke_klinikler: a clinic keeps its country and its owner') : null
    if (ad === 'ulke_klinik_erisim_kayitlari') return hata('23514', 'ulke_klinik_erisim_kayitlari: a record row does not change')
    if (ad === 'ulke_klinik_uyeleri') {
      if (farkli('ulke', 'klinik_id', 'doctor_id', 'id')) return hata('23514', 'ulke_klinik_uyeleri: a member never moves to another country, clinic or account')
      if (farkli('konum') && (eski.konum === 'sahip' || yeni.konum === 'sahip')) return hata('23514', "ulke_klinik_uyeleri: the owner's position is not changed and not given")
    }
    if (ad === 'ulke_klinik_davetleri') {
      if (farkli('ulke', 'klinik_id', 'doctor_id', 'konum', 'kod_hash', 'son_gecerlilik', 'created_at', 'id')) return hata('23514', 'ulke_klinik_davetleri: an invitation does not change')
      if ((eski.kullanildi_at != null || eski.iptal_at != null) && farkli('kullanildi_at', 'kullanan_id', 'iptal_at')) return hata('23514', 'ulke_klinik_davetleri: an invitation is used once or withdrawn once')
      if (yeni.kullanildi_at != null && yeni.iptal_at != null) return hata('23514', 'ulke_klinik_davetleri: an invitation is used or withdrawn, never both')
    }
    if (ad === 'ulke_klinik_yetkileri') {
      if (farkli('ulke', 'klinik_id', 'doctor_id', 'alan_id', 'tur', 'patient_id', 'baslangic', 'bitis', 'kaydeden_id', 'created_at', 'id')) return hata('23514', 'ulke_klinik_yetkileri: a grant does not change; a new grant is a new row')
      if (eski.iptal_at != null && farkli('iptal_at', 'iptal_eden_id')) return hata('23514', 'ulke_klinik_yetkileri: a withdrawn grant stays withdrawn')
    }
    return null
  }

  /** A DELETE: the record is never deleted; the owner is not removed; a membership takes its grants and invitations with it. */
  function silme(ad, silinen) {
    if (ad === 'ulke_klinik_erisim_kayitlari' && silinen.length) return hata('23514', 'ulke_klinik_erisim_kayitlari: a record row is not deleted')
    if (ad !== 'ulke_klinik_uyeleri') return null
    if (silinen.some((u) => u.konum === 'sahip' && tablo('ulke_klinikler').some((k) => k.id === u.klinik_id && k.ulke === u.ulke))) return hata('23514', 'ulke_klinik_uyeleri: the owner is not removed from the clinic')
    for (const u of silinen) {
      tablolar.ulke_klinik_yetkileri = tablo('ulke_klinik_yetkileri').filter((y) => !(y.ulke === u.ulke && y.klinik_id === u.klinik_id && (y.doctor_id === u.doctor_id || y.alan_id === u.doctor_id)))
      tablolar.ulke_klinik_davetleri = tablo('ulke_klinik_davetleri').filter((d) => !(d.ulke === u.ulke && d.klinik_id === u.klinik_id && d.doctor_id === u.doctor_id))
    }
    return null
  }

  /** A row written inside a function, held to the same constraints as a statement. */
  function ekle(ad, satir) {
    const yeni = { id: randomUUID(), ...satir }
    const c = kisit(ad, yeni, tablo(ad), 'insert')
    if (c) throw c
    tablo(ad).push(yeni)
    return yeni
  }
  const kayit = (y, kisi, olay, an) => ekle('ulke_klinik_erisim_kayitlari', { ulke: y.ulke, doctor_id: y.doctor_id, kisi_id: kisi, alan_id: y.alan_id, patient_id: y.patient_id ?? null, yetki_id: y.id, tur: y.tur, olay, ne: null, created_at: an })

  const islevler = {
    ulke_klinik_kur: (a) => {
      if (!hesapVar(a.p_ulke, a.p_doctor_id)) return { durum: 'NOT_FOUND' }
      if (tablo('ulke_klinik_uyeleri').some((u) => u.ulke === a.p_ulke && u.doctor_id === a.p_doctor_id)) return { durum: 'UYE' }
      const k = ekle('ulke_klinikler', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, ad: String(a.p_ad ?? '').trim(), created_at: a.p_simdi, updated_at: a.p_simdi })
      ekle('ulke_klinik_uyeleri', { ulke: a.p_ulke, klinik_id: k.id, doctor_id: a.p_doctor_id, konum: 'sahip', created_at: a.p_simdi, updated_at: a.p_simdi })
      return { durum: 'TAMAM', klinik_id: k.id }
    },
    ulke_klinik_katil: (a) => {
      if (!hesapVar(a.p_ulke, a.p_doctor_id)) return { durum: 'KOD' }
      const d = tablo('ulke_klinik_davetleri').find((x) => x.kod_hash === a.p_kod_hash && x.ulke === a.p_ulke)
      if (!d || d.kullanildi_at != null || d.iptal_at != null || ms(d.son_gecerlilik) <= ms(a.p_simdi)) return { durum: 'KOD' }
      if (tablo('ulke_klinik_uyeleri').some((u) => u.ulke === a.p_ulke && u.doctor_id === a.p_doctor_id)) return { durum: 'UYE' }
      ekle('ulke_klinik_uyeleri', { ulke: a.p_ulke, klinik_id: d.klinik_id, doctor_id: a.p_doctor_id, konum: d.konum, created_at: a.p_simdi, updated_at: a.p_simdi })
      Object.assign(d, { kullanildi_at: a.p_simdi, kullanan_id: a.p_doctor_id })
      return { durum: 'TAMAM', klinik_id: d.klinik_id, konum: d.konum }
    },
    ulke_klinik_uye_cikar: (a) => {
      const hedef = uyeKonumu(a.p_ulke, a.p_klinik_id, a.p_doctor_id), yapan = uyeKonumu(a.p_ulke, a.p_klinik_id, a.p_yapan_id)
      if (!hedef || !yapan) return 'NOT_FOUND'
      if (hedef === 'sahip') return 'SAHIP'
      if (a.p_yapan_id !== a.p_doctor_id && !yonetebilir(yapan, hedef)) return 'YETKI_YOK'
      const onun = (y) => y.ulke === a.p_ulke && y.klinik_id === a.p_klinik_id && (y.doctor_id === a.p_doctor_id || y.alan_id === a.p_doctor_id)
      for (const y of tablo('ulke_klinik_yetkileri').filter((x) => onun(x) && x.iptal_at == null)) kayit(y, a.p_yapan_id, 'bitti', a.p_simdi)
      const uye = tablo('ulke_klinik_uyeleri').filter((u) => u.ulke === a.p_ulke && u.klinik_id === a.p_klinik_id && u.doctor_id === a.p_doctor_id)
      const c = silme('ulke_klinik_uyeleri', uye)
      if (c) throw c
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
      for (const y of acik) kayit(y, a.p_yapan_id, 'bitti', a.p_simdi)
      for (const y of acik) Object.assign(y, { iptal_at: a.p_simdi, iptal_eden_id: a.p_yapan_id })
      Object.assign(tablo('ulke_klinik_uyeleri').find((x) => x.ulke === a.p_ulke && x.klinik_id === a.p_klinik_id && x.doctor_id === a.p_doctor_id), { konum: a.p_konum, updated_at: a.p_simdi })
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
      if (a.p_patient_id != null && !hastaVar(a.p_ulke, a.p_doctor_id, a.p_patient_id)) return { durum: 'NOT_FOUND' }
      const varOlan = tablo('ulke_klinik_yetkileri').find((y) => y.ulke === a.p_ulke && y.doctor_id === a.p_doctor_id && y.alan_id === a.p_alan_id && y.tur === a.p_tur && (y.patient_id ?? null) === (a.p_patient_id ?? null) && y.iptal_at == null)
      if (varOlan) {
        if (a.p_tur !== 'vekalet') return { durum: 'VAR', yetki_id: varOlan.id }
        Object.assign(varOlan, { iptal_at: a.p_simdi, iptal_eden_id: a.p_kaydeden_id })
        kayit(varOlan, a.p_kaydeden_id, 'geri-alindi', a.p_simdi)
      }
      const y = ekle('ulke_klinik_yetkileri', { ulke: a.p_ulke, klinik_id: a.p_klinik_id, doctor_id: a.p_doctor_id, alan_id: a.p_alan_id, tur: a.p_tur, patient_id: a.p_patient_id ?? null, baslangic: a.p_baslangic ?? null, bitis: a.p_bitis ?? null, kaydeden_id: a.p_kaydeden_id, iptal_at: null, iptal_eden_id: null, created_at: a.p_simdi })
      kayit(y, a.p_kaydeden_id, 'verildi', a.p_simdi)
      return { durum: 'TAMAM', yetki_id: y.id }
    },
    ulke_klinik_yetki_geri_al: (a) => {
      const y = tablo('ulke_klinik_yetkileri').find((x) => x.id === a.p_yetki_id && x.ulke === a.p_ulke && (x.doctor_id === a.p_yapan_id || x.alan_id === a.p_yapan_id || x.kaydeden_id === a.p_yapan_id))
      if (!y) return 'NOT_FOUND'
      if (y.iptal_at != null) return 'AYNI'
      Object.assign(y, { iptal_at: a.p_simdi, iptal_eden_id: a.p_yapan_id })
      kayit(y, a.p_yapan_id, 'geri-alindi', a.p_simdi)
      return 'TAMAM'
    },
  }
  return { kisit, kilit, silme, islevler }
}
