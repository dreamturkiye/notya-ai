import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sesTurKilitAyniMi, sesTurunuAc, type SesTurKilit } from './sesTurKilit'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

describe('NOTYA-BUYUME-KISA-01 / NOTYA-SES-TEK-CEVAP-01 sesTurKilit', () => {
  it('aynı / bulanık mesaj TTL içinde meşgul sayılır', () => {
    const k: SesTurKilit = {
      mesaj: 'Rıdvan Dilmen\'in büyümesi yaşına uygun mu?',
      zaman: new Date().toISOString(),
      claimId: 'a',
    }
    assert.equal(sesTurKilitAyniMi(k.mesaj, k), true)
    assert.equal(sesTurKilitAyniMi('Rıdvan Dilmen büyümesi yaşına uygun mu Hocam', k), true)
    assert.equal(sesTurKilitAyniMi('Umutcan\'ın aşıları neler?', k), false)
  })

  it('24 ay muayene sorusu bulanık eşleşir', () => {
    const k: SesTurKilit = {
      mesaj: '24 aylık sağlam çocuk muayenesini yapacağım. Bu muayenede dikkat etmem gerekenler, yapmam gerekenler nelerdir?',
      zaman: new Date().toISOString(),
      claimId: 'b',
    }
    assert.equal(
      sesTurKilitAyniMi(
        '24 aylık sağlığım çocuk muayenesini yapacağım bu muayenede dikkat etmem gerekenler nelerdir',
        k,
      ),
      true,
    )
  })

  it('TTL dolunca serbest', () => {
    const k: SesTurKilit = {
      mesaj: 'Lab sonuçları neler?',
      zaman: new Date(Date.now() - 60_000).toISOString(),
    }
    assert.equal(sesTurKilitAyniMi(k.mesaj, k), false)
  })
})

const DOKTOR = '00000000-0000-0000-0000-00000000000d'

function kur() {
  const db = new SahteVeritabani()
  const oturum = db.ekle('asistan_sessions', { doctor_id: DOKTOR, persona_id: 'aysekaya', messages: [{ role: 'user', content: 'önceki' }], active_context: { specialty: 'pediatri' } }).id as string
  return { db, sb: db.istemci() as never, oturum }
}

describe('sesTurunuAc — RPC yolu (sahte ses_turu_ac)', () => {
  it('ilk tur kazanır ve satırı getirir; aynı mesajın ikinci turu kaybeder; farklı mesaj kilidi devralır', async () => {
    const { sb, oturum } = kur()
    const a = await sesTurunuAc(sb, DOKTOR, oturum, 'Umutcan’ın alerjisi var mı?')
    assert.deepEqual([a.yok, a.kazandi, a.oncekiKilit], [false, true, null])
    assert.equal(a.satir?.id, oturum)
    assert.equal((a.satir?.messages as unknown[]).length, 1, 'geçmiş aynı çağrıda gelir')
    const b = await sesTurunuAc(sb, DOKTOR, oturum, 'Umutcan’ın alerjisi var mı?')
    assert.equal(b.kazandi, false, 'ElevenLabs aynı soruyu yeniden POST etti: ikinci beyin yok')
    assert.ok(b.oncekiKilit && sesTurKilitAyniMi('Umutcan’ın alerjisi var mı?', b.oncekiKilit))
    const c = await sesTurunuAc(sb, DOKTOR, oturum, 'Peki randevusu ne zaman?')
    assert.equal(c.kazandi, true, 'gerçek ikinci soru beklemez: kilidi devralır')
  })

  it('başka doktorun oturumu: yok=true, satır yok, kilit yazılmaz', async () => {
    const { db, sb, oturum } = kur()
    const y = await sesTurunuAc(sb, '00000000-0000-0000-0000-00000000000e', oturum, 'soru')
    assert.deepEqual([y.yok, y.kazandi, y.satir], [true, false, null])
    assert.equal((db.tablo('asistan_sessions').find((r) => r.id === oturum)?.active_context as Record<string, unknown>)?.sesTurKilit, undefined)
  })

  it('süresi geçmiş kilit (45 sn) yeni turu engellemez', async () => {
    const { db, sb, oturum } = kur()
    const satir = db.tablo('asistan_sessions').find((r) => r.id === oturum)!
    const eski: SesTurKilit = { mesaj: 'Aynı soru', zaman: new Date(Date.now() - 46_000).toISOString(), claimId: 'x' }
    satir.active_context = { ...(satir.active_context as Record<string, unknown>), sesTurKilit: eski }
    const a = await sesTurunuAc(sb, DOKTOR, oturum, 'Aynı soru')
    assert.equal(a.kazandi, true)
  })

  it('rpc hata fırlatırsa (eski sahte/ağ) üç-turlu eski yola düşer ve yine kazanır', async () => {
    const { sb, oturum } = kur()
    const bozuk = { from: (t: string) => (sb as { from: (t: string) => unknown }).from(t), rpc: async () => { throw new Error('desteklenmeyen rpc: ses_turu_ac') } }
    const a = await sesTurunuAc(bozuk as never, DOKTOR, oturum, 'Fallback sorusu')
    assert.deepEqual([a.yok, a.kazandi], [false, true])
    assert.equal(a.satir?.id, oturum)
  })

  it('rpc PGRST202 (fonksiyon migrasyonu ulaşmamış ülke) eski yola düşer', async () => {
    const { sb, oturum } = kur()
    const bozuk = { from: (t: string) => (sb as { from: (t: string) => unknown }).from(t), rpc: async () => ({ data: null, error: { message: 'Could not find the function', code: 'PGRST202' } }) }
    const a = await sesTurunuAc(bozuk as never, DOKTOR, oturum, 'Fallback sorusu')
    assert.equal(a.kazandi, true)
  })

  it('rpc başka bir hata kodu döndürürse fail-closed: fırlatır', async () => {
    const { sb, oturum } = kur()
    const bozuk = { from: (t: string) => (sb as { from: (t: string) => unknown }).from(t), rpc: async () => ({ data: null, error: { message: 'permission denied', code: '42501' } }) }
    await assert.rejects(() => sesTurunuAc(bozuk as never, DOKTOR, oturum, 'soru'))
  })
})
