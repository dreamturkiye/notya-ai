/**
 * ESNEK-MUAYENE-A — Kulak Burun Boğaz (KBB) handwriting seed lexicon, Turkish (no patient data; doctor-independent).
 * Standard Turkish otorhinolaryngology shorthand as written on muayene forms. The doctor's own lexicon always wins.
 */
import type { SozlukGirdisi } from '../tipler'

const b = (kisaltma: string, anlam: string): SozlukGirdisi => ({ kisaltma, anlam, kaynak: 'brans', baglam: 'kelime' })

export const KBB_TR_TOHUM: SozlukGirdisi[] = [
  // otology
  b('DKY', 'dış kulak yolu'), b('KZ', 'kulak zarı'), b('TM', 'timpanik membran'), b('MT', 'membrana timpani'), b('OM', 'otitis media'),
  b('AOM', 'akut otitis media'), b('SOM', 'seröz otitis media'), b('OME', 'efüzyonlu otitis media'), b('KOM', 'kronik otitis media'),
  b('KSOM', 'kronik süpüratif otitis media'), b('OE', 'otitis eksterna'), b('Ty', 'timpanometri'), b('Tymp', 'timpanometri'),
  b('Odyo', 'odyometri'), b('ODM', 'odyometri'), b('SNİK', 'sensörinöral işitme kaybı'), b('SNIK', 'sensörinöral işitme kaybı'),
  b('İTİK', 'iletim tipi işitme kaybı'), b('İK', 'işitme kaybı'), b('MTİK', 'mikst tip işitme kaybı'), b('ABG', 'hava-kemik aralığı'),
  b('BPPV', 'benign paroksismal pozisyonel vertigo'), b('VNG', 'videonistagmografi'), b('ABR', 'işitsel beyin sapı yanıtı'),
  b('VT', 'ventilasyon tüpü'), b('VTT', 'ventilasyon tüpü takılması'), b('Buşon', 'buşon'), b('sx', 'sekresyon'), b('perf', 'perforasyon'),
  b('retr', 'retraksiyon'), b('Weber', 'Weber testi'), b('Rinne', 'Rinne testi'), b('R+', 'Rinne pozitif'), b('R-', 'Rinne negatif'),
  // rhinology
  b('SD', 'septum deviasyonu'), b('S.D', 'septum deviasyonu'), b('AKH', 'alt konka hipertrofisi'), b('KH', 'konka hipertrofisi'),
  b('KB', 'konka bülloza'), b('PND', 'postnazal akıntı'), b('NP', 'nazal polip'), b('KRS', 'kronik rinosinüzit'), b('ARS', 'akut rinosinüzit'),
  b('AR', 'alerjik rinit'), b('ESC', 'endoskopik sinüs cerrahisi'), b('FESS', 'fonksiyonel endoskopik sinüs cerrahisi'),
  b('SPT', 'septoplasti'), b('RPL', 'rinoplasti'), b('NSE', 'nazal septum'), b('OSAS', 'obstrüktif uyku apne sendromu'), b('PSG', 'polisomnografi'),
  b('AHİ', 'apne-hipopne indeksi'), b('AHI', 'apne-hipopne indeksi'), b('mukoza', 'mukoza'), b('müköz', 'müköz'),
  // oral cavity / pharynx / larynx
  b('Tons', 'tonsil'), b('Ad', 'adenoid'), b('AT', 'adenotonsillektomi'), b('TT', 'tonsillektomi'), b('AV', 'adenoid vejetasyon'),
  b('VK', 'vokal kord'), b('VKN', 'vokal kord nodülü'), b('VKP', 'vokal kord polibi'), b('VKparalizi', 'vokal kord paralizisi'),
  b('IL', 'indirekt laringoskopi'), b('DL', 'direkt laringoskopi'), b('FOL', 'fiberoptik laringoskopi'), b('FNL', 'fleksibl nazofaringolaringoskopi'),
  b('PPD', 'postnazal akıntı'), b('aftöz', 'aftöz'),
  // head & neck
  b('LAP', 'lenfadenopati'), b('LN', 'lenf nodu'), b('SMG', 'submandibuler gland'), b('SMB', 'submandibuler bez'), b('PG', 'parotis bezi'),
  b('Par', 'parotis'), b('Tir', 'tiroid'), b('TN', 'tiroid nodülü'), b('İİAB', 'ince iğne aspirasyon biyopsisi'), b('KBB', 'kulak burun boğaz'),
  b('sialolit', 'sialolit'), b('sialadenit', 'sialadenit'), b('sialolitiazis', 'sialolitiazis'), b('sialendoskopi', 'sialendoskopi'),
  b('sialendoskopik', 'sialendoskopik'), b('submandibuler', 'submandibuler'), b('submand', 'submandibuler'), b('parotis', 'parotis'),
  b('tükürük bezi', 'tükürük bezi'), b('tonsillektomi', 'tonsillektomi'), b('adenoidektomi', 'adenoidektomi'), b('konka', 'konka'),
  b('nazofarenks', 'nazofarenks'), b('orofarenks', 'orofarenks'), b('larenks', 'larenks'), b('kulak zarı', 'kulak zarı'),
  b('masseter', 'masseter'), b('botoks', 'botoks'), b('kulak yolu', 'kulak yolu'), b('işitme kaybı', 'işitme kaybı'), b('SCM', 'sternokleidomastoid kas'), b('ÖSB', 'ön servikal bölge'),
]
