/**
 * NOTYA-EYLEM-28 — generates docs/beta/Ilac-Tablosu-Hekim-Inceleme.html.
 *
 * Why this exists: every one of the 176 entries is `kub_okundu` — read from the molecule's own TİTCK
 * KÜB — and NONE is `hekim_dogruladi`. That third state is not decoration; it is the difference
 * between "a machine read the label" and "a physician signed this line". This sheet is how Dr.
 * Gökhan turns the first into the second, one molecule at a time, on paper.
 *
 * Deliberately paper-shaped: no interactivity, one line per molecule, a checkbox and a correction
 * line. Pediatri and kadın hastalıkları ve doğum molecules come first because that is where a wrong
 * mg/kg hurts a child.
 *
 * Çalıştırma:  npx tsx scripts/ilac-tablosu-inceleme.mts
 * PDF:         tarayıcıda açıp Yazdır → "PDF olarak kaydet" (kenar boşlukları: yok, arka plan: açık)
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { MOLEKUL_SAYISI, TURKISH_DRUGS, dogrulamaSayilari } from '@/lib/asistan/turkishDrugs'
import type { TürkishDrug } from '@/lib/asistan/turkishDrugs'

const CIKTI = 'docs/beta/Ilac-Tablosu-Hekim-Inceleme.html'

/** Reviewed first: a wrong number here reaches a child or a pregnancy. */
const ONCELIK: Record<string, number> = {}
const PEDIATRI_ONCE = [
  'parasetamol', 'ibuprofen', 'metamizol', 'amoksisilin', 'amoksisilinKlavulanat', 'ampisilinSulbaktam',
  'sefuroksim', 'sefdinir', 'sefiksim', 'sefaleksin', 'sefprozil', 'seftriakson', 'azitromisin',
  'klaritromisin', 'eritromisin', 'klindamisin', 'trimetoprimSulfametoksazol', 'fenoksimetilpenisilin',
  'metronidazol', 'nitrofurantoin', 'flukonazol', 'nistatin', 'asiklovir', 'oseltamivir',
  'salbutamol', 'budesonidInhaler', 'montelukast', 'setirizin', 'levosetirizin', 'desloratadin',
  'loratadin', 'feniramin', 'hidroksizin', 'omeprazol', 'lansoprazol', 'domperidon', 'metoklopramid',
  'ondansetron', 'laktuloz', 'simetikon', 'rasekadotril', 'kolekalsiferol', 'cinko', 'demirPolimaltoz',
  'folikAsit', 'prednizolon', 'metilprednizolon', 'levetirasetam', 'valproikAsit', 'karbamazepin',
  'lamotrijin', 'topiramat', 'gabapentin', 'metilfenidat', 'atomoksetin', 'risperidon', 'aripiprazol',
  'spironolakton', 'furosemid', 'digoksin', 'propranolol', 'metildopa', 'amlodipin', 'lizinopril',
  'valsartan', 'metformin', 'levotiroksin', 'tiamazol', 'propiltiourasil', 'izoniazid', 'rifampisin',
  'siprofloksasin', 'hidroksiklorokin', 'allopurinol', 'sulfasalazin', 'kolsisin', 'izotretinoin',
]
const KHD = [
  'folikAsit', 'demirPolimaltoz', 'progesteron', 'didrogesteron', 'drospirenonEtinilestradiol',
  'levonorgestrelEtinilestradiol', 'levonorgestrelAcil', 'klomifen', 'traneksamikAsit', 'misoprostol',
  'metilergonovin', 'metotreksat', 'kolekalsiferol',
]
PEDIATRI_ONCE.forEach((k, i) => { ONCELIK[k] = i })
KHD.forEach((k, i) => { if (ONCELIK[k] === undefined) ONCELIK[k] = 1000 + i })

const kacis = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function grup(anahtar: string): string {
  if (PEDIATRI_ONCE.includes(anahtar) && KHD.includes(anahtar)) return 'Pediatri + KHD'
  if (PEDIATRI_ONCE.includes(anahtar)) return 'Pediatri'
  if (KHD.includes(anahtar)) return 'Kadın hastalıkları ve doğum'
  return 'Diğer branşlar'
}

function pediSatiri(d: TürkishDrug): string {
  if (d.pediatrik) {
    const p = d.pediatrik
    const aralik = p.min === undefined ? '—' : p.max !== undefined && p.max !== p.min ? `${p.min}–${p.max}` : `${p.min}`
    const bolum = p.gunlukBolum && p.gunlukBolum > 1 ? `, ${p.gunlukBolum} doza bölünmüş` : ''
    return `<b>${kacis(aralik)} ${kacis(p.birim)}</b>${kacis(bolum)}`
  }
  if (d.pediatricDose) return kacis(d.pediatricDose)
  return '<span class="yok">pediatrik doz YOK (bilerek boş)</span>'
}

function tavanSatiri(d: TürkishDrug): string {
  const p = d.pediatrik
  const parca: string[] = []
  if (p?.maxMgKgGun !== undefined) parca.push(`${p.maxMgKgGun} mg/kg/gün`)
  if (p?.mutlakMaxMgGun !== undefined) parca.push(`mutlak ${p.mutlakMaxMgGun} mg/gün`)
  if (p?.mutlakMaxMgDoz !== undefined) parca.push(`tek doz ${p.mutlakMaxMgDoz} mg`)
  return parca.length ? kacis(parca.join(' · ')) : '<span class="yok">tavan YOK → doz aşımı hükmü verilmiyor</span>'
}

function yasSatiri(d: TürkishDrug): string {
  const a = d.yasKontrendikasyonAy
  if (a === undefined) return '<span class="yok">yaş sınırı yazılmadı</span>'
  return a < 24 ? `<b>${a} ay altı</b>` : `<b>${Math.round(a / 12)} yaş altı</b>`
}

function etkilesimSatiri(d: TürkishDrug): string {
  const e = d.etkilesimler || []
  if (!e.length) return '<span class="yok">etkileşim satırı yok</span>'
  const ciddi = e.filter((x) => x.siddet === 'ciddi').map((x) => x.ile)
  const orta = e.filter((x) => x.siddet === 'orta').map((x) => x.ile)
  const parca: string[] = []
  if (ciddi.length) parca.push(`<b>CİDDİ:</b> ${kacis(ciddi.join(', '))}`)
  if (orta.length) parca.push(`<span class="orta">orta:</span> ${kacis(orta.join(', '))}`)
  return parca.join('<br>')
}

function satir(anahtar: string, d: TürkishDrug, sira: number): string {
  return `
  <tr class="molekul">
    <td class="no">${sira}</td>
    <td>
      <div class="ad">${kacis(d.name)}</div>
      <div class="marka">${kacis(d.brand.slice(0, 4).join(', '))}</div>
      <div class="sinif">${kacis(d.category)}${d.renkliRecete && d.renkliRecete !== 'normal' ? ` · <span class="renk ${kacis(d.renkliRecete)}">${d.renkliRecete === 'yesil' ? 'YEŞİL REÇETE' : 'KIRMIZI REÇETE'}</span>` : ''}</div>
    </td>
    <td>
      <div><span class="et">Erişkin:</span> ${kacis(d.dose)}</div>
      <div><span class="et">Pediatrik:</span> ${pediSatiri(d)}</div>
      <div><span class="et">Tavan:</span> ${tavanSatiri(d)}</div>
      <div><span class="et">Yaş sınırı:</span> ${yasSatiri(d)}</div>
      ${d.gebelik ? `<div><span class="et">Gebelik:</span> ${d.gebelik.kategori ? `kat. ${kacis(d.gebelik.kategori)} — ` : ''}${kacis(d.gebelik.metin.slice(0, 160))}</div>` : ''}
    </td>
    <td class="etk">${etkilesimSatiri(d)}</td>
    <td class="kaynak">
      ${kacis(d.kaynak.belge)}
      <div class="dogrulama">durum: <b>KÜB okundu</b> · hekim onayı: <b>YOK</b></div>
    </td>
    <td class="onay">
      <div class="kutu">☐ Doğru</div>
      <div class="duzeltme"><span class="et">Düzeltme:</span> <span class="cizgi"></span></div>
    </td>
  </tr>`
}

function uret(): string {
  const girdiler = Object.entries(TURKISH_DRUGS).sort((a, b) => {
    const oa = ONCELIK[a[0]] ?? 9000
    const ob = ONCELIK[b[0]] ?? 9000
    if (oa !== ob) return oa - ob
    return a[1].name.localeCompare(b[1].name, 'tr')
  })

  const say = dogrulamaSayilari()
  let sonGrup = ''
  const govde = girdiler
    .map(([anahtar, d], i) => {
      const g = grup(anahtar)
      const baslik = g !== sonGrup ? `<tr class="grup"><td colspan="6">${kacis(g)}</td></tr>` : ''
      sonGrup = g
      return baslik + satir(anahtar, d, i + 1)
    })
    .join('')

  const bugun = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10).split('-').reverse().join('.')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>Notya İlaç Tablosu — Hekim İnceleme Formu</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 9.5px; color: #111; margin: 0; padding: 14px; }
  h1 { font-size: 17px; margin: 0 0 4px; }
  .alt { font-size: 10.5px; color: #444; line-height: 1.55; max-width: 1100px; }
  .kutucuk { border: 1px solid #bbb; background: #fafafa; border-radius: 6px; padding: 8px 10px; margin: 10px 0 14px; font-size: 10px; line-height: 1.55; }
  .kutucuk b { color: #a00; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; color: #555; border-bottom: 1.5px solid #333; padding: 4px 5px; }
  td { vertical-align: top; padding: 5px; border-bottom: 1px solid #e2e2e2; line-height: 1.45; }
  tr.molekul { page-break-inside: avoid; }
  tr.grup td { background: #1f2937; color: #fff; font-weight: 700; font-size: 10.5px; padding: 5px 7px; letter-spacing: .03em; }
  .no { width: 22px; color: #888; }
  .ad { font-weight: 700; font-size: 10.5px; }
  .marka { color: #555; font-size: 9px; }
  .sinif { color: #777; font-size: 8.5px; margin-top: 1px; }
  .et { color: #666; }
  .yok { color: #b45309; font-style: italic; }
  .orta { color: #92400e; }
  .etk { width: 24%; font-size: 8.8px; }
  .kaynak { width: 17%; font-size: 8.3px; color: #444; word-break: break-word; }
  .dogrulama { margin-top: 3px; color: #a00; }
  .onay { width: 14%; }
  .kutu { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
  .duzeltme { font-size: 8.5px; }
  .cizgi { display: inline-block; border-bottom: 1px solid #999; width: 100%; height: 12px; }
  .renk.yesil { color: #047857; font-weight: 700; }
  .renk.kirmizi { color: #b91c1c; font-weight: 700; }
  .imza { margin-top: 18px; font-size: 10px; display: flex; gap: 40px; }
  .imza div { border-top: 1px solid #333; padding-top: 4px; min-width: 200px; }
  @media print { .kutucuk { break-inside: avoid; } }
</style>
</head>
<body>
<h1>Notya İlaç Tablosu — Hekim İnceleme Formu</h1>
<div class="alt">
  <b>${MOLEKUL_SAYISI} molekül</b> · hazırlanma: ${kacis(bugun)} ·
  kaynak durumu: KÜB okundu ${say.kub_okundu} · literatür ${say.literatur} · <b>hekim doğruladı ${say.hekim_dogruladi}</b>
</div>

<div class="kutucuk">
  <b>Bu form ne için:</b> Aşağıdaki her satır, molekülün kendi TİTCK KÜB'ünden (Kısa Ürün Bilgisi) okunarak yazıldı — sayıların hiçbiri tahmin değil, hepsinin kaynağı satırda yazılı.
  Ama <b>hiçbiri henüz bir hekim tarafından doğrulanmadı</b>. Sizin işaretiniz, sistemdeki kaydı <i>“KÜB okundu”</i>dan <i>“hekim doğruladı”</i>ya çevirecek tek şey.<br><br>
  <b>Nasıl doldurulur:</b> Satırı okuyun. Doğruysa <b>☐ Doğru</b> kutusunu işaretleyin. Yanlış ya da eksikse <b>Düzeltme</b> satırına doğrusunu yazın — tek kelime de yeter (“max 90 mg/kg”, “6 ay değil 3 ay”).<br>
  <b>Öncelik sırası:</b> önce pediatri, sonra kadın hastalıkları ve doğum molekülleri; bir mg/kg hatası en çok orada zarar verir.<br>
  <b>Doğrulanmamış bir pediatrik doz</b>, kartta hekime <i>“KÜB'den teyit edin”</i> notuyla birlikte gösteriliyor — yani bu form dolana kadar sistem kendi sayısına da ihtiyatla davranıyor.<br><br>
  <b>PDF'e çevirmek için:</b> bu dosyayı tarayıcıda açın → <b>Yazdır (Ctrl/Cmd+P)</b> → Hedef: <b>PDF olarak kaydet</b> → Düzen: <b>Yatay</b> → Kenar boşlukları: <b>Yok</b> → “Arka plan grafikleri” açık.
</div>

<table>
  <thead>
    <tr>
      <th>#</th><th>Molekül / marka</th><th>Doz · tavan · yaş · gebelik</th><th>Etkileşimler</th><th>Kaynak</th><th>Hekim onayı</th>
    </tr>
  </thead>
  <tbody>${govde}</tbody>
</table>

<div class="imza">
  <div>İnceleyen hekim (ad, soyad, unvan)</div>
  <div>Tarih</div>
  <div>İmza</div>
</div>
</body>
</html>`
}

mkdirSync(dirname(CIKTI), { recursive: true })
writeFileSync(CIKTI, uret(), 'utf8')
console.log(`yazıldı: ${CIKTI} (${MOLEKUL_SAYISI} molekül)`)
