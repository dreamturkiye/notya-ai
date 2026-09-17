/**
 * NOTYA-ONAY-DONUS-01 — onay sonrası hedefin üç kuralı:
 *  1) kuyruk boşaldıysa hekim "Bekleyen not yok" çıkmazında bırakılmaz, kesinleşmiş nota gider,
 *  2) kuyrukta hâlâ bekleyen not varsa akış bölünmez (kuyrukta kalınır),
 *  3) hasta bağlı olmayan notta bile dönüş bağlantısı ölü olmaz (hasta listesine düşer).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  onaylananNotYolu,
  hastaDosyasiYolu,
  onaySonrasiHedef,
  HASTA_LISTESI_YOLU,
  ONAYLANAN_NOTU_AC,
} from './onaySonrasiYol'

test('onaylananNotYolu: hasta dosyasından açılan kesinleşmiş not sayfasının ta kendisi', () => {
  assert.equal(onaylananNotYolu('abc-123'), '/dashboard/doktor/notlar/abc-123/yazdir')
})

test('onaylananNotYolu: id kaçışı yapar (bozuk id ile yol kırılmaz)', () => {
  assert.equal(onaylananNotYolu('a/b?c'), '/dashboard/doktor/notlar/a%2Fb%3Fc/yazdir')
})

test('Dr. Gökhan senaryosu: kuyrukta son not onaylandı → kesinleşmiş nota gider', () => {
  assert.deepEqual(onaySonrasiHedef('n1', 0), { tur: 'not', yol: '/dashboard/doktor/notlar/n1/yazdir' })
})

test('kuyrukta hâlâ bekleyen not varsa akış bölünmez', () => {
  assert.deepEqual(onaySonrasiHedef('n1', 1), { tur: 'kuyrukta-kal' })
  assert.deepEqual(onaySonrasiHedef('n1', 7), { tur: 'kuyrukta-kal' })
})

test('not kimliği yoksa yönlendirme yapılmaz (boş sayfaya atılmaz)', () => {
  assert.deepEqual(onaySonrasiHedef('', 0), { tur: 'kuyrukta-kal' })
  assert.deepEqual(onaySonrasiHedef('   ', 0), { tur: 'kuyrukta-kal' })
})

test('bozuk kalan sayısı kuyrukta tutmaz — hekim yine nota gider', () => {
  assert.deepEqual(onaySonrasiHedef('n1', Number.NaN), { tur: 'not', yol: '/dashboard/doktor/notlar/n1/yazdir' })
  assert.deepEqual(onaySonrasiHedef('n1', -1), { tur: 'not', yol: '/dashboard/doktor/notlar/n1/yazdir' })
})

test('hastaDosyasiYolu: hasta varsa dosyasına, yoksa listeye — ölü bağlantı yok', () => {
  assert.equal(hastaDosyasiYolu('p1'), '/dashboard/doktor/hastalar/p1')
  assert.equal(hastaDosyasiYolu(null), HASTA_LISTESI_YOLU)
  assert.equal(hastaDosyasiYolu(undefined), HASTA_LISTESI_YOLU)
  assert.equal(hastaDosyasiYolu('  '), HASTA_LISTESI_YOLU)
})

test('etiketler Türkçe ve tek kaynakta', () => {
  assert.equal(ONAYLANAN_NOTU_AC, 'Onaylanan notu aç →')
})
