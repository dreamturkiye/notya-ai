import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { belgeTuruIzinliMi, IKI_NUSHA_KATEGORI } from '@/lib/doktor/belgeTurleri'
import { nushaNotCoz, nushaNotu, nushaPdf, nushaRolMu } from '@/lib/klinik/ikiNusha'
import { seansListesiCoz } from '@/lib/klinik/seansDefter'

describe('iki nüsha', () => {
  it('dosya ve hasta ayrı PDF olur', () => {
    const dosya = nushaPdf('dosya', '2026-10-19')
    const hasta = nushaPdf('hasta', '2026-10-19')
    assert.ok(dosya.subarray(0, 8).toString() === '%PDF-1.4')
    assert.notEqual(dosya.equals(hasta), true)
    assert.match(dosya.toString('latin1'), /Nusha: dosya/)
    assert.match(hasta.toString('latin1'), /Nusha: hasta/)
    assert.match(dosya.toString('latin1'), /2026-10-19/)
    assert.match(dosya.toString('latin1'), /E-imza iddia edilmez/)
    assert.match(dosya.toString('latin1'), /startxref/)
    assert.match(hasta.toString('latin1'), /%%EOF/)
    assert.doesNotMatch(dosya.toString('latin1'), /seans notu|imza alani/i)
    assert.equal(nushaRolMu('dosya'), true)
    assert.equal(nushaRolMu('pediatri'), false)
  })

  it('not round-trip; pediatri ve kardiyoloji kategoriyi yükleyemez', () => {
    const not = nushaNotu('hasta', '2026-10-19', 'ks-1')
    assert.deepEqual(nushaNotCoz(not), { rol: 'hasta', iso: '2026-10-19', seansId: 'ks-1' })
    assert.equal(nushaNotCoz('sac-foto|donor-once|2026-10-19|2026-10-19'), null)
    assert.equal(belgeTuruIzinliMi(IKI_NUSHA_KATEGORI, 'sac-ekimi'), true)
    assert.equal(belgeTuruIzinliMi(IKI_NUSHA_KATEGORI, 'fizyoterapi'), true)
    assert.equal(belgeTuruIzinliMi(IKI_NUSHA_KATEGORI, 'estetik-cerrahi'), true)
    assert.equal(belgeTuruIzinliMi(IKI_NUSHA_KATEGORI, 'pediatri'), false)
    assert.equal(belgeTuruIzinliMi(IKI_NUSHA_KATEGORI, 'kardiyoloji'), false)
    assert.equal(belgeTuruIzinliMi(IKI_NUSHA_KATEGORI, 'dermatoloji'), false)
    const liste = seansListesiCoz({ seanslar: [{ id: 'ks-1', iso: '2026-10-19', metin: 'uygulama', rizaIkiNusha: true, dosyaNushaId: 'd1', hastaNushaId: 'h1' }] })
    assert.equal(liste[0]?.dosyaNushaId, 'd1')
    assert.equal(liste[0]?.hastaNushaId, 'h1')
  })

  it('seans rotası iki dosyayı sahip hastaya yazar', () => {
    const rota = fs.readFileSync(path.join(process.cwd(), 'app/api/ozel-brans/seans/route.ts'), 'utf8')
    assert.match(rota, /hastaSahibiMi/)
    assert.match(rota, /ikiNushaYaz/)
    assert.match(rota, /status: 404/)
    assert.doesNotMatch(rota, /status: 403/)
    const yaz = fs.readFileSync(path.join(process.cwd(), 'lib/klinik/ikiNushaYaz.ts'), 'utf8')
    assert.match(yaz, /uploadDocument/)
    assert.match(yaz, /IKI_NUSHA_KATEGORI/)
    assert.match(yaz, /yaz\('dosya'\)/)
    assert.match(yaz, /yaz\('hasta'\)/)
    const nusha = fs.readFileSync(path.join(process.cwd(), 'app/api/ozel-brans/nusha/route.ts'), 'utf8')
    assert.match(nusha, /hastaSahibiMi/)
    assert.match(nusha, /klinikSlugCoz/)
    assert.match(nusha, /status: 404/)
    assert.doesNotMatch(nusha, /status: 403/)
    assert.doesNotMatch(nusha, /bytes/)
    const seans = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/notya-klinik/seans/page.tsx'), 'utf8')
    assert.match(seans, /IkiNushaDosya/)
    assert.match(seans, /nushalar/)
    assert.match(seans, /Dosya nüshası · Hasta nüshası/)
    const dosya = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/notya-klinik/hastalar/[id]/page.tsx'), 'utf8')
    assert.match(dosya, /slug && <IkiNushaDosya/)
    assert.match(dosya, /slug === 'sac-ekimi' && <SacFotoDosya/)
    const portal = fs.readFileSync(path.join(process.cwd(), 'app/api/portal/hasta/[token]/route.ts'), 'utf8')
    assert.match(portal, /seans-defter/)
  })
})