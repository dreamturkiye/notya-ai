import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { IPUCLARI, IPUCU_BOLUMLERI, type IpucuBolumu } from './ipuclari'
import {
  IPUCU_ACIK_ANAHTAR,
  gorulduIsaretle,
  gorulduMu,
  ipuclariAcikMi,
  ipuclariAyarla,
  otomatikGosterilsinMi,
  type IpucuDeposu,
} from './ipucuDurumu'

function sahteDepo(baslangic: Record<string, string> = {}): IpucuDeposu & { veri: Map<string, string> } {
  const veri = new Map(Object.entries(baslangic))
  return {
    veri,
    getItem: (k: string) => (veri.has(k) ? veri.get(k)! : null),
    setItem: (k: string, v: string) => void veri.set(k, String(v)),
    removeItem: (k: string) => void veri.delete(k),
  }
}

/** Fırlatan depo — gizli pencere / kapalı site verisi: asla patlamamalı, varsayılana düşmeli. */
const bozukDepo: IpucuDeposu = {
  getItem: () => {
    throw new Error('depo kapalı')
  },
  setItem: () => {
    throw new Error('depo kapalı')
  },
  removeItem: () => {
    throw new Error('depo kapalı')
  },
}

const BEKLENEN_BOLUMLER: IpucuBolumu[] = [
  'ana-sayfa',
  'randevular',
  'hastalar',
  'hasta-dosyasi',
  'fotograflar',
  'yeni-muayene',
  'mesajlar',
  'gelen-belgeler',
  'raporlar',
  'enabiz',
  'araclar',
  'faturalama',
  'hasta-portali',
  'ayarlar',
]

describe('ipuclari (içerik sözleşmesi)', () => {
  it('her ana bölümün bir ipucu girdisi var — eksiksiz', () => {
    assert.deepEqual([...IPUCU_BOLUMLERI].sort(), [...BEKLENEN_BOLUMLER].sort())
  })

  it('her ipucu 2–4 kısa cümle ve bir başlık taşır', () => {
    for (const bolum of IPUCU_BOLUMLERI) {
      const i = IPUCLARI[bolum]
      assert.ok(i.baslik.trim().length >= 3, `${bolum}: başlık boş`)
      assert.ok(i.satirlar.length >= 2 && i.satirlar.length <= 4, `${bolum}: ${i.satirlar.length} satır (2–4 olmalı)`)
      for (const s of i.satirlar) {
        assert.ok(s.trim().length >= 10, `${bolum}: çok kısa satır: ${s}`)
        assert.ok(s.length <= 160, `${bolum}: çok uzun satır (${s.length}): ${s}`)
      }
    }
  })

  it('brans-alan-sizmasi: evrensel kromdaki ipuçlarında branşa özel sözcük yok', () => {
    // Bir branşın klinik dili başka branşın doktoruna görünmemeli; bu metinler HERKESE görünür.
    const yasakli = [
      /persentil/i,
      /baş çevresi/i,
      /\bveli\b/i,
      /gebelik/i,
      /pediatri/i,
      /kardiyoloji/i,
      /dermatoloji/i,
      /aşı takvimi/i,
      /logmar/i,
      /\bpasi\b/i,
      /psikiyatri/i,
    ]
    for (const bolum of IPUCU_BOLUMLERI) {
      const metin = [IPUCLARI[bolum].baslik, ...IPUCLARI[bolum].satirlar].join(' ')
      for (const r of yasakli) {
        assert.ok(!r.test(metin), `${bolum}: branşa özel sözcük sızdı (${r}): ${metin}`)
      }
    }
  })
})

describe('ipucuDurumu (görünürlük durumu)', () => {
  it('varsayılan AÇIK: anahtar yoksa ipuçları gösterilir', () => {
    assert.equal(ipuclariAcikMi(sahteDepo()), true)
  })

  it("yalnız '0' kapatır; açma/kapama gidip gelir", () => {
    const d = sahteDepo()
    ipuclariAyarla(false, d)
    assert.equal(d.veri.get(IPUCU_ACIK_ANAHTAR), '0')
    assert.equal(ipuclariAcikMi(d), false)
    ipuclariAyarla(true, d)
    assert.equal(ipuclariAcikMi(d), true)
  })

  it('otomatik gösterim bölüm başına en fazla bir kez: işaretlenince bir daha önerilmez', () => {
    const d = sahteDepo()
    assert.equal(otomatikGosterilsinMi('hastalar', d), true)
    gorulduIsaretle('hastalar', d)
    assert.equal(gorulduMu('hastalar', d), true)
    assert.equal(otomatikGosterilsinMi('hastalar', d), false)
    // Başka bölüm etkilenmez.
    assert.equal(otomatikGosterilsinMi('randevular', d), true)
  })

  it('global anahtar kapalıyken hiçbir bölüm otomatik gösterilmez', () => {
    const d = sahteDepo({ [IPUCU_ACIK_ANAHTAR]: '0' })
    assert.equal(otomatikGosterilsinMi('ana-sayfa', d), false)
  })

  it('depo fırlatırsa sessizce varsayılana düşer (açık, görülmedi) — asla hata yükseltmez', () => {
    assert.equal(ipuclariAcikMi(bozukDepo), true)
    assert.equal(gorulduMu('ayarlar', bozukDepo), false)
    assert.doesNotThrow(() => gorulduIsaretle('ayarlar', bozukDepo))
    assert.doesNotThrow(() => ipuclariAyarla(false, bozukDepo))
  })
})

// IPUCU-TETIK-01 (2026-11-10, core): the "?" trigger is a small labelled icon inside or right after the section heading.
describe('ipucu tetikleyicisi (IPUCU-TETIK-01)', () => {
  const KOK = join(__dirname, '..', '..', '..')

  it('renders a labelled 44px button with a 22px visual, muted, with a title tooltip', async () => {
    const { default: IpucuBaloncugu, IPUCU_TETIK_ETIKETI } = await import('../../../components/doktor/IpucuBaloncugu')
    const html = renderToStaticMarkup(React.createElement(IpucuBaloncugu, { bolum: 'ana-sayfa' }))
    assert.equal(IPUCU_TETIK_ETIKETI, 'Bu sayfa hakkında ipucu')
    assert.match(html, /<button[^>]*aria-label="Bu sayfa hakkında ipucu"/)
    assert.match(html, /<button[^>]*title="Bu sayfa hakkında ipucu"/)
    assert.match(html, /<button[^>]*width:44px;height:44px/)
    assert.match(html, /class="notya-ipucu-ikon"[^>]*width:22px;height:22px/)
    assert.match(html, /aria-expanded="false"/)
  })

  it('every call site puts the trigger inside or right after its heading (home: inside the h1, never alone below it)', () => {
    const kullananlar: string[] = []
    const gez = (d: string) => {
      for (const ad of readdirSync(d)) {
        if (ad === 'node_modules' || ad === '.next') continue
        const yol = join(d, ad)
        if (statSync(yol).isDirectory()) gez(yol)
        else if (/\.tsx$/.test(ad) && !/IpucuBaloncugu\.tsx$/.test(ad) && /<IpucuBaloncugu\b/.test(readFileSync(yol, 'utf8'))) kullananlar.push(yol)
      }
    }
    for (const d of ['app', 'components']) gez(join(KOK, d))
    assert.ok(kullananlar.length >= 10, `only ${kullananlar.length} call sites found`)
    for (const f of kullananlar) {
      const satirlar = readFileSync(f, 'utf8').split('\n')
      satirlar.forEach((s, i) => {
        if (!/<IpucuBaloncugu\b/.test(s)) return
        // Passed as a prop to a page header that renders it beside its title, or within three lines after a heading.
        const onceki = satirlar.slice(Math.max(0, i - 6), i + 1).join('\n')
        const yaninda = /ipucu=\{<IpucuBaloncugu/.test(s) || /<h[1-3]\b|fontFamily: CHROME_FONT\.serif[^\n]*>[^<\n]*<\/div>|<\/h[1-3]>/.test(onceki)
        assert.ok(yaninda, `${f}:${i + 1} — the tip trigger is not beside a heading`)
      })
    }
    const ana = readFileSync(join(KOK, 'app/dashboard/doktor/page.tsx'), 'utf8')
    const h1 = ana.slice(ana.indexOf('<h1'), ana.indexOf('</h1>'))
    assert.match(h1, /Hoş geldiniz, Dr\./)
    assert.match(h1, /whiteSpace: 'nowrap'[^\n]*<IpucuBaloncugu bolum="ana-sayfa" \/>/)
  })
})
