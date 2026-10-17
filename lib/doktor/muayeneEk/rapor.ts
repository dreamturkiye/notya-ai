/**
 * MUAYENE-EKLERI-01 — entegre muayene raporu için ek blokları. Saf (sunucu + test).
 *
 * İki ayrı çıktı vardır ve BİLEREK ayrıdır:
 *  1) ekPromptBlogu → SOAP isteminin "değişken" bölümüne girer. Model bu blokta olmayan hiçbir tetkik sonucunu yazamaz,
 *     blok bilgisini hekimin sözü gibi yazamaz ve kullandığı her ek bilgisini `[EK-n]` ile etiketler. Dosya adı ve hasta
 *     kimliği ASLA bu bloğa girmez (SOAP çağrısı kimliksizdir).
 *  2) ekAiMetni → `notes.ai_degerlendirme` (DOKTORA ÖZEL, portala gitmez) alanına belirlenimli olarak eklenir. Modelden
 *     geçmez: yani her ek bulgusu `[EK-n.m]` kimliği ve kaynak dosya adıyla, doktorun sözünden ayrı biçimde görünür.
 */
import { notAsilariniTemizle, type NotAsisi } from '@/lib/doktor/notAsilari'
import { EK_TUR_ETIKETI, type EkDegerlendirme, type EkSonuc } from './tipler'

export const EK_BLOK_BASLIGI = 'EKLERİN YAPAY ZEKÂ DEĞERLENDİRMESİ'
const PROMPT_AZAMI = 9000

/** Belge sırasına göre `EK-1…` etiketi verir ve bulgu kimliklerini etikete uyarlar. */
export function ekleriNumarala(girdi: { belgeId: string; dosyaAdi: string; sonuc: EkSonuc }[]): EkDegerlendirme[] {
  return girdi.map((g, i) => {
    const etiket = `EK-${i + 1}`
    return {
      etiket,
      belgeId: g.belgeId,
      dosyaAdi: g.dosyaAdi,
      sonuc: { ...g.sonuc, bulgular: g.sonuc.bulgular.map((b, j) => ({ ...b, id: `${etiket}.${j + 1}` })) },
    }
  })
}

function degerSatiri(v: NonNullable<EkSonuc['labDegerleri']>[number]): string {
  const ref = v.referans ? `, ref ${v.referans}` : ''
  const bayrak = v.bayrak === 'H' ? ' ↑' : v.bayrak === 'L' ? ' ↓' : v.bayrak === 'critical' ? ' KRİTİK' : ''
  const dogrula = v.dogrulanacak ? ' (okuma doğrulanmalı)' : ''
  return `${v.test}: ${v.deger}${v.birim ? ` ${v.birim}` : ''}${ref}${bayrak}${dogrula}`
}

/** SOAP istemi için blok. Hata/atlanan ekler de bildirilir: model "değerlendirilemedi" diyebilsin, boşluğu doldurmasın. */
export function ekPromptBlogu(ekler: EkDegerlendirme[]): string {
  if (!ekler.length) return ''
  const satirlar: string[] = [
    `\n${EK_BLOK_BASLIGI} (hekim bunları KONUŞMADI; yüklediği belgelerden çıkarıldı):`,
    'KURALLAR:',
    '- Bu bloktaki hiçbir bilgiyi hekimin ifadesi gibi yazma. Öykü, muayene bulgusu ve plan YALNIZ transkriptteki hekim sözünden gelir.',
    '- Bloktan bir bilgiyi kullanırsan "objektif" bölümünde tetkik olarak, değeri/birimi/tarihi AYNEN kopyalayarak yaz ve cümle sonuna kaynağı [EK-n] biçiminde ekle. Yuvarlama, çıkarım ve tamamlama yapma.',
    '- Blokta olmayan hiçbir tetkik sonucu, değer, tarih ya da bulgu yazma. "değerlendirilemedi" ya da "atlandı" işaretli ek için yalnız "[EK-n] değerlendirilemedi" de.',
    '- Tanı ve tedavi kararını hekimin sözünden al. Ek değerlendirmelerindeki "düşündürebilir / uyumlu olabilir" ifadeleri yalnız aiDegerlendirme alanında, [EK-n] atıfıyla ve aynı çekinceli dille yer alabilir.',
    '- Aşı satırlarını "asilar" alanına YAZMA (hekim onaylı aşılar ayrıca işlenir); yalnız transkriptte hekimin yaptığını söylediği aşı varsa asilar kuralları geçerlidir.',
    '- Görüntüleme (röntgen, EKG, fotoğraf) için yalnız gözlem aktar; kesin tanı koyma.',
  ]
  for (const e of ekler) {
    const s = e.sonuc
    const etiket = `[${e.etiket}] ${EK_TUR_ETIKETI[s.tur]}${s.baslik ? ` — ${s.baslik}` : ''}`
    if (s.durum !== 'tamam') {
      satirlar.push(`${etiket}: ${s.durum === 'atlandi' ? 'atlandı' : 'değerlendirilemedi'}.`)
      continue
    }
    satirlar.push(etiket)
    if (s.ozet) satirlar.push(`  Özet: ${s.ozet}`)
    if (s.labDegerleri?.length) satirlar.push(`  Değerler: ${s.labDegerleri.slice(0, 60).map(degerSatiri).join('; ')}`)
    for (const b of s.bulgular.slice(0, 12)) satirlar.push(`  - [${b.id}] ${b.metin}`)
    if (s.sinirlar.length) satirlar.push(`  Sınırlar: ${s.sinirlar.slice(0, 3).join(' ')}`)
  }
  const metin = satirlar.join('\n')
  return metin.length > PROMPT_AZAMI ? `${metin.slice(0, PROMPT_AZAMI)}\n… (kısaltıldı)` : metin
}

/** `ai_degerlendirme` için belirlenimli blok (doktora özel). Kaynak dosya adları burada görünür, modele gitmez. */
export function ekAiMetni(ekler: EkDegerlendirme[]): string {
  if (!ekler.length) return ''
  const satirlar: string[] = [`${EK_BLOK_BASLIGI} — doktorun sözü değildir; kaynak belgeler bu muayeneye bağlıdır.`]
  for (const e of ekler) {
    const s = e.sonuc
    satirlar.push(`[${e.etiket}] ${EK_TUR_ETIKETI[s.tur]} · ${e.dosyaAdi}${s.baslik ? ` · ${s.baslik}` : ''}`)
    if (s.durum === 'atlandi') { satirlar.push('  Atlandı — değerlendirilmedi.'); continue }
    if (s.durum === 'hata') { satirlar.push(`  Değerlendirilemedi${s.hataNedeni ? ` (${s.hataNedeni})` : ''} — belge Belgeler bölümünden yeniden değerlendirilebilir.`); continue }
    if (s.ozet) satirlar.push(`  ${s.ozet}`)
    for (const b of s.bulgular) satirlar.push(`  • [${b.id}]${b.duzey === 'kritik' ? ' KRİTİK:' : ''} ${b.metin}`)
    for (const u of s.uyarilar) satirlar.push(`  ! ${u}`)
    if (s.sinirlar.length) satirlar.push(`  Sınırlar: ${s.sinirlar.join(' ')}`)
  }
  return satirlar.join('\n')
}

// ─── Hekim onaylı aşılar → notun "Bu muayenede uygulanan aşılar" listesi ──────────────────────────────────────
export interface AsiOnayGirdisi {
  belgeId: string
  satirlar: Array<{ asiAdi: string; dozNo?: number | null; uygulamaTarihi?: string | null; lotNo?: string | null; kaynakTuru?: string }>
}

/**
 * YALNIZ hekimin açıkça onayladığı ve "bu muayenede uygulandı" işaretlediği satırlar. Tarih boşsa muayene günü atanır
 * (hekim onayı, transkript süzgecinin yerini tutar). Geçmiş kayıtlar ('karne') buradan geçmez: onlar karne rotasıyla
 * yazılır. Hekim notu onaylarken listeyi yine düzenleyebilir; yazma bu onayda olur (lib/doktor/notAsiAktarim).
 */
export function onayliAsilariNotaCevir(onaylar: AsiOnayGirdisi[] | undefined, muayeneGunu: string): NotAsisi[] {
  const ham = (onaylar || []).flatMap((o) => (o.satirlar || []).filter((s) => s && s.kaynakTuru === 'bu_muayene').map((s) => ({
    asi_adi: s.asiAdi, doz_no: s.dozNo ?? null, uygulama_tarihi: s.uygulamaTarihi || muayeneGunu, lot_no: s.lotNo || null,
    notlar: 'Ekten aktarıldı (hekim onaylı)',
  })))
  return notAsilariniTemizle(ham)
}

/** İki aşı listesini birleştirir; aynı seri+doz tekrar eklenmez (transkriptten gelen önceliklidir). */
export function asiListeleriniBirlestir(birinci: NotAsisi[], ikinci: NotAsisi[]): NotAsisi[] {
  return notAsilariniTemizle([...birinci, ...ikinci])
}
