/**
 * AU-KITAP-01 — each role this pack offers has its OWN Australian practice sources and book list, carried as data on
 * the assistant identity (the way Türkiye carries them on the persona) and shown on no screen.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BugunGorunumu } from '@/components/ulke/uygulama/Bugun'
import { AU_ARAYUZ } from '../arayuz'
import { AU_ASISTAN_ADLARI } from '../klinik/asistanAdlari'
import { AU_EK_ROLLER, AU_CIKAN_ROLLER } from '../klinik/rolListesi'
import { EN_ROLLER } from '../../_dil/en/klinik/roller'
import { AU_ASISTAN_KAYNAKLARI, AU_KITAP_AYRIMI, AU_ULUSAL_KITABI_OLMAYAN_ROLLER, auAsistanKaynakBlogu, auAsistanKaynaklari } from './kaynaklar'

const ROLLER = Object.keys(AU_ASISTAN_ADLARI)
const D = 'en-AU' as const
const yetkiYazisi = /Australia|Australian|Australasian|RACGP|RACP|RACS|RANZ|ANZCA|ANZSN|ANZAN|ANZSCTS|ANZSVS|CSANZ|TSANZ|ACEM|HSANZ|USANZ|eviQ|CARI|ARPANSA|Ahpra|Medical Board|Immunisation Handbook|Therapeutic Guidelines|Dietitians|Audiology Australia|Speech Pathology|Heart Foundation|Kidney Health|Stroke Foundation|Lifeblood|Cancer|National Health and Medical Research Council|National Acoustic|Patient Blood|Pharmaceutical Benefits|Medicare Benefits|Occupational Therapy|Physiotherapy|Psychological|Podiatry|Lung Foundation|ASCIA|Neurosurgical|Gastroenterological|Endocrine Society|Diabetes|General Surgeons|Children|Department of Health/

describe('au: per-role practice sources and books (AU-KITAP-01)', () => {
  it('the 44 offered roles = the 40 shared roles, minus the 5 Australia does not have, plus its 9 own', () => {
    const ek = AU_EK_ROLLER.map((r) => r.anahtar)
    const beklenen = [...EN_ROLLER.filter((r) => !(AU_CIKAN_ROLLER as readonly string[]).includes(r)), ...ek]
    assert.equal(EN_ROLLER.length, 40)
    assert.equal(AU_CIKAN_ROLLER.length, 5)
    assert.equal(ek.length, 9)
    assert.equal(ROLLER.length, 44)
    assert.deepEqual([...ROLLER].sort(), [...beklenen].sort())
    assert.deepEqual(Object.keys(AU_ASISTAN_KAYNAKLARI).sort(), [...ROLLER].sort())
    // a role Australia removed has no sources at all
    for (const r of AU_CIKAN_ROLLER) assert.equal(auAsistanKaynaklari(r), null, r)
    assert.equal(auAsistanKaynaklari('no-such-role'), null)
  })

  it('every role has at least 2 books and 4 authorities, unique inside the role, Australian wording in the authorities', () => {
    for (const rol of ROLLER) {
      const k = AU_ASISTAN_KAYNAKLARI[rol as keyof typeof AU_ASISTAN_KAYNAKLARI]
      assert.ok(k.kitaplar.length >= 2, `${rol}: books`)
      assert.ok(k.yetki.length >= 4, `${rol}: authorities`)
      assert.equal(new Set(k.kitaplar).size, k.kitaplar.length, rol)
      assert.equal(new Set(k.yetki).size, k.yetki.length, rol)
      assert.match(k.yetki.join(' '), yetkiYazisi, rol)
      assert.doesNotMatch([...k.yetki, ...k.kitaplar, k.not].join('\n'), /\b(NHS|NHI|Turkey|Turkish|TGA|HIPAA|compliant|certified|accredited|endorsed)\b/i, rol)
      const a = AU_KITAP_AYRIMI[rol as keyof typeof AU_KITAP_AYRIMI]
      assert.deepEqual(k.kitaplar, [...a.ulusal, ...a.uluslararasi], `${rol}: Australian titles first, international for depth`)
    }
  })

  it('no two roles share a list: every role has its own authorities signature and its own books signature', () => {
    const yetki = ROLLER.map((r) => AU_ASISTAN_KAYNAKLARI[r as keyof typeof AU_ASISTAN_KAYNAKLARI].yetki.join('|'))
    const kitap = ROLLER.map((r) => AU_ASISTAN_KAYNAKLARI[r as keyof typeof AU_ASISTAN_KAYNAKLARI].kitaplar.join('|'))
    assert.equal(new Set(yetki).size, ROLLER.length)
    assert.equal(new Set(kitap).size, ROLLER.length)
  })

  it('the honest gap is held: the roles with no verified Australian-authored book are exactly these 15', () => {
    assert.deepEqual([...AU_ULUSAL_KITABI_OLMAYAN_ROLLER].sort(), [
      'aesthetic-medicine', 'aesthetic-surgery', 'cardio-thoracic-surgery', 'clinical-psychology', 'haematology', 'immunology-and-allergy',
      'ophthalmology', 'orthopaedics', 'otolaryngology', 'plastic-surgery', 'podiatry', 'radiation-oncology', 'radiology', 'urology', 'vascular-surgery',
    ])
    assert.equal(ROLLER.length - AU_ULUSAL_KITABI_OLMAYAN_ROLLER.length, 29)
  })

  it('role-specific Australian titles are on the right role and nowhere else (no cross-specialty bleed)', () => {
    const kitaplar = (r: string) => AU_ASISTAN_KAYNAKLARI[r as keyof typeof AU_ASISTAN_KAYNAKLARI].kitaplar.join('\n')
    const hepsi = (r: string) => `${kitaplar(r)}\n${AU_ASISTAN_KAYNAKLARI[r as keyof typeof AU_ASISTAN_KAYNAKLARI].yetki.join('\n')}`
    const sahibi = (baslik: RegExp) => ROLLER.filter((r) => baslik.test(kitaplar(r)))
    assert.deepEqual(sahibi(/Murtagh's General Practice/), ['family-medicine'])
    assert.deepEqual(sahibi(/Practical Paediatrics/), ['paediatrics'])
    assert.deepEqual(sahibi(/Beischer/), ['obstetrics-gynaecology'])
    assert.deepEqual(sahibi(/Westmead Anaesthetic Manual/), ['anaesthesia'])
    assert.deepEqual(sahibi(/Practical Cardiology/), ['cardiology'])
    assert.deepEqual(sahibi(/Essential Neurosurgery/), ['neurosurgery'])
    assert.deepEqual(sahibi(/Explain Pain/), ['pain-medicine'])
    assert.deepEqual(sahibi(/Lidcombe/), ['speech-pathology'])
    assert.deepEqual(sahibi(/Hearing Aids \(Dillon\)/), ['audiology'])
    assert.deepEqual(sahibi(/Nelson Textbook of Pediatrics/), [])
    assert.doesNotMatch(hepsi('paediatrics'), /Braunwald|Nelson Textbook of Pediatrics/)
    assert.doesNotMatch(hepsi('cardiology'), /hair transplant|Wellness and healthspan/i)
    assert.doesNotMatch(hepsi('aesthetic-surgery'), /hair transplant/i)
    assert.match(hepsi('aesthetic-medicine'), /lists hair transplants with non-surgical cosmetic procedures/)
    assert.match(hepsi('family-medicine'), /Wellness and healthspan reviews are general practice/)
    // an allied profession carries no doctor's book, and a doctor no allied profession's
    assert.doesNotMatch(hepsi('physiotherapy'), /Braunwald|Harrison/)
    assert.doesNotMatch(hepsi('internal-medicine'), /Maitland|Lidcombe|Hearing Aids/)
  })

  it('the books ride on the assistant identity of every role; the home screen shows none of it', () => {
    for (const rol of ROLLER) {
      const kim = AU_ARAYUZ.asistan(rol, D)
      assert.deepEqual(kim?.kaynaklar, AU_ASISTAN_KAYNAKLARI[rol as keyof typeof AU_ASISTAN_KAYNAKLARI], rol)
    }
    assert.equal(AU_ARAYUZ.asistan('no-such-role', D), null)
    const ev = renderToStaticMarkup(React.createElement(BugunGorunumu, { m: AU_ARAYUZ.metinler[D]!, ad: 'QA', muayeneler: [], hata: false, rol: 'paediatrics' }))
    assert.doesNotMatch(ev, /Practical Paediatrics|Books named for this role|Australian practice sources/)
  })

  it('the prompt block (the personaEngine counterpart) puts Australian sources first and international texts last, per role', () => {
    const b = auAsistanKaynakBlogu('paediatrics')!
    assert.ok(b.indexOf('AUSTRALIAN PRACTICE SOURCES') < b.indexOf('Royal Australasian College of Physicians'))
    assert.ok(b.indexOf('AUSTRALIAN AND ANZ BOOKS') < b.indexOf('Practical Paediatrics'))
    assert.doesNotMatch(b, /INTERNATIONAL TEXTS/) // paediatrics names none
    const c = auAsistanKaynakBlogu('cardiology')!
    assert.ok(c.indexOf('AUSTRALIAN AND ANZ BOOKS') < c.indexOf('INTERNATIONAL TEXTS'))
    assert.match(c, /depth only/)
    const o = auAsistanKaynakBlogu('ophthalmology')!
    assert.doesNotMatch(o, /AUSTRALIAN AND ANZ BOOKS/)
    assert.match(o, /INTERNATIONAL TEXTS/)
    assert.doesNotMatch(c, /Practical Paediatrics/)
    assert.equal(auAsistanKaynakBlogu('thoracic-surgery'), null)
  })
})
