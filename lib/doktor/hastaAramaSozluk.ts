/**
 * Clinical synonym dictionary for dossier search.
 * One bag per concept — spoken TR/EN + ICD + street names map here so Gökhan
 * does not have to invent the exact stored wording.
 */
export const KLINIK_SOZLUK: Record<string, string[]> = {
  kulak: ['kulak', 'otit', 'otitis', 'h65', 'h66', 'orta kulak', 'kulak agri', 'kulak akinti'],
  bogaz: ['bogaz', 'farenjit', 'tonsillit', 'streptokok', 'anjin', 'j02', 'j03'],
  iltihap: ['iltihap', 'enfeksiyon', 'infeksiyon', 'enflam', 'ihtihab', 'iltehab'],
  ates: ['ates', 'fever', 'pireksi', 'atesli'],
  oksuruk: ['oksuruk', 'oksuruklu', 'krup', 'j05'],
  hirilti: ['hirilti', 'wheez', 'bronsiolit', 'bronşiolit', 'bronşiyolit', 'bronchiol', 'bronşit', 'j21', 'j20'],
  astim: ['astim', 'asthma', 'j45', 'nefes darligi'],
  ishal: ['ishal', 'gastroenterit', 'kusma', 'rotavirus', 'a08', 'a09'],
  kabizlik: ['kabizlik', 'konstipasyon'],
  karin: ['karin', 'karin agri', 'gaz', 'kolik'],
  idrar: ['idrar', 'uti', 'sistit', 'pyelonefrit', 'n30', 'n39', 'enurezis', 'yatak islatma'],
  alerji: ['alerji', 'allerji', 'anafilaksi', 'urtiker', 'kizariklik'],
  dokuntu: ['dokuntu', 'dokuntu', 'egzama', 'isilik', 'dermatit', 'mantar', 'uyuz', 'bit', 'pamukcuk', 'kandida'],
  goz: ['goz', 'konjonktivit', 'kirmizi goz', 'capak', 'katarakt', 'glokom', 'oct', 'fundus', 'ivt', 'vegf', 'retinopati'],
  burun: ['burun', 'sinuzit', 'nezle', 'rinit', 'j00', 'j01', 'j30'],
  bas: ['bas agri', 'migren', 'bas agrisi'],
  travma: ['dusme', 'carpisma', 'kirik', 'burkulma', 'yanik', 'kaza', 'travma'],
  asi: ['asi', 'asilama', 'immuniz', 'asi kart', 'asi kaydi', 'kpa', 'kgb', 'hepatit', 'bcg', 'kizamik', 'kabakulak', 'sucicegi', 'difteri', 'tetanoz', 'bogmaca', 'polio', 'rotavir', 'influenza', 'grip'],
  gelisim: ['gelisim', 'gelisme geriligi', 'boy kisa', 'kilo alamiyor', 'neyzi', 'persentil'],
  sarilik: ['sarilik', 'ikter', 'fototerapi'],
  anemi: ['anemi', 'demir', 'hemoglobin', 'demir eksikligi'],
  vitamin: ['d vitamini', 'b12', 'vitamin'],
  diyabet: ['diyabet', 'seker', 'insulin', 'e10', 'e11', 'hba1c'],
  tansiyon: ['tansiyon', 'hipertansiyon', 'kb', 'i10'],
  tiroid: ['tiroid', 'hipotiroid', 'e03'],
  kalp: ['kalp', 'aritmi', 'uflu', 'cyanoz', 'stent', 'efor', 'af', 'kalp yetmezligi'],
  noro: ['nobet', 'havale', 'epilepsi', 'fejril konvulsiyon'],
  ruh: ['otizm', 'mchat', 'dikkat', 'hiperaktivite', 'kekeme', 'gelisim geriligi'],
  ilac: ['ilac', 'recete', 'antibiyotik', 'amoksisilin', 'parasetamol', 'ibuprofen'],
  antibiyotik: ['antibiyotik', 'amoksisilin', 'augmentin', 'amoklavin', 'klavulan', 'sefiksim', 'azitromisin', 'klaritromisin'],
  augmentin: ['augmentin', 'amoklavin', 'klavunat', 'croxilex', 'bioment', 'klamoks', 'klavulan', 'amoksisilin klavulanat'],
  randevu: ['randevu', 'kontrol', 'takip'],
  belge: ['belge', 'epikriz', 'lab', 'rontgen', 'tetkik', 'sonuc'],
  gebelik: ['gebelik', 'gebe', 'hamile', 'trimester', 'nst', 'tokoliz', 'ogtt', 'lohusa', 'gbs'],
  jinekoloji: ['adet', 'menoraji', 'pcos', 'myom', 'endometriozis', 'menopoz', 'pap', 'smear'],
  uroloji: ['prostat', 'bph', 'hematuri', 'inkontinans', 'bobrek tasi'],
  cilt: ['akne', 'psoriazis', 'melanom', 'sigil', 'zona', 'uyuz', 'pasi', 'easi', 'tbse', 'fototerapi'],
  dahiliye: ['hba1c', 'egfr', 'ldl', 'score2', 'kdigo', 'statin'],
  ortopedi: ['meniskus', 'omuz', 'bel agri', 'diz', 'kirik'],
}

export const ASI_KELIME = /(^|[^a-z])(asi|asilama|immuniz|kpa|kgb|hepatit|bcg|kizamik|kizamikcik|kabakulak|sucicegi|sucice|difteri|tetanoz|bogmaca|polio|rotavir|influenza|grip)([^a-z]|$)/

export const AY_AD: Record<string, number> = {
  ocak: 1, subat: 2, mart: 3, nisan: 4, mayis: 5, haziran: 6,
  temmuz: 7, agustos: 8, eylul: 9, ekim: 10, kasim: 11, aralik: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

export const KAN_GRUPLARI = ['a rh+', 'a rh-', 'b rh+', 'b rh-', 'ab rh+', 'ab rh-', '0 rh+', '0 rh-', 'o rh+', 'o rh-']
