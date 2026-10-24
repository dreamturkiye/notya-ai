/**
 * AU-LAUNCH-01 (2026-10-24) — guards for the launch-readiness fixes (docs/au/LAUNCH-READINESS.md). Each test names the
 * requirement of Kaan's regulatory brief it protects. Not a legal or regulatory finding.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AU_PAKETI } from './index'
import { AU_ARAYUZ } from './arayuz'
import { AU_GIRDI } from './ayarlar'
import { AU_YASAL } from './yasal'
import { AU_GIZLILIK } from './uzanti/gizlilik'
import { auAcilisGuncelle } from './uzanti/acilisEk'
import { AU_CANLI_ASISTAN, AU_ASISTAN_DEGISKENI } from './asistan/canli'
import { canliAcikMi, canliAjanlarVar } from '@/lib/ulke/asistan/ajan'
import { seoMetni } from '@/lib/ulke/seo/metinler'
import { DISA_AKTARMADA_YOK, disaAktarmaOlustur } from '@/lib/ulke/gizlilik/disaAktar'

const KOK = join(__dirname, '..', '..')
const oku = (p: string): string => readFileSync(join(KOK, p), 'utf8')

/** Phrases the brief forbids in marketing and product copy (regulatory approval, replacing judgement, validation). */
const YASAK = [
  /\bAI doctor\b/i, /\bdoctor[- ]replac/i, /\breplaces? (the |your )?(doctor|clinician|practitioner|judge?ment)/i,
  /\b(approved|endorsed|certified|registered|cleared) by (the )?(Ahpra|TGA|Medical Board)/i, /\b(Ahpra|TGA)[- ](approved|endorsed|certified|registered|cleared)\b/i,
  /\bclinically (validated|proven|tested)\b/i, /\bFDA[- ]?(cleared|approved)\b/i, /\bHIPAA[- ]compliant\b/i, /\b100% accurate\b/i,
]

function metinler(x: unknown, cikti: string[] = []): string[] {
  if (typeof x === 'string') cikti.push(x)
  else if (Array.isArray(x)) for (const y of x) metinler(y, cikti)
  else if (x && typeof x === 'object') for (const y of Object.values(x as Record<string, unknown>)) metinler(y, cikti)
  return cikti
}

describe('AU launch: TGA boundary (brief item 2)', () => {
  it('image / document reading by the model is NOT switched on for Australia', () => {
    assert.equal((AU_PAKETI.ozellikler as Record<string, unknown>).goruntuDegerlendirme, undefined)
  })
  it('the routes and screens that read images check that feature', () => {
    for (const p of ['app/api/ulke/belge-degerlendir/route.ulke.ts', 'app/api/ulke/not/belge/route.ulke.ts']) assert.match(oku(p), /ozellikAcik\('goruntuDegerlendirme'\)/, p)
    assert.match(oku('app/api/ulke/not/route.ulke.ts'), /ozellikAcik\('goruntuDegerlendirme'\) \? g\.ekler : undefined/)
    assert.match(oku('components/ulke/uygulama/Muayene.tsx'), /ozellikAcik\('goruntuDegerlendirme'\) \? '&ekler=1'/)
    assert.match(oku('components/ulke/uygulama/Not.tsx'), /ozellikAcik\('goruntuDegerlendirme'\) \? \(\s*<EklerNotKarti/)
  })
  it('the clinical Q&A assistant is opt-in: off unless the environment switch is set', () => {
    assert.equal(AU_CANLI_ASISTAN.acikDegiskeni, AU_ASISTAN_DEGISKENI)
    assert.equal(canliAcikMi(AU_CANLI_ASISTAN, {}), false)
    assert.equal(canliAcikMi(AU_CANLI_ASISTAN, { [AU_ASISTAN_DEGISKENI]: '0' }), false)
    assert.equal(canliAcikMi(AU_CANLI_ASISTAN, { [AU_ASISTAN_DEGISKENI]: '1' }), true)
    assert.equal(canliAjanlarVar('au', {}, AU_ASISTAN_DEGISKENI), false)
  })
  it('the assistant prompt no longer calculates a dose for a patient', () => {
    const t = oku('lib/ulke/asistan/istem.ts')
    assert.ok(!/show the working/i.test(t))
    assert.match(t, /Do not calculate a dose for a particular patient/)
  })
  it('the note instruction forbids a diagnosis the clinician did not state, and advice', () => {
    const t = oku('countries/_dil/en/klinik/talimatlar.ts')
    assert.match(t, /Make no diagnosis the doctor did not state/)
    assert.match(t, /no advice that was not spoken/)
  })
})

describe('AU launch: consent for recording and AI processing (brief items 1 and 3)', () => {
  it('the recording consent names AI processing, overseas services, review and lawful recording', () => {
    const s = AU_GIRDI.sozler.kayitRizasi
    assert.match(s, /artificial intelligence/i)
    assert.match(s, /outside Australia/i)
    assert.match(s, /read and approve/i)
    assert.match(s, /lawful where this visit takes place/i)
  })
  it('the collection notice has an AI section that says the practitioner approves, and the overseas section names the unverified retention', () => {
    const t = JSON.stringify(AU_GIZLILIK.bildirim)
    assert.match(t, /Artificial intelligence/)
    assert.match(t, /must read it, correct it and approve it/)
    assert.match(t, /has not been verified|have not been verified/)
    assert.match(t, /deleted from Notya.s storage once it has been transcribed/)
  })
  it('an approved note shows its AI provenance, and the draft says it is not yet part of the record', () => {
    const k = oku('countries/_dil/en/uygulama.ts')
    assert.match(k, /not part of the patient record, until you have read it/)
    assert.match(k, /onayliKaynak: 'Drafted by artificial intelligence/)
  })
})

describe('AU launch: marketing discipline and intended purpose (brief item 4)', () => {
  it('no forbidden claim in the landing, the policies, the SEO texts or the consent words', () => {
    const kok = AU_ARAYUZ.acilis!.icerik['en-AU']!
    const hepsi = [...metinler(auAcilisGuncelle(kok, 44)), ...metinler(AU_YASAL), ...metinler(AU_GIZLILIK), ...metinler(AU_GIRDI.sozler)]
    for (const s of ['home', 'forClinics', 'catalogue', 'privacy', 'terms', 'cookies', 'data-request', 'accessibility', 'medical', 'security', 'refund', 'copyright'] as const) hepsi.push(JSON.stringify(seoMetni('au', s)))
    // A denial ("does not replace the practitioner's clinical judgement") is not a claim: only an un-negated match fails.
    const olumsuz = /\b(not|no|nor|never|cannot|without)\b[^.]{0,40}$/i
    for (const t of hepsi) for (const re of YASAK) {
      const g = new RegExp(re.source, 'gi')
      for (let m = g.exec(t); m; m = g.exec(t)) assert.ok(olumsuz.test(t.slice(0, m.index)), `${re}: ${t.slice(Math.max(0, m.index - 60), m.index + 60)}`)
    }
  })
  it('every use of the word "diagnos…" on the landing and in the medical disclaimer is a denial', () => {
    const kok = AU_ARAYUZ.acilis!.icerik['en-AU']!
    const hepsi = [...metinler(auAcilisGuncelle(kok, 44)), ...metinler(AU_YASAL.diller[0])]
    for (const t of hepsi) if (/diagnos/i.test(t)) assert.match(t, /\b(not|no|nor|never|without|remain|remains|stay|stays|belong|belongs|decide|decides)\b/i, t.slice(0, 160))
  })
  it('the medical disclaimer opens with an intended-purpose statement and the landing hero carries one', () => {
    const med = AU_YASAL.diller[0].belgeler.find((b) => b.anahtar === 'medical')!
    assert.equal(med.bolumler[0].baslik, 'Intended purpose')
    assert.match(med.bolumler[0].paragraflar[0], /assists registered practitioners with documentation/)
    assert.match(med.bolumler[0].paragraflar[0], /does not replace the practitioner.s clinical judgement/)
    const hero = auAcilisGuncelle(AU_ARAYUZ.acilis!.icerik['en-AU']!, 44).kahraman.giris
    assert.match(hero, /assists with documentation/)
    assert.match(hero, /does not diagnose or suggest treatment/)
  })
  it('the landing no longer advertises the reading of images and scans', () => {
    const t = JSON.stringify(auAcilisGuncelle(AU_ARAYUZ.acilis!.icerik['en-AU']!, 44))
    assert.ok(!/ultrasound images|scans, lab reports|Documents added after the recording|they are read with the visit/.test(t))
  })
})

describe('AU launch: APP 12 export and the response to the patient (AU-MKT-06)', () => {
  const hasta = { id: 'h1', ad: 'Test Person', otaIsmi: '', dogumTarihi: '1990-01-02', cinsiyet: 'female' as const, telefon: '+61 400 000 000', dil: 'en', ulusalKimlik: '', olusturuldu: '2026-10-01T00:00:00Z' }
  it('builds one document and states what it does not carry', () => {
    const d = disaAktarmaOlustur({
      hasta,
      vizitler: [{ visitId: 'v1', startedAt: '2026-10-02T01:00:00Z', transcript: 'x', note: { noteId: 'n1', status: 'draft', approvedAt: null, language: 'en-AU', content: { s: 'a', o: '', a: '', p: '' }, addendum: '' } }],
      randevular: [{ baslangic: 'b', bitis: 'e', tur: 'muayene', durum: 'planlandi', neden: '' }],
      rizalar: [{ surum: 'v', kaynak: 'portal', verildiAt: 't', geriCekildiAt: null }],
      talepler: [{ tur: 'erisim', durum: 'yeni', alindiAt: 'a', sonTarih: 's', ayrinti: '', yanit: '', yanitlandiAt: null }],
      simdi: Date.UTC(2026, 9, 24),
    })
    assert.equal(d.generatedAt, '2026-10-24T00:00:00.000Z')
    assert.deepEqual(d.notIncluded, DISA_AKTARMADA_YOK)
    assert.equal(d.visits[0].note?.status, 'draft')
    assert.equal(d.patient.ad, 'Test Person')
    assert.equal(d.consents[0].withdrawnAt, null)
  })
  it('the route is doctor-only and reads the patient with the doctor id', () => {
    const r = oku('app/api/ulke/gizlilik/disa-aktar/route.ulke.ts')
    assert.match(r, /ulkeOturum/)
    assert.match(r, /hastaVerisi\(oturum\.supabase, oturum\.user\.id, hastaId\)/)
    assert.match(oku('lib/ulke/gizlilik/disaAktar.ts'), /hastaGetir\(supabase, doktorId, hastaId\)/)
  })
  it('the patient sees the practitioner\'s response only after the request is closed', () => {
    const r = oku('app/api/ulke/portal/gizlilik/route.ulke.ts')
    assert.match(r, /durum === 'tamamlandi' \|\| t\.durum === 'reddedildi' \? t : \{ \.\.\.t, yanit: '' \}/)
    assert.match(oku('components/ulke/portal/GizlilikKarti.tsx'), /data-alan="talep-yanit"/)
    assert.match(AU_GIZLILIK.doktor.yanitIpucu, /patient reads this on their own page/)
  })
})
