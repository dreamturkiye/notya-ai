import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kuralOnizlemesiKur, type DuzenlemeSatiri } from './onizleme'
import { duzeltmeAnaliz } from './duzeltmeAnaliz'
import { deltalardanAdaylar } from './kuralTuret'

const satir = (note_id: string, alan: string, onceki: string, sonraki: string): DuzenlemeSatiri => ({ note_id, alan, onceki, sonraki })

function slugBul(onceki: string, sonraki: string, alan: 'plan' | 'alarmBulgulari' | 'objektif' = 'plan', tur?: string): string {
  const adaylar = deltalardanAdaylar(duzeltmeAnaliz({ [alan]: onceki }, { [alan]: sonraki }), 'x')
  return adaylar.find((a) => !tur || a.tur === tur)!.anahtarSlug
}

test('önizleme: terim kuralı kendi nottan cümleyle önce/sonra verir', () => {
  const o1 = 'Ateş olursa gerektiğinde parasetamol verin.'
  const s1 = 'Ateş olursa Lüzumlu halde parasetamol verin.'
  const slug = slugBul(o1, s1, 'plan', 'terim')
  const r = kuralOnizlemesiKur({ anahtar: slug, kanit_not_idler: ['n1', 'n2'] }, [
    satir('n1', 'plan', o1, s1),
    satir('n2', 'plan', 'Kontrol için gerektiğinde başvurun.', 'Kontrol için Lüzumlu halde başvurun.'),
    satir('baskasi', 'plan', 'Başka gerektiğinde.', 'Başka Lüzumlu halde.'),
  ])
  assert.equal(r.var, true)
  assert.equal(r.ciftler.length, 2)
  assert.match(r.ciftler[0].onceki, /gerektiğinde/)
  assert.match(r.ciftler[0].sonraki, /Lüzumlu halde/)
})

test('önizleme: yalnız kural kanıt notlarından; başka doktorun/notun satırı kullanılmaz', () => {
  const o1 = 'Ateş olursa gerektiğinde parasetamol verin.'
  const s1 = 'Ateş olursa Lüzumlu halde parasetamol verin.'
  const slug = slugBul(o1, s1, 'plan', 'terim')
  const r = kuralOnizlemesiKur({ anahtar: slug, kanit_not_idler: ['n1'] }, [satir('yabanci-not', 'plan', o1, s1)])
  assert.equal(r.var, false)
  assert.deepEqual(r.ciftler, [])
})

test('önizleme: silme kuralında sonraki boş (kural bu cümleyi çıkarır)', () => {
  const o = 'Bol sıvı.\nAcil bir durumda acil servise başvurun.'
  const s = 'Bol sıvı.'
  const slug = slugBul(o, s, 'alarmBulgulari', 'silme')
  const r = kuralOnizlemesiKur({ anahtar: slug, kanit_not_idler: ['n1'] }, [satir('n1', 'alarmBulgulari', o, s)])
  assert.equal(r.var, true)
  assert.equal(r.ciftler[0].sonraki, '')
  assert.match(r.ciftler[0].onceki, /acil servise/)
})

test('önizleme: doz değeri asla kural → önizleme yok; klinik: kuralı için örnek yok', () => {
  const o = 'Amoksisilin 400 mg 2 dozda.'
  const s = 'Amoksisilin 250 mg 2 dozda.'
  const rows = [satir('n1', 'plan', o, s)]
  assert.equal(kuralOnizlemesiKur({ anahtar: 'doz-degeri-plan', kanit_not_idler: ['n1'] }, rows).var, false)
  assert.equal(deltalardanAdaylar(duzeltmeAnaliz({ plan: o }, { plan: s }), 'n1').some((a) => a.tur === 'doz_degeri'), false)
  assert.equal(kuralOnizlemesiKur({ anahtar: 'klinik:terim-a-b', kanit_not_idler: ['n1'] }, rows).var, false)
})

test('önizleme: en çok 2 çift, kişisel ad/TC maskelenir', () => {
  const o = 'Ahmet Yılmaz 12345678901 gerektiğinde dinlensin.'
  const s = 'Ahmet Yılmaz 12345678901 Lüzumlu halde dinlensin.'
  const slug = slugBul(o, s, 'plan', 'terim')
  const rows = ['n1', 'n2', 'n3'].map((n) => satir(n, 'plan', o, s))
  const r = kuralOnizlemesiKur({ anahtar: slug, kanit_not_idler: ['n1', 'n2', 'n3'] }, rows)
  assert.equal(r.ciftler.length, 2)
  const hepsi = JSON.stringify(r)
  assert.ok(!/12345678901|Ahmet Yılmaz/.test(hepsi))
})
