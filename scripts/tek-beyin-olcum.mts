#!/usr/bin/env npx tsx
/**
 * NOTYA-TEK-BEYIN — gecikme ölçümü (Kaan: doktor geçmeden ÖNCE rakamlar).
 *
 * ~20 gerçek Türkçe soru, iki paralel konuşmada aynı sırayla:
 *   A) ortak fonksiyon, yazılı kanal (ayseCevapla kanal:'yazi' — bugünkü yazılı Ayşe)  → toplam süre
 *   B) Custom LLM SSE ucu (sesLlmPost — ElevenLabs'in çağıracağı handler, süreç içinde) → ilk parça (bekletme sözü),
 *      ilk GERÇEK cevap parçası, toplam
 * ve her soru için yazı / ses EKRAN cevabının uyuşup uyuşmadığı, sözlü biçimde kimlik değeri olup olmadığı.
 * Hedef: bekletme < 1 s, ilk gerçek cevap medyan < 2,5 s.
 *
 * Veri: yalnız qa.dahiliye@notya.ai sentetik QA hesabı (şifre .env.local QA_DAHILIYE_PASSWORD). Hasta adları rapora
 * yazılmaz ({H1}/{H2}). Oluşturulan asistan oturumları silinir, "Evet" ile yazılan kayıt eylem geri al ile geri alınır,
 * yazılı yoldaki taslak kart vazgeçilir. Gerçek model (Anthropic) ve gerçek veritabanı kullanılır; ElevenLabs ağ gidişi
 * (STT/TTS ve onların bize ulaşması) ölçüme dahil DEĞİLDİR.
 *
 *   npx tsx scripts/tek-beyin-olcum.mts   → smoke-out/tek-beyin-olcum.json + markdown tablo (stdout)
 */
import fs from 'fs'
import path from 'path'

for (const f of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), f)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
const { createClient } = await import('@supabase/supabase-js')
const { NextRequest } = await import('next/server')
const { ayseCevapla, asistanOturumuAc } = await import('../lib/asistan/ayseCevapla')
const { sesLlmPost } = await import('../lib/asistan/sesLlm')
const { sesJetonuImzala } = await import('../lib/asistan/sesJetonu')
const { kimlikDegeriVarMi, DOLGU_BAKIYORUM, DOLGU_KAYDEDIYORUM } = await import('../lib/asistan/konusma')
const { eylemGeriAl } = await import('../core/eylemler/geriAl')
const { eylemVazgec } = await import('../core/eylemler/onayla')
const sesEkran = await import('../app/api/asistan/ses-ekran/route')
const { decrypt } = await import('../lib/security/encryption')

const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
const { data: giris, error } = await anon.auth.signInWithPassword({ email: 'qa.dahiliye@notya.ai', password: process.env.QA_DAHILIYE_PASSWORD || '' })
if (error || !giris.session) throw new Error(`QA girişi: ${error?.message}`)
const doktorId = giris.user!.id
const token = giris.session.access_token
const supabase = sb()

// En çok notu olan iki sentetik hasta
const { data: hastalar } = await supabase.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).eq('is_active', true).limit(50)
const { data: notlar } = await supabase.from('notes').select('patient_id').eq('doctor_id', doktorId).limit(500)
const say = new Map<string, number>()
for (const n of (notlar || []) as { patient_id: string }[]) say.set(n.patient_id, (say.get(n.patient_id) || 0) + 1)
const adli = ((hastalar || []) as { id: string; name_encrypted: string }[]).map((h) => {
  let ad = ''
  try { const ham = decrypt(h.name_encrypted); try { ad = String(JSON.parse(ham).ad || '') } catch { ad = ham } } catch { /* */ }
  return { id: h.id, ad, n: say.get(h.id) || 0 }
}).filter((h) => h.ad.trim().split(/\s+/).length >= 2).sort((a, b) => b.n - a.n)
if (adli.length < 2) throw new Error('QA hesabında iki adlı hasta yok')
const [H1, H2] = adli

type Soru = { tur: string; metin: string; yaziYok?: boolean }
const SORULAR: Soru[] = [
  { tur: 'hasta özeti (uzun cümlede ad)', metin: 'Merhaba Ayşe, bugün {H1} kontrole geldi, son muayenesinde neler vardı, bir özetler misin?' },
  { tur: 'kimlik', metin: '{H1} hastasının telefon numarası ne?' },
  { tur: 'kimlik', metin: 'Peki doğum tarihi ne?' },
  { tur: 'dosya: son vizit', metin: 'En son ne zaman geldi?' },
  { tur: 'takip (aktif hasta)', metin: 'Alerjisi var mı?' },
  { tur: 'takip (aktif hasta)', metin: 'Sürekli kullandığı ilaçlar neler?' },
  { tur: 'antibiyotik geçmişi', metin: 'Bu hastaya en son hangi antibiyotiği yazdık?' },
  { tur: 'aşı durumu', metin: '{H1} için aşı durumu ne?' },
  { tur: 'takip (model)', metin: 'Bu hastada tansiyon takibini nasıl planlarsın, kısaca anlatır mısın?' },
  { tur: 'takip (model, ilaç etkileşimi)', metin: 'Bu hastaya amoksisilin başlasam sürekli ilaçlarıyla etkileşim olur mu?' },
  { tur: 'kohort', metin: 'Son bir ay içinde hangi antibiyotiği en fazla yazdım?' },
  { tur: 'kohort', metin: 'Kaç hastam var?' },
  { tur: 'kohort', metin: 'Bu hafta hangi hastalarım geldi?' },
  { tur: 'hasta değiştir', metin: '{H2} hastamın son tanısı neydi?' },
  { tur: 'takip (aktif hasta)', metin: 'Kaç kez geldi?' },
  { tur: 'takip (model)', metin: 'Son vizitine göre bir sonraki kontrolde nelere bakmamı önerirsin?' },
  { tur: 'eylem: ilaç ekle', metin: '{H2} için sürekli ilaç olarak D vitamini damla ekle, dozu 400 ünite, günde bir kez, dosyaya kaydet' },
  { tur: 'eylem: sözlü onay', metin: 'Evet', yaziYok: true },
  { tur: 'genel klinik (hastasız)', metin: 'Genel olarak, erişkinde toplum kökenli pnömonide hangi durumlarda yatış düşünülür, kısaca?' },
  { tur: 'sosyal', metin: 'Teşekkürler Ayşe' },
]
const doldur = (m: string) => m.replace('{H1}', H1.ad).replace('{H2}', H2.ad)
const gizle = (m: string) => m.split(H1.ad).join('{H1}').split(H2.ad).join('{H2}')

const specialty = 'dahiliye'
const oturumA = String((await asistanOturumuAc(supabase, { doktorId, specialty, hekimBransi: 'dahiliye' }))?.id)
const oturumB = String((await asistanOturumuAc(supabase, { doktorId, specialty, hekimBransi: 'dahiliye' }))?.id)
const jeton = sesJetonuImzala({ d: doktorId, o: oturumB, s: specialty, p: null, pe: '' })
if (!jeton) throw new Error('NOTYA_SES_JETON_SECRET yok')
const olusturulanOturumlar = [oturumA, oturumB]

async function ses(mesaj: string) {
  const req = new NextRequest('http://localhost/api/asistan/ses-llm/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.NOTYA_SES_LLM_SECRET}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'notya-ayse', stream: true, messages: [{ role: 'system', content: 'x' }, { role: 'user', content: mesaj }], tools: [{ type: 'function', function: { name: 'end_call' } }], elevenlabs_extra_body: { notya_jeton: jeton } }),
  })
  const t0 = performance.now()
  const y = await sesLlmPost(req)
  const okuyucu = y.body!.getReader()
  const dec = new TextDecoder()
  let tampon = ''
  const parcalar: { t: number; metin: string }[] = []
  for (;;) {
    const { value, done } = await okuyucu.read()
    if (done) break
    tampon += dec.decode(value, { stream: true })
    let i
    while ((i = tampon.indexOf('\n\n')) !== -1) {
      const olay = tampon.slice(0, i); tampon = tampon.slice(i + 2)
      if (!olay.startsWith('data: ') || olay === 'data: [DONE]') continue
      const c = JSON.parse(olay.slice(6)).choices[0]
      if (typeof c.delta?.content === 'string' && c.delta.content) parcalar.push({ t: performance.now() - t0, metin: c.delta.content })
    }
  }
  const toplam = performance.now() - t0
  const dolgu = parcalar[0] && (parcalar[0].metin === DOLGU_BAKIYORUM || parcalar[0].metin === DOLGU_KAYDEDIYORUM) ? parcalar[0] : null
  const gercek = parcalar.find((p) => p !== dolgu)
  return { ilk: parcalar[0]?.t ?? null, dolguVar: Boolean(dolgu), ilkGercek: gercek?.t ?? null, toplam, konusma: parcalar.filter((p) => p !== dolgu).map((p) => p.metin).join('').trim() }
}

let imlec = new Date(Date.now() - 5000).toISOString()
async function sesEkrani(): Promise<string> {
  const r = await sesEkran.GET(new NextRequest(`http://localhost/api/asistan/ses-ekran?oturum=${oturumB}&sonra=${encodeURIComponent(imlec)}`, { headers: { authorization: `Bearer ${token}` } }))
  const j = (await r.json()) as { turlar?: { zaman: string; metin: string }[] }
  const son = (j.turlar || []).at(-1)
  if (son) imlec = son.zaman
  return son?.metin || ''
}

const kelimeler = (s: string) => new Set(s.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2))
function benzerlik(a: string, b: string) {
  const x = kelimeler(a), y = kelimeler(b)
  if (!x.size && !y.size) return 1
  let k = 0
  for (const w of x) if (y.has(w)) k++
  return k / (x.size + y.size - k)
}
const KIMLIK_DEGERI = /(?:Telefon|telefonu|E-posta|Adres|Doğum yeri|Doğum tarihi|Anne adı|Baba adı|temsilci)[^:\n]*:\s*([^(\n•]+)/g

// ısınma (sayılmaz): modüller, bağlantılar
{
  const o = String((await asistanOturumuAc(supabase, { doktorId, specialty, hekimBransi: 'dahiliye' }))?.id)
  olusturulanOturumlar.push(o)
  await ayseCevapla({ supabase, doktorId, oturumId: o, mesaj: 'Merhaba', kanal: 'yazi', specialty })
}

const satirlar: Record<string, unknown>[] = []
const yaziKartlari: string[] = []
for (const [i, s] of SORULAR.entries()) {
  const mesaj = doldur(s.metin)
  let yazi: { ms: number; ekran: string } | null = null
  if (!s.yaziYok) {
    const t0 = performance.now()
    const r = await ayseCevapla({ supabase, doktorId, oturumId: oturumA, mesaj, kanal: 'yazi', specialty })
    yazi = { ms: performance.now() - t0, ekran: r.ok ? r.cevap.ekran : `HATA ${r.durum}` }
    if (r.ok) yaziKartlari.push(...r.cevap.kartlar.map((k) => k.id))
  }
  const v = await ses(mesaj)
  const vEkran = await sesEkrani()
  const degerler = [...(vEkran.matchAll(KIMLIK_DEGERI))].map((m) => m[1].trim()).filter((d) => d.length >= 3 && !/kayıtlı değil|yok/i.test(d))
  const sizinti = kimlikDegeriVarMi(v.konusma) || degerler.some((d) => v.konusma.includes(d))
  const ayni = yazi ? yazi.ekran.trim() === vEkran.trim() : null
  const sat = {
    no: i + 1, tur: s.tur, soru: s.metin,
    ilkParcaMs: v.ilk === null ? null : Math.round(v.ilk), dolgu: v.dolguVar,
    ilkGercekMs: v.ilkGercek === null ? null : Math.round(v.ilkGercek), sesToplamMs: Math.round(v.toplam),
    yaziToplamMs: yazi ? Math.round(yazi.ms) : null,
    uyum: yazi === null ? 'yalnız ses' : ayni ? 'aynı' : `benzer ${benzerlik(yazi.ekran, vEkran).toFixed(2)}`,
    kimlikSizintisi: sizinti,
    konusma: gizle(v.konusma).slice(0, 300),
    yaziEkran: yazi ? gizle(yazi.ekran).slice(0, 300) : null,
    sesEkran: gizle(vEkran).slice(0, 300),
  }
  satirlar.push(sat)
  console.error(`${sat.no}. ${sat.tur}: ilk ${sat.ilkParcaMs} ms, gerçek ${sat.ilkGercekMs} ms, ses ${sat.sesToplamMs} ms, yazı ${sat.yaziToplamMs} ms, ${sat.uyum}${sizinti ? ' SIZINTI' : ''}`)
}

// Temizlik: "Evet"le yazılan kaydı geri al, yazılı yoldaki taslak kartları vazgeç, oturumları sil
const { data: kayitlar } = await supabase.from('eylem_kayitlari').select('id, created_at, geri_alindi_at').eq('doctor_id', doktorId).is('geri_alindi_at', null).gte('created_at', new Date(Date.now() - 30 * 60e3).toISOString())
for (const k of (kayitlar || []) as { id: string }[]) console.error('geri al:', (await eylemGeriAl(supabase, doktorId, k.id, 'dahiliye')).ok)
for (const id of yaziKartlari) await eylemVazgec(supabase, doktorId, id)
const { data: taslaklar } = await supabase.from('eylem_onerileri').select('id').eq('doctor_id', doktorId).eq('durum', 'taslak').gte('created_at', new Date(Date.now() - 30 * 60e3).toISOString())
for (const t of (taslaklar || []) as { id: string }[]) await eylemVazgec(supabase, doktorId, t.id)
for (const o of olusturulanOturumlar) {
  await supabase.from('asistan_actions').delete().eq('asistan_session_id', o).eq('doctor_id', doktorId)
  await supabase.from('asistan_sessions').delete().eq('id', o).eq('doctor_id', doktorId)
}

const medyan = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN }
const ilkler = satirlar.map((s) => s.ilkParcaMs as number).filter((x) => x !== null)
const gercekler = satirlar.map((s) => s.ilkGercekMs as number).filter((x) => x !== null)
const ozet = {
  calisma: new Date().toISOString(),
  ilkParcaMedyanMs: medyan(ilkler), ilkParcaMaxMs: Math.max(...ilkler),
  ilkGercekMedyanMs: medyan(gercekler), ilkGercekMaxMs: Math.max(...gercekler),
  sesToplamMedyanMs: medyan(satirlar.map((s) => s.sesToplamMs as number)),
  yaziToplamMedyanMs: medyan(satirlar.map((s) => s.yaziToplamMs as number).filter((x) => x !== null)),
  ayni: satirlar.filter((s) => s.uyum === 'aynı').length,
  sizinti: satirlar.filter((s) => s.kimlikSizintisi).length,
}
fs.mkdirSync(path.join(process.cwd(), 'smoke-out'), { recursive: true })
fs.writeFileSync(path.join(process.cwd(), 'smoke-out', 'tek-beyin-olcum.json'), JSON.stringify({ ozet, satirlar }, null, 2))
console.log('| # | Question (type) | First chunk (filler) ms | First real answer ms | Voice total ms | Text total ms | Text vs voice screen | ID value spoken |')
console.log('|---|---|---|---|---|---|---|---|')
for (const s of satirlar) console.log(`| ${s.no} | ${s.tur} | ${s.ilkParcaMs}${s.dolgu ? '' : ' (no filler)'} | ${s.ilkGercekMs} | ${s.sesToplamMs} | ${s.yaziToplamMs ?? '—'} | ${s.uyum} | ${s.kimlikSizintisi ? 'YES' : 'no'} |`)
console.log(`\nmedian first chunk ${ozet.ilkParcaMedyanMs} ms (max ${ozet.ilkParcaMaxMs}); median first real answer ${ozet.ilkGercekMedyanMs} ms (max ${ozet.ilkGercekMaxMs}); median voice total ${ozet.sesToplamMedyanMs} ms; median text total ${ozet.yaziToplamMedyanMs} ms; identical screen ${ozet.ayni}/${satirlar.length}; ID leaks ${ozet.sizinti}`)
process.exit(0)
