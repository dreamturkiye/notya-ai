/**
 * DIKTE-TIBBI-01 — core dictation lexicon: terms every one of the 40 branşlar dictates (general exam, vitals, common
 * findings, Turkish medical spelling). Loaded together with the branş file. Data only.
 */
import type { Sozluk } from '../duzelt'

const sozluk: Sozluk = {
  terimler: [
    // general exam and history
    'anamnez', 'fizik muayene', 'genel durum', 'bilinç açık', 'koopere', 'oryante', 'afebril', 'febril', 'subfebril', 'vital bulgular',
    'taşikardi', 'bradikardi', 'takipne', 'dispne', 'ortopne', 'siyanoz', 'ikter', 'ikterik', 'anikterik', 'solukluk', 'dehidratasyon',
    'ödem', 'pretibial ödem', 'lenfadenopati', 'servikal lenfadenopati', 'hepatomegali', 'splenomegali', 'hepatosplenomegali',
    'hiperemi', 'hiperemik', 'eritem', 'eritematöz', 'ödemli', 'hassasiyet', 'palpasyon', 'perküsyon', 'oskültasyon', 'inspeksiyon',
    'bilateral', 'unilateral', 'simetrik', 'asimetrik', 'mukoid', 'pürülan', 'seröz', 'hemorajik', 'seropürülan', 'mukopürülan',
    'akut', 'kronik', 'subakut', 'rekürren', 'progresif', 'intermittan', 'persistan', 'idiyopatik', 'konjenital',
    'enflamasyon', 'enfeksiyon', 'inflamatuvar', 'bakteriyel', 'viral', 'fungal', 'alerjik', 'otoimmün',
    'semptom', 'semptomatik', 'asemptomatik', 'prognoz', 'komplikasyon', 'kontrendikasyon', 'endikasyon', 'diferansiyel tanı', 'ön tanı',
    'hemogram', 'lökositoz', 'lökopeni', 'trombositopeni', 'anemi', 'sedimantasyon', 'prokalsitonin', 'kreatinin', 'elektrolit',
    'biyokimya', 'tam idrar tetkiki', 'kültür', 'antibiyogram', 'ultrasonografi', 'tomografi', 'manyetik rezonans', 'radyografi',
    'hipertansiyon', 'hipotansiyon', 'diyabet', 'hiperlipidemi', 'hipotiroidi', 'hipertiroidi', 'astım', 'koah', 'obezite',
    'analjezik', 'antipiretik', 'antibiyotik', 'antihistaminik', 'kortikosteroid', 'nonsteroid', 'antiinflamatuvar', 'proton pompa inhibitörü',
    'oral', 'intravenöz', 'intramüsküler', 'subkutan', 'topikal', 'inhaler', 'nebül', 'profilaksi', 'ampirik',
    'kontrol muayenesi', 'konsültasyon', 'sevk', 'epikriz', 'taburcu', 'yatış', 'poliklinik',
    'abdomen', 'batın', 'defans', 'rebound', 'bağırsak sesleri', 'toraks', 'solunum sesleri', 'ral', 'ronküs', 'wheezing', 'stridor',
    'kalp sesleri', 'üfürüm', 'ritmik', 'aritmi', 'nabız', 'periferik nabızlar', 'kapiller dolum', 'turgor',
    'nörolojik muayene', 'meningeal irritasyon', 'ense sertliği', 'refleks', 'derin tendon refleksleri', 'babinski', 'parestezi', 'vertigo',
    'konjonktiva', 'sklera', 'pupil', 'izokorik', 'anizokori', 'farenks', 'tonsil', 'larenks', 'servikal', 'tiroid', 'guatr',
  ],
  hatalar: [
    // common Turkish ASR splits of core terms
    { duyulan: ['hiper emik', 'hiper amik', 'hiperamik', 'hiper ermik'], dogru: 'hiperemik', ekli: true },
    { duyulan: ['ödem li'], dogru: 'ödemli' },
    { duyulan: ['lenfa denopati', 'lenf adenopati', 'lenfadeno pati'], dogru: 'lenfadenopati', ekli: true },
    { duyulan: ['hepato megali'], dogru: 'hepatomegali', ekli: true },
    { duyulan: ['spleno megali'], dogru: 'splenomegali', ekli: true },
    { duyulan: ['a febril', 'af febril'], dogru: 'afebril' },
    { duyulan: ['sub febril'], dogru: 'subfebril' },
    { duyulan: ['pürü lan', 'püre lan'], dogru: 'pürülan' },
    { duyulan: ['ta şikardi'], dogru: 'taşikardi', ekli: true },
    { duyulan: ['os kültasyon', 'oskül tasyon'], dogru: 'oskültasyon', ekli: true },
    { duyulan: ['ronkus'], dogru: 'ronküs', ekli: true },
    { duyulan: ['vizing', 'viizing'], dogru: 'wheezing' },
  ],
}

export default sozluk
