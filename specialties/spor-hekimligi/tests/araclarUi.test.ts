import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import SporRtpAraci from '@/specialties/spor-hekimligi/ui/araclar/SporRtpAraci'
import SporSakatlikAraci from '@/specialties/spor-hekimligi/ui/araclar/SporSakatlikAraci'

describe('SPOR-HEKIMLIGI-EXCEPTIONAL-01 Araçlar UI smoke', () => {
  it('RTP studio renders without crash and never embeds audit jargon', () => {
    const html = renderToStaticMarkup(React.createElement(SporRtpAraci))
    assert.match(html, /RTP|basamak/i)
    assert.doesNotMatch(html, /EXCEPTIONAL|sprint|Gökhan|\.html/i)
  })

  it('Sakatlık studio renders', () => {
    const html = renderToStaticMarkup(React.createElement(SporSakatlikAraci))
    assert.match(html, /Sakatlık|Bölge/i)
    assert.doesNotMatch(html, /doping|WADA/i)
  })
})
