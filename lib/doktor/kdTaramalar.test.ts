/**
 * KD-TARAMA-01 — Türkiye build: wiring and leak gate of the four KD records.
 *   - LEAK GATE BOTH WAYS: present for Kadın Hastalıkları ve Doğum (every stored spelling), absent for every other one of
 *     the 30 branches, every Özel Branş, branch-less and pediatri (brans-alan-sizmasi); the screen mounts only behind
 *     `kdHekimi`, the doctor route answers 403 to a non-KD doctor, the portal diary opens only for a KD token.
 *   - NO DOSE, NO PEDIATRI CONSENT: none of the new files proposes an amount or reaches the Pediatri Dijital Aşı Onam system.
 *   - SERVER: records validated by the shared engine; foreign patient / diary ids are null (404); diary days upsert.
 * Synthetic QA data only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'

process.env.ENCRYPTION_MASTER_KEY ||= 'test-master-key-notya-kd-tarama'
const KOK = join(__dirname, '..', '..')
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8')
const YENI = [
  'lib/clinical/kdTaramalar.ts', 'lib/doktor/kdTaramaSunucu.ts', 'app/api/doktor/kd-tarama/route.ts', 'app/api/portal/hasta/[token]/kd-gunluk/route.ts',
  'app/portal/hasta/[token]/semptom-gunlugu/page.tsx', 'specialties/kadin-dogum/ui/KdTaramalar.tsx', 'specialties/kadin-dogum/protocols/kd-taramalar-tr.ts', 'specialties/kadin-dogum/engines/kdTaramaMetinleri.ts',
]

type Satir = Record<string, any>
function sahteSb(t: Record<string, Satir[]>) {
  const from = (ad: string) => {
    t[ad] ||= []
    const f: ((r: Satir) => boolean)[] = []
    let yaz: Satir | null = null, guncelle: Satir | null = null
    const sonuc = () => t[ad].filter((r) => f.every((g) => g(r)))
    const b: any = {
      select: () => b, order: () => b, limit: () => b,
      eq: (k: string, v: unknown) => { f.push((r) => r[k] === v); return b },
      gte: (k: string, v: any) => { f.push((r) => r[k] >= v); return b },
      insert: (r: Satir) => { yaz = { id: `${ad}-${t[ad].length + 1}`, created_at: '2026-11-09T10:00:00Z', ...r }; t[ad].push(yaz); return b },
      upsert: (r: Satir) => { const i = t[ad].findIndex((x) => x.gunluk_id === r.gunluk_id && x.tarih === r.tarih); if (i >= 0) t[ad][i] = { ...t[ad][i], ...r }; else t[ad].push({ id: `${ad}-${t[ad].length + 1}`, ...r }); return b },
      update: (r: Satir) => { guncelle = r; return b },
      maybeSingle: async () => ({ data: sonuc()[0] ?? null, error: null }),
      single: async () => ({ data: yaz ?? sonuc()[0] ?? null, error: null }),
      then: (ok: any, no: any) => { if (guncelle) for (const r of sonuc()) Object.assign(r, guncelle); return Promise.resolve({ data: yaz ? [yaz] : sonuc(), error: null }).then(ok, no) },
    }
    return b
  }
  return { from } as unknown as SupabaseClient
}

describe('KD-TARAMA-01 leak gate', () => {
  it('KD (every stored spelling) only: the other 29 branches, every Özel Branş, pediatri and branch-less see nothing', async () => {
    const { kdTaramaBransi } = await import('./kdTaramaSunucu')
    for (const k of ['kadin-dogum', 'kadin-hastaliklari-dogum', 'Kadın Hastalıkları ve Doğum', 'jinekoloji', 'perinatoloji']) assert.equal(kdTaramaBransi(k), true, k)
    const { BRANS_ETIKETLERI } = await import('@/lib/intake/bransSorulari')
    const { KLINIK_YENI_SLUGS } = await import('@/lib/specialties/klinikDikey')
    const digerleri = Object.keys(BRANS_ETIKETLERI).filter((k) => k !== 'kadin-hastaliklari-dogum')
    assert.ok(digerleri.length >= 29)
    for (const k of [...digerleri, ...KLINIK_YENI_SLUGS, 'pediatri', 'dahiliye', 'goz-hastaliklari', 'dermatoloji', 'aile-hekimligi', null, '', 'genel']) assert.equal(kdTaramaBransi(k as string), false, String(k))
  })
  it('the screen mounts only behind the KD boolean (aile hekimliği shares the section and does not get it)', () => {
    const g = oku('components/doktor/HastaGebelik.tsx')
    assert.match(g, /\{kdHekimi && <KdTaramalar patientId=\{patientId\} \/>\}/)
    assert.equal((g.match(/<KdTaramalar/g) || []).length, 1)
    assert.match(g, /const kdHekimi = kadinDogumBransi\(doktorBransi\)/)
    assert.match(g, /dinamikYukle\(\(\) => import\('@\/specialties\/kadin-dogum\/ui\/KdTaramalar'\)/)
  })
  it('the doctor route asks the doctor\'s own branch before anything else and answers 403 otherwise', () => {
    const r = oku('app/api/doktor/kd-tarama/route.ts')
    assert.match(r, /if \(!kdTaramaBransi\(await doktorBransi\(oturum\.supabase, oturum\.doktorId\)\)\) return \{ hata: yanit\(\{ error: HATA\.kd_degil, kod: 'kd_degil' \}, 403\) \}/)
    for (const yontem of ['GET', 'POST']) assert.match(r, new RegExp(`export async function ${yontem}\\(req: NextRequest\\) \\{\\n  const k = await kapi\\(req\\)\\n  if \\('hata' in k\\) return k\\.hata`))
    assert.match(r, /sadeceDoktor\(oturum\)/)
  })
  it('the portal diary opens only for a KD doctor\'s token with an open diary; other modules never link it', () => {
    const p = oku('app/api/portal/hasta/[token]/kd-gunluk/route.ts')
    assert.match(p, /const kd = kdTaramaBransi\(await hekimBransi\(client, tok\.doctor_id\)\)/)
    assert.match(p, /const gunluk = kd \? await acikGunluk\(client, tok\.doctor_id, tok\.patient_id\) : null/)
    assert.match(p, /requirePortalUnlock\(req, token, tok\)/)
    const takip = oku('app/portal/hasta/[token]/takip/page.tsx')
    assert.match(takip, /const jineModulu = portalModulAktif\(data, 'jinekoloji'\)/)
  })
  it('the jinekoloji portal module itself stays KD (or a baseline doctor with KD chart data): never dahiliye, göz, pediatri', async () => {
    const { portalModulleri } = await import('@/lib/portal/moduller')
    const g = (b: string) => portalModulleri({ doktorBransi: b, hastaYasYil: 30, gebelikAktif: false, kdKaydi: false, buyumeOlcumu: false, dahiliyeKaydi: false }).moduller.includes('jinekoloji')
    assert.equal(g('kadin-dogum'), true)
    for (const b of ['dahiliye', 'goz-hastaliklari', 'pediatri', 'kardiyoloji', 'dermatoloji']) assert.equal(g(b), false, b)
  })
})

describe('KD-TARAMA-01 no dose, no Pediatri consent system, sourced', () => {
  it('no new file proposes an amount or imports the Pediatri Dijital Aşı Onam code', () => {
    for (const p of YENI) {
      const s = oku(p)
      assert.ok(!/\b\d+(?:[.,]\d+)?\s?(?:mcg|µg|mikrogram|mg\/gün|mg\/day)\b/i.test(s), `${p}: a dose`)
      assert.ok(!/lib\/asi\/onam|asiOnam|AsiOnam/.test(s), `${p}: Pediatri aşı onam`)
    }
  })
  it('every Türkiye number in the rule file names its source on the same line', () => {
    const s = oku('specialties/kadin-dogum/protocols/kd-taramalar-tr.ts')
    const kural = s.slice(s.indexOf('export const TR_TIROID_KURALI'), s.indexOf('export const TR_HPV_KURALI'))
    for (const satir of kural.split('\n').filter((l) => /^\s+\w+: (?:\d|\[\[)/.test(l))) assert.match(satir, /\/\/ (?:ATA|TEMD|1\. trimesterin)/, satir)
    assert.match(s, /saglik\.gov\.tr\/TR-99556/); assert.match(s, /SB_ASI_2020/); assert.match(s, /© pending, Jean Endicott/)
  })
  it('the HPV due line no longer claims an unverified national position', () => {
    const s = oku('specialties/kadin-dogum/engines/jinekoloji-spine.ts')
    assert.ok(!/ulusal programa tam alınmadı/.test(s))
    assert.match(s, /T\.C\. SB 2020 çocukluk dönemi takviminde HPV yok/)
  })
})

describe('KD-TARAMA-01 server (in-memory, synthetic)', () => {
  const A = 'dr-a', B = 'dr-b', HA = 'hasta-a', HB = 'hasta-b'
  const tablolar = () => ({ patients: [{ id: HA, doctor_id: A, dob_encrypted: null }, { id: HB, doctor_id: B, dob_encrypted: null }], gebelikler: [{ id: 'g-a', patient_id: HA, doctor_id: A, durum: 'aktif', sat: null, tdt: null, created_at: '2026-09-01' }], kd_tarama_kayitlari: [] as Satir[], kd_semptom_gunlugu: [] as Satir[], serviks_taramalari: [] as Satir[] })
  it('validates with the engine; binds thyroid records to the active pregnancy; refuses a foreign patient', async () => {
    const { kayitEkle } = await import('./kdTaramaSunucu')
    const t = tablolar(); const sb = sahteSb(t)
    const r = await kayitEkle(sb, A, HA, 'tiroid_olcum', { tarih: '2026-11-01', hafta: 10, tsh: 4.4 })
    assert.ok(r.ok && r.kayit.gebelik_id === 'g-a')
    assert.deepEqual(await kayitEkle(sb, A, HB, 'tiroid_olcum', { hafta: 10, tsh: 1 }), { ok: false, status: 404, hata: 'bulunamadi' })
    assert.deepEqual(await kayitEkle(sb, A, HA, 'tiroid_olcum', { hafta: 10 }), { ok: false, status: 422, hata: 'deger_yok' })
    assert.deepEqual(await kayitEkle(sb, A, HA, 'lt4_not', { metin: '' }), { ok: false, status: 422, hata: 'lt4_bos' })
    assert.deepEqual(await kayitEkle(sb, A, HA, 'sma', { durum: 'teklif_edildi', sonuc: 'tasiyici' }), { ok: false, status: 422, hata: 'sma_sonuc_yalniz_yapildi' })
    assert.deepEqual(await kayitEkle(sb, A, HA, 'nope', {}), { ok: false, status: 422, hata: 'tur' })
  })
  it('the summary flags TSH with the Türkiye rule and shows the TEMD booking prompt until a TSH exists', async () => {
    const { kayitEkle, ozetGetir } = await import('./kdTaramaSunucu')
    const t = tablolar(); const sb = sahteSb(t)
    const once = await ozetGetir(sb, A, HA)
    assert.equal(once?.tiroid.tarama.neden, 'evrensel')
    await kayitEkle(sb, A, HA, 'tiroid_olcum', { tarih: '2026-11-01', hafta: 10, tsh: 4.4 })
    const o = await ozetGetir(sb, A, HA)
    assert.equal(o?.tiroid.tarama.goster, false)
    assert.deepEqual([o?.tiroid.olcumler[0].degerlendirme.tsh.kaynak, o?.tiroid.olcumler[0].degerlendirme.tsh.bayrak], ['yedek_sabit', 'yuksek'])
    assert.equal(await ozetGetir(sb, A, HB), null)
  })
  it('diary: opened by the doctor, days upsert once per date, a closed or foreign diary is refused', async () => {
    const { kayitEkle, gunlukGunuYaz, gunlukKapat, acikGunluk } = await import('./kdTaramaSunucu')
    const t = tablolar(); const sb = sahteSb(t)
    const g = await kayitEkle(sb, A, HA, 'pmdd_gunluk', {})
    assert.ok(g.ok)
    const id = (g as { kayit: { id: string } }).kayit.id
    assert.deepEqual(await acikGunluk(sb, A, HA), { id })
    assert.equal(await acikGunluk(sb, B, HA), null)
    assert.deepEqual(await gunlukGunuYaz(sb, { doktorId: A, patientId: HA, gunlukId: id, gun: { tarih: '2026-11-01', adet: false, puan: { b1: 4 } }, kaynak: 'portal' }), { ok: true })
    await gunlukGunuYaz(sb, { doktorId: A, patientId: HA, gunlukId: id, gun: { tarih: '2026-11-01', adet: true, puan: { b1: 5 } }, kaynak: 'portal' })
    assert.equal(t.kd_semptom_gunlugu.length, 1); assert.equal(t.kd_semptom_gunlugu[0].puan.b1, 5)
    assert.equal((await gunlukGunuYaz(sb, { doktorId: B, patientId: HB, gunlukId: id, gun: { tarih: '2026-11-01', puan: { b1: 1 } }, kaynak: 'klinik' }) as { status: number }).status, 404)
    assert.equal((await gunlukGunuYaz(sb, { doktorId: A, patientId: HA, gunlukId: id, gun: { tarih: '2026-11-01', puan: { b1: 9 } }, kaynak: 'klinik' }) as { hata: string }).hata, 'gun_puan')
    assert.equal(await gunlukKapat(sb, B, HB, id), false)
    assert.equal(await gunlukKapat(sb, A, HA, id), true)
    assert.equal(await acikGunluk(sb, A, HA), null)
    assert.equal((await gunlukGunuYaz(sb, { doktorId: A, patientId: HA, gunlukId: id, gun: { tarih: '2026-11-02', puan: { b1: 1 } }, kaynak: 'klinik' }) as { status: number }).status, 409)
  })
})
