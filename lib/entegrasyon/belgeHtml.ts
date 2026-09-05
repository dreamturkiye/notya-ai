/**
 * NOTYA-KOPRU-01 — Onaylı notun kendi kendine yeten HTML belgesi.
 * İki tüketici: (1) FHIR export worker (DocumentReference içeriği), (2) manuel köprü —
 * doktorun hastane sistemine (HBYS) kendi eliyle yapıştırması/yüklemesi için not
 * görünümündeki "HBYS için" düğmeleri. Resmî entegrasyon öncesi başlangıç köprüsü.
 */

export interface BelgeGirdisi {
  kurumAd: string
  hastaAd: string
  doktorAd: string
  tarih: string
  bolumler: [string, string][]
}

export function htmlBelgeYap(b: BelgeGirdisi): string {
  const kacir = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>')
  const govde = b.bolumler.filter(([, m]) => m && m.trim()).map(([baslik, metin]) =>
    `<h2 style="font:600 13px system-ui;color:#0F9B8E;border-bottom:1px solid #ddd;padding-bottom:4px;margin:18px 0 6px">${baslik}</h2><p style="font:12px/1.6 system-ui;color:#111;white-space:normal">${kacir(metin)}</p>`
  ).join('')
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Muayene Notu</title></head><body style="max-width:720px;margin:24px auto;padding:0 16px">` +
    `<div style="font:700 18px system-ui;color:#0A1628">MUAYENE NOTU</div>` +
    `<div style="font:11px system-ui;color:#555;margin:4px 0 14px">${kacir(b.hastaAd)} · ${kacir(b.doktorAd)} · ${new Date(b.tarih).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} (TRT) · ${kacir(b.kurumAd)}</div>` +
    govde +
    `<div style="font:10px system-ui;color:#888;margin-top:22px">Bu belge Notya™ tarafından üretilmiş, doktor tarafından incelenip onaylanmış muayene notudur.</div></body></html>`
}

/** HBYS'e yapıştırma için düz metin sürümü — başlıklar büyük harf, bölümler boş satırla. */
export function metinBelgeYap(b: BelgeGirdisi): string {
  const satirlar = [
    'MUAYENE NOTU',
    `${b.hastaAd} · ${b.doktorAd} · ${new Date(b.tarih).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} (TRT)`,
    '',
  ]
  for (const [baslik, metin] of b.bolumler) {
    if (!metin || !metin.trim()) continue
    satirlar.push(baslik.toUpperCase(), metin.trim(), '')
  }
  satirlar.push('— Notya™ ile üretilmiş, hekim onaylı nottur.')
  return satirlar.join('\n')
}
