/**
 * NOTYA-DAH-WOW C1 — Yaşlı polifarmasi (≥65 yaş). STOPP/START v3 esinli, kurallar kendi sözcüklerimizle ve sınıf düzeyinde.
 * Yalnız öneri: hiçbir ilaç otomatik kesilmez/başlanmaz; doz yazılmaz (doz ve seçim hekimde). Bayrak ≠ tanı.
 * 'durdur' öneriler engelleyici: uygulanmaması (override) için hekim gerekçesi ≥ OVERRIDE_MIN karakter.
 */
import type { Dipnot } from './dahiliye'

export interface PoliIlac { ad: string; etken?: string | null; baslangic?: string | null }
export interface PoliTanilar { askvh: boolean; af: boolean; hf: boolean; dm: boolean; koah: boolean; osteoporoz: boolean; ckdAlbuminuri: boolean }
export interface PoliGirdi { yas: number | null; ilaclar: PoliIlac[]; eGFR: number | null; k: number | null; na: number | null; tanilar: PoliTanilar; dusmePozitif: boolean; bugun: string /* YYYY-MM-DD */ }
export type PoliSiddet = 'durdur' | 'gozden_gecir' | 'baslat'
export interface PoliOneri { kod: string; tip: 'STOPP' | 'START'; siddet: PoliSiddet; ilaclar: string[]; baslik: string; gerekce: string; oneri: string; engelleyici: boolean; dipnot: Dipnot }
export interface PoliSonuc { uygulanabilir: boolean; not: string; aktifSayi: number; polifarmasi: boolean /* ≥5 */; oneriler: PoliOneri[]; dipnotlar: Dipnot[] }
export const OVERRIDE_MIN = 15

const NSAII = /diklofenak|diclofenac|ibuprofen|naproks[ea]n|naproxen|etodolak|etodolac|meloksikam|meloxicam|deksketoprofen|dexketoprofen|flurbiprofen|indometazin|indometasin|indomethacin|selekoksib|celecoxib|etorikoksib|etoricoxib|(?<!deks)ketoprofen|lornoksikam|lornoxicam|piroksikam|tenoksikam|nimesulid|asemetazin/g
const OAK = /warfarin|kumadin|coumadin|apiksaban|apixaban|eliquis|rivaroksaban|rivaroxaban|xarelto|dabigatran|pradaxa|edoksaban|edoxaban|lixiana/
const ACEI = /[a-zçğış]+pril\b/, ARB = /[a-zçğış]+sartan\b/, MRA = /spironolakton|spironolacton|eplerenon/, ARNI = /sakubitril|sacubitril|entresto/
const TIYAZID = /hidroklorotiyazid|hidroklortiyazid|hydrochlorothiazide|\bhctz\b|indapamid|klortalidon|chlorthalidone/
const METFORMIN = /metformin/
const BENZO = /alprazolam|diazepam|lorazepam|klonazepam|clonazepam|klordiazepoksit|chlordiazepoxide|oksazepam|oxazepam|midazolam|bromazepam|klobazam|clobazam/
const Z_ILAC = /zolpidem|(?<!es)zopiklon|eszopiklon|zopiclone/
const ANTIKOLINERJIK = /amitriptilin|amitriptyline|imipramin|klomipramin|clomipramine|hidroksizin|hydroxyzine|klorfeniramin|chlorphenamine|difenhidramin|diphenhydramine|oksibutinin|oxybutynin|tolterodin|solifenasin|solifenacin|trospiyum|trospium|biperiden|prometazin|promethazine|paroksetin|paroxetine/g
const SU_UZUN = /glibenklamid|glyburide|glimepirid/
const PPI = /(?<!deks)lansoprazol|dekslansoprazol|(?<!es)omeprazol|esomeprazol|pantoprazol|rabeprazol/
const DIGOKSIN = /digoksin|digoxin/
const ASPIRIN = /aspirin|asetilsalisil|acetylsalicyl|coraspin|ecopirin/
const ALFA = /doksazosin|doxazosin|terazosin|prazosin/
const ANTIPSIKOTIK = /ketiapin|quetiapine|olanzapin|risperidon|haloperidol|aripiprazol/
const OPIOID = /tramadol|kodein|codeine|morfin|morphine|oksikodon|oxycodone|fentanil|fentanyl|tapentadol/
const LAKSATIF = /laktüloz|laktuloz|lactulose|makrogol|macrogol|polietilen\s*glikol|senna|sennozit|bisakodil|bisacodyl/
const STATIN = /(atorva|rosuva|simva|prava|fluva|pitava|lova)statin/
const OSTEO = /alendronat|risedronat|ibandronat|zoledron|denosumab|teriparatid/
const UZUN_BRONKO = /tiotropium|glikopironyum|glycopyrronium|umeklidinyum|umeclidinium|aklidinyum|aclidinium|formoterol|salmeterol|indakaterol|indacaterol|olodaterol|vilanterol/

const metin = (i: PoliIlac) => `${i.ad} ${i.etken ?? ''}`.toLocaleLowerCase('tr')
const SIRA: Record<PoliSiddet, number> = { durdur: 0, gozden_gecir: 1, baslat: 2 }
const gunOnce = (t: string, gun: number) => { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d - gun)).toISOString().slice(0, 10) }
const ss = (not: string): Dipnot => ({ ref: 'STOPP_START_V3', not })

export function polifarmasiDegerlendir(g: PoliGirdi): PoliSonuc {
  const aktifSayi = g.ilaclar.length, polifarmasi = aktifSayi >= 5
  const dip: Dipnot[] = [ss('Yaşlıda uygunsuz reçete (STOPP) ve atlanmış tedavi (START) taraması — öneriler sınıf düzeyinde, karar hekimde'), { ref: 'TIHUD2023', not: '≥5 eş zamanlı ilaç polifarmasi kabul edilir; düzenli ilaç uzlaştırması önerilir' }]
  if (g.yas == null || g.yas < 65) return { uygulanabilir: false, not: g.yas == null ? 'Yaş bilinmiyor — polifarmasi taraması ≥65 yaş kriteriyle uygulanır' : 'Polifarmasi (STOPP/START) taraması ≥65 yaş için uygulanır', aktifSayi, polifarmasi, oneriler: [], dipnotlar: dip }
  const L = g.ilaclar.map((i) => ({ ad: i.ad, t: metin(i), bas: i.baslangic ?? null }))
  const bul = (re: RegExp) => L.filter((x) => { re.lastIndex = 0; return re.test(x.t) }).map((x) => x.ad)
  const o: PoliOneri[] = [], ekDip: Dipnot[] = []
  const ekle = (kod: string, tip: 'STOPP' | 'START', siddet: PoliSiddet, ilaclar: string[], baslik: string, gerekce: string, oneri: string, dipnot: Dipnot, ek?: Dipnot) => { o.push({ kod, tip, siddet, ilaclar: Array.from(new Set(ilaclar)), baslik, gerekce, oneri, engelleyici: siddet === 'durdur', dipnot }); if (ek) ekDip.push(ek) }
  const e = g.eGFR, tn = g.tanilar
  const nsaii = bul(NSAII), oak = bul(OAK), acei = bul(ACEI), arb = bul(ARB), mra = bul(MRA), arni = bul(ARNI), opioid = bul(OPIOID), laksatif = bul(LAKSATIF)

  // STOPP — engelleyici
  if (nsaii.length && e != null && e < 50) ekle('stopp_nsaii_bobrek', 'STOPP', 'durdur', nsaii, 'NSAİİ + azalmış böbrek fonksiyonu', `eGFR ${e}: NSAİİ böbrek fonksiyonunu daha da bozabilir`, 'NSAİİ kesilmesini değerlendirin; analjezi için böbrek dostu alternatif sınıf (hekim seçer)', ss('Böbrek fonksiyonu belirgin azalmışsa NSAİİ uygunsuz'), { ref: 'TIHUD2023', not: 'KBH\'de NSAİİ\'den kaçınma' })
  if (nsaii.length && oak.length) ekle('stopp_nsaii_oak', 'STOPP', 'durdur', [...nsaii, ...oak], 'NSAİİ + oral antikoagülan', 'Birlikte kullanımda ciddi kanama (özellikle GİS) riski artar', 'NSAİİ kesilmesini değerlendirin; antikoagülan kararı ayrı (Antikoagülan kartı)', ss('Antikoagülan alan yaşlıda NSAİİ kanama riskini artırır'), { ref: 'HARRISON', not: 'NSAİİ trombosit işlevini ve GİS mukozasını etkiler; antikoagülanla kanama riski artar' })
  if (nsaii.length && tn.hf) ekle('stopp_nsaii_ky', 'STOPP', 'durdur', nsaii, 'NSAİİ + kalp yetersizliği', 'NSAİİ sıvı-tuz tutulumu ile KY dekompansasyonunu tetikleyebilir', 'NSAİİ kesilmesini değerlendirin; alternatif analjezik sınıf hekimde', ss('Kalp yetersizliğinde NSAİİ uygunsuz'))
  if (new Set(nsaii).size >= 2) ekle('stopp_nsaii_tekrar', 'STOPP', 'durdur', nsaii, 'Aynı sınıftan birden fazla NSAİİ', 'İki veya daha fazla NSAİİ ek fayda sağlamadan yan etki riskini artırır', 'Tek NSAİİ\'ye inme veya tümünü kesme değerlendirilsin', ss('Aynı ilaç sınıfının tekrarlanması uygunsuz'))
  const metf = bul(METFORMIN)
  if (metf.length && e != null && e < 30) ekle('stopp_metformin_bobrek', 'STOPP', 'durdur', metf, 'Metformin + ileri böbrek yetersizliği', `eGFR ${e}: laktik asidoz riski`, 'Metformin kesilmesini değerlendirin; glisemik plan hekimde', ss('İleri böbrek yetersizliğinde metformin uygunsuz'), { ref: 'TEMD_DM2026', not: 'eGFR <30: metformin kontrendike' })
  if ((acei.length || arb.length || mra.length) && g.k != null && g.k > 5.5) ekle('stopp_ras_hiperkalemi', 'STOPP', 'durdur', [...acei, ...arb, ...mra], 'Hiperkalemi + RAS blokeri / MRA', `K ${g.k}: potasyumu yükselten ilaçlarla hiperkalemi derinleşebilir`, 'İlgili ilacın kesilmesi/ara verilmesi değerlendirilsin; tekrar K ve EKG (hekim)', ss('Hiperkalemide potasyum yükselten ilaçlar uygunsuz'), { ref: 'TIHUD2023', not: 'MRA ve RAS blokajı ile hiperkalemi' })
  if (acei.length && arb.length) ekle('stopp_ikili_ras', 'STOPP', 'durdur', [...acei, ...arb], 'ACEİ + ARB birlikte (ikili RAS blokajı)', 'Ek fayda göstermeden hiperkalemi, hipotansiyon ve böbrek hasarı riskini artırır', 'Tek RAS blokerine inilmesi değerlendirilsin', ss('İkili RAS blokajı uygunsuz'), { ref: 'HARRISON', not: 'ACEİ + ARB kombinasyonu böbrek olayları ve hiperkalemi riskini artırır' })
  const tiy = bul(TIYAZID)
  if (tiy.length && g.na != null && g.na < 130) ekle('stopp_tiyazid_hiponatremi', 'STOPP', 'durdur', tiy, 'Tiyazid + hiponatremi', `Na ${g.na}: tiyazid/tiyazid benzeri diüretikler hiponatremiyi ağırlaştırabilir`, 'Diüretiğin kesilmesi değerlendirilsin; Na takibi ve antihipertansif plan hekimde', ss('Belirgin hiponatremide tiyazid uygunsuz'), { ref: 'HARRISON', not: 'Yaşlıda tiyazide bağlı hiponatremi sık' })

  // STOPP — gözden geçir (düşmede bazıları durdur)
  const benzo = bul(BENZO)
  if (benzo.length) ekle('stopp_benzo', 'STOPP', g.dusmePozitif ? 'durdur' : 'gozden_gecir', benzo, g.dusmePozitif ? 'Benzodiazepin + düşme öyküsü/riski' : 'Benzodiazepin kullanımı (≥65 yaş)', g.dusmePozitif ? 'Sedasyon, denge bozukluğu ve düşme/kırık riski; düşme taraması pozitif' : 'Yaşlıda sedasyon, bilişsel etkilenme ve düşme riski', 'Endikasyonu gözden geçirin; ani kesilmeden kademeli azaltma planı hekimde', ss('Yaşlıda benzodiazepinler düşme ve bilişsel yan etki riskini artırır'))
  const zi = bul(Z_ILAC)
  if (zi.length) ekle('stopp_z_ilac', 'STOPP', g.dusmePozitif ? 'durdur' : 'gozden_gecir', zi, g.dusmePozitif ? 'Z-ilacı hipnotik + düşme öyküsü/riski' : 'Z-ilacı hipnotik kullanımı (≥65 yaş)', 'Benzodiazepine benzer sedasyon ve düşme riski', 'Uyku hijyeni ve endikasyon gözden geçirilsin; azaltma/kesme hekimde', ss('Z-ilaçları yaşlıda düşme riskini artırır'))
  const ak = bul(ANTIKOLINERJIK)
  if (new Set(ak).size >= 2) ekle('stopp_antikolinerjik_yuk', 'STOPP', 'gozden_gecir', ak, 'Yüksek antikolinerjik yük', `${new Set(ak).size} antikolinerjik etkili ilaç: konfüzyon, kabızlık, idrar retansiyonu, düşme riski`, 'Antikolinerjik etkisi daha düşük alternatif sınıflar veya azaltma değerlendirilsin', ss('Birden fazla antikolinerjik ilaç yaşlıda uygunsuz'), { ref: 'HARRISON', not: 'Antikolinerjik yük yaşlıda deliryum ve bilişsel bozulma ile ilişkili' })
  const su = bul(SU_UZUN)
  if (su.length) ekle('stopp_su_uzun', 'STOPP', e != null && e < 45 ? 'durdur' : 'gozden_gecir', su, 'Uzun etkili sülfonilüre (≥65 yaş)', e != null && e < 45 ? `Uzun süreli hipoglisemi riski; eGFR ${e} ile birikim` : 'Yaşlıda uzun süreli hipoglisemi riski', 'Hipoglisemi riski düşük sınıfa geçiş değerlendirilsin (hekim)', ss('Uzun etkili sülfonilüreler yaşlıda uzamış hipoglisemi riski taşır'), { ref: 'TEMD_DM2026', not: 'Sülfonilürede hipoglisemi riski; yaşlıda glisemik hedef bireyselleştirilir' })
  const sinir = gunOnce(g.bugun, 56)
  const ppi = L.filter((x) => PPI.test(x.t) && x.bas != null && x.bas < sinir).map((x) => x.ad)
  if (ppi.length) ekle('stopp_ppi_uzun', 'STOPP', 'gozden_gecir', ppi, 'PPI uzun süreli kullanım (>8 hafta)', 'Endikasyon belirsiz uzun PPI: C. difficile, kırık, hipomagnezemi, B12 eksikliği riski', 'Endikasyonu gözden geçirin; azaltma veya kesme denemesi değerlendirilsin', ss('Komplike olmayan durumda 8 haftayı aşan tam PPI kullanımı gözden geçirilmeli'))
  const dig = bul(DIGOKSIN)
  if (dig.length && e != null && e < 30) ekle('stopp_digoksin_bobrek', 'STOPP', 'gozden_gecir', dig, 'Digoksin + ileri böbrek yetersizliği', `eGFR ${e}: birikim ve toksisite riski`, 'Endikasyon ve düzey takibi gözden geçirilsin (hekim)', ss('Böbrek fonksiyonu azalmışsa digoksin toksisitesi riski'))
  const asa = bul(ASPIRIN)
  if (asa.length && oak.length && !tn.askvh) ekle('stopp_asa_oak', 'STOPP', 'gozden_gecir', [...asa, ...oak], 'Aspirin + oral antikoagülan (belgeli ASKVH yok)', 'Açık endikasyon olmadan kombinasyon kanama riskini artırır', 'Aspirin endikasyonu gözden geçirilsin; kesme kararı hekimde', ss('Belirgin endikasyon yoksa antiagregan + antikoagülan kombinasyonu uygunsuz'))
  const alfa = bul(ALFA)
  if (alfa.length && g.dusmePozitif) ekle('stopp_alfa_dusme', 'STOPP', 'gozden_gecir', alfa, 'Alfa bloker + düşme riski', 'Ortostatik hipotansiyon ve düşme riski', 'Ortostatik ölçüm; antihipertansif sınıf değişikliği değerlendirilsin', ss('Düşme riski olan yaşlıda alfa blokerler ortostatik hipotansiyon yapabilir'))
  const ap = bul(ANTIPSIKOTIK)
  if (ap.length) ekle('stopp_antipsikotik', 'STOPP', 'gozden_gecir', ap, 'Antipsikotik kullanımı (≥65 yaş)', 'Sedasyon, düşme ve serebrovasküler olay riski; endikasyon belgelenmeli', 'Endikasyon ve süre gözden geçirilsin; azaltma planı hekim/psikiyatri', ss('Yaşlıda antipsikotikler düşme ve inme riskini artırır'), { ref: 'HARRISON', not: 'Demanslı yaşlıda antipsikotiklerle serebrovasküler olay ve mortalite artışı' })

  // START
  if (tn.askvh && !bul(STATIN).length) ekle('start_statin_askvh', 'START', 'baslat', [], 'ASKVH var, statin yok', 'Aterosklerotik KV hastalıkta statin sınıfı ikincil korumada önerilir', 'Statin sınıfı değerlendirilsin; yaşam beklentisi ve kırılganlık hekimce tartılır', ss('Belgeli ASKVH\'de statin atlanmamalı (yaşam sonu hariç)'), { ref: 'TIHUD2023', not: 'İkincil korumada lipid düşürücü tedavi' })
  if (tn.af && !oak.length) ekle('start_oak_af', 'START', 'baslat', [], 'AF var, oral antikoagülan yok', 'AF\'de inme önleme için antikoagülasyon değerlendirmesi atlanmış olabilir', 'Antikoagülan değerlendirmesi (Antikoagülan kartı: inme ve kanama riski)', ss('AF\'de kontrendikasyon yoksa antikoagülan atlanmamalı'))
  if (tn.osteoporoz && !bul(OSTEO).length) ekle('start_osteoporoz', 'START', 'baslat', [], 'Osteoporoz var, antiosteoporotik yok', 'Kırık önleyici tedavi sınıfı listede yok', 'Antirezorptif/anabolik sınıf değerlendirilsin; D vitamini ve kalsiyum durumu kontrol', ss('Osteoporozda kemik koruyucu tedavi atlanmamalı'), { ref: 'TEMD_OSTEO2025', not: 'Osteoporoz farmakoterapisi ve D vitamini/kalsiyum yeterliliği' })
  if (tn.koah && !bul(UZUN_BRONKO).length) ekle('start_koah_bronkodilator', 'START', 'baslat', [], 'KOAH var, uzun etkili bronkodilatör yok', 'Semptomatik KOAH\'ta düzenli uzun etkili bronkodilatör önerilir', 'LAMA/LABA sınıfı değerlendirilsin; inhaler tekniği kontrol', ss('KOAH\'ta düzenli uzun etkili bronkodilatör atlanmamalı'))
  if (tn.hf && !acei.length && !arb.length && !arni.length) ekle('start_ras_ky', 'START', 'baslat', [], 'Kalp yetersizliği var, RAS blokeri/ARNI yok', 'KY\'de RAS/ARNI sınıfı prognozu iyileştirir (EF\'e göre)', 'RAS/ARNI sınıfı değerlendirilsin (KY kartı; K ve eGFR takibiyle)', ss('KY\'de kontrendikasyon yoksa RAS blokajı atlanmamalı'))
  if (tn.dm && tn.ckdAlbuminuri && !acei.length && !arb.length) ekle('start_ras_dm_albuminuri', 'START', 'baslat', [], 'Diyabet + albüminürik KBH, RAS blokeri yok', 'Albüminüride RAS blokajı böbrek korumasında önerilir', 'ACEİ/ARB sınıfı değerlendirilsin; K ve eGFR takibi', ss('Diyabetik albüminüride RAS blokajı atlanmamalı'), { ref: 'TEMD_DM2026', not: 'Albüminürili diyabetik böbrek hastalığında ACEİ/ARB' })
  if (opioid.length && !laksatif.length) ekle('start_laksatif_opioid', 'START', 'baslat', opioid, 'Düzenli opioid, laksatif yok', 'Opioide bağlı kabızlık yaşlıda sık ve öngörülebilir', 'Kabızlık önleme için laksatif sınıfı eklenmesi değerlendirilsin', ss('Düzenli opioid kullananlarda laksatif atlanmamalı'))

  o.sort((a, b) => SIRA[a.siddet] - SIRA[b.siddet])
  const dipnotlar: Dipnot[] = []
  for (const d of [...dip, ...o.map((x) => x.dipnot), ...ekDip]) if (!dipnotlar.some((y) => y.ref === d.ref && y.not === d.not)) dipnotlar.push(d)
  const n = (s: PoliSiddet) => o.filter((x) => x.siddet === s).length
  const not = `${aktifSayi} aktif ilaç${polifarmasi ? ' (polifarmasi)' : ''} · ${n('durdur')} durdurma, ${n('gozden_gecir')} gözden geçirme, ${n('baslat')} başlatma önerisi — yalnız öneri, karar hekimde`
  return { uygulanabilir: true, not, aktifSayi, polifarmasi, oneriler: o, dipnotlar }
}

/** Hekim kararı doğrulama: 'kabul' her zaman geçerli; 'override' (öneriyi uygulamama) engelleyici öneride gerekçe.trim().length >= OVERRIDE_MIN ister, engelleyici değilse gerekçe boş olabilir. Hata metni döner veya null. */
export function kararDogrula(oneri: Pick<PoliOneri, 'engelleyici' | 'baslik'>, karar: 'kabul' | 'override', gerekce: string): string | null {
  if (karar === 'kabul' || !oneri.engelleyici) return null
  return (gerekce ?? '').trim().length >= OVERRIDE_MIN ? null : `"${oneri.baslik}" önerisini uygulamamak için en az ${OVERRIDE_MIN} karakterlik klinik gerekçe yazın`
}
