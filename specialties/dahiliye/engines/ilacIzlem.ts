/**
 * NOTYA-DAH-WOW W1.6 — İlaç izlem takvimi: hasta_ilaclar satırlarından lab izlem görevleri.
 * Kural tabanlı; doz yok; kaynak: TİHUD/TEMD/Harrison ilaç izlem standartları (hekim susturabilir).
 * "başlangıç" = baslangic_tarihi son 45 gün içinde → erken kontrol; aksi halde periyodik kontrol.
 */
export interface IzlemIlac { ad: string; etken?: string | null; baslangic?: string | null; aktif: boolean }
export interface IzlemKural { kod: string; ad: string; re: RegExp; labs: string[]; baslangicGun?: number; periyotAy: number; dipnot: string }
export interface IzlemGorev { kod: string; ad: string; due: string; labs: string[]; ilac: string; kaynak: string }

export const IZLEM_KURALLARI: IzlemKural[] = [
  { kod: 'izlem_metformin', ad: 'Metformin: yıllık B12 + eGFR', re: /metformin/i, labs: ['B12', 'eGFR'], periyotAy: 12, dipnot: 'TEMD: uzun süreli metforminde B12 eksikliği; eGFR ile doz' },
  { kod: 'izlem_ras', ad: 'ACEi/ARB: K + kreatinin', re: /pril\b|sartan|ramipril|enalapril|lisinopril|perindopril|valsartan|losartan|telmisartan|kandesartan|irbesartan|olmesartan/i, labs: ['K', 'Kre'], baslangicGun: 14, periyotAy: 12, dipnot: 'Başlangıç/doz artışı sonrası 1–2 hafta K/Kre; sonra yıllık' },
  { kod: 'izlem_mra', ad: 'Spironolakton/eplerenon: K + kreatinin', re: /spironolakton|eplerenon|finerenon/i, labs: ['K', 'Kre'], baslangicGun: 7, periyotAy: 4, dipnot: 'MRA: 1. hafta, 1. ay, sonra 4 ayda bir K/Kre' },
  { kod: 'izlem_statin', ad: 'Statin: ALT', re: /statin|atorva|rosuva|simva|prava|pitava|fluva/i, labs: ['ALT'], baslangicGun: 84, periyotAy: 12, dipnot: 'Başlangıç sonrası 8–12 hafta ALT; sonra yıllık; CK yalnız semptomda' },
  { kod: 'izlem_levo', ad: 'Levotiroksin: TSH', re: /levotiroksin|levothyrox|euthyrox|tefor|levotiron/i, labs: ['TSH'], baslangicGun: 49, periyotAy: 6, dipnot: 'Doz değişimi sonrası 6–8 hafta TSH; stabil ise 6–12 ay' },
  { kod: 'izlem_warfarin', ad: 'Warfarin: INR', re: /warfarin|coumadin|kumadin/i, labs: ['INR'], baslangicGun: 7, periyotAy: 1, dipnot: 'INR: başlangıçta haftalık, stabil ise 4 haftada bir' },
  { kod: 'izlem_amiodaron', ad: 'Amiodaron: TSH + ALT', re: /amiodaron|cordarone/i, labs: ['TSH', 'ALT'], periyotAy: 6, dipnot: '6 ayda bir TSH/ALT; göz/akciğer semptomu sorgula' },
  { kod: 'izlem_lityum', ad: 'Lityum: Li düzeyi + kreatinin + TSH', re: /lityum|lithium|lithuril/i, labs: ['Li', 'Kre', 'TSH'], periyotAy: 3, dipnot: 'Lityum düzeyi 3 ayda bir; Kre/TSH 6 ay' },
  { kod: 'izlem_mtx', ad: 'Metotreksat: hemogram + ALT + kreatinin', re: /metotreksat|methotrexate/i, labs: ['Hb', 'ALT', 'Kre'], periyotAy: 3, dipnot: '3 ayda bir hemogram/KCFT/Kre (reçeteyi yazan branşla)' },
  { kod: 'izlem_tiyazid', ad: 'Tiyazid: Na + K', re: /hidroklorotiyazid|hct\b|indapamid|klortalidon/i, labs: ['Na', 'K'], baslangicGun: 30, periyotAy: 12, dipnot: 'Başlangıç sonrası 4 hafta Na/K; sonra yıllık' },
  { kod: 'izlem_sglt2', ad: 'SGLT2: eGFR', re: /gliflozin|dapagli|empagli|kanagli|ertugli/i, labs: ['eGFR'], periyotAy: 6, dipnot: 'eGFR 6 ayda bir (başlangıçta beklenen küçük düşüş)' },
  { kod: 'izlem_allopurinol', ad: 'Allopurinol/febuksostat: ürik asit + kreatinin', re: /allopurinol|febuksostat/i, labs: ['Uric', 'Kre'], baslangicGun: 60, periyotAy: 6, dipnot: 'Hedef ürik asit <6 mg/dL; 2 ayda titrasyon, sonra 6 ay' },
  { kod: 'izlem_nsaii', ad: 'Kronik NSAİİ: kreatinin + Hb', re: /ibuprofen|naproksen|diklofenak|etodolak|meloksikam|celecoxib|selekoksib|deksketoprofen/i, labs: ['Kre', 'Hb'], periyotAy: 6, dipnot: 'Kronik kullanımda 6 ayda bir Kre/Hb; PPI koruması değerlendir' },
]

function gunEkle(t: string, g: number): string { const d = new Date(t + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + g); return d.toISOString().slice(0, 10) }
function ayEkle(t: string, ay: number): string { const [y, m, d] = t.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + ay, d)).toISOString().slice(0, 10) }

/** sonLab: canonical_key → son onaylı numune tarihi. Görev due = son lab + periyot (veya başlangıç + erken gün). Bugünden eski due → bugün (overdue). */
export function ilacIzlemGorevleri(ilaclar: IzlemIlac[], sonLab: Record<string, string | null>, bugun: string): IzlemGorev[] {
  const out: IzlemGorev[] = []
  const gorulen = new Set<string>()
  for (const i of ilaclar.filter((x) => x.aktif)) {
    const metin = `${i.ad} ${i.etken || ''}`
    for (const k of IZLEM_KURALLARI) {
      if (!k.re.test(metin) || gorulen.has(k.kod)) continue
      gorulen.add(k.kod)
      const yeniBaslangic = !!i.baslangic && i.baslangic >= gunEkle(bugun, -45)
      let due: string
      if (yeniBaslangic && k.baslangicGun) due = gunEkle(i.baslangic!, k.baslangicGun)
      else {
        const enEskiLab = k.labs.map((l) => sonLab[l] || null).reduce<string | null>((acc, t) => (t == null ? acc : acc == null ? t : t < acc ? t : acc), null)
        due = enEskiLab ? ayEkle(enEskiLab, k.periyotAy) : bugun
      }
      // Tüm labs periyot içinde tazeyse görev üretme
      const hepsiTaze = !yeniBaslangic && k.labs.every((l) => sonLab[l] && sonLab[l]! > ayEkle(bugun, -k.periyotAy))
      if (hepsiTaze) continue
      out.push({ kod: k.kod, ad: k.ad, due, labs: k.labs, ilac: i.ad, kaynak: k.dipnot })
    }
  }
  return out.sort((a, b) => a.due.localeCompare(b.due))
}
