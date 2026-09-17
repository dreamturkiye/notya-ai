/**
 * NOTYA-DAH-WOW-NEXT C2 — Hasta hedef kartı + Türkçe eğitim yaprakları (hasta dili, tek sayfa, yazdırılabilir).
 * Kural: karta YALNIZ hekimin kilitlediği / girdiği hedefler yazılır (HT hedef kilidi, DM hedef HbA1c, LDL hedef kilidi, KVR kategori kilidi);
 * kilitsiz hedef "hekiminiz belirleyecek" olarak kalır. Yapraklar kendi sözcüklerimizle yazıldı — kılavuz metni kopyalanmadı; doz yok.
 * Hekim "Kartı onayla" (kart=hedef alan=kart) demeden yazdırılamaz; nota yalnız hekim "Nota ekle" ile yazılır.
 */
import type { Dipnot } from './dahiliye'

export type YaprakKod = 'yasam' | 'ht' | 'dm_ayak_goz' | 'statin'
export interface EgitimYapragi { kod: YaprakKod; baslik: string; bolumler: { baslik: string; maddeler: string[] }[]; dipnot: Dipnot }

export const EGITIM_YAPRAKLARI: Record<YaprakKod, EgitimYapragi> = {
  yasam: { kod: 'yasam', baslik: 'Sağlıklı yaşam: her gün küçük adımlar', dipnot: { ref: 'TIHUD2023', not: 'Kronik hastalıkta yaşam tarzı danışmanlığı (beslenme, fiziksel aktivite, tütün, alkol, uyku)' }, bolumler: [
    { baslik: 'Beslenme', maddeler: ['Tabağınızın yarısı sebze olsun; meyveyi suyu yerine bütün olarak yiyin.', 'Beyaz ekmek ve pirinç yerine tam tahıl, bulgur ve baklagilleri seçin.', 'Hazır gıda, turşu, salamura ve cipste tuz fazladır; sofraya tuzluk koymayın.', 'Şekerli içecekler yerine su, ayran (az tuzlu) veya maden suyu için.'] },
    { baslik: 'Hareket', maddeler: ['Haftada en az 5 gün, günde 30 dakika tempolu yürüyüş hedefleyin.', 'Uzun süre oturuyorsanız saatte bir kalkıp birkaç dakika yürüyün.', 'Yeni bir spora başlamadan önce hekiminize danışın.'] },
    { baslik: 'Diğer', maddeler: ['Sigara kullanıyorsanız bırakmak için ALO 171\'i arayabilirsiniz.', 'Alkolü sınırlayın; ilaçlarınızla etkileşebilir.', 'Gece 7–8 saat uyumaya çalışın.', 'Kilonuzu ayda bir aynı saatte tartıp not edin.'] },
  ] },
  ht: { kod: 'ht', baslik: 'Tansiyonumu nasıl kontrol ederim?', dipnot: { ref: 'HT_UZLASI2025', not: 'Ev KB ölçüm tekniği, tuz kısıtlaması, ilaç uyumu' }, bolumler: [
    { baslik: 'Evde doğru ölçüm', maddeler: ['Ölçümden önce 5 dakika oturarak dinlenin; son 30 dakikada kahve, sigara ve egzersiz olmasın.', 'Sırtınız destekli, ayaklarınız yere düz bassın; kolunuz kalp hizasında bir masada dursun.', 'Manşon çıplak kola, dirsek bükümünün biraz üstüne takılsın; ölçüm sırasında konuşmayın.', 'Sabah ve akşam 1–2 dakika arayla 2 ölçüm yapıp sonuçları tarihleriyle yazın.'] },
    { baslik: 'Günlük hayatta', maddeler: ['Tuzu azaltın: ekmek, peynir, zeytin ve hazır çorbalar gizli tuz kaynağıdır.', 'İlaçlarınızı her gün aynı saatte alın; tansiyonunuz normal çıksa da kendiniz kesmeyin.', 'Ağır baş ağrısı, göğüs ağrısı, nefes darlığı, konuşma bozukluğu veya kolda-bacakta güçsüzlük olursa 112\'yi arayın.'] },
  ] },
  dm_ayak_goz: { kod: 'dm_ayak_goz', baslik: 'Diyabette ayak ve göz bakımı', dipnot: { ref: 'TEMD_DM2026', not: 'Diyabetik ayak koruma eğitimi; yıllık göz dibi muayenesi' }, bolumler: [
    { baslik: 'Ayaklarınız', maddeler: ['Her akşam ayaklarınızı ve parmak aralarını ayna yardımıyla kontrol edin: yara, kızarıklık, nasır, renk değişikliği.', 'Ilık (sıcak değil) suyla yıkayın, parmak aralarını iyice kurulayın; kuru cilde krem sürün ama parmak aralarına sürmeyin.', 'Tırnakları düz kesin; nasırları kendiniz kesmeyin veya koterize etmeyin.', 'Evde de terlik/ayakkabı giyin; ayakkabının içini giymeden önce elinizle kontrol edin.', 'Sıcak su torbası ve soba yanında ayak ısıtmaktan kaçının — his azalmışsa yanık fark edilmeyebilir.', 'İyileşmeyen yara, şişlik veya renk değişikliğinde beklemeden hekiminize başvurun.'] },
    { baslik: 'Gözleriniz', maddeler: ['Görmeniz iyi olsa bile yılda bir göz dibi muayenesi yaptırın.', 'Bulanık görme, görme alanında gölge veya ani görme kaybında hemen göz hekimine başvurun.', 'Kan şekeri ve tansiyon kontrolü gözlerinizi de korur.'] },
  ] },
  statin: { kod: 'statin', baslik: 'Kolesterol ilacım (statin) hakkında', dipnot: { ref: 'TEMD_LIPID', not: 'Statin uyumu, yan etki bildirimi, lipid izlemi' }, bolumler: [
    { baslik: 'Neden kullanıyorum?', maddeler: ['Bu ilaç "kötü" kolesterolü (LDL) düşürür ve kalp krizi ile inme riskini azaltır.', 'Etkisi kullandığınız sürece devam eder; kolesterolünüz düştü diye kendiniz bırakmayın.'] },
    { baslik: 'Dikkat edilecekler', maddeler: ['Her gün aynı saatte alın; unutursanız çift doz almayın.', 'Açıklanamayan kas ağrısı, kas güçsüzlüğü veya koyu renkli idrar olursa hekiminize haber verin.', 'Yeni bir ilaç, bitkisel ürün veya antibiyotik başlanırsa statin kullandığınızı söyleyin.', 'Gebelik planlıyorsanız veya gebe kaldıysanız hekiminize hemen bilgi verin.', 'Kontrol tahlillerinizi hekiminizin belirlediği zamanda yaptırın.'] },
  ] },
}

export interface HedefKartGirdi {
  kbHedef: { sbpUst: number; dbpUst: number | null } | null; hba1cHedef: number | null; ldlHedef: number | null; kvrKategori: string | null
  ht: boolean; dm: boolean; statin: boolean
  son: { kb: { sbp: number; dbp: number; tarih: string } | null; hba1c: { deger: number; tarih: string | null } | null; ldl: { deger: number; tarih: string | null } | null }
}
export type HedefDurum = 'hedefte' | 'hedef_disi' | 'olcum_yok' | 'hekim_belirleyecek'
export interface HedefSatir { kod: 'kb' | 'hba1c' | 'ldl' | 'kvr'; ad: string; hedef: string; son: string | null; durum: HedefDurum }
export interface HedefKartSonuc { satirlar: HedefSatir[]; yapraklar: YaprakKod[]; eksikKilit: string[]; dipnotlar: Dipnot[] }

const KVR_HASTA: Record<string, string> = { dusuk_orta: 'düşük–orta', yuksek: 'yüksek', cok_yuksek: 'çok yüksek' }
const sayi = (n: number) => String(n).replace('.', ',')

export function hedefKarti(g: HedefKartGirdi): HedefKartSonuc {
  const satirlar: HedefSatir[] = [], eksik: string[] = []
  if (g.ht || g.kbHedef) {
    const son = g.son.kb ? `${g.son.kb.sbp}/${g.son.kb.dbp} (${g.son.kb.tarih})` : null
    if (!g.kbHedef) { eksik.push('KB hedefi (HT)'); satirlar.push({ kod: 'kb', ad: 'Tansiyon', hedef: 'Hekiminiz belirleyecek', son, durum: 'hekim_belirleyecek' }) }
    else satirlar.push({ kod: 'kb', ad: 'Tansiyon', hedef: `${g.kbHedef.sbpUst}${g.kbHedef.dbpUst ? `/${g.kbHedef.dbpUst}` : ''} mmHg altı`, son, durum: !g.son.kb ? 'olcum_yok' : g.son.kb.sbp < g.kbHedef.sbpUst && (g.kbHedef.dbpUst == null || g.son.kb.dbp < g.kbHedef.dbpUst) ? 'hedefte' : 'hedef_disi' })
  }
  if (g.dm || g.hba1cHedef != null) {
    const son = g.son.hba1c ? `%${sayi(g.son.hba1c.deger)}${g.son.hba1c.tarih ? ` (${g.son.hba1c.tarih})` : ''}` : null
    if (g.hba1cHedef == null) { eksik.push('HbA1c hedefi (DM)'); satirlar.push({ kod: 'hba1c', ad: 'HbA1c (3 aylık şeker ortalaması)', hedef: 'Hekiminiz belirleyecek', son, durum: 'hekim_belirleyecek' }) }
    else satirlar.push({ kod: 'hba1c', ad: 'HbA1c (3 aylık şeker ortalaması)', hedef: `%${sayi(g.hba1cHedef)} ve altı`, son, durum: !g.son.hba1c ? 'olcum_yok' : g.son.hba1c.deger <= g.hba1cHedef ? 'hedefte' : 'hedef_disi' })
  }
  if (g.statin || g.ldlHedef != null || g.kvrKategori) {
    const son = g.son.ldl ? `${sayi(g.son.ldl.deger)} mg/dL${g.son.ldl.tarih ? ` (${g.son.ldl.tarih})` : ''}` : null
    if (g.ldlHedef == null) { eksik.push('LDL hedefi (KVR)'); satirlar.push({ kod: 'ldl', ad: 'LDL ("kötü" kolesterol)', hedef: 'Hekiminiz belirleyecek', son, durum: 'hekim_belirleyecek' }) }
    else satirlar.push({ kod: 'ldl', ad: 'LDL ("kötü" kolesterol)', hedef: `${g.ldlHedef} mg/dL altı`, son, durum: !g.son.ldl ? 'olcum_yok' : g.son.ldl.deger < g.ldlHedef ? 'hedefte' : 'hedef_disi' })
  }
  if (g.kvrKategori) satirlar.push({ kod: 'kvr', ad: 'Kalp-damar risk grubunuz', hedef: KVR_HASTA[g.kvrKategori] || g.kvrKategori, son: null, durum: 'hedefte' })
  const yapraklar: YaprakKod[] = ['yasam']
  if (g.ht) yapraklar.push('ht')
  if (g.dm) yapraklar.push('dm_ayak_goz')
  if (g.statin) yapraklar.push('statin')
  return { satirlar, yapraklar, eksikKilit: eksik, dipnotlar: [{ ref: 'TIHUD2023', not: 'Hasta ile ortak hedef belirleme ve öz-yönetim eğitimi; hedefler hekim kilidinden' }, ...yapraklar.map((k) => EGITIM_YAPRAKLARI[k].dipnot)] }
}

const kacis = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const DURUM_HASTA: Record<HedefDurum, string> = { hedefte: '✓ hedefte', hedef_disi: '↑ hedefin üstünde', olcum_yok: 'ölçüm bekleniyor', hekim_belirleyecek: '—' }

/** Yazdırılabilir tek HTML (hedef kartı + seçili yapraklar, her biri ayrı sayfa). Kaynak dipnotları hastaya basılmaz. */
export function yazdirHtml(k: HedefKartSonuc, secili: YaprakKod[], o: { hastaAdi: string; hekimAdi: string; tarih: string }): string {
  const satir = k.satirlar.map((s) => `<tr><td>${kacis(s.ad)}</td><td><b>${kacis(s.hedef)}</b></td><td>${kacis(s.son || '—')}</td><td>${kacis(s.kod === 'kvr' ? '' : DURUM_HASTA[s.durum])}</td></tr>`).join('')
  const yaprak = secili.map((kod) => { const y = EGITIM_YAPRAKLARI[kod]; return `<section class="sayfa"><h1>${kacis(y.baslik)}</h1>${y.bolumler.map((b) => `<h2>${kacis(b.baslik)}</h2><ul>${b.maddeler.map((m) => `<li>${kacis(m)}</li>`).join('')}</ul>`).join('')}<p class="alt">Bu yaprak genel bilgilendirme içindir; hekiminizin size özel önerilerinin yerine geçmez.</p></section>` }).join('')
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Sağlık hedeflerim</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:0}.sayfa{padding:18mm 16mm;page-break-after:always}h1{font-size:20px;margin:0 0 8px}h2{font-size:15px;margin:14px 0 4px}table{width:100%;border-collapse:collapse;font-size:14px;margin-top:10px}td,th{border:1px solid #bbb;padding:7px;text-align:left}li{margin:3px 0;font-size:14px;line-height:1.45}.alt{font-size:11px;color:#555;margin-top:16px}.ust{font-size:12px;color:#444}</style></head><body><section class="sayfa"><h1>Sağlık hedeflerim</h1><div class="ust">${kacis(o.hastaAdi)} · ${kacis(o.tarih)} · Hekim: ${kacis(o.hekimAdi)}</div><table><tr><th>Ne?</th><th>Hedefim</th><th>Son değerim</th><th>Durum</th></tr>${satir}</table><h2>Bir sonraki kontrolüme kadar</h2><ul><li>İlaçlarımı her gün, hekimimin söylediği şekilde kullanacağım.</li><li>Ev ölçümlerimi (tansiyon / şeker) yazıp kontrolüme getireceğim.</li><li>Sorularımı not edip kontrolde soracağım.</li></ul><p class="alt">Hedefler hekiminiz tarafından belirlenmiştir. Acil durumda 112.</p></section>${yaprak}</body></html>`
}
