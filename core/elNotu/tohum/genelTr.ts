/**
 * ESNEK-MUAYENE-A — general Turkish clinical handwriting seed lexicon (no patient data; doctor-independent).
 * Abbreviations and symbols Turkish physicians write by hand in muayene notes. The doctor's own lexicon always wins over
 * this seed; an abbreviation found in neither is asked once ("Doğrula") and then learned for that doctor.
 * Data only — per-branş differences live in sibling seed files (kbbTr.ts), never in code.
 */
import type { SozlukGirdisi } from '../tipler'

const g = (kisaltma: string, anlam: string, baglam: SozlukGirdisi['baglam'] = 'kelime'): SozlukGirdisi => ({ kisaltma, anlam, kaynak: 'genel', baglam })

export const GENEL_TR_TOHUM: SozlukGirdisi[] = [
  // symbols
  g('Ø', 'yok', 'sembol'), g('∅', 'yok', 'sembol'), g('ø', 'yok', 'sembol'), g('(-)', 'negatif', 'sembol'), g('(+)', 'pozitif', 'sembol'),
  g('+', 'var', 'sembol'), g('↑', 'yüksek', 'sembol'), g('↓', 'düşük', 'sembol'), g('→', 'sonrasında', 'sembol'), g('~', 'yaklaşık', 'sembol'),
  g('≈', 'yaklaşık', 'sembol'), g('x', 'kez', 'sembol'), g('?', 'şüpheli', 'sembol'), g('N', 'normal', 'sembol'), g('n', 'normal', 'sembol'),
  g('Δ', 'tanı', 'sembol'), g('Dx', 'tanı', 'kelime'), g('DDx', 'ayırıcı tanı', 'kelime'), g('Tx', 'tedavi', 'kelime'), g('Rx', 'reçete', 'kelime'),
  // history headings
  g('ÖS', 'özgeçmiş'), g('ÖG', 'özgeçmiş'), g('Ö.G', 'özgeçmiş'), g('ÖZG', 'özgeçmiş'), g('SG', 'soygeçmiş'), g('SoyG', 'soygeçmiş'),
  g('AÖ', 'aile öyküsü'), g('Şk', 'şikayet'), g('Şik', 'şikayet'), g('Hik', 'hikaye'), g('FM', 'fizik muayene'), g('F.M', 'fizik muayene'),
  g('Lab', 'laboratuvar'), g('Ktr', 'kontrol'), g('Kont', 'kontrol'),
  // age / sex shorthand ("37K" = 37 yaş kadın, "40E" = 40 yaş erkek)
  g('K', 'kadın', 'yas_cinsiyet'), g('E', 'erkek', 'yas_cinsiyet'), g('Kd', 'kadın', 'yas_cinsiyet'), g('Erk', 'erkek', 'yas_cinsiyet'),
  // general findings
  g('GD', 'genel durum'), g('GDİ', 'genel durum iyi'), g('GDO', 'genel durum orta'), g('BBO', 'bilinç açık, koopere, oryante'),
  g('KOO', 'koopere, oryante'), g('TA', 'tansiyon arteriyel'), g('KTA', 'kan basıncı'), g('Nb', 'nabız'), g('SS', 'solunum sayısı'),
  g('Ateş', 'ateş'), g('VKİ', 'vücut kitle indeksi'), g('Sat', 'oksijen satürasyonu'),
  g('DSS', 'doğal solunum sesleri'), g('KVS', 'kardiyovasküler sistem'), g('S1S2', 'S1 ve S2'), g('ÜFR', 'üfürüm'),
  g('ÜSYE', 'üst solunum yolu enfeksiyonu'), g('ASYE', 'alt solunum yolu enfeksiyonu'), g('İYE', 'idrar yolu enfeksiyonu'),
  g('DM', 'diabetes mellitus'), g('HT', 'hipertansiyon'), g('KAH', 'koroner arter hastalığı'), g('KOAH', 'kronik obstrüktif akciğer hastalığı'),
  g('KBY', 'kronik böbrek yetmezliği'), g('KKY', 'konjestif kalp yetmezliği'), g('AF', 'atriyal fibrilasyon'), g('GÖRH', 'gastroözofageal reflü hastalığı'),
  g('GÖR', 'gastroözofageal reflü'), g('LPR', 'larengofaringeal reflü'), g('Op', 'operasyon'), g('op', 'operasyon'), g('postop', 'postoperatif'),
  g('preop', 'preoperatif'), g('bx', 'biyopsi'), g('Bx', 'biyopsi'), g('Px', 'prognoz'), g('Hx', 'öykü'), g('c/o', 'şikayeti'),
  // standard history headings of a Turkish clinical note (written in full or shortened)
  g('sist hast', 'sistemik hastalık'), g('sist. hast.', 'sistemik hastalık'), g('sistemik hastalık', 'sistemik hastalık'),
  g('sürekli ilaç', 'sürekli ilaç'), g('ilaç alerjisi', 'ilaç alerjisi'), g('alkol', 'alkol'), g('özgeçmiş', 'özgeçmiş'),
  g('soygeçmiş', 'soygeçmiş'), g('şikayet', 'şikayet'), g('muayene', 'muayene'), g('tedavi', 'tedavi'), g('takip', 'takip'),
  g('ilaç alj', 'ilaç alerjisi'), g('alj', 'alerji'), g('allerji', 'alerji'), g('sigara', 'sigara'), g('pk/yıl', 'paket-yıl'), g('pkt', 'paket'),
  g('sv', 'sıvı'), g('lt', 'litre'), g('gün', 'gün'), g('hf', 'hafta'), g('hft', 'hafta'), g('ay', 'ay'), g('yl', 'yıl'),
  // radiology / lab
  g('USG', 'ultrasonografi'), g('US', 'ultrasonografi'), g('BT', 'bilgisayarlı tomografi'), g('MR', 'manyetik rezonans'), g('MRG', 'manyetik rezonans görüntüleme'),
  g('PA AC', 'PA akciğer grafisi'), g('İİAB', 'ince iğne aspirasyon biyopsisi'), g('İİAB.', 'ince iğne aspirasyon biyopsisi'), g('TİT', 'tam idrar tetkiki'),
  g('TKS', 'tam kan sayımı'), g('Hmg', 'hemogram'), g('CRP', 'C-reaktif protein'), g('Sed', 'sedimantasyon'), g('ANA', 'antinükleer antikor'),
  g('IgE', 'immünoglobulin E'), g('TSH', 'TSH'),
  // dosage shorthand (protected: numbers/doses always need a reading confirmation below high confidence)
  g('1x1', 'günde 1 kez 1', 'kelime'), g('2x1', 'günde 2 kez 1', 'kelime'), g('3x1', 'günde 3 kez 1', 'kelime'), g('1x2', 'günde 1 kez 2', 'kelime'),
  g('tb', 'tablet'), g('tab', 'tablet'), g('kps', 'kapsül'), g('fl', 'flakon'), g('amp', 'ampul'), g('şr', 'şurup'), g('dml', 'damla'),
  g('pf', 'puf'), g('im', 'intramüsküler'), g('iv', 'intravenöz'), g('po', 'ağızdan'), g('sc', 'subkutan'),
  // laterality (protected)
  g('sğ', 'sağ'), g('sl', 'sol'), g('bil', 'bilateral'), g('bilat', 'bilateral'), g('R', 'sağ'), g('L', 'sol'),
]
