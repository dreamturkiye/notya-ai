#!/usr/bin/env node
/**
 * NOTYA-ULKE-KLINIK-01 — MUTATION CHECKS for clinic accounts: "remove a check, the tests must fail".
 *
 * A test that passes proves little until it has been seen to fail. Each entry below takes ONE check out of the
 * server code that stands between a member of a clinic and another doctor's patients — a filter of the grant
 * lookup, the period of cover, the position, the pack's switch, the record-before-read rule, the field-by-field
 * answer of the front desk, the country — runs lib/ulke/klinikHesabi/klinik.paket.test.ts for one country, and
 * expects the run to FAIL. Then the file is put back exactly as it was. A mutant that survives is a check no test
 * holds: the script exits 1 and names it.
 *
 *   node scripts/ulke-klinik-mutasyon.mjs            every mutant, with the Uzbek pack
 *   node scripts/ulke-klinik-mutasyon.mjs --ulke xx  with another country's pack
 *   node scripts/ulke-klinik-mutasyon.mjs --liste    print the mutants, run nothing
 *
 * It edits source files IN THE WORKING TREE while it runs and restores each one (also when interrupted); it finishes
 * by checking that every file is byte for byte what it was and that the unchanged code passes. It reaches no network
 * and no database. It is not part of `npm run test:ulke` (it runs the test file once per mutant); a test of that
 * suite (lib/ulke/klinikHesabi/mutasyon.test.ts) holds every mutant's target text to the source, so a check cannot
 * be renamed out from under this script without the suite saying so.
 *
 * Exit code 0 = every mutant was killed and the unchanged code passes.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const YETKI = 'lib/ulke/klinikHesabi/yetki.ts', KLINIK = 'lib/ulke/klinikHesabi/klinik.ts', ONBURO = 'lib/ulke/klinikHesabi/onBuro.ts', PAYLASIM = 'lib/ulke/klinikHesabi/paylasim.ts'
const TEST = 'lib/ulke/klinikHesabi/klinik.paket.test.ts'

/** [name, [[file, text to find (exactly once), text to put in its place], …]] */
export const MUTANTLAR = [
  // ── THE GRANT CHECK (yetkiBul) ──
  ['grant check: the lookup no longer names the DOCTOR', [[YETKI, ".eq('klinik_id', ben.klinikId).eq('doctor_id', hekimId).eq('alan_id', alanId)", ".eq('klinik_id', ben.klinikId).eq('alan_id', alanId)"]]],
  ['grant check: the lookup no longer names the MEMBER it was given to', [[YETKI, ".eq('doctor_id', hekimId).eq('alan_id', alanId).eq('tur', tur)", ".eq('doctor_id', hekimId).eq('tur', tur)"]]],
  ['grant check: the lookup no longer names the CAPABILITY', [[YETKI, ".eq('alan_id', alanId).eq('tur', tur).is('iptal_at', null)", ".eq('alan_id', alanId).is('iptal_at', null)"]]],
  ['grant check: the lookup no longer names the CLINIC', [[YETKI, "select('id, patient_id, baslangic, bitis, iptal_at').eq('klinik_id', ben.klinikId)", "select('id, patient_id, baslangic, bitis, iptal_at')"]]],
  ['grant check: a WITHDRAWN grant still counts', [[YETKI, ".eq('tur', tur).is('iptal_at', null)\n", ".eq('tur', tur)\n"], [YETKI, '  if (s.iptal_at) return false\n', '']]],
  ['grant check: the PERIOD of cover is not looked at', [[YETKI, 'return new Date(s.baslangic).getTime() <= simdi && simdi < new Date(s.bitis).getTime()', 'return true']]],
  ['grant check: cover that has ENDED still counts', [[YETKI, '<= simdi && simdi < new Date(s.bitis).getTime()', '<= simdi']]],
  ['grant check: cover that has NOT BEGUN already counts', [[YETKI, 'return new Date(s.baslangic).getTime() <= simdi && simdi <', 'return simdi <']]],
  ['grant check: a share of ONE patient opens another patient', [[YETKI, "  if (hastaId) q = q.eq('patient_id', hastaId)\n", ''], [YETKI, ' && (s.patient_id ?? null) === (hastaId ?? null))', ')']]],
  ['grant check: the POSITION of the member is not looked at', [[YETKI, 'if (!ben || !YETKI_ALAN_KONUMLARI[tur].includes(ben.konum)) return null', 'if (!ben) return null']]],
  ['grant check: the DOCTOR need not be a member of the same clinic', [[YETKI, 'if (!hekim || !hastaSahibiOlabilir(hekim.konum)) return null', 'void hekim']]],
  ['grant check: a front-desk member counts as a doctor with patients', [[YETKI, 'if (!hekim || !hastaSahibiOlabilir(hekim.konum)) return null', 'if (!hekim) return null']]],
  ['grant check: the membership of the doctor is not bound to the CLINIC', [[KLINIK, ".select('klinik_id, konum').eq('klinik_id', klinikId).eq('doctor_id', hesapId)", ".select('klinik_id, konum').eq('doctor_id', hesapId)"], [KLINIK, 'if (error || !s || s.klinik_id !== klinikId || !konumMu(s.konum)) return null', 'if (error || !s || !konumMu(s.konum)) return null']]],
  ['grant check: a capability the PACK has not switched on still opens', [[YETKI, 'if (!ayar || !yetkiTuruMu(tur) || !ayar.yetkiTurleri.includes(tur)) return null', 'if (!ayar || !yetkiTuruMu(tur)) return null']]],
  ['grant check: the ROLE of the member is not looked at', [[YETKI, '  if (!rolUygun(tur, await hekimRolunuOku(supabase, alanId))) return null\n', '']]],
  ['grant check: any allied role may read a share, whatever the pack lists', [[YETKI, "if (tur === 'paylasim') return (klinikAyarlari()?.paylasimRolleri ?? []).includes(tanim.anahtar)", "if (tur === 'paylasim') return true"]]],
  // ── THE RECORD ──
  ['record: a read goes ahead when its record row could not be written (lists)', [[YETKI, '  if (!(await erisimKaydet(supabase, b, g.olay, g.ne, g.hastaId ?? b.hastaId ?? null, simdi))) return null\n', '  await erisimKaydet(supabase, b, g.olay, g.ne, g.hastaId ?? b.hastaId ?? null, simdi)\n']]],
  ['record: the patient card is answered when its record row could not be written', [[ONBURO, "  if (!(await erisimKaydet(supabase, b, 'okuma', 'hasta-karti', hasta.id, simdi))) return null\n", "  await erisimKaydet(supabase, b, 'okuma', 'hasta-karti', hasta.id, simdi)\n"]]],
  ['record: approved notes are answered when their record row could not be written', [[PAYLASIM, "  if (!(await erisimKaydet(supabase, b, 'okuma', 'not-listesi', hasta.id, simdi))) return null\n", "  await erisimKaydet(supabase, b, 'okuma', 'not-listesi', hasta.id, simdi)\n"]]],
  ['record: the list is not bound to the doctor who asks', [[YETKI, ".select('id, kisi_id, alan_id, patient_id, tur, olay, ne, created_at').eq('doctor_id', hekimId)", ".select('id, kisi_id, alan_id, patient_id, tur, olay, ne, created_at')"]]],
  // ── WHAT THE FRONT DESK IS ANSWERED ──
  ['front desk: the patient is passed through instead of the five fields of the card', [[ONBURO, 'const kart = (h: Hasta): HastaKarti => ({ id: h.id, ad: h.ad, otaIsmi: h.otaIsmi, dogumTarihi: h.dogumTarihi, telefon: h.telefon })', 'const kart = (h: Hasta): HastaKarti => h as unknown as HastaKarti']]],
  ['front desk: the appointment is passed through (with its reason and its visit)', [[ONBURO, 'const randevu = (r: Randevu): OnBuroRandevusu => ({ id: r.id, hastaId: r.hastaId, hastaAdi: r.hastaAdi, baslangic: r.baslangic, bitis: r.bitis, gun: r.gun, saat: r.saat, sureDk: r.sureDk, durum: r.durum, mesaiDisi: r.mesaiDisi })', 'const randevu = (r: Randevu): OnBuroRandevusu => r as unknown as OnBuroRandevusu']]],
  ['front desk: the search runs over the whole patient (an identity number can be tested for)', [[ONBURO, '  const hepsi = await hastalariListele(supabase, hekimId)\n  if (!hepsi) return { tamam: false, kod: \'BASARISIZ\' }\n  const katla', '  const hepsi = await hastalariListele(supabase, hekimId, aranan)\n  if (!hepsi) return { tamam: false, kod: \'BASARISIZ\' }\n  if (hepsi) return { tamam: true, hastalar: hepsi.map(kart).slice(0, ARAMA_SONUC_AZAMI) }\n  const katla']]],
  ['front desk: an identity number typed at the desk is stored', [[ONBURO, "telefon: g.telefon, dil: g.dil, ulusalKimlik: '' }", "telefon: g.telefon, dil: g.dil, ulusalKimlik: String((g as unknown as { ulusalKimlik?: string }).ulusalKimlik ?? '99') }"]]],
  ['front desk: may set an appointment to "done"', [[ONBURO, "  if ('durum' in d && !ON_BURO_DURUMLARI.includes(d.durum)) return { tamam: false, kod: 'GECIS_YOK' }\n", '']]],
  ['front desk: the card is answered without the appointments capability', [[ONBURO, "  const b = await yetkiBul(supabase, benId, hekimId, 'on-buro-randevu', null, simdi)\n  if (!b) return null\n  // ISOLATION: the patient must be THAT DOCTOR's — proven before the record names them and before anything is answered.", "  const b = (await yetkiBul(supabase, benId, hekimId, 'on-buro-randevu', null, simdi)) ?? (await yetkiBul(supabase, benId, hekimId, 'on-buro-hasta', null, simdi))\n  if (!b) return null\n  // ISOLATION: the patient must be THAT DOCTOR's — proven before the record names them and before anything is answered."]]],
  // ── THE CLINIC'S SCHEDULE, INVITATIONS, ON BEHALF ──
  ["schedule: any member sees the clinic's schedule", [[ONBURO, '  if (!ben || !yoneticiMi(ben.konum)) return null\n  const { data: uyeler }', '  if (!ben) return null\n  const { data: uyeler }']]],
  ['invitations: any member withdraws an invitation', [[KLINIK, "  if (!u || !yoneticiMi(u.konum)) return ret('NOT_FOUND')\n", "  if (!u) return ret('NOT_FOUND')\n"]]],
  ["invitations: an invitation of ANOTHER clinic is withdrawn by its id", [[KLINIK, ".eq('id', davetId).eq('klinik_id', u.klinikId).is('kullanildi_at', null)", ".eq('id', davetId).is('kullanildi_at', null)"]]],
  ['invitations: any member lists the invitations', [[KLINIK, '  if (!u || !yoneticiMi(u.konum)) return null\n', '  if (!u) return null\n']]],
  ["on behalf: the clinic's owner enters a grant for a doctor although the pack says no", [[YETKI, "  if (hekimId !== kaydedenId && ayar.sahipHekimAdinaVerebilir !== true) return ret('YETKI_YOK')\n", '']]],
  ['giving: a capability the pack has not switched on can be given', [[YETKI, "  if (!ayar.yetkiTurleri.includes(tur)) return ret('TUR_KAPALI')\n", '']]],
  ['giving: the role of the member a grant is for is not looked at', [[YETKI, "  if (!rolUygun(tur, await hekimRolunuOku(supabase, g.alanId))) return ret('ROL')\n", '']]],
  ['giving: cover may be longer than the pack allows', [[YETKI, ' || g.bitisGun >= gunEkle(ilk, azami)) return ret', ') return ret']]],
  // ── A SHARE AND COVER ──
  ['share / cover: a note that is NOT APPROVED is answered', [[PAYLASIM, ".filter((x) => x.durum === 'onayli' && x.notId)", '.filter((x) => x.notId)'], [PAYLASIM, 'if (!n || !n.onayli || !n.onayTarihi || n.muayene.hasta?.id !== hasta.id) continue', 'if (!n || n.muayene.hasta?.id !== hasta.id) continue']]],
  ['share / cover: the note is passed through (with its visit and transcript)', [[PAYLASIM, "    notlar.push({ notId: n.notId, muayeneTarihi: n.muayene.baslangic, onayTarihi: n.onayTarihi, dil: n.dil, sablon: n.muayene.sablon, icerik: { s: n.icerik.s, o: n.icerik.o, a: n.icerik.a, p: n.icerik.p, ...(n.icerik.alanlar ? { alanlar: n.icerik.alanlar } : {}) }, alanAnahtarlari: [...n.alanAnahtarlari] })", '    notlar.push(n as unknown as PaylasilanNot)']]],
  ['share: a share reads through the path of cover (any patient of the doctor)', [[PAYLASIM, "?? (await yetkiBul(supabase, benId, hekimId, 'vekalet', null, simdi))", "?? (await yetkiBul(supabase, benId, hekimId, 'vekalet', null, simdi)) ?? (await paylasimVarMi(supabase, benId, hekimId, simdi))"], [PAYLASIM, '/** Who a patient is, for a reader through a grant.', "const paylasimVarMi = async (supabase: SupabaseClient, benId: string, hekimId: string, simdi: number): Promise<YetkiBaglami | null> => { const y = (await alinanYetkiler(supabase, benId, simdi)).find((x) => x.hekimId === hekimId && x.tur === 'paylasim'); return y ? yetkiBul(supabase, benId, hekimId, 'paylasim', y.hastaId, simdi) : null }\n/** Who a patient is, for a reader through a grant."]]],
  // ── THE COUNTRY ──
  ['country: a select is not bound to the build\'s country', [['lib/ulke/uygulama/tablolar.ts', "select: (kolonlar: string) => supabase.from(ad).select(kolonlar as '*').eq(ULKE_KOLONU, ulke),", "select: (kolonlar: string) => supabase.from(ad).select(kolonlar as '*'),"]]],
  ['country: an update is not bound to the build\'s country', [['lib/ulke/uygulama/tablolar.ts', 'update: (degerler: Satir) => supabase.from(ad).update(damgasiz(degerler)).eq(ULKE_KOLONU, ulke),', 'update: (degerler: Satir) => supabase.from(ad).update(damgasiz(degerler)),']]],
  ['country: a session stamped with another country is accepted', [['lib/ulke/sunucuOturum.ts', '  if (!hesapBuUlkedeMi(data.user)) return null\n', '']]],
]

const oku = (f) => readFileSync(join(KOK, f), 'utf8')
/** The files of a mutant with its replacements applied, or an error naming the target that is not there exactly once. */
export function uygula(degisiklikler, okuyucu = oku) {
  const dosyalar = new Map()
  for (const [dosya, bul, koy] of degisiklikler) {
    const metin = dosyalar.get(dosya) ?? okuyucu(dosya)
    const adet = metin.split(bul).length - 1
    if (adet !== 1) throw new Error(`${dosya}: the target occurs ${adet} time(s), not once: ${bul.slice(0, 90)}`)
    dosyalar.set(dosya, metin.replace(bul, () => koy))
  }
  return dosyalar
}

const dogrudan = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (dogrudan) {
  const argv = process.argv.slice(2)
  const ulke = argv.includes('--ulke') ? argv[argv.indexOf('--ulke') + 1] : 'uz'
  if (argv.includes('--liste')) { for (const [ad, d] of MUTANTLAR) console.log(`${ad}\n    ${[...new Set(d.map((x) => x[0]))].join(', ')}`); process.exit(0) }
  const kos = () => spawnSync('npx', ['--yes', 'tsx', '--experimental-test-module-mocks', '--test', TEST], { cwd: KOK, env: { ...process.env, NOTYA_COUNTRY: ulke }, encoding: 'utf8' })
  const asillar = new Map([...new Set(MUTANTLAR.flatMap(([, d]) => d.map((x) => x[0])))].map((f) => [f, oku(f)]))
  const geriKoy = () => { for (const [f, m] of asillar) if (oku(f) !== m) writeFileSync(join(KOK, f), m) }
  for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { geriKoy(); process.exit(130) })
  let hata = 0
  try {
    const temiz = kos()
    if (temiz.status !== 0) { console.error('the unchanged code does not pass: nothing can be concluded from a mutant\n' + (temiz.stdout ?? '').split('\n').filter((l) => /not ok/.test(l)).slice(0, 10).join('\n')); process.exit(1) }
    console.log(`ok   the unchanged code passes (${/# pass (\d+)/.exec(temiz.stdout)?.[1]} tests, NOTYA_COUNTRY=${ulke})`)
    for (const [ad, degisiklikler] of MUTANTLAR) {
      let dosyalar
      try { dosyalar = uygula(degisiklikler) } catch (e) { console.log(`FAIL ${ad} — ${e.message}`); hata++; continue }
      try {
        for (const [f, m] of dosyalar) writeFileSync(join(KOK, f), m)
        const r = kos()
        const kirilan = Number(/# fail (\d+)/.exec(r.stdout ?? '')?.[1] ?? 0)
        if (r.status !== 0) console.log(`ok   killed (${kirilan} test(s) fail): ${ad}`)
        else { console.log(`FAIL SURVIVED — no test noticed: ${ad}`); hata++ }
      } finally { geriKoy() }
    }
  } finally { geriKoy() }
  const degisen = [...asillar].filter(([f, m]) => oku(f) !== m).map(([f]) => f)
  if (degisen.length) { console.error(`NOT RESTORED: ${degisen.join(', ')}`); process.exit(2) }
  console.log(hata ? `\n${hata} MUTANT(S) NOT KILLED` : `\nALL ${MUTANTLAR.length} MUTANTS KILLED; every file is as it was`)
  process.exit(hata ? 1 : 0)
}
