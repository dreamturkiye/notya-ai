/**
 * MOBIL-PERSONEL-01 — the permission map: every role x every capability, the route table, and the guarantee
 * that the unchanged secretary keeps every route she had.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import {
  PERSONEL_ROLLERI, ROL_YETKILERI, TUM_YETKILER, ROTA_YETKILERI, izinVarMi, kuralBul, personelRoluMu, yolIzniVarMi,
  type PratikRol, type Yetki,
} from './personelYetki'

const KOK = resolve(__dirname, '../..')

/** The expected matrix, written out by hand (NOT derived from ROL_YETKILERI) so a silent edit fails here. */
const BEKLENEN: Record<PratikRol, Yetki[]> = {
  doktor: [...TUM_YETKILER],
  // Frozen: what a secretary could do before this change (every pratikOturum route not guarded by sadeceDoktor/doktorOturum).
  sekreter: [
    'randevu.gor', 'randevu.yonet', 'hasta.liste', 'hasta.kayit', 'hasta.dosya.oku', 'hasta.dosya.yaz',
    'olcum.ekle', 'iletisim.gonder', 'iletisim.toplu', 'mesaj', 'intake.oku', 'intake.yonet', 'portal.baglanti', 'gelen_belge',
    'onburo', 'fatura', 'ayar', 'ai.asistan', 'hesap.kendi',
  ],
  asistan: ['randevu.gor', 'hasta.liste', 'hasta.dosya.oku', 'not.oku', 'olcum.ekle', 'ek.ekle', 'intake.oku', 'hesap.kendi'],
  hasta_danismani: ['randevu.gor', 'randevu.yonet', 'hasta.liste', 'hasta.kayit', 'iletisim.gonder', 'mesaj', 'intake.oku', 'intake.yonet', 'portal.baglanti', 'hesap.kendi'],
}

describe('rol x yetki matrisi', () => {
  for (const rol of Object.keys(BEKLENEN) as PratikRol[]) {
    for (const y of TUM_YETKILER) {
      const beklenen = BEKLENEN[rol].includes(y)
      it(`${rol} · ${y} → ${beklenen ? 'VAR' : 'yok'}`, () => {
        assert.equal(izinVarMi(rol, y), beklenen)
      })
    }
  }

  it('sekreter yetkileri değişmedi (donmuş küme) ve ek ek-yetki kazanmadı', () => {
    assert.deepEqual([...ROL_YETKILERI.sekreter].sort(), [...BEKLENEN.sekreter].sort())
    for (const yok of ['ek.ekle', 'not.onayla', 'personel.yonet', 'recete'] as Yetki[]) assert.equal(izinVarMi('sekreter', yok), false, yok)
  })

  it('hiçbir personel rolü onay / fatura(asistan,danışman) / ayar / personel yönetimi / reçete yetkisi taşımaz', () => {
    for (const rol of ['asistan', 'hasta_danismani'] as PratikRol[]) {
      for (const y of ['not.onayla', 'fatura', 'ayar', 'personel.yonet', 'recete', 'ai.asistan', 'gelen_belge', 'iletisim.toplu'] as Yetki[]) {
        assert.equal(izinVarMi(rol, y), false, `${rol} ${y}`)
      }
    }
    assert.equal(izinVarMi('sekreter', 'not.onayla'), false)
  })

  it('asistan not içeriğini okur ama yazamaz; danışman not içeriğini okuyamaz', () => {
    assert.equal(izinVarMi('asistan', 'not.oku'), true)
    assert.equal(izinVarMi('asistan', 'not.yaz'), false)
    assert.equal(izinVarMi('hasta_danismani', 'not.oku'), false)
    assert.equal(izinVarMi('hasta_danismani', 'hasta.dosya.oku'), false)
  })

  it('personelRoluMu yalnız üç rolü kabul eder', () => {
    for (const r of PERSONEL_ROLLERI) assert.equal(personelRoluMu(r), true)
    for (const r of ['doktor', 'admin', '', null, undefined, 'Sekreter', 'asistan ']) assert.equal(personelRoluMu(r), false, String(r))
  })

  it('bilinmeyen / boş rol hiçbir yetki alamaz', () => {
    assert.equal(izinVarMi(null, 'hesap.kendi'), false)
    assert.equal(izinVarMi('admin' as PratikRol, 'hesap.kendi'), false)
  })
})

describe('rota tablosu', () => {
  it('en uzun eşleşme kazanır', () => {
    assert.equal(kuralBul('/api/doktor/iletisim/toplu/gonder')?.yol, '/api/doktor/iletisim/toplu')
    assert.equal(kuralBul('/api/doktor/iletisim/kuyruk')?.yol, '/api/doktor/iletisim')
    assert.equal(kuralBul('/api/doktor/hastalar/abc/olcumler')?.yol, '/api/doktor/hastalar/[id]/olcumler')
    assert.equal(kuralBul('/api/doktor/hastalar/abc')?.yol, '/api/doktor/hastalar')
  })

  it('doktor her yola girer; sekreter yalnız sekreterKapali kurallar dışında (eski davranış)', () => {
    assert.deepEqual(yolIzniVarMi('doktor', '/api/herhangi/yeni', 'DELETE'), { izin: true })
    assert.deepEqual(yolIzniVarMi('sekreter', '/api/herhangi/yeni', 'POST'), { izin: true })
    assert.equal(yolIzniVarMi('sekreter', '/api/doktor/hastalar/x/olcumler', 'POST').izin, false)
    assert.equal(yolIzniVarMi('sekreter', '/api/doktor/documents', 'POST').izin, false)
  })

  it('sınıflandırılmamış yol asistan ve danışmana KAPALI (varsayılan ret)', () => {
    for (const rol of ['asistan', 'hasta_danismani'] as PratikRol[]) {
      assert.deepEqual(yolIzniVarMi(rol, '/api/doktor/yeni-bir-rota', 'GET'), { izin: false, neden: 'sinifsiz' })
    }
  })

  it('asistan: okur, ölçüm/ek ekler, onaylayamaz/silemez/yazamaz', () => {
    const a = (y: string, m: string) => yolIzniVarMi('asistan', y, m).izin
    assert.equal(a('/api/doktor/hastalar', 'GET'), true)
    assert.equal(a('/api/doktor/hastalar/1', 'GET'), true)
    assert.equal(a('/api/doktor/hastalar/1', 'PUT'), false)
    assert.equal(a('/api/doktor/hastalar', 'POST'), false)
    assert.equal(a('/api/notes/1', 'GET'), true)
    assert.equal(a('/api/notes/1', 'DELETE'), false)
    assert.equal(a('/api/notes/1/approve', 'POST'), false)
    assert.equal(a('/api/doktor/hastalar/1/olcumler', 'POST'), true)
    assert.equal(a('/api/doktor/documents', 'POST'), true)
    assert.equal(a('/api/doktor/documents/1', 'DELETE'), false)
    assert.equal(a('/api/doktor/randevular', 'GET'), true)
    assert.equal(a('/api/doktor/randevular', 'POST'), false)
    assert.equal(a('/api/doktor/randevular/1', 'PATCH'), false)
    assert.equal(a('/api/accounting/invoices', 'GET'), false)
    assert.equal(a('/api/doktor/personel', 'GET'), false)
    assert.equal(a('/api/doktor/iletisim/kayit', 'POST'), false)
    assert.equal(a('/api/doktor/mesajlar', 'GET'), false)
    assert.equal(a('/api/doktor/gelen-belgeler', 'GET'), false)
    assert.equal(a('/api/doktor/medula/recete', 'POST'), false)
    assert.equal(a('/api/doktor/konsult', 'POST'), false)
  })

  it('hasta danışmanı: randevu / iletişim / bilgi formu / portal; not içeriği, fatura, ayar, ölçüm, ek yok', () => {
    const h = (y: string, m: string) => yolIzniVarMi('hasta_danismani', y, m).izin
    assert.equal(h('/api/doktor/randevular', 'POST'), true)
    assert.equal(h('/api/doktor/randevular/1', 'PATCH'), true)
    assert.equal(h('/api/doktor/hastalar', 'GET'), true)
    assert.equal(h('/api/doktor/hastalar/1', 'PUT'), true)
    assert.equal(h('/api/doktor/iletisim/kayit', 'POST'), true)
    assert.equal(h('/api/doktor/iletisim/toplu/gonder', 'POST'), false)
    assert.equal(h('/api/doktor/iletisim/ayarlar', 'PUT'), false)
    assert.equal(h('/api/doktor/mesajlar', 'POST'), true)
    assert.equal(h('/api/doktor/intake-formlari', 'POST'), true)
    assert.equal(h('/api/doktor/randevu-portal/talepler', 'POST'), true)
    assert.equal(h('/api/doktor/randevu-portal/ayar', 'PUT'), false)
    assert.equal(h('/api/notes/1', 'GET'), false)
    assert.equal(h('/api/doktor/son-notlar', 'GET'), false)
    assert.equal(h('/api/doktor/hastalar/1/sessions', 'GET'), false)
    assert.equal(h('/api/doktor/hastalar/1/olcumler', 'POST'), false)
    assert.equal(h('/api/doktor/documents', 'GET'), false)
    assert.equal(h('/api/accounting/invoices', 'GET'), false)
    assert.equal(h('/api/doktor/calisma-saatleri', 'PUT'), false)
    assert.equal(h('/api/doktor/gelen-belgeler', 'GET'), false)
    assert.equal(h('/api/doktor/personel', 'POST'), false)
  })

  it('her personel rolü kendi hesabını (şifre / avatar / oturum / me) kullanır', () => {
    for (const rol of PERSONEL_ROLLERI) {
      for (const y of ['/api/personel/me', '/api/personel/avatar', '/api/doktor/hesap/sifre-degistir', '/api/doktor/hesap/oturum']) {
        assert.equal(yolIzniVarMi(rol, y, 'GET').izin, true, `${rol} ${y}`)
        assert.equal(yolIzniVarMi(rol, y, 'DELETE').izin, true, `${rol} ${y}`)
      }
    }
  })

  it('tablodaki her kural geçerli yetki adı kullanır', () => {
    for (const k of ROTA_YETKILERI) for (const y of [k.oku, k.yaz]) if (y) assert.ok(TUM_YETKILER.includes(y), `${k.yol}: ${y}`)
  })
})

// ─── Every API file that resolves a practice session must be classified ──────────────────────────────
function dosyalar(dir: string, cikti: string[] = []): string[] {
  for (const ad of readdirSync(dir)) {
    const yol = join(dir, ad)
    if (statSync(yol).isDirectory()) dosyalar(yol, cikti)
    else if (ad === 'route.ts' || ad === 'route.tsx') cikti.push(yol)
  }
  return cikti
}
function rotaYolu(dosya: string): string {
  const r = '/' + relative(KOK, dosya).replace(/\\/g, '/').replace(/^app\//, '').replace(/\/route\.tsx?$/, '')
  return r.replace(/\[[^\]]+\]/g, '[id]')
}
const PRATIK_ROTALAR = dosyalar(join(KOK, 'app/api'))
  .filter((d) => /pratikOturum/.test(readFileSync(d, 'utf8')) || /gelenBelgeOturum|muayeneEk\/rotaOn/.test(readFileSync(d, 'utf8')))
  .map(rotaYolu)

describe('pratikOturum kullanan her rota sınıflandırılmış', () => {
  it('rota listesi boş değil (tarama çalışıyor)', () => {
    assert.ok(PRATIK_ROTALAR.length > 50, `yalnız ${PRATIK_ROTALAR.length} rota bulundu`)
  })
  for (const yol of PRATIK_ROTALAR) {
    it(`${yol}`, () => {
      assert.ok(kuralBul(yol), `${yol} personelYetki.ts ROTA_YETKILERI'nde yok — yeni rota asistan/danışmana varsayılan KAPALI kalır ama açıkça sınıflandırılmalı`)
    })
  }
  it('sekreter, sekreterKapali olmayan her mevcut rotada eskisi gibi girer (hiçbir yetki kaybı yok)', () => {
    const YENI_ROTALAR = new Set(['/api/doktor/hastalar/[id]/olcumler', '/api/doktor/documents', '/api/doktor/documents/[id]', '/api/doktor/documents/[id]/download', '/api/doktor/hesap/oturum', '/api/doktor/ilk-adimlar'])
    // MOBIL-PERSONEL-04: the only deliberate secretary loss — clinical note content (read) and note deletion.
    const NOT_KAPALI = (y: string) => y === '/api/doktor/son-notlar' || y === '/api/notes' || y.startsWith('/api/notes/')
    for (const yol of PRATIK_ROTALAR) {
      // FOTO-ARSIV-01: the clinical photo archive never served the secretary (closed to her on purpose).
      if (YENI_ROTALAR.has(yol) || NOT_KAPALI(yol) || yol.startsWith('/api/doktor/hasta-foto')) continue
      for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        assert.equal(yolIzniVarMi('sekreter', yol, m).izin, true, `sekreter ${m} ${yol}`)
      }
    }
  })
  it('MOBIL-PERSONEL-04: sekreter muayene notunu okuyamaz ve hiçbir notu silemez; doktor ve asistan okuyabilir', () => {
    for (const m of ['GET', 'DELETE', 'PATCH', 'PUT', 'POST']) {
      assert.equal(yolIzniVarMi('sekreter', '/api/notes/[id]', m).izin, false, `sekreter ${m} /api/notes/[id]`)
      assert.equal(yolIzniVarMi('sekreter', '/api/notes/abc-123', m).izin, false, `sekreter ${m} /api/notes/abc-123`)
    }
    assert.equal(yolIzniVarMi('sekreter', '/api/doktor/son-notlar', 'GET').izin, false)
    assert.equal(izinVarMi('sekreter', 'not.oku'), false)
    assert.equal(izinVarMi('sekreter', 'not.yaz'), false)
    assert.equal(yolIzniVarMi('doktor', '/api/notes/[id]', 'DELETE').izin, true)
    assert.equal(yolIzniVarMi('asistan', '/api/notes/[id]', 'GET').izin, true)
    assert.equal(yolIzniVarMi('asistan', '/api/notes/[id]', 'DELETE').izin, false)
  })
  it('asistan ve danışman hiçbir rotada onay / silme / personel yönetimi / reçete / fatura yapamaz', () => {
    const YASAK = [/\/approve$/, /\/accounting/, /\/doktor\/personel$/, /\/doktor\/personel\/\[id\]$/, /\/medula/, /\/erecete-ayar/, /\/araclar\/enabiz/, /\/asi-stok/]
    for (const yol of PRATIK_ROTALAR.filter((y) => YASAK.some((r) => r.test(y)))) {
      for (const rol of ['asistan', 'hasta_danismani'] as PratikRol[]) {
        for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
          assert.equal(yolIzniVarMi(rol, yol, m).izin, false, `${rol} ${m} ${yol}`)
        }
      }
    }
  })
  it('asistan: pratikOturum rotalarında yazma izni yalnız ölçüm, ek ve kendi hesabı için var', () => {
    const yazilabilen = new Set<string>()
    for (const yol of PRATIK_ROTALAR) {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].some((m) => yolIzniVarMi('asistan', yol, m).izin)) yazilabilen.add(yol)
    }
    assert.deepEqual(
      [...yazilabilen].sort(),
    // Country build: 3 of main's 4 extra routes (hasta-foto kucuk, hastalar olcumler, hesap oturum) do not exist here yet;
    // `documents` exists but its route.ts has not been migrated to pratikOturum() here. Verified empirically, not assumed.
      ['/api/doktor/hesap/sifre-degistir', '/api/personel/avatar', '/api/personel/me'],
    )
  })
})

describe('FOTO-ARSIV-01: klinik fotoğraf arşivi rol kapıları', () => {
  const ARSIV = ['/api/doktor/hasta-foto/p1', '/api/doktor/hasta-foto/p1/b1', '/api/doktor/hasta-foto/p1/b1/dosya', '/api/doktor/hasta-foto/p1/toplu', '/api/doktor/hasta-foto/p1/rapor', '/api/doktor/hasta-foto/p1/b1/kucuk']
  const AI = ['/api/doktor/hasta-foto/p1/b1/ai', '/api/doktor/hasta-foto/p1/b1/ai/karsilastir', '/api/doktor/hasta-foto/p1/b1/ai/geri-bildirim', '/api/doktor/hasta-foto/p1/kalite']
  it('sekreter klinik fotoğrafı göremez (hiçbir yöntem)', () => {
    for (const y of [...ARSIV, ...AI]) for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) assert.equal(yolIzniVarMi('sekreter', y, m).izin, false, `sekreter ${m} ${y}`)
  })
  it('hasta danışmanı klinik fotoğrafı göremez', () => {
    for (const y of [...ARSIV, ...AI]) for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) assert.equal(yolIzniVarMi('hasta_danismani', y, m).izin, false, `danisman ${m} ${y}`)
  })
  it('asistan arşivi okur, yalnız küçük resim yükler; düzenleyemez, dışa aktaramaz, AI çağıramaz', () => {
    const a = (y: string, m: string) => yolIzniVarMi('asistan', y, m).izin
    assert.equal(a('/api/doktor/hasta-foto/p1', 'GET'), true)
    assert.equal(a('/api/doktor/hasta-foto/p1/b1', 'GET'), true)
    assert.equal(a('/api/doktor/hasta-foto/p1/b1/dosya', 'GET'), true)
    assert.equal(a('/api/doktor/hasta-foto/p1/b1/kucuk', 'GET'), true)
    assert.equal(a('/api/doktor/hasta-foto/p1/b1/kucuk', 'PUT'), true)
    assert.equal(a('/api/doktor/hasta-foto/p1/b1', 'PATCH'), false)
    assert.equal(a('/api/doktor/hasta-foto/p1/toplu', 'POST'), false)
    assert.equal(a('/api/doktor/hasta-foto/p1/rapor', 'POST'), false)
    for (const y of AI) for (const m of ['GET', 'POST']) assert.equal(a(y, m), false, `asistan ${m} ${y}`)
  })
  it('doktor hepsine girer', () => {
    for (const y of [...ARSIV, ...AI]) assert.equal(yolIzniVarMi('doktor', y, 'POST').izin, true)
  })
})
