/**
 * @vitest-environment or node render smoke — static markup for visit motor panel.
 * Uses react-dom/server so CI without a browser still pins deep-link chips.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Pack resolve needs NOTYA_COUNTRY=au for motors to exist.
process.env.NOTYA_COUNTRY = 'au'

describe('MuayeneMotorPaneli', () => {
  it('renders deep-link chips for cardiology motor tools when AU pack is active', async () => {
    // Dynamic import after env so ulkePaketi() sees au.
    const { MuayeneMotorPaneli } = await import('./MuayeneMotorPaneli')
    const html = renderToStaticMarkup(
      <MuayeneMotorPaneli rol="cardiology" hastaId="hasta-1" />,
    )
    assert.match(html, /data-alan="muayene-motor"/)
    assert.match(html, /data-rol="cardiology"/)
    assert.match(html, /data-alan="muayene-motor-araclar"/)
    assert.match(html, /data-arac="au-cardiology-visit-prep"/)
    assert.match(html, /arac=au-cardiology-visit-prep/)
    assert.match(html, /hasta=hasta-1/)
  })
})
