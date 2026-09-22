import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CEK_LISTE_SORU,
  cekListeAsistanCevabi,
  cekListeDogrula,
  cekListeDogrulamaMetni,
  cekListePromptBlogu,
  cekListeSorulduMu,
  muayeneCekListesi,
} from './muayeneCekListesi'

describe('muayene çek listesi — evrensel kutu, branşa özel madde', () => {
  it('Gökhan pediatri listesinde baş çevresi / aşı var; KD ve kardiyolojide yok', () => {
    const ped = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: '2022-01-01' })
    const kd = muayeneCekListesi({ seansBransi: 'kadin-hastaliklari-dogum', hastaDogumIso: '2022-01-01' })
    const kar = muayeneCekListesi({ seansBransi: 'kardiyoloji', hastaDogumIso: '2022-01-01' })
    assert.ok(ped.some((m) => m.id === 'basCevresi'))
    assert.ok(ped.some((m) => m.id === 'asi'))
    assert.ok(ped.some((m) => m.id === 'sikayet'))
    assert.ok(!kd.some((m) => m.id === 'basCevresi' || m.id === 'asi'))
    assert.ok(kd.some((m) => m.id === 'sat' || m.id === 'jine'))
    assert.ok(!kar.some((m) => m.id === 'basCevresi' || m.id === 'asi'))
    assert.ok(kar.some((m) => m.id === 'oskultasyon'))
  })

  it('göz VA/GİB taşır, baş çevresi taşımaz; branşsız yalnız ortak anamnez', () => {
    const goz = muayeneCekListesi({ seansBransi: 'goz-hastaliklari' })
    const bos = muayeneCekListesi({})
    assert.ok(goz.some((m) => m.id === 'va'))
    assert.ok(!goz.some((m) => m.id === 'basCevresi'))
    assert.ok(bos.some((m) => m.id === 'sikayet'))
    assert.ok(!bos.some((m) => m.id === 'basCevresi'))
  })

  it('hekim işareti veya dosya anahtarı doğrular; uydurma yok', () => {
    const maddeler = muayeneCekListesi({ seansBransi: 'pediatri' })
    const d = cekListeDogrula(maddeler, {
      transcript: 'Şikayet: öksürük üç gündür. Boğaz hiperemik.',
      isaretler: { kilo: true },
    })
    assert.equal(d.find((s) => s.id === 'kilo')?.durum, 'hekim')
    assert.equal(d.find((s) => s.id === 'sikayet')?.durum, 'dosyada')
    assert.equal(d.find((s) => s.id === 'basCevresi')?.durum, 'eksik')
    const metin = cekListeDogrulamaMetni(d)
    assert.match(metin, /Baş çevresi/)
    assert.match(metin, /uydurulmadı/)
  })

  it('hazır soru yakalanır; SOAP promptu gövdeye uydurmayı yasaklar', () => {
    assert.equal(cekListeSorulduMu(CEK_LISTE_SORU), true)
    assert.equal(cekListeSorulduMu('çek listesini göster'), true)
    assert.equal(cekListeSorulduMu('alerjisi var mı'), false)
    const p = cekListePromptBlogu(muayeneCekListesi({ seansBransi: 'dahiliye' }), {})
    assert.match(p, /uydurma YASAK/)
    assert.match(p, /aiDegerlendirme/)
  })

  it('Ayşe cevabı madde listeler; boş branş uydurmaz', () => {
    const c = cekListeAsistanCevabi(muayeneCekListesi({ seansBransi: 'pediatri' }))
    assert.match(c, /Baş çevresi/)
    assert.match(c, /Aşı/)
    assert.match(cekListeAsistanCevabi([]), /henüz önerilen/)
  })

  it('UI ve seans omurgası evrensel kutuyu kullanır; pediatri sızıntısı yok', () => {
    const ui = readFileSync(new URL('../../components/doktor/MuayeneCekListesi.tsx', import.meta.url), 'utf8')
    const seans = readFileSync(new URL('../../app/session/new/page.tsx', import.meta.url), 'utf8')
    const ayse = readFileSync(new URL('../../components/doktor/HastaKonsult.tsx', import.meta.url), 'utf8')
    const css = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8')
    assert.match(ui, /CEK_LISTE_BASLIK/)
    assert.match(ui, /data-cek-toggle/)
    assert.match(ui, /data-cek-govde/)
    assert.match(seans, /MuayeneCekListesi/)
    assert.match(seans, /notya-seans-sayfa/)
    assert.match(seans, /notya-seans-aksiyon/)
    assert.match(ayse, /CEK_LISTE_SORU/)
    assert.match(css, /data-cek-govde/)
    assert.match(css, /notya-seans-aksiyon/)
    assert.ok(!/Baş Çevresi/.test(ui))
    assert.ok(!/Baş Çevresi/.test(seans))
    assert.match(seans, /cekListeSifirla/)
    assert.match(seans, /hastaDogumIso/)
  })

  it('yenidoğanda göbek / NTP / 1. hafta izlemi var; 4 yaşta yok; KD yenidoğana sızmaz', () => {
    const gun = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)
    const yenidogan = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: gun(3) })
    const dortYas = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: gun(4 * 365) })
    const kdBebek = muayeneCekListesi({ seansBransi: 'kadin-hastaliklari-dogum', hastaDogumIso: gun(3) })
    assert.ok(yenidogan.some((m) => m.id === 'sc_gobek'))
    assert.ok(yenidogan.some((m) => m.id === 'sc_ntp'))
    assert.ok(yenidogan.some((m) => m.id === 'sc_izlem_hafta1' || /1\.\s*hafta/i.test(m.etiket)))
    assert.ok(yenidogan.some((m) => m.id === 'basCevresi'))
    assert.ok(!dortYas.some((m) => m.id === 'sc_gobek' || m.id === 'sc_ntp'))
    assert.ok(dortYas.some((m) => m.id === 'basCevresi'))
    assert.ok(!kdBebek.some((m) => String(m.id).startsWith('sc_')))
    assert.ok(!kdBebek.some((m) => m.id === 'basCevresi'))
  })

  it('18 aylıkta otizm / M-CHAT hatırlatması var, göbek yok', () => {
    const onsekizIso = new Date(Date.now() - Math.round(18 * 30.4375) * 86_400_000).toISOString().slice(0, 10)
    const onsekiz = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: onsekizIso })
    assert.ok(onsekiz.some((m) => /otizm|M-CHAT/i.test(m.etiket)))
    assert.ok(!onsekiz.some((m) => m.id === 'sc_gobek'))
  })
})
