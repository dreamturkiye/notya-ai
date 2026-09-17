/**
 * QA doğrulaması (repoya GİRMEZ): gerçek POST /api/intake/[token] route handler'ını,
 * PostgREST'i fetch seviyesinde taklit ederek çalıştırır. Sentetik hasta — PHI YOK.
 */
process.env.ENCRYPTION_MASTER_KEY = 'qa-synthetic-master-key-not-production'
process.env.ENCRYPTION_SALT = 'qa-synthetic-salt'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://qa.example.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'qa-service-role'

import { createHash } from 'crypto'

const TOKEN = 'qa-sentetik-token-123'
const tokenHash = createHash('sha256').update(TOKEN).digest('hex')

const yazilanlar: Record<string, unknown>[] = []
const gercekFetch = globalThis.fetch

globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url)
  const method = (init.method || 'GET').toUpperCase()
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

  if (url.pathname.endsWith('/hasta_intake_formlari')) {
    if (method === 'GET') {
      const eslesme = url.searchParams.get('token_hash') === `eq.${tokenHash}`
      return json(eslesme ? [{ id: 'form-1', durum: 'gonderildi', token_expires_at: null, patient_id: 'hasta-1', brans: 'dahiliye' }] : [])
    }
    if (method === 'PATCH') { yazilanlar.push({ tablo: 'hasta_intake_formlari', govde: JSON.parse(String(init.body)) }); return json([]) }
  }
  if (url.pathname.endsWith('/patients')) {
    if (method === 'GET') return json([{ dob_encrypted: null, gender_encrypted: null, email_encrypted: null, notes_encrypted: null }])
    if (method === 'PATCH') { yazilanlar.push({ tablo: 'patients', govde: JSON.parse(String(init.body)) }); return json([]) }
  }
  throw new Error(`beklenmeyen istek: ${method} ${url.pathname}`)
}) as typeof fetch

const { POST } = await import('../app/api/intake/[token]/route.ts')
const { decrypt } = await import('../lib/security/encryption.ts')

// SENTETİK QA hastası — üç sigorta alanı ve "Yok" ipuçlu diğer alanlar BİLEREK boş.
const yanitlar: Record<string, unknown> = {
  tcKimlik: '12345678901', ad: 'Sentetik', soyad: 'Testhasta', dogumTarihi: '1985-04-12', cinsiyet: 'Kadın',
  dogumYeri: 'Ankara', babaAdi: 'Sentetik', anneAdi: 'Sentetik', medeniDurum: 'Evli',
  telefon: '05551112233', eposta: 'qa@example.test', adres: 'Sentetik Mah. 1. Sok. No:1', il: 'Ankara',
  acilKisiAdi: 'Sentetik Yakın', acilKisiTelefon: '05554445566', acilKisiYakinlik: 'eş',
  sigortaTuru: 'SGK',
  sigortaSirketi: '',        // ← BOŞ (eskiden zorunluydu)
  policeNo: '',              // ← BOŞ
  kurumAdi: '',              // ← BOŞ
  kanGrubu: 'A Rh+', kronikHastaliklar: ['Yok'],
  gecirilmisAmeliyatlar: '', // ← BOŞ ("yoksa Yok yazın" ipuçlu)
  kullaniyorMu: 'Hayır', kullanilanIlaclar: '', // ← BOŞ
  alerjiVarMi: 'Bilinen alerjisi yok', aileOykusu: 'Bilinen ciddi hastalık yok',
  sigara: 'Kullanmıyorum', alkol: 'Kullanmıyorum',
  dogruBeyan: 'Beyan ediyorum', kvkkOnay: 'Kabul ediyorum',
}

const req = new Request(`https://qa.example.test/api/intake/${TOKEN}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ yanitlar }),
})
const res = await POST(req as any, { params: { token: TOKEN } })
const govde = await res.json()
console.log('HTTP', res.status, JSON.stringify(govde))
if (res.status !== 200 || !govde.basarili) { console.error('❌ Form boş sigorta alanlarıyla GÖNDERİLEMEDİ'); process.exit(1) }

const kayit = yazilanlar.find((y) => y.tablo === 'hasta_intake_formlari') as any
const kaydedilen = JSON.parse(decrypt(kayit.govde.form_data_encrypted))
console.log('kaydedilen durum:', kayit.govde.durum)
console.log('kaydedilen sigortaSirketi/policeNo/kurumAdi:', JSON.stringify([kaydedilen.sigortaSirketi, kaydedilen.policeNo, kaydedilen.kurumAdi]))
const hastaYazma = yazilanlar.find((y) => y.tablo === 'patients') as any
console.log('hasta kaydına aktarım (downstream) çalıştı:', !!hastaYazma)
if (hastaYazma) {
  const n = JSON.parse(decrypt(hastaYazma.govde.notes_encrypted))
  console.log('hasta notları:', JSON.stringify(n))
}

// Karşı kontrol: gerçekten zorunlu bir alan boşsa hâlâ 400 dönmeli.
const res2 = await POST(new Request(`https://qa.example.test/api/intake/${TOKEN}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ yanitlar: { ...yanitlar, ad: '' } }),
}) as any, { params: { token: TOKEN } })
console.log('karşı kontrol (ad boş) HTTP', res2.status, JSON.stringify(await res2.json()))
if (res2.status !== 400) { console.error('❌ Zorunlu alan kontrolü kayboldu'); process.exit(1) }

globalThis.fetch = gercekFetch
console.log('✅ QA: sigorta alanları boş bırakılarak form gönderildi; zorunlu alan koruması duruyor.')
