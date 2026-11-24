/**
 * ESNEK-GELISIM — (re)writes the SYNTHETIC regression set the guard runs in `npm test` and `npm run test:el-notu-bekci`
 * (core/elNotu/testing/regresyon-ornek): the synthetic pages, the stand-in production model's recorded answers and the
 * baseline score. Run it ONLY after an intended reader prompt change made the synthetic recordings stale — and only when
 * the real set's guard (`--uretim`, after a production re-record) shows no drop.
 *
 *   npx tsx core/elNotu/testing/regresyonOrnekYaz.mts
 */
import fs from 'node:fs'
import path from 'node:path'
import { ornekSet, canliModel, ornekOrtam } from './regresyonOrnek'
import { kaydedenModel, sayfaOlc } from '../regresyonBekcisi'
import { toplamPuan, type SayfaPuani } from '../degerlendirme'

const d = path.join(path.dirname(new URL(import.meta.url).pathname), 'regresyon-ornek')
fs.mkdirSync(path.join(d, 'sayfalar'), { recursive: true }); fs.mkdirSync(path.join(d, 'kayit'), { recursive: true })
const puanlar: SayfaPuani[] = []
for (const s of ornekSet()) {
  const kayit: Record<string, unknown> = {}
  puanlar.push((await sayfaOlc(s, kaydedenModel(canliModel(s.ad), s.ad, kayit), ornekOrtam())).puan)
  fs.writeFileSync(path.join(d, 'sayfalar', `${s.ad}.json`), JSON.stringify(s, null, 1) + '\n')
  fs.writeFileSync(path.join(d, 'kayit', `${s.ad}.json`), JSON.stringify({ kayit }, null, 1) + '\n')
}
fs.writeFileSync(path.join(d, 'taban.json'), JSON.stringify(toplamPuan(puanlar), null, 2) + '\n')
console.log(JSON.stringify(toplamPuan(puanlar)))
