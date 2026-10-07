/**
 * NOTYA-INTAKE-EPOSTA (2026-10-07) — designed intake invitation: deliverability rules and the
 * multipart/alternative message the connected mailbox sends.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bilgiFormuEpostasi, bilgiFormuLinkiGecerliMi } from './bilgiFormuEposta'
import { mesajHazirla } from './sablonlar'
import { epostaMesaji, htmlGecerliMi } from './otomatik/eposta/mime'

const LINK = 'https://www.notya.io/intake/abc123'
const g = { hastaAdi: 'Ayşe Yılmaz', doktorAdi: 'Dr. Gökhan Mamur', link: LINK }

describe('bilgi formu e-postası', () => {
  it('metin parçası tek-dokunuş metniyle aynı', () => {
    const e = bilgiFormuEpostasi(g)
    assert.equal(e.metin, mesajHazirla('bilgi_formu', g)!.metin)
  })

  it('HTML: başlıkta doktor adı, tek "Formu doldur" düğmesi, bağlantı metin olarak da var, alt bilgi', () => {
    const { html } = bilgiFormuEpostasi(g)
    assert.ok(html)
    assert.match(html!, /Dr\. Gökhan Mamur<\/td>/)
    assert.equal(html!.match(/>Formu doldur</g)?.length, 1)
    assert.ok(html!.includes(`>${LINK}</a>`), 'tam bağlantı düğmenin altında görünür metin')
    assert.ok(html!.includes('Bu e-posta Dr. Gökhan Mamur adına Notya üzerinden gönderildi.'))
    assert.ok(html!.includes('Bu bağlantı size özeldir; lütfen başkalarıyla paylaşmayın.'))
  })

  it('teslim edilebilirlik: görsel, arka plan resmi, stil bloğu, script, web fontu yok; tek bağlantı hedefi; küçük', () => {
    const { html } = bilgiFormuEpostasi(g)
    assert.doesNotMatch(html!, /<img|background-image|url\(|<style|<script|@import|fonts\.googleapis|<link /i)
    const hedefler = new Set(Array.from(html!.matchAll(/href="([^"]+)"/g), (m) => m[1]))
    assert.deepEqual([...hedefler], [LINK], 'yalnız gerçek notya.io bağlantısı')
    assert.ok(html!.length < 6000, `HTML ${html!.length} bayt`)
    assert.ok(htmlGecerliMi(html))
  })

  it('kaçış: ad içindeki HTML işlenmez', () => {
    const { html } = bilgiFormuEpostasi({ ...g, hastaAdi: '<b>x</b>', doktorAdi: 'Dr. A & B' })
    assert.ok(!html!.includes('<b>x</b>'))
    assert.ok(html!.includes('Dr. A &amp; B'))
  })

  it('yabancı ya da http bağlantı → HTML yok (düz metin gider)', () => {
    for (const l of ['http://www.notya.io/intake/x', 'https://evil.test/intake/x', 'https://notya.io.evil.test/x', 'javascript:alert(1)']) {
      assert.equal(bilgiFormuLinkiGecerliMi(l), false, l)
      assert.equal(bilgiFormuEpostasi({ ...g, link: l }).html, null, l)
    }
    assert.equal(bilgiFormuLinkiGecerliMi('https://notya.io/intake/x'), true)
  })

  it('MIME: html varsa multipart/alternative (önce metin, sonra HTML); aynı içerik', () => {
    const e = bilgiFormuEpostasi(g)
    const ham = epostaMesaji({ alici: 'h@o.test', konu: 'Hasta bilgi formu', metin: e.metin, html: e.html! })
    const sinir = /boundary="([^"]+)"/.exec(ham)![1]
    assert.match(ham, /^Content-Type: multipart\/alternative; boundary="/m)
    const parcalar = ham.split(`--${sinir}`).slice(1, 3)
    assert.match(parcalar[0], /text\/plain/)
    assert.match(parcalar[1], /text\/html/)
    const coz = (p: string) => Buffer.from(p.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString('utf8')
    assert.ok(coz(parcalar[0]).includes(LINK))
    assert.ok(coz(parcalar[1]).includes('Formu doldur'))
  })

  it('MIME: html yoksa eski text/plain mesajı bayt bayt aynı (diğer e-postalar değişmez)', () => {
    const m = { alici: 'h@o.test', konu: 'Randevu', metin: 'Merhaba' }
    assert.equal(epostaMesaji({ ...m, html: undefined }), epostaMesaji(m))
    assert.match(epostaMesaji(m), /^Content-Type: text\/plain; charset="UTF-8"$/m)
    assert.equal(epostaMesaji({ ...m, html: '<script>x</script>' }), epostaMesaji(m), 'script taşıyan HTML atılır')
  })

  it('MIME: ek + html → multipart/mixed içinde multipart/alternative', () => {
    const ham = epostaMesaji({ alici: 'h@o.test', konu: 'K', metin: 'M', html: '<p>M</p>', ekler: [{ ad: 'r.ics', tur: 'text/calendar', icerik: 'BEGIN:VCALENDAR' }] })
    assert.match(ham, /^Content-Type: multipart\/mixed;/m)
    assert.match(ham, /Content-Type: multipart\/alternative;/)
    assert.match(ham, /Content-Disposition: attachment; filename="r.ics"/)
  })
})
