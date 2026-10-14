/**
 * GORSEL-YAKALAMA · brans-alan-sizmasi guard (static). Each specialty's inline capture block on the
 * muayene notu screen (app/dashboard/doktor/notlar/[id]/page.tsx) must be gated on its OWN,
 * mutually-exclusive kapsam.brans literal — never a shared/looser condition, never two specialties
 * behind the same gate, never a specialty rendering another's component. Companion to
 * .cursor/skills/brans-alan-sizmasi/SKILL.md. See also lib/doktor/gorselYakalama.test.ts (the
 * server-side ownership/visit-linkage checks) and lib/specialties/brans-alan-sizmasi.test.ts (the
 * older head-circumference/veli-language guard, same rule, different source area).
 *
 * Exact-block (not greedy-regex, not a fixed window) on purpose: this source file is large with
 * deeply nested JSX braces, so a "non-} characters" regex spans far past the intended block — and
 * the four gates here are mounted back-to-back (GORSEL-YAKALAMA-02/03/04 directly follow derm's,
 * only ~150-200 chars apart), so even a generous fixed window from one gate reaches into the next
 * one's render. Each gate has the same fixed shape (open on `{kapsam.brans === '<x>' && ... && (`,
 * close on the following `)}` line), so each block is extracted by its own real start/end rather
 * than a guessed length.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const KOK = resolve(__dirname, '../../..');
const kaynak = readFileSync(join(KOK, 'app/dashboard/doktor/notlar/[id]/page.tsx'), 'utf8');
const BLOK_SONU = '\n      )}';

const BLOKLAR = [
  { brans: 'dermatoloji', bilesen: 'DermNotGorselYakala' },
  { brans: 'kulak-burun-bogaz', bilesen: 'KbbNotGorselYakala' },
  { brans: 'plastik-cerrahi', bilesen: 'PlastikNotGorselYakala' },
  { brans: 'goz-hastaliklari', bilesen: 'GozNotGorselYakala' },
];

function kapiIndex(brans: string): number {
  return kaynak.indexOf(`kapsam.brans === '${brans}' && hasta.patientId`);
}

function kapiBlogu(brans: string): string {
  const i = kapiIndex(brans);
  if (i < 0) return '';
  const bitis = kaynak.indexOf(BLOK_SONU, i);
  if (bitis < 0) return kaynak.slice(i);
  return kaynak.slice(i, bitis + BLOK_SONU.length);
}

describe('GORSEL-YAKALAMA · her branş kendi kapısı, kendi bileşeni', () => {
  for (const { brans, bilesen } of BLOKLAR) {
    it(`'${brans}' kapısı hasta.patientId koşuluyla birlikte var ve ${bilesen} içeriyor`, () => {
      const blok = kapiBlogu(brans);
      assert.ok(blok, `"kapsam.brans === '${brans}' && hasta.patientId" bulunamadı`);
      assert.ok(blok.includes(`<${bilesen}`), `${bilesen}, '${brans}' kapısının bloğunda bulunamadı`);
    });

    it(`${bilesen} başka hiçbir branş kapısının bloğunda GEÇMİYOR`, () => {
      for (const diger of BLOKLAR.filter((b) => b.brans !== brans)) {
        const blok = kapiBlogu(diger.brans);
        assert.ok(blok, `"kapsam.brans === '${diger.brans}' && hasta.patientId" bulunamadı`);
        assert.ok(!blok.includes(`<${bilesen}`), `${bilesen}, '${diger.brans}' kapısının bloğuna sızmış`);
      }
    });
  }

  it('dört kapı da birbirinden ayrı branş anahtarı kullanıyor (tekrar/çakışma yok)', () => {
    const anahtarlar = BLOKLAR.map((b) => b.brans);
    assert.equal(new Set(anahtarlar).size, anahtarlar.length, 'İki blok aynı branş anahtarını paylaşıyor');
  });

  it('dört kapı da dosyada TAM OLARAK bir kez geçiyor (çift mount yok)', () => {
    for (const { brans } of BLOKLAR) {
      const desen = `kapsam.brans === '${brans}' && hasta.patientId`;
      const adet = kaynak.split(desen).length - 1;
      assert.equal(adet, 1, `'${brans}' kapısı ${adet} kez geçiyor, 1 olmalı`);
    }
  });
});
