/**
 * DIKTE-TIBBI-01 — KBB (kulak burun boğaz) dictation lexicon, in depth. Seeded 2026-11-21 from a KBB doctor's exam
 * dictation that the recogniser broke ("Konak Mahallesi'nde tem panik membran intak … Araf Fenk … Wirthon ofisleri
 * … ortaya atışlardan … Mopar … orta conta") and from the standard KBB exam vocabulary (otoskopi, rinoskopi,
 * orofarenks / larenks muayenesi, nazal endoskopi, odyoloji, baş-boyun). Data only.
 *
 * Known-error rules that rewrite an everyday phrase ("ortaya atış", "ağız tabağı") carry `baglam`: they fire only
 * next to a word of the same exam, so "Konak Mahallesi'nde oturuyor" in a history is left alone.
 */
import type { Sozluk } from '../../duzelt'

const KULAK = ['timpan', 'membran', 'kulak', 'zar', 'otoskop', 'buson', 'serumen', 'dis kulak', 'meatus', 'kepce']
const BURUN = ['nazal', 'burun', 'konka', 'mukoza', 'endoskop', 'salgi', 'septum', 'sinus', 'meatus', 'polip', 'rinoskop', 'nazofarenk']
const BOGAZ = ['bogaz', 'tonsil', 'uvula', 'hiperem', 'farenk', 'agiz', 'dil', 'damak', 'orofarenk', 'tukuruk']

const sozluk: Sozluk = {
  terimler: [
    // ear
    'kulak muayenesi', 'otoskopi', 'otomikroskopi', 'timpanik membran', 'timpanik membranlar', 'timpan zarı', 'kulak zarı', 'intakt',
    'perfore', 'perforasyon', 'santral perforasyon', 'marjinal perforasyon', 'retraksiyon', 'retraksiyon cebi', 'bombe', 'opak', 'matlaşma',
    'ışık refleksi', 'malleus', 'inkus', 'stapes', 'umbo', 'pars tensa', 'pars flaksida', 'dış kulak yolu', 'dış kulak yolları',
    'serumen', 'buşon', 'otore', 'otalji', 'otit', 'otitis media', 'akut otitis media', 'seröz otitis media', 'efüzyonlu otitis media',
    'otitis eksterna', 'kolesteatom', 'timpanoskleroz', 'mastoid', 'mastoidit', 'kulak kepçesi', 'aurikula', 'preauriküler', 'retroauriküler',
    'tinnitus', 'vertigo', 'işitme kaybı', 'iletim tipi', 'sensörinöral', 'mikst tip', 'odyometri', 'odyogram', 'timpanometri', 'tip B',
    'akustik refleks', 'rinne', 'weber', 'diyapazon', 'nistagmus', 'dix hallpike', 'bppv', 'meniere', 'vestibüler', 'vestibüler nörit',
    'ventilasyon tüpü', 'timpanostomi', 'miringotomi', 'timpanoplasti', 'mastoidektomi', 'östaki', 'östaki tüpü', 'östaki disfonksiyonu',
    // nose / sinus
    'nazal endoskopi', 'anterior rinoskopi', 'rinoskopi', 'nazal mukoza', 'mukoza', 'konka', 'alt konka', 'orta konka', 'üst konka',
    'konka hipertrofisi', 'konka bülloza', 'paradoks konka', 'paradoksal', 'paradoks', 'meatus', 'orta meatus', 'orta meatuslar',
    'alt meatus', 'üst meatus', 'septum', 'septum deviasyonu', 'septal deviasyon', 'septal', 'septoplasti', 'spur', 'krista', 'kolumella',
    'vestibül', 'nazal vestibül', 'nazal valv', 'rinore', 'postnazal akıntı', 'mukoid', 'mukopürülan', 'nazofarenks', 'nazofarenks',
    'adenoid', 'adenoid hipertrofisi', 'adenoidektomi', 'koana', 'koanal atrezi', 'polip', 'nazal polip', 'polipozis', 'antrokoanal polip',
    'sinüzit', 'rinosinüzit', 'akut rinosinüzit', 'kronik rinosinüzit', 'maksiller sinüs', 'frontal sinüs', 'etmoid', 'sfenoid', 'ostiomeatal kompleks',
    'unsinat', 'unsinektomi', 'fess', 'endoskopik sinüs cerrahisi', 'alerjik rinit', 'rinit', 'vazomotor rinit', 'epistaksis', 'kiesselbach',
    'koterizasyon', 'tampon', 'anosmi', 'hiposmi', 'konkoplasti', 'radyofrekans', 'rinoplasti', 'soluk', 'livid', 'ödemli',
    // mouth / pharynx / larynx
    'boğaz muayenesi', 'orofarenks', 'orofarenks hiperemik', 'ağız vestibülü', 'ağız tabanı', 'Wharton', 'Wharton kanalı', 'Wharton orifisi',
    'Wharton orifisleri', 'orifis', 'orifisler', 'orifisleri', 'Stensen', 'Stensen kanalı', 'tükürük bezi', 'submandibuler', 'submandibuler bez',
    'parotis', 'parotit', 'siyalolitiazis', 'siyaladenit', 'sublingual', 'tonsil', 'tonsiller', 'tonsiller hipertrofi', 'tonsillit', 'tonsillektomi',
    'kripta', 'kriptik', 'eksüda', 'eksüdatif', 'peritonsiller', 'peritonsiller apse', 'uvula', 'yumuşak damak', 'sert damak', 'arka farenks duvarı',
    'granülasyon', 'farenjit', 'tonsillofarenjit', 'hipofarenks', 'larenks', 'laringoskopi', 'indirekt laringoskopi', 'fleksibl laringoskopi',
    'videolaringostroboskopi', 'vokal kord', 'vokal kordlar', 'vokal nodül', 'vokal polip', 'reinke ödemi', 'aritenoid', 'epiglot', 'vallekula',
    'piriform sinüs', 'glottik', 'supraglottik', 'subglottik', 'disfoni', 'ses kısıklığı', 'disfaji', 'odinofaji', 'globus', 'reflü', 'laringofaringeal reflü',
    'horlama', 'uyku apnesi', 'obstrüktif uyku apnesi', 'polisomnografi', 'mallampati', 'friedman', 'uvulopalatofaringoplasti',
    'aft', 'oral mukoza', 'lökoplaki', 'dil kökü', 'frenulum', 'ankiloglossi', 'trismus',
    // neck
    'boyun muayenesi', 'servikal lenf nodu', 'juguler', 'tiroglossal kist', 'brankial kist', 'kitle', 'ince iğne aspirasyonu', 'tiroid nodülü',
    'trakeotomi', 'trakeostomi', 'stridor', 'laringomalazi',
    // drugs and procedures said in KBB visits
    'nazal steroid', 'mometazon', 'flutikazon', 'budesonid', 'azelastin', 'oksimetazolin', 'ksilometazolin', 'serum fizyolojik', 'nazal yıkama',
    'betahistin', 'amoksisilin klavulanat', 'sefuroksim', 'klaritromisin', 'siprofloksasin', 'ofloksasin', 'kulak damlası', 'montelukast',
  ],
  hatalar: [
    // "kulak muayenesinde" → "Konak Mahallesi'nde" (only next to an ear word)
    { duyulan: ['konak mahallesi', 'konak mahalle', 'kulak mahallesi', 'kona muayenesi', 'konak muayenesi'], dogru: 'kulak muayenesi', ekli: true, baglam: KULAK },
    { duyulan: ['tem panik', 'tim panik', 'tempanik', 'tımpanik', 'tim panic', 'timpanic'], dogru: 'timpanik', ekli: true },
    { duyulan: ['membran intak', 'membran in tak'], dogru: 'membran intakt' },
    { duyulan: ['membranlar intak', 'membranlar in tak'], dogru: 'membranlar intakt' },
    { duyulan: ['in takt'], dogru: 'intakt', baglam: KULAK },
    // orofarenks
    { duyulan: ['araf fenk', 'araffenk', 'arafenk', 'ara fenk', 'orafenk', 'ora fenk', 'orofenk', 'oro fenk', 'oro farenks', 'ora farenks', 'orafarenks'], dogru: 'orofarenks', ekli: true, baglam: BOGAZ },
    // ağız vestibülü
    { duyulan: ['ağız ve stubble', 'ağız ve stibül', 'ağız ve stübül', 'ağız ve stibul', 'ağız ve sitibül', 'ağız vestibul', 'ağız ve stüdyo'], dogru: 'ağız vestibülü', ekli: true },
    { duyulan: ['ağız tabağ', 'ağız tabak'], dogru: 'ağız taban', ekli: true },
    // Wharton orifisleri
    { duyulan: ['wirthon', 'virthon', 'virton', 'vartın', 'varton', 'wharthon', 'vorton', 'warton', 'wartın', 'whartın'], dogru: 'Wharton', ekli: true },
    { duyulan: ['wharton ofis', 'wharton orifiz', 'wharton orfis', 'wharton ofiz'], dogru: 'Wharton orifis', ekli: true },
    { duyulan: ['stenson', 'stensın', 'istensen'], dogru: 'Stensen', ekli: true, baglam: ['kanal', 'parotis', 'agiz', 'orifis', 'tukuruk'] },
    // nazal endoskopi, orta meatus, mukoid, nazofarenks, orta konka
    { duyulan: ['nazan endoskop', 'nazar endoskop', 'nasal endoskop', 'nazal endo skop'], dogru: 'nazal endoskop', ekli: true },
    { duyulan: ['endo skopi', 'endos kopi'], dogru: 'endoskopi', ekli: true, baglam: BURUN },
    { duyulan: ['ortaya atış', 'orta ya atış', 'ortaya at', 'orta matus', 'orta mea tus', 'orta meatüs', 'orta miatus'], dogru: 'orta meatus', ekli: true, baglam: BURUN },
    { duyulan: ['muko salgı', 'mukoit salgı', 'muko id salgı'], dogru: 'mukoid salgı', ekli: true },
    { duyulan: ['muko id', 'mukoit'], dogru: 'mukoid', ekli: true, baglam: BURUN },
    { duyulan: ['mopar', 'nazo farenks', 'nazo fareks', 'naso farenks', 'nazofarenk se', 'nazo farenkse'], dogru: 'nazofarenks', ekli: true, baglam: [...BURUN, 'ilerl', 'adenoid', 'postnazal'] },
    { duyulan: ['orta conta', 'orta konta', 'orta kontra', 'orta konga', 'orta kanka'], dogru: 'orta konka', ekli: true },
    { duyulan: ['alt conta', 'alt konta', 'alt kontra', 'alt konga'], dogru: 'alt konka', ekli: true },
    { duyulan: ['conta hipertrofi', 'konta hipertrofi'], dogru: 'konka hipertrofi', ekli: true },
    { duyulan: ['conta bülloza', 'konka büllöz', 'conka bulloza'], dogru: 'konka bülloza', ekli: true },
    { duyulan: ['septum de viyasyon', 'septum deviyasyon', 'septum deviasyon'], dogru: 'septum deviasyon', ekli: true },
    { duyulan: ['ost akı', 'öst aki', 'östaki tüp'], dogru: 'östaki tüp', ekli: true },
    { duyulan: ['tinitus', 'tinnitüs'], dogru: 'tinnitus', ekli: true },
    { duyulan: ['ko lesteatom', 'kolestetom', 'koleste atom'], dogru: 'kolesteatom', ekli: true },
    { duyulan: ['timpano metri'], dogru: 'timpanometri', ekli: true },
    { duyulan: ['odyo metri', 'odio metri'], dogru: 'odyometri', ekli: true },
    { duyulan: ['adenoit', 'ade noid'], dogru: 'adenoid', ekli: true },
    { duyulan: ['tonsil lit'], dogru: 'tonsillit', ekli: true },
    { duyulan: ['epi glot'], dogru: 'epiglot', ekli: true },
    { duyulan: ['vokal kort'], dogru: 'vokal kord', ekli: true },
    { duyulan: ['laringo skopi', 'larengoskopi'], dogru: 'laringoskopi', ekli: true },
    { duyulan: ['rino skopi'], dogru: 'rinoskopi', ekli: true },
    { duyulan: ['sinü zit', 'sinuzit'], dogru: 'sinüzit', ekli: true },
    { duyulan: ['epis taksis', 'epistaxis'], dogru: 'epistaksis', ekli: true },
  ],
}

export default sozluk
