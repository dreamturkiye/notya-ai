import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SOHBET_AZAMI,
  fifoKirp,
  sohbetAnahtar,
  sohbetCoz,
  sohbetFifoKirp,
  sohbetMaxSira,
  sohbetOku,
  sohbetYaz,
  type SakliSesMesaj,
  type SakliYaziliMesaj,
} from './sohbetGecmisi'

function bellekDepo(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: (k) => { m.delete(k) },
    key: (i) => [...m.keys()][i] ?? null,
  }
}

describe('NOTYA-ASISTAN-GECMIS-01 — son 50 sıra FIFO', () => {
  it('fifoKirp: azamiyi aşınca en eskiler düşer', () => {
    const a = Array.from({ length: 55 }, (_, i) => i)
    assert.deepEqual(fifoKirp(a, 50), Array.from({ length: 50 }, (_, i) => i + 5))
    assert.deepEqual(fifoKirp([1, 2, 3], 50), [1, 2, 3])
  })

  it('sohbetFifoKirp: ses + yazılı tek çizgide 50; sira sırası', () => {
    const ses: SakliSesMesaj[] = Array.from({ length: 30 }, (_, i) => ({
      id: `s${i}`, role: i % 2 ? 'user' : 'ai', text: `ses-${i}`, sira: i + 1,
    }))
    const yazili: SakliYaziliMesaj[] = Array.from({ length: 30 }, (_, i) => ({
      rol: i % 2 ? 'doktor' : 'asistan', icerik: `yaz-${i}`, sira: 100 + i,
    }))
    const g = sohbetFifoKirp(ses, yazili, 50)
    assert.equal(g.ses.length + g.yazili.length, 50)
    assert.equal(g.ses[0]?.text, 'ses-10', 'en eski 10 ses düşer (sira 1–10)')
    assert.equal(g.yazili.length, 30)
    assert.equal(g.yazili[0]?.icerik, 'yaz-0')
  })

  it('oku/yaz: persona ayrı; bozuk JSON boş; max sira', () => {
    const d = bellekDepo()
    const ses: SakliSesMesaj[] = [{ id: '1', role: 'ai', text: 'Merhaba', sira: 3 }]
    const yazili: SakliYaziliMesaj[] = [{ rol: 'doktor', icerik: 'dosya', sira: 7 }]
    sohbetYaz('aysekaya', ses, yazili, d)
    assert.deepEqual(sohbetOku('aysekaya', d), { ses, yazili })
    assert.deepEqual(sohbetOku('fatmaozkan', d), { ses: [], yazili: [] })
    assert.equal(sohbetMaxSira(sohbetOku('aysekaya', d)), 7)
    d.setItem(sohbetAnahtar('aysekaya'), '{degil')
    assert.deepEqual(sohbetOku('aysekaya', d), { ses: [], yazili: [] })
  })

  it('sohbetCoz: kirli alanları atar; azami SOHBET_AZAMI', () => {
    const g = sohbetCoz({
      ses: [
        { id: 'x', role: 'ai', text: 'ok', sira: 1 },
        { role: 'bot', text: 'yok' },
        { id: 'y', role: 'user', text: '  ', sira: 2 },
      ],
      yazili: [{ rol: 'asistan', icerik: 'gun', sira: 3 }, { rol: 'x', icerik: 'yok' }],
    })
    assert.deepEqual(g.ses, [{ id: 'x', role: 'ai', text: 'ok', sira: 1 }])
    assert.deepEqual(g.yazili, [{ rol: 'asistan', icerik: 'gun', sira: 3 }])
    assert.equal(SOHBET_AZAMI, 50)
  })

  it('AsistanOturumContext: startConversation mesajları silmez; sohbet kalıcı', () => {
    const ui = readFileSync(join(import.meta.dirname, '../../components/asistan/AsistanOturumContext.tsx'), 'utf8')
    assert.match(ui, /sohbetYaz|sohbetOku/)
    assert.match(ui, /NOTYA-ASISTAN-GECMIS-01/)
    // startConversation içindeki setMessages([]) kaldırıldı — geçmiş mikrofona yeniden dokununca silinmez.
    assert.doesNotMatch(ui, /setStatus\("connecting"\)\s*\n\s*setErrorMsg\(""\)\s*\n\s*setMessages\(\[\]\)/)
  })
})
