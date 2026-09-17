/**
 * NOTYA-DAH-WOW C6 — Gut / ürik asit ofis kartı (ACR 2020 / EULAR 2016 / Harrison). Onaylı lab ürik asit (mg/dL) + klinik işaretlerden
 * evre (atak / kronik gut / asemptomatik hiperürisemi), atak tedavi sınıfları (böbrek, KY, antikoagülan, etkileşim süzgeci), ULT endikasyonu,
 * hedef ürik asit, ULT merdiveni ve profilaksi. Tanı koymaz; "olası/uyumlu" dili, tanı ve plan hekim kilidi. Sınıf düzeyi — doz hekim yazar.
 */
import type { Dipnot } from './dahiliye'

export interface GutGirdi {
  urik: number | null; urikTarih: string | null; eGFR: number | null
  atakAktif: boolean; ates: boolean; kristalKanit: boolean /* eklem sıvısında MSU kristali */
  atakSayisi12Ay: number; tofus: boolean; radyografikHasar: boolean; urolitiyazis: boolean
  hf: boolean; dm: boolean; ilacMetinleri: string[]; bugun: string
}
export type GutEvre = 'atak' | 'kronik_gut' | 'asemptomatik_hiperurisemi' | 'normal' | 'belirsiz'
export interface GutSonuc {
  evre: GutEvre; kirmizi: string[]; atakSinif: string[]; ultEndikasyon: 'guclu' | 'kosullu' | 'yok' | null; ultNeden: string[]
  hedefUrik: number | null; ultMerdiven: string[]; profilaksi: string[]; ilacUyari: string[]; diyet: string[]
  sevk: string[]; gorevler: { kod: string; ad: string; due: string }[]; dipnotlar: Dipnot[]
}

export const DIYET_ONERILERI: string[] = [
  'Alkolü azaltın — özellikle bira ve damıtılmış içkiler atak riskini artırır',
  'Fruktozlu / şekerli içecekleri kısıtlayın',
  'Sakatat (karaciğer, böbrek) ve bazı deniz ürünlerini (hamsi, sardalya, kabuklular) sınırlayın',
  'Fazla kilolu ise kademeli kilo verme',
  'Günlük yeterli sıvı alımı (kısıtlama yoksa)',
  'Düşük yağlı süt ürünleri tercih edilebilir',
]

const HIPERURISEMI = 6.8
const ANTIKOAG = ['warfarin', 'kumadin', 'coumadin', 'apiksaban', 'apixaban', 'eliquis', 'rivaroksaban', 'rivaroxaban', 'xarelto', 'dabigatran', 'pradaxa', 'edoksaban', 'edoxaban', 'lixiana']
const CYP3A4_PGP = ['klaritromisin', 'clarithromycin', 'siklosporin', 'cyclosporin', 'ketokonazol', 'ketoconazole', 'itrakonazol', 'itraconazole', 'verapamil', 'diltiazem']
const ULT = ['allopurinol', 'febuksostat', 'febuxostat', 'benzbromaron', 'probenesid', 'probenecid']
const DIURETIK = ['hidroklorotiyazid', 'hydrochlorothiazide', 'indapamid', 'klortalidon', 'chlorthalidone', 'furosemid', 'furosemide', 'torasemid', 'torsemide']

function ekleAy(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }
function gunEkle(t: string, g: number): string { const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10) }

export function gutDegerlendir(g: GutGirdi): GutSonuc {
  const dip: Dipnot[] = [
    { ref: 'ACR_GUT2020', not: 'ULT güçlü endikasyon: tofüs, radyografik hasar, yılda ≥2 atak; ilk atak sonrası yalnız KBH evre ≥3, ürik asit >9 veya ürolitiyazis varsa koşullu; hedef <6 mg/dL; allopurinol birinci basamak, düşük dozla başlayıp titrasyon; ULT başlangıcında 3–6 ay atak profilaksisi; asemptomatik hiperürisemide rutin ULT önerilmez' },
    { ref: 'EULAR_GUT2016', not: 'Tofüslü / ağır gutta daha düşük hedef (<5 mg/dL); her hastada yaşam tarzı danışmanlığı (alkol, şekerli içecek, kilo) ve eşlik eden hastalık taraması' },
    { ref: 'HARRISON', not: 'Akut gut atağında NSAİİ, kolşisin veya kortikosteroid sınıfları; ateşli akut monoartritte septik artrit ayırıcı tanıda öncelikli, eklem aspirasyonu ile kristal ve kültür' },
  ]
  const ilac = g.ilacMetinleri.map((m) => m.toLocaleLowerCase('tr-TR')).join(' | ')
  const var_ = (liste: string[]) => liste.filter((a) => ilac.includes(a))
  const hiper = g.urik != null && g.urik > HIPERURISEMI
  const gutKanit = g.atakSayisi12Ay >= 1 || g.tofus || g.radyografikHasar || g.kristalKanit
  const evre: GutEvre = g.atakAktif ? 'atak' : gutKanit ? 'kronik_gut' : hiper ? 'asemptomatik_hiperurisemi' : g.urik != null ? 'normal' : 'belirsiz'
  const r: GutSonuc = { evre, kirmizi: [], atakSinif: [], ultEndikasyon: null, ultNeden: [], hedefUrik: null, ultMerdiven: [], profilaksi: [], ilacUyari: [], diyet: [], sevk: [], gorevler: [], dipnotlar: dip }
  const agirBobrek = g.eGFR != null && g.eGFR < 30
  const antikoag = var_(ANTIKOAG), inhibitor = var_(CYP3A4_PGP), ult = var_(ULT), diuretik = var_(DIURETIK)

  if (g.atakAktif && g.ates) { r.kirmizi.push('Ateş + akut monoartrit: septik artrit dışlanmalı — acil değerlendirme / eklem aspirasyonu (sevk)'); r.sevk.push('Acil / ortopedi-romatoloji: septik artrit şüphesi') }

  // ULT endikasyonu
  if (evre !== 'normal' && evre !== 'belirsiz') {
    if (g.tofus) r.ultNeden.push('Tofüs')
    if (g.radyografikHasar) r.ultNeden.push('Radyografik eklem hasarı')
    if (g.atakSayisi12Ay >= 2) r.ultNeden.push(`Son 12 ayda ${g.atakSayisi12Ay} atak (≥2)`)
    if (r.ultNeden.length) r.ultEndikasyon = 'guclu'
    else if (g.atakSayisi12Ay >= 1 || g.atakAktif || g.kristalKanit) {
      const ek: string[] = []
      if (g.eGFR != null && g.eGFR < 60) ek.push(`eGFR ${g.eGFR} (<60, KBH evre ≥3)`)
      if (g.urik != null && g.urik > 9) ek.push(`Ürik asit ${g.urik} mg/dL (>9)`)
      if (g.urolitiyazis) ek.push('Ürolitiyazis öyküsü')
      if (ek.length) { r.ultEndikasyon = 'kosullu'; r.ultNeden.push(...ek.map((e) => `${e} — ilk/seyrek atakta koşullu ULT (hekim kararı)`)) }
      else { r.ultEndikasyon = 'yok'; r.ultNeden.push('Seyrek atak, komplikasyon / ek risk yok: şu an ULT için rutin ölçüt karşılanmıyor — hekim değerlendirir, yaşam tarzı') }
    } else { r.ultEndikasyon = 'yok'; r.ultNeden.push('Asemptomatik hiperürisemide ürat düşürücü rutin önerilmez — yaşam tarzı') }
  }
  const ultVar = r.ultEndikasyon === 'guclu' || r.ultEndikasyon === 'kosullu'
  if (ultVar) {
    r.hedefUrik = g.tofus ? 5 : 6
    r.ultMerdiven.push(
      'Allopurinol (birinci basamak) — düşük dozla başla, hedefe göre titrasyon; böbrek fonksiyonu gözetilir — hekim dozu yazar',
      'Hedefe ulaşılamazsa / intolerans: febuksostat — KV hastalıkta risk/yarar hekim değerlendirir',
      'Dirençli / tofüslü: romatoloji (ürikozürik veya ileri tedavi)',
      'Allopurinol başlamadan önce yüksek riskli etnik kökende HLA-B*58:01 hekim değerlendirir',
      'ULT atak geçtikten sonra da başlanabilir; atak sırasında başlamak hekim kararı',
      `Hedef ürik asit <${r.hedefUrik} mg/dL${g.tofus ? ' (tofüs)' : ''} — ömür boyu izlem`,
    )
    r.profilaksi.push('ULT başlangıcında 3–6 ay atak profilaksisi: düşük doz kolşisin veya NSAİİ sınıfı — hekim dozu yazar')
    r.gorevler.push({ kod: 'gut_urik_kontrol', ad: `Ürik asit kontrolü (ULT titrasyonu, hedef <${r.hedefUrik} mg/dL)`, due: ekleAy(g.bugun, 1) })
  }

  // Atak tedavi sınıfları + güvenlik süzgeci
  const nsaiiEngel: string[] = []
  if (agirBobrek) nsaiiEngel.push(`eGFR ${g.eGFR} <30`)
  if (g.hf) nsaiiEngel.push('kalp yetmezliği')
  if (antikoag.length) nsaiiEngel.push(`oral antikoagülan (${antikoag.join(', ')})`)
  if (g.atakAktif) {
    if (!nsaiiEngel.length) r.atakSinif.push('NSAİİ sınıfı (kısa süreli, gastroprotektif değerlendir) — hekim dozu yazar')
    if (!agirBobrek) r.atakSinif.push('Kolşisin (semptom başlangıcından sonra erken başlanırsa etkili) — hekim dozu yazar')
    r.atakSinif.push('Kortikosteroid (oral veya tek eklemde intraartiküler) — hekim dozu yazar')
    if (ult.length) r.ilacUyari.push(`Mevcut ürat düşürücü tedavi (${ult.join(', ')}) atak sırasında kesilmez`)
    if (g.dm) r.ilacUyari.push('Kortikosteroid + diyabet: glisemi izlemi (hekim)')
    if (g.urik != null && g.urik <= HIPERURISEMI) {
      r.ultNeden.push('Atak sırasında ürik asit yalancı normal olabilir — atak sonrası 2–4 hafta tekrar')
      r.gorevler.push({ kod: 'gut_urik_tekrar', ad: 'Serum ürik asit tekrarı (atak sonrası)', due: gunEkle(g.bugun, 21) })
    }
  }
  const nsaiiKullanimi = g.atakAktif || ultVar
  if (nsaiiKullanimi && nsaiiEngel.length) r.ilacUyari.push(`NSAİİ sınıfından kaçınılır: ${nsaiiEngel.join(', ')} — alternatif sınıf hekim seçer`)
  if (nsaiiKullanimi && agirBobrek) r.ilacUyari.push('kolşisin: ağır böbrek yetmezliğinde kaçınılır/hekim')
  if (nsaiiKullanimi && inhibitor.length && !agirBobrek) r.ilacUyari.push(`Kolşisin + güçlü CYP3A4/P-gp inhibitörü (${inhibitor.join(', ')}): ciddi toksisite etkileşimi — kolşisinden kaçın veya hekim yeniden değerlendirir`)
  if (diuretik.length) r.ilacUyari.push(`Tiyazid/loop diüretik (${diuretik.join(', ')}): ürik asiti artırabilir — endikasyon gözden geçir (hekim)`)
  if (ilac.includes('losartan')) r.ilacUyari.push('Bilgi: losartanın hafif ürikozürik etkisi var (HT eşlik ediyorsa hekim değerlendirir)')

  if (evre !== 'normal' && evre !== 'belirsiz') r.diyet = [...DIYET_ONERILERI]

  if (g.urik == null && (g.atakAktif || g.atakSayisi12Ay >= 1)) r.gorevler.push({ kod: 'gut_urik_ilk', ad: 'Serum ürik asit + kreatinin', due: g.bugun })

  if (g.tofus || g.radyografikHasar) r.sevk.push('Romatoloji: tofüs/eklem hasarı')
  if (!g.kristalKanit && g.atakAktif && g.atakSayisi12Ay === 0) r.sevk.push('Tanı belirsizse eklem aspirasyonu / romatoloji (kristal kanıtı)')
  if (g.urolitiyazis) r.sevk.push('Üroloji: ürat taşı öyküsü (hekim kararı)')

  r.ilacUyari = Array.from(new Set(r.ilacUyari)); r.sevk = Array.from(new Set(r.sevk))
  return r
}
