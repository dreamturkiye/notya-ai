/**
 * NOTYA-DAH-WOW W3.7 — Ramazan DM/HT rehberi (TEMD Ramazan ve Diyabet rehberi; IDF-DAR risk kategorileri ile hizalı).
 * Risk kademesi (düşük / orta / yüksek / çok yüksek), oruç önerisi, ilaç ZAMANLAMA rehberi (sınıf düzeyi; doz değişikliği ve
 * insülin titrasyonu YOK — "hekim düzenler"), oruç bozma kuralları + hasta bilgilendirme yaprağı. Mevsimsel: kart yalnız hekim açınca.
 */
import type { Dipnot } from './dahiliye'

export type RamazanRisk = 'dusuk' | 'orta' | 'yuksek' | 'cok_yuksek'
export interface RamazanGirdi {
  dmTip: 'T1' | 'T2' | 'diger' | null; hba1c: number | null; eGFR: number | null; yas: number | null; gebe: boolean
  ilacMetinleri: string[]; htVar: boolean
  son3AyAgirHipo: boolean; son3AyDkaHhs: boolean; hipoFarkindalikAzalmis: boolean; tekrarlayanHipo: boolean
  ileriMakrovaskuler: boolean; akutHastalik: boolean; yalnizYasiyor: boolean; kirilgan: boolean; agirFizikselIs: boolean
}
export interface RamazanSonuc { risk: RamazanRisk; nedenler: string[]; oruc: string; ilacRehberi: string[]; olcum: string[]; bozmaKurallari: string[]; hastaYapragi: string; dipnotlar: Dipnot[] }

export const ORUC_BOZMA = ['Kan şekeri 70 mg/dL altındaysa orucu hemen bozun', 'Kan şekeri 300 mg/dL üzerindeyse orucu bozun', 'Titreme, terleme, çarpıntı, bilinç bulanıklığı gibi düşük şeker belirtilerinde ölçmeden bekleyin — orucu bozun', 'Aşırı susuzluk, baş dönmesi, bayılma hissi, kusma veya ateşli hastalıkta orucu bozun ve doktorunuza haber verin']

export function ramazanDegerlendir(g: RamazanGirdi): RamazanSonuc {
  const dip: Dipnot[] = [{ ref: 'TEMD_RAMAZAN', not: 'Ramazan öncesi 6–8 hafta içinde risk değerlendirmesi; çok yüksek/yüksek riskte oruç önerilmez; ilaç zamanlaması iftar-sahura göre yeniden düzenlenir; glukoz <70 veya >300 mg/dL\'de oruç bozulur; parmak ucu ölçümü orucu bozmaz' }]
  const t = (re: RegExp) => g.ilacMetinleri.some((x) => re.test(x))
  const ins = t(/insülin|insulin|glarjin|detemir|degludek|aspart|lispro|glulisin|nph/i), su = t(/gliklazid|glimepirid|glibenklamid|glipizid/i), glinid = t(/repaglinid|nateglinid/i)
  const sglt2 = t(/gliflozin/i), met = t(/metformin/i), dpp4 = t(/gliptin/i), glp1 = t(/glutid|tirzepatid/i), diur = t(/hidroklorotiyazid|indapamid|klortalidon|furosemid|torasemid|spironolakton/i)
  const cy: string[] = [], y: string[] = [], o: string[] = []
  if (g.son3AyAgirHipo) cy.push('son 3 ayda ağır hipoglisemi')
  if (g.son3AyDkaHhs) cy.push('son 3 ayda DKA / HHS')
  if (g.tekrarlayanHipo || g.hipoFarkindalikAzalmis) cy.push('tekrarlayan hipoglisemi / hipoglisemi farkındalığında azalma')
  if (g.dmTip === 'T1' && (g.hba1c == null || g.hba1c > 7.5)) cy.push('tip 1 DM (kontrolsüz)')
  if (g.gebe && g.dmTip) cy.push('gebelikte diyabet')
  if (g.eGFR != null && g.eGFR < 30) cy.push(`KBH evre 4–5 / diyaliz (eGFR ${g.eGFR})`)
  if (g.ileriMakrovaskuler) cy.push('ileri makrovasküler komplikasyon')
  if (g.akutHastalik) cy.push('akut hastalık')
  if (g.dmTip === 'T1' && !cy.length) y.push('tip 1 DM (iyi kontrollü)')
  if (g.dmTip === 'T2' && g.hba1c != null && g.hba1c >= 9) y.push(`kontrolsüz tip 2 DM (HbA1c %${g.hba1c})`)
  if (g.eGFR != null && g.eGFR >= 30 && g.eGFR < 45) y.push(`KBH evre 3b (eGFR ${g.eGFR})`)
  if ((ins || su) && g.yalnizYasiyor) y.push('insülin/sülfonilüre kullanıp yalnız yaşama')
  if (g.kirilgan || (g.yas != null && g.yas >= 75)) y.push('ileri yaş / kırılganlık')
  if (ins && g.dmTip === 'T2') y.push('tip 2 DM + insülin')
  if (g.agirFizikselIs && (ins || su)) y.push('ağır fiziksel iş + hipoglisemi yapan ajan')
  if (su || glinid) o.push('sülfonilüre / glinid kullanımı')
  if (sglt2) o.push('SGLT2 inhibitörü (dehidratasyon)')
  if (g.eGFR != null && g.eGFR >= 45 && g.eGFR < 60) o.push(`KBH evre 3a (eGFR ${g.eGFR})`)
  const risk: RamazanRisk = cy.length ? 'cok_yuksek' : y.length ? 'yuksek' : o.length ? 'orta' : 'dusuk'
  const nedenler = cy.length ? cy : y.length ? y : o.length ? o : [g.dmTip ? 'iyi kontrollü diyabet, hipoglisemi riski düşük ajanlar' : 'diyabet yok / yalnız HT']
  const oruc = risk === 'cok_yuksek' || risk === 'yuksek' ? 'Oruç önerilmez (hekim kararı). Hasta yine de tutmak isterse: yapılandırılmış eğitim, sık glukoz ölçümü, ilaç zamanlaması hekim tarafından yeniden düzenlenir, oruç bozma kuralları.' : 'Oruç tutabilir — Ramazan öncesi eğitim, ev glukoz izlemi ve oruç bozma kuralları ile.'
  const ilac: string[] = []
  if (met) ilac.push('Metformin: günlük toplam korunur; iftar ve sahura bölünür (uzatılmış salımlı ise iftarda) — hekim düzenler')
  if (su) ilac.push('Sülfonilüre: hipoglisemi riski en düşük ajan tercih edilir; sabah dozu iftara alınır, sahurda dikkat — doz ayarı hekim')
  if (glinid) ilac.push('Glinid: öğünle birlikte (iftar/sahur); öğün atlanırsa alınmaz')
  if (dpp4) ilac.push('DPP-4 inhibitörü: genellikle değişiklik gerekmez; iftarda alınabilir')
  if (sglt2) ilac.push('SGLT2 inhibitörü: iftarda; iftar-sahur arası yeterli sıvı; yaşlı/diüretik kullananda dehidratasyon — hekim değerlendirir')
  if (glp1) ilac.push('GLP-1 RA: genellikle değişiklik gerekmez; Ramazan\'dan hemen önce yeni başlanmaz (bulantı/dehidratasyon)')
  if (ins) ilac.push('İnsülin: bazal ve prandiyal insülinin dozu ve zamanlaması HEKİM tarafından yeniden düzenlenir — asistan doz/yüzde önerisi yapmaz')
  if (g.htVar) ilac.push('Antihipertansifler: günde tek doz ajanlar iftarda; iki dozlu ajanlar iftar + sahur — hekim')
  if (diur) ilac.push('Diüretik: iftardan sonra; sahurda verilmez (dehidratasyon, gündüz ortostatik hipotansiyon) — hekim')
  const olcum = g.dmTip ? ['Sahur öncesi', 'Öğle (12:00 civarı)', 'İkindi / iftardan 1–2 saat önce', 'İftar öncesi', 'İftardan 2 saat sonra', 'Kendini kötü hissettiğinde her zaman — ölçüm orucu bozmaz'] : []
  const hastaYapragi = [
    'RAMAZAN VE SAĞLIĞINIZ — BİLGİLENDİRME',
    `Doktorunuzun değerlendirmesi: ${risk === 'cok_yuksek' || risk === 'yuksek' ? 'Oruç tutmanız önerilmemektedir.' : 'Aşağıdaki kurallara uyarak oruç tutabilirsiniz.'}`,
    ...(g.dmTip ? ['', 'Kan şekeri ölçümü (orucu bozmaz):', ...olcum.map((x) => `• ${x}`)] : []),
    '', 'Orucu hemen bozmanız gereken durumlar:', ...ORUC_BOZMA.map((x) => `• ${x}`),
    '', 'Beslenme: sahuru geciktirin, iftarı hafif açın; iftar-sahur arası bol su; kızartma ve şerbetli tatlıyı azaltın.',
    'İlaçlarınızın saatini ve dozunu yalnızca doktorunuzun yazdığı şekilde değiştirin.',
    'Acil durumda 112\'yi arayın.',
  ].join('\n')
  return { risk, nedenler, oruc, ilacRehberi: ilac, olcum, bozmaKurallari: ORUC_BOZMA, hastaYapragi, dipnotlar: dip }
}
