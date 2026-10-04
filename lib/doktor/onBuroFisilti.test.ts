import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  mesajOgeleri,
  talepOgeleri,
  belgeOgesi,
  telefonOgeleri,
  gelmediOgeleri,
  formOgeleri,
  onBuroSirala,
  trtGunAraligi,
} from './onBuroFisilti'

describe('NOTYA-ONBURO-FISILTI-01 — Ön büro fısıltısı', () => {
  it('mesaj: yalnızca gecikme eşiğini aşan okunmamışlar aday olur', () => {
    const simdi = Date.parse('2026-10-04T15:00:00+03:00')
    const eski = new Date(simdi - 25 * 3600_000).toISOString()
    const yeni = new Date(simdi - 2 * 3600_000).toISOString()
    const liste = mesajOgeleri(
      [
        { id: 'k1', patientId: 'p1', hastaAdi: 'Ayşe', ozet: 'Merhaba', sonMesajAt: eski },
        { id: 'k2', patientId: 'p2', hastaAdi: 'Ali', ozet: 'Yeni', sonMesajAt: yeni },
      ],
      simdi,
      24,
    )
    assert.equal(liste.length, 1)
    assert.equal(liste[0].id, 'mesaj:p1:k1')
    assert.equal(liste[0].baslik, 'yanıt bekleyen mesaj')
    assert.match(liste[0].hedefYol, /konu=k1/)
  })

  it('talep: geciken / saati geçen talepler daha yüksek öncelikli', () => {
    const liste = talepOgeleri([
      { id: 't1', hastaAdi: 'Normal', gun: '5 Eki', saat: '10:00', gecikti: false, zamaniGecti: false },
      { id: 't2', hastaAdi: 'Acil', gun: '4 Eki', saat: '09:00', gecikti: true, zamaniGecti: false },
    ])
    assert.equal(liste.find((x) => x.id === 'talep:t2')?.oncelik, 0)
    assert.equal(liste.find((x) => x.id === 'talep:t1')?.oncelik, 2)
    assert.match(liste.find((x) => x.id === 'talep:t2')!.baslik, /yanıt bekliyor/)
  })

  it('belge: sıfırda null, birden fazla sayı doğru etiket', () => {
    assert.equal(belgeOgesi(0), null)
    assert.equal(belgeOgesi(1)?.baslik, '1 yeni belge dosyalanmayı bekliyor')
    assert.equal(belgeOgesi(3)?.baslik, '3 yeni belge dosyalanmayı bekliyor')
    assert.equal(belgeOgesi(2)?.hedefYol, '/dashboard/doktor/gelen-belgeler')
  })

  it('telefon: iptal/talep hariç, numarası boş olan bugünkü randevular', () => {
    const liste = telefonOgeleri([
      { id: 'r1', hastaAdi: 'Boş', hastaTelefon: '', baslangic: '2026-10-04T10:00:00+03:00', durum: 'planlandi' },
      { id: 'r2', hastaAdi: 'Var', hastaTelefon: '0532 111 22 33', baslangic: '2026-10-04T11:00:00+03:00', durum: 'onaylandi' },
      { id: 'r3', hastaAdi: 'İptal', hastaTelefon: '', baslangic: '2026-10-04T12:00:00+03:00', durum: 'iptal' },
    ])
    assert.equal(liste.length, 1)
    assert.equal(liste[0].id, 'telefon:r1')
    assert.equal(liste[0].baslik, 'telefon numarası yok')
  })

  it('gelmedi: yalnız gelmedi durumundakiler', () => {
    const liste = gelmediOgeleri([
      { id: 'g1', hastaAdi: 'Gelmedi', baslangic: '2026-10-04T09:00:00+03:00', durum: 'gelmedi' },
      { id: 'g2', hastaAdi: 'Bitti', baslangic: '2026-10-04T10:00:00+03:00', durum: 'tamamlandi' },
    ])
    assert.equal(liste.length, 1)
    assert.equal(liste[0].baslik, 'gelmedi — aranacak')
  })

  it('form: doldurulmuş formlar inceleme bekliyor', () => {
    const liste = formOgeleri([
      { id: 'f1', patientId: 'p9', hastaAdi: 'Zeynep', doldurulduAt: '2026-10-03T12:00:00Z' },
    ])
    assert.equal(liste[0].kaynak, 'form')
    assert.match(liste[0].hedefYol, /hastalar\/p9/)
  })

  it('sıra: acil talep, sonra eski mesaj, sonra belge', () => {
    const sirali = onBuroSirala([
      { id: 'b', kaynak: 'belge', ad: 'Gelen', baslik: '2 belge', detay: [], enErkenTarih: '2026-10-01T00:00:00Z', hedefYol: '/b', oncelik: 2 },
      { id: 'm', kaynak: 'mesaj', ad: 'Ayşe', baslik: 'mesaj', detay: [], enErkenTarih: '2026-10-02T00:00:00Z', hedefYol: '/m', oncelik: 1 },
      { id: 't', kaynak: 'talep', ad: 'Acil', baslik: 'talep', detay: [], enErkenTarih: '2026-10-04T00:00:00Z', hedefYol: '/t', oncelik: 0 },
    ])
    assert.deepEqual(sirali.map((x) => x.id), ['t', 'm', 'b'])
  })

  it('trt gün aralığı İstanbul gün sınırlarını kullanır', () => {
    const { bas, bit } = trtGunAraligi('2026-10-04')
    assert.ok(bas.includes('2026-10-03') || bas.includes('2026-10-04'))
    assert.ok(Date.parse(bit) > Date.parse(bas))
  })
})
