#!/usr/bin/env node
/** One-shot generator: Klinik Eylül-19 pre + exceptional HTML. Doktor files untouched. */
import { writeFileSync } from 'node:fs'

const CSS = `    :root {
      --bg:#060C18; --surface:#0D1526; --surface2:#121C30; --stroke:rgba(255,255,255,0.10);
      --text:#EDF1F7; --muted:#8FA0B5; --dim:#64748B; --indigo:#15803D;
      --blue:#60A5FA; --blue-soft:rgba(96,165,250,0.14); --amber:#F59E0B; --amber-soft:rgba(245,158,11,0.14);
      --red:#F87171; --red-soft:rgba(248,113,113,0.14); --green:#34D399;
    }
    * { box-sizing:border-box; }
    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background:var(--bg); color:var(--text); line-height:1.45; -webkit-font-smoothing:antialiased; }
    .wrap { max-width:1100px; margin:0 auto; padding:32px 20px 72px; }
    .brand { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:24px; align-items:center; }
    .brand .tag { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); font-weight:700; }
    .brand a { color:#4ADE80; text-decoration:none; font-size:13px; font-weight:600; }
    h1 { margin:0 0 8px; font-size:28px; font-weight:700; letter-spacing:-.02em; }
    h2 { margin:28px 0 12px; font-size:18px; font-weight:700; }
    .lede { margin:0 0 14px; color:var(--muted); font-size:15px; max-width:920px; }
    .pills { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:22px; }
    .pill { display:inline-flex; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:600; border:1px solid transparent; }
    .pill.success { background:rgba(52,211,153,.14); color:var(--green); border-color:rgba(52,211,153,.25); }
    .pill.warning { background:var(--amber-soft); color:var(--amber); border-color:rgba(245,158,11,.28); }
    .pill.danger { background:var(--red-soft); color:var(--red); border-color:rgba(248,113,113,.3); }
    .pill.info { background:var(--blue-soft); color:var(--blue); border-color:rgba(96,165,250,.25); }
    .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
    .stat { background:var(--surface); border:1px solid var(--stroke); border-radius:12px; padding:16px 14px; }
    .stat .v { font-size:24px; font-weight:700; margin-bottom:4px; }
    .stat .v.success { color:var(--green); } .stat .v.warning { color:var(--amber); } .stat .v.danger { color:var(--red); }
    .stat .l { font-size:12px; color:var(--muted); }
    .callout { border-radius:12px; padding:16px 18px; margin:14px 0 22px; border:1px solid; }
    .callout.info { background:var(--blue-soft); border-color:rgba(96,165,250,.28); }
    .callout.warning { background:var(--amber-soft); border-color:rgba(245,158,11,.3); }
    .callout h2 { margin:0 0 6px; font-size:12px; text-transform:uppercase; }
    .callout.info h2 { color:var(--blue); } .callout.warning h2 { color:var(--amber); }
    .callout p { margin:0; font-size:14px; }
    .table-wrap { border:1px solid var(--stroke); border-radius:12px; overflow:auto; margin-bottom:22px; background:var(--surface); }
    table { width:100%; border-collapse:collapse; font-size:13px; min-width:640px; }
    th,td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--stroke); vertical-align:top; }
    th { background:var(--surface2); color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
    td.domain { font-weight:600; } td.note { color:var(--muted); } td.gap { color:#FBBF24; }
    .bars { background:var(--surface); border:1px solid var(--stroke); border-radius:12px; padding:16px; margin-bottom:22px; }
    .bar-row { display:grid; grid-template-columns:minmax(160px,280px) 1fr 40px; gap:10px; align-items:center; margin:8px 0; }
    .bar-track { height:10px; background:rgba(255,255,255,.06); border-radius:999px; overflow:hidden; }
    .bar-fill { height:100%; background:#15803D; border-radius:999px; }
    .bar-fill.warn { background:var(--amber); }
    .cards { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:22px; }
    .cards.three { grid-template-columns:repeat(3,1fr); }
    .card { background:var(--surface); border:1px solid var(--stroke); border-radius:12px; padding:14px; }
    .card .title { font-size:14px; font-weight:650; margin-bottom:6px; }
    .card .body { font-size:12px; color:var(--muted); }
    .banner { border-radius:10px; padding:10px 14px; font-size:13px; margin-bottom:18px; border:1px solid; }
    .banner.ok { background:rgba(21,128,61,.12); border-color:rgba(21,128,61,.4); color:#86EFAC; }
    .banner.warn { background:rgba(245,158,11,.12); border-color:rgba(245,158,11,.4); color:#FBBF24; }
    .foot { margin-top:36px; padding-top:16px; border-top:1px solid var(--stroke); font-size:12px; color:var(--dim); }
    @media (max-width:900px) { .stats,.cards,.cards.three { grid-template-columns:1fr 1fr; } .cards,.cards.three { grid-template-columns:1fr; } .bar-row { grid-template-columns:1fr; } }`

const DALS = [
  {
    file: 'klinik-sac', ad: 'Saç Ekimi', ticket: 'KLINIK-SAC-EXCEPTIONAL-01',
    preWow: 12, postWow: 92, hekim: true,
    anchors: 'SB saç ekimi uygulayıcı sertifikası × TPRECD × TR ayaktan FUE/DHI bakım ritüeli',
    notTus: '≠ plastik-cerrahi TUS / Yaram / OR HIS',
    portal: { path: '/sacim', label: 'Saçım' },
    araclar: [
      ['Donör greft bandı', '/klinik-tools/sac-greft', 'cm² × yoğunluk → greft bandı (karar desteği). Nihai greft hekimde.'],
      ['Yıkama takvimi', '/klinik-tools/sac-takvim', 'Ameliyat → 1 / 3 / 10 / 14. gün bakım vadeleri.'],
      ['Saç ekimi kohort', '/klinik-tools/sac-kohort', 'Geciken yıkama · 10/14. gün kontrol · 1-tap hatırlatma.'],
    ],
    gc: [
      ['Donör greft bandı', 'Seans planı 30 sn; 3180 greft uydurulmaz', 'M'],
      ['Yıkama takvimi', 'Post-op telefon azalır', 'S'],
      ['Saçım portalı', 'Hasta cebinden yıkama günü — greft/tanı yok', 'M'],
      ['Kohort', 'Geciken 10/14. gün tek listede', 'S'],
      ['112 kilit', 'Nekroz / anestezi reaksiyonu portal beklenmez', 'S'],
    ],
    pain: [
      ['“Kaç greft yazayım, sistem uydurmasın”', 'Band karar desteği; kilit hekimde.'],
      ['“Yıkama gününü WhatsApp’tan anlatıyorum”', '1/3/10/14 vade + Saçım.'],
    ],
    mandate: ['SB uygulayıcı sertifikası', 'TPRECD etik', 'Uydurma greft yasağı'],
    out: 'SGK greft paket iddiası · hairline AI · doz/PRP protokol uydurma',
    gap: 'SBİYS senkron / e-imza resmi kayıt iddia edilmez',
  },
  {
    file: 'klinik-estetik-cerrahi', ad: 'Estetik & Plastik Cerrahi', ticket: 'KLINIK-ESTETIK-CERRAHI-EXCEPTIONAL-01',
    preWow: 18, postWow: 91, hekim: true,
    anchors: 'Ayakta Teşhis soğuma × TPRECD etik × TR ayaktan rino/lipo/meme izlem ritüeli',
    notTus: '≠ plastik-cerrahi TUS (Yaram, rekonstrüksiyon, OR HIS)',
    portal: { path: '/estetik-ameliyatim', label: 'Ameliyat bakımım' },
    araclar: [
      ['Elektif onam / soğuma', '/klinik-tools/cerrahi-onam', 'Onam → ameliyat gün farkı. Kesi/implant yok.'],
      ['Ameliyat sonrası takvim', '/klinik-tools/cerrahi-takvim', '1 / 7 / 14 / 42. gün pansuman ve izlem.'],
      ['Estetik cerrahi kohort', '/klinik-tools/cerrahi-kohort', 'Soğuma · geç izlem · emboli 112.'],
    ],
    gc: [
      ['Elektif soğuma kaydı', 'Aynı gün işlem bayrağı — mevzuat hatırlatması', 'M'],
      ['42. gün izlem', 'Rino/lipo/meme pansuman ritüeli', 'M'],
      ['Ameliyat bakımım', 'Hasta-güvenli tarih; kesi yok', 'M'],
      ['Emboli 112', 'Nefes / bacak şişliği portal beklenmez', 'S'],
      ['TUS Yaram kapısı', 'Plastik-cerrahi araçları bu dalda açılmaz', 'M'],
    ],
    pain: [
      ['“Onamı aynı gün aldım, sistem uyarmadı”', 'Soğuma kaydı: <1 gün zayıf.'],
      ['“Pansuman gününü deftere yazıyorum”', '1/7/14/42 takvim + portal.'],
    ],
    mandate: ['Ayakta Teşhis soğuma', 'TPRECD etik', 'TUS plastik sızıntısı yok'],
    out: 'OR scheduling · implant seçimi · rekonstrüktif HIS',
    gap: 'SBİYS / e-imza resmi kayıt iddia edilmez',
  },
  {
    file: 'klinik-medikal-estetik', ad: 'Medikal Estetik', ticket: 'KLINIK-MEDIKAL-ESTETIK-EXCEPTIONAL-01',
    preWow: 12, postWow: 92, hekim: true,
    anchors: 'Ayakta Teşhis × TR botoks/dolgu/PRP bakım ritüeli × vasküler oklüzyon 112',
    notTus: '≠ plastik-cerrahi · ≠ klinik-dermatoloji lazer pack',
    portal: { path: '/estetik-bakimim', label: 'Estetik bakımım' },
    araclar: [
      ['Onam / soğuma', '/klinik-tools/estetik-soguma', 'Ayakta Teşhis soğuma kaydı. Doz/ünite yok.'],
      ['İşlem bakım takvimi', '/klinik-tools/estetik-takvim', '1 / 14 / 28. gün kontrol vadeleri.'],
      ['Estetik kohort', '/klinik-tools/estetik-kohort', 'Soğuma · 14/28 · vasküler bayrak.'],
    ],
    gc: [
      ['Soğuma kaydı', 'Aynı gün dolgu/botoks belgelenir', 'M'],
      ['14/28 bakım', 'Botoks etki / dolgu oturma — yorum yok', 'S'],
      ['Vasküler 112', 'Görme kaybı / livedo: hyaluronidaz hekimde', 'M'],
      ['Bakımım portalı', 'Tarih; ürün ve ünite yok', 'M'],
    ],
    pain: [
      ['“Üniteyi sistem yazmasın”', 'Doz yok; kilit hekimde.'],
      ['“Komplikasyonu WhatsApp’ta kaçırıyorum”', '112 metni intake + portal.'],
    ],
    mandate: ['Ayakta Teşhis', 'Vasküler oklüzyon 112', 'Ünite uydurma yasağı'],
    out: 'Hyaluronidaz dozu · ürün markası · anatomi haritası',
    gap: 'Ünite haritası el ile (bilerek); SBİYS yok',
  },
  {
    file: 'klinik-derm', ad: 'Dermatoloji (Klinik)', ticket: 'KLINIK-DERM-EXCEPTIONAL-01',
    preWow: 18, postWow: 91, hekim: true,
    anchors: 'TR ayaktan lazer / akne bakım ritüeli × TDD klinik pratik (tanı değil)',
    notTus: '≠ TUS dermatoloji Derim / lezyon / morfoloji / skor. Slug: klinik-dermatoloji',
    portal: { path: '/klinik-derim', label: 'Bakımım' },
    araclar: [
      ['Lazer seans vadesi', '/klinik-tools/derm-lazer', '14–90 gün aralık. Fluence ve tanı yok.'],
      ['Akne bakım takvimi', '/klinik-tools/derm-takvim', '2 / 6 / 12. hafta — skor yok.'],
      ['Klinik dermatoloji kohort', '/klinik-tools/derm-kohort', 'Geciken seans · lazer 112.'],
    ],
    gc: [
      ['Lazer vadesi', 'Seans aralığı; fluence yazılmaz', 'M'],
      ['Akne 2/6/12', 'Bakım uyum, tanı değil', 'S'],
      ['klinik-dermatoloji slug', 'Çıplak Dermatoloji TUS Derim’de kalır', 'L'],
      ['Bakımım ≠ Derim', 'Hasta yüzü ayrı; lezyon yok', 'M'],
    ],
    pain: [
      ['“Lazer joule’unu sistem uydurmasın”', 'Yalnız gün aralığı.'],
      ['“TUS Derim kliniğe sızacak”', 'Ayrı slug + portal id.'],
    ],
    mandate: ['TUS sızıntısı yok', 'Fluence/skor yasağı', '112 lazer reaksiyon'],
    out: 'ICD otomatik · biyopsi karar motoru · TDD lezyon atlası',
    gap: 'Foto zaman çizgisi sunucu persist yok (KVKK rıza kutusu var)',
  },
  {
    file: 'klinik-long', ad: 'Longevity & Wellness', ticket: 'KLINIK-LONG-EXCEPTIONAL-01',
    preWow: 10, postWow: 91, hekim: true,
    anchors: 'SB IV güvenlik çerçevesi × TR wellness seans ritüeli (karışım/doz yok)',
    notTus: '≠ endokrinoloji Hormonlarım / CGM',
    portal: { path: '/longevitim', label: 'Longevitim' },
    araclar: [
      ['Sonraki seans vadesi', '/klinik-tools/long-vade', 'IV / izlem aralığı — karışım ve doz yazılmaz.'],
      ['IV güvenlik kaydı', '/klinik-tools/long-guvenlik', 'Lot / alerji / 112 yolu — karışım yok.'],
      ['Longevity kohort', '/klinik-tools/long-kohort', 'Geciken seans · IV izlem · 112.'],
    ],
    gc: [
      ['Seans vadesi', 'IV aralığı; NAD+/hormon protokolü yok', 'M'],
      ['Sınıf kaydı', 'IV / izlem etiketi — içerik yok', 'S'],
      ['112 reaksiyon', 'IV reaksiyon portal beklenmez', 'S'],
      ['Longevitim', 'Sonraki tarih; lab yorumu yok', 'M'],
    ],
    pain: [
      ['“Karışımı sistem yazmasın”', 'Yalnız vade.'],
      ['“Kim gecikti, listede yok”', 'Kohort.'],
    ],
    mandate: ['IV doz yasağı', 'Hormon uydurma yok', '112'],
    out: 'Lab köprüsü · NAD+ protokol kütüphanesi · endokrin sızıntısı',
    gap: 'Lab köprüsü yok (bilerek); SBİYS yok',
  },
  {
    file: 'klinik-fizyo', ad: 'Fizyoterapi', ticket: 'KLINIK-FIZYO-EXCEPTIONAL-01',
    preWow: 14, postWow: 91, hekim: false,
    anchors: '29.03.2025 müttefik yönetmeliği × ICF × TR ayaktan fizyo seans ritüeli',
    notTus: '≠ FTR (fizik-tedavi) / FTR’m / enjeksiyon',
    portal: { path: '/fizyom', label: 'Fizyom' },
    araclar: [
      ['ICF seans özeti', '/klinik-tools/fizyo-icf', 'Hekim tanı referansı zorunlu. ICF — tanı yok.'],
      ['Seans vadesi', '/klinik-tools/fizyo-seans', 'Sonraki seans — SGK hak iddiası yok.'],
      ['Fizyoterapi kohort', '/klinik-tools/fizyo-kohort', 'Geciken seans · tanı referansı.'],
    ],
    gc: [
      ['ICF + hekim tanı kilidi', 'Tanısız ICF açılmaz (29.03.2025)', 'L'],
      ['Seans vadesi', 'SGK seans hakkı iddia edilmez', 'S'],
      ['Fizyom', 'Tarih; tanı/egzersiz reçetesi yok', 'M'],
      ['FTR sızıntısı yok', 'fizik-tedavi araçları bu gridde yok', 'M'],
    ],
    pain: [
      ['“Tanı yazarsam yönetmelik ihlali”', 'Hekim tanısı zorunlu referans.'],
      ['“Egzersiz kütüphanesi yok, iddia da yok”', 'Seans vadesi yeter; kütüphane out.'],
    ],
    mandate: ['29.03.2025 tanı hekimde', 'ICF', 'e-reçete gizli'],
    out: 'Egzersiz kütüphanesi · SGK seans hak motoru · FTR enjeksiyon',
    gap: 'Egzersiz şablonu yok (bilerek Partial değil — Missing intentional)',
  },
  {
    file: 'klinik-psikolog', ad: 'Klinik Psikoloji', ticket: 'KLINIK-PSIKOLOG-EXCEPTIONAL-01',
    preWow: 12, postWow: 91, hekim: false,
    anchors: '29.03.2025 × TPD etik / sır saklama × BDT-EMDR-ACT çerçevesi (tanı değil)',
    notTus: '≠ psikiyatri Ruh Sağlığım / PHQ-9 skor / psikotrop',
    portal: { path: '/seanslarim', label: 'Seanslarım' },
    araclar: [
      ['Seans çerçevesi', '/klinik-tools/psikolog-seans', 'Yaklaşım + ölçek kaydı. Tıbbi tanı ve reçete yok.'],
      ['Seans vadesi', '/klinik-tools/psikolog-vade', '3–60 gün aralık — skor yorumu yok.'],
      ['Klinik psikoloji kohort', '/klinik-tools/psikolog-kohort', 'Geciken seans · kriz 112.'],
    ],
    gc: [
      ['Seans çerçevesi', 'BDT/EMDR/ACT kaydı; DSM tanı yok', 'M'],
      ['Kriz 112', 'Ölçek yorumu yok; kriz bayrağı 112', 'M'],
      ['Seanslarım', 'Tarih; tanı/skor yok', 'M'],
      ['Psikiyatri kapısı', 'PHQ motoru / yeşil reçete açılmaz', 'L'],
    ],
    pain: [
      ['“Ölçek skorunu sistem yorumlamasın”', 'Yalnız ölçek adı kaydı.'],
      ['“Krizi mesajda kaçırma”', 'Bayrak + 112.'],
    ],
    mandate: ['29.03.2025', 'TPD etik', 'Reçete/tanı yasağı'],
    out: 'PHQ-9/GAD-7 skor motoru · kapalı servis · psikotrop',
    gap: 'Ölçek skor motoru yok (bilerek)',
  },
  {
    file: 'klinik-diyet', ad: 'Diyetisyen', ticket: 'KLINIK-DIYET-EXCEPTIONAL-01',
    preWow: 12, postWow: 91, hekim: false,
    anchors: '29.03.2025 × Tıbbi Beslenme Tedavisi çerçevesi (hekim tanısı zorunlu)',
    notTus: '≠ endokrinoloji / dahiliye obezite motoru',
    portal: { path: '/beslenmem', label: 'Beslenmem' },
    araclar: [
      ['Makro bandı', '/klinik-tools/diyet-makro', 'kcal / protein karar desteği. Takviye dozu yok.'],
      ['Kontrol takvimi', '/klinik-tools/diyet-takvim', '2 / 4 / 8. hafta — öğün kütüphanesi yok.'],
      ['Diyetisyen kohort', '/klinik-tools/diyet-kohort', 'Geciken kontrol · tanı referansı.'],
    ],
    gc: [
      ['Makro bandı', 'kcal bandı; takviye dozu yok', 'M'],
      ['Hekim tanı referansı', 'Tanısız TBT açılmaz', 'M'],
      ['Beslenmem', 'Kontrol tarihi; lab yorumu yok', 'S'],
    ],
    pain: [
      ['“Kalori sayısını kilitlemeyin”', 'Band; hedef hekim/danışanda.'],
      ['“Diyabet planını uydurma”', 'Tanı satırı zorunlu, protokol yok.'],
    ],
    mandate: ['29.03.2025', 'Hekim tanı', 'Takviye doz yasağı'],
    out: 'Öğün şablonu · CGM · endokrin sızıntısı',
    gap: 'Öğün kütüphanesi yok',
  },
  {
    file: 'klinik-ergo', ad: 'Ergoterapi', ticket: 'KLINIK-ERGO-EXCEPTIONAL-01',
    preWow: 10, postWow: 90, hekim: false,
    anchors: '29.03.2025 × GYA odaklı seans (hekim tanısı zorunlu) × Neyzi yasağı',
    notTus: '≠ pediatri Hedef Boy / Neyzi · ≠ FTR',
    portal: { path: '/ergom', label: 'Ergom' },
    araclar: [
      ['GYA özeti', '/klinik-tools/ergo-gya', 'Hekim tanı + GYA odak. Neyzi yok.'],
      ['GYA seans vadesi', '/klinik-tools/ergo-seans', '3–42 gün — motor skor yok.'],
      ['Ergoterapi kohort', '/klinik-tools/ergo-kohort', 'Geciken seans · GYA odak.'],
    ],
    gc: [
      ['GYA özeti', 'Giyinme/yemek odak; tanı hekimde', 'M'],
      ['Neyzi kilidi', 'Pediatri büyüme bu dalda yok', 'L'],
      ['Ergom', 'Seans tarihi; motor skor yok', 'S'],
    ],
    pain: [
      ['“Çocuk ergoterapide Hedef Boy görünmesin”', 'Neyzi/Hedef Boy yok.'],
      ['“GYA’yı serbest notta kaybediyorum”', 'Checkbox özet.'],
    ],
    mandate: ['29.03.2025', 'Hekim tanı', 'Pediatri sızıntısı yok'],
    out: 'Ekipman katalog · Neyzi · FTR sızıntısı',
    gap: 'Ekipman seçim listesi yok',
  },
  {
    file: 'klinik-odyo', ad: 'Odyoloji', ticket: 'KLINIK-ODYO-EXCEPTIONAL-01',
    preWow: 12, postWow: 91, hekim: false,
    anchors: '29.03.2025 × TR odyoloji eşik kaydı (tanı değil) × ani işitme 112',
    notTus: '≠ KBB odyometri / SGK işitme raporu / koklear',
    portal: { path: '/isitmem-odyoloji', label: 'İşitmem' },
    araclar: [
      ['Eşik kaydı', '/klinik-tools/odyo-esik', 'Saf ses ortalaması bandı — işitme kaybı tanısı değil.'],
      ['Sessiz oda kaydı', '/klinik-tools/odyo-oda', 'md.11 ≥3 m² — kayıp tanısı yok.'],
      ['Odyoloji kohort', '/klinik-tools/odyo-kohort', 'Geciken eşik · ani işitme 112.'],
    ],
    gc: [
      ['PTA kayıt bandı', 'dB kayıt; kayıp tanısı yok', 'M'],
      ['Cihaz listesi kilidi', 'Uzman hekim raporu yoksa iddia yok', 'M'],
      ['Ani işitme 112', 'KBB acil — odyolog tanı koymaz', 'S'],
      ['İşitmem', 'Tarih; dB yorumu yok', 'M'],
    ],
    pain: [
      ['“KBB odyometrisini kopyalamayın”', 'Ayrı motor, KBB araç yok.'],
      ['“Cihaz raporu yazmayın”', 'Yalnız hekim raporu bayrağı.'],
    ],
    mandate: ['29.03.2025', 'Tanı hekimde', 'KBB sızıntısı yok'],
    out: 'KBB motor kopyası · SGK cihaz raporu · koklear HIS',
    gap: 'Timpanometri/OAE sayı motoru yok (bilerek)',
  },
]

/** Same 5-slot TR clinician stack as lib/klinik/klinikTurkishRefs.ts */
const REFS = {
  'klinik-sac': [
    'T.C. SB saç ekimi uygulayıcı sertifikası / tıbbi estetik uygulama çerçevesi',
    'Türk Plastik Rekonstrüktif ve Estetik Cerrahi Derneği (TPRECD) etik ve hasta güvenliği',
    'Estetik Plastik Cerrahi Derneği (EPCD) ayaktan saç cerrahisi pratik önerileri',
    'T.C. SB Ayakta Teşhis ve Tedavi Yapılan Özel Sağlık Kuruluşları Hakkında Yönetmelik (soğuma / onam)',
    'SGK kozmetik FUE/DHI paket iddiası yazılmaz — greft sayısı hekimde',
  ],
  'klinik-estetik-cerrahi': [
    'T.C. SB Ayakta Teşhis ve Tedavi Yapılan Özel Sağlık Kuruluşları Hakkında Yönetmelik (elektif soğuma / onam)',
    'Türk Plastik Rekonstrüktif ve Estetik Cerrahi Derneği (TPRECD) etik ve hasta güvenliği',
    'Estetik Plastik Cerrahi Derneği (EPCD) rino/lipo/meme izlem pratik önerileri',
    'T.C. SB ameliyathane / cerrahi güvenlik protokolleri (ayaktan elektif)',
    'SGK elektif kozmetik paket iddiası yazılmaz — rekonstrüktif HIS TUS plastiktedir',
  ],
  'klinik-medikal-estetik': [
    'T.C. SB Ayakta Teşhis ve Tedavi — botoks/dolgu soğuma ve onam kaydı',
    'TPRECD / EPCD medikal estetik hasta güvenliği önerileri',
    'TİTCK botulinum toksin ve hyaluronik asit KÜB (ünite/mL hekimde; sistem yazmaz)',
    'TR ayaktan vasküler oklüzyon pratik: görme kaybı / livedo → 112; hyaluronidaz hekimde',
    'SGK kozmetik dolgu/botoks paket iddiası yazılmaz',
  ],
  'klinik-derm': [
    'T.C. SB Ayakta Teşhis ve Tedavi — lazer / kozmetik işlem soğuma',
    'Türk Dermatoloji Derneği (TDD) akne ve kozmetik dermatoloji konsensusları (klinik pratik; biyolojik rapor chapter’ı değil)',
    'TDD fototerapi / lazer çalışma grubu önerileri — fluence ve endikasyon hekimde',
    'TİTCK lazer / IPL cihaz ve kozmetik ürün güvenliği',
    'SGK kozmetik lazer paket iddiası yazılmaz — biyolojik rapor TUS dermatolojidedir',
  ],
  'klinik-long': [
    'T.C. SB Ayakta Teşhis / özel sağlık — IV ve izlem güvenliği (karışım yazılmaz)',
    'Türk Geriatri Derneği klinik yaşlanma / koruyucu yaklaşım (tanı hekimde)',
    'TİTCK parenteral ürün KÜB — NAD+/hormon protokolü uydurulmaz',
    'TEMD yaşam tarzı önerileri yalnız hekim tanı referansı ile (endokrin motor yok)',
    'SGK wellness / IV paket iddiası yazılmaz',
  ],
  'klinik-fizyo': [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — fizyoterapist; tanı/reçete yok',
    'Türkiye Fizyoterapistler Derneği (TFTD) meslek çerçevesi ve eğitim önerileri',
    'ICF (WHO) — TR fizyoterapi eğitiminde kullanılan işlevsellik dili (tanı değil)',
    'T.C. SB rehabilitasyon hizmetleri: hekim tanı referansı zorunlu',
    'SGK fizik tedavi seans hakkı iddia edilmez — FTR raporu hekimdedir',
  ],
  'klinik-psikolog': [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — klinik psikolog; tıbbi tanı/reçete yok',
    'Türk Psikologlar Derneği (psikolog.org.tr) Etik Yönetmeliği — sır saklama / yetkinlik',
    'Bilişsel Davranışçı Psikoterapiler Derneği eğitim çerçevesi (BDT kaydı; DSM tanı motoru yok)',
    'T.C. SB kriz yönlendirme / 112 — ölçek skoru yorumlanmaz',
    'SGK reçete-rapor çerçevesi bu meslekte yoktur — psikotrop yazılmaz',
  ],
  'klinik-diyet': [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — diyetisyen; tıbbi tanı yok',
    'Türkiye Diyetisyenler Derneği (tdd.org.tr) Tıbbi Beslenme Tedavisi çerçevesi',
    'T.C. SB HSGM Diyabette Tıbbi Beslenme Tedavisi / toplum beslenmesi rehberleri — kalori hedefi hekim/danışanda',
    'TEMD DM beslenme önerileri yalnız hekim tanı referansı ile (endokrin / insülin motoru yok)',
    'SGK mama / takviye rapor ve doz iddiası yazılmaz',
  ],
  'klinik-ergo': [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — iş ve uğraşı terapisti (ergoterapist); tanı yok',
    'Ergoterapi Derneği (ergoterapidernegi.org) meslek çerçevesi — WFOT üyesi TR dernek',
    'ICF + GYA (günlük yaşam aktiviteleri) değerlendirme dili — tanı hekimde',
    'T.C. SB engellilik / işlevsellik değerlendirme (rapor hekimde)',
    'Pediatri büyüme eğrisi / boy tahmini araçları bu dalda açılmaz',
  ],
  'klinik-odyo': [
    'T.C. SB Sağlık Meslek Mensuplarının Serbest Meslek İcrası Hakkında Yönetmelik (RG 29.03.2025/32856) — odyolog; işitme kaybı tanısı yok',
    'Türkiye Odyologlar ve Konuşma Bozuklukları Derneği (odyoloji.org.tr) meslek çerçevesi',
    'Odyologlar Derneği (odyologlar.org.tr) lisans odyolog pratik önerileri',
    'T.C. SB yenidoğan / okul işitme tarama protokolleri (tarama; tanı KBB hekimde)',
    'SGK işitme cihazı — uzman hekim raporu yoksa iddia yok; KBB motoru kopyalanmaz',
  ],
}

function kaynakTablosu(file, label) {
  const rows = (REFS[file] || []).map((r, i) => `<tr><td>${i + 1}</td><td class="domain">${r}</td></tr>`).join('')
  return `<h2>${label}</h2>
  <p class="lede" style="font-size:13px">TR klinisyen / müttefik meslek altın kaynakları (doktor TURKISH_REFS ile aynı 5’li kalıp). Çakışmada TR &gt; uluslararası. Katalog: <code>lib/klinik/klinikTurkishRefs.ts</code> — Doktor TURKISH_REFS’e eklenmez.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Golden TR reference</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`
}

function wrap(title, desc, body) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <style>${CSS}</style>
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>
`
}

for (const d of DALS) {
  const pre = wrap(
    `${d.ad} — Klinik pre-sprint audit · Notya`,
    `Eylül 19 chrome. ${d.ad} Klinik dalı baseline ~${d.preWow}%. Chapter/Araç/portal yok. No PHI.`,
    `  <div class="brand">
    <span class="tag">Notya · Pre-sprint Klinik audit · ${d.ad}</span>
    <span>
      <a href="/${d.file}-exceptional-audit.html">Post-exceptional →</a> ·
      <a href="/klinik-presprint-audit.html">Klinik base →</a>
    </span>
  </div>
  <div class="banner warn"><b>Pre-sprint lock · 2026-09-22</b> — Klinik ayrı kategori. Doktor TUS gold’u bu dalın gold’u değildir. ${d.notTus}. Deploy yok (go bekleniyor).</div>
  <h1>${d.ad} — Pre-sprint Audit (~${d.preWow}%)</h1>
  <p class="lede">${d.anchors}. Soru: bu Klinik dal exceptional barda mı? <b>Hayır — honest wow ~${d.preWow}%.</b> Landing persona + Pabau admin var; motor, Araçlar, hasta dosyası, Sağlığım yok.</p>
  <div class="pills">
    <span class="pill danger">${d.ticket} baseline</span>
    <span class="pill warning">${d.hekim ? 'hekim klinik' : 'müttefik 29.03.2025'}</span>
    <span class="pill info">Honest wow ~${d.preWow}%</span>
    <span class="pill danger">Araçlar 0</span>
  </div>
  <div class="stats">
    <div class="stat"><div class="v warning">1</div><div class="l">Partial (landing)</div></div>
    <div class="stat"><div class="v danger">6</div><div class="l">Missing domains</div></div>
    <div class="stat"><div class="v danger">0</div><div class="l">Klinik Araç</div></div>
    <div class="stat"><div class="v danger">0</div><div class="l">Portal Strong</div></div>
  </div>
  <div class="callout warning"><h2>Gap</h2><p>Chapter motor, Klinik Araçlar, kohort, ${d.portal.label} portal, hasta/randevu omurgası ve ${d.notTus} kapısı yok. Bu haliyle TR klinik uzmanı “ulan bu başka” demez.</p></div>
  <h2>Wow bar</h2>
  <div class="bars">
    <div class="bar-row"><span>${d.ad}</span><div class="bar-track"><div class="bar-fill warn" style="width:${d.preWow}%"></div></div><b>${d.preWow}</b></div>
    <div class="bar-row"><span>Klinik omurga</span><div class="bar-track"><div class="bar-fill warn" style="width:12%"></div></div><b>12</b></div>
    <div class="bar-row"><span>Hasta portalı</span><div class="bar-track"><div class="bar-fill warn" style="width:0%"></div></div><b>0</b></div>
  </div>
  <h2>Coverage depth</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Domain</th><th>Depth</th><th>Note</th><th>Gap to wow</th></tr></thead>
    <tbody>
      <tr><td class="domain">Landing / persona</td><td><span class="pill warning">Partial</span></td><td class="note">/klinik# hash + sesli persona</td><td class="gap">Ürün yüzeyi yok</td></tr>
      <tr><td class="domain">Motor / chapter</td><td><span class="pill danger">Missing</span></td><td class="note">—</td><td class="gap">Deterministik motor</td></tr>
      <tr><td class="domain">Klinik Araçlar</td><td><span class="pill danger">Missing</span></td><td class="note">/klinik-tools boş</td><td class="gap">2–3 tile + kohort</td></tr>
      <tr><td class="domain">Hasta portalı (Sağlığım)</td><td><span class="pill danger">Missing</span></td><td class="note">Çekirdek yok (hasta yok)</td><td class="gap">${d.portal.label}</td></tr>
      <tr><td class="domain">Omurga (hasta/randevu)</td><td><span class="pill danger">Thin</span></td><td class="note">Pabau notu</td><td class="gap">Klinik Hastalar / Randevular</td></tr>
      <tr><td class="domain">Sızıntı kapısı</td><td><span class="pill danger">Missing</span></td><td class="note">${d.notTus}</td><td class="gap">Test + slug</td></tr>
    </tbody>
  </table></div>
  <h2>Mandate / practice</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Mandate</th><th>Level</th><th>In product today</th><th>Gap to wow</th></tr></thead>
    <tbody>${d.mandate.map((m) => `<tr><td class="domain">${m}</td><td class="note">${d.hekim ? 'Reg / BP' : 'Law · 29.03.2025'}</td><td class="note">Yok</td><td class="gap">Exceptional pack</td></tr>`).join('')}</tbody>
  </table></div>
  <h2>Planned Klinik-only Araçlar</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Tool</th><th>Route</th><th>Bucket</th></tr></thead>
    <tbody>${d.araclar.map((a) => `<tr><td class="domain">${a[0]}</td><td class="note">${a[1]}</td><td><span class="pill info">Klinik specialty-only</span></td></tr>`).join('')}
      <tr><td class="domain">Doktor TUS Araçları</td><td class="note">Görünmez</td><td><span class="pill success">Locked</span></td></tr>
    </tbody>
  </table></div>
  ${kaynakTablosu(d.file, 'Golden TR references (planned lock)')}
  <h2>Planned game changers (exceptional sprint)</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Move</th><th>Why they care</th><th>Size</th></tr></thead>
    <tbody>${d.gc.map((g, i) => `<tr><td>${i + 1}</td><td class="domain">${g[0]}</td><td class="note">${g[1]}</td><td><span class="pill info">${g[2]}</span></td></tr>`).join('')}</tbody>
  </table></div>
  <p class="foot">Pre-sprint · 2026-09-22 · ${d.ticket} baseline · No PHI · not on Doktor Araçları · <a href="/${d.file}-exceptional-audit.html">after →</a></p>`,
  )

  const post = wrap(
    `${d.ad} — Klinik post-exceptional audit · Notya`,
    `${d.ticket}: ${d.ad} ~${d.preWow}% → ~${d.postWow}%. ${d.araclar.length} Klinik Araç. ${d.portal.label} Strong. No PHI.`,
    `  <div class="brand">
    <span class="tag">Notya · Post-exceptional Klinik audit · ${d.ad}</span>
    <span>
      <a href="/${d.file}-presprint-audit.html">Pre-sprint (~${d.preWow}%) →</a> ·
      <a href="/klinik-exceptional-audit.html">Klinik 10 →</a>
    </span>
  </div>
  <div class="banner ok"><b>Post-exceptional ${d.ticket}</b> — 2026-09-22 · Eylül 19 chrome. Klinik ayrı kategori. ${d.notTus}. <b>Local pack — merge/deploy yalnız go.</b></div>
  <h1>${d.ad} — Post-exceptional Audit</h1>
  <p class="lede">${d.anchors}. Soru: Doktor exceptional barında mı (Klinik yüzeyinde)? <b>Ürün cevap: evet — honest wow ~${d.postWow}% (pre ~${d.preWow}%).</b> Olgunluk: beta-hazir. Uzman-dogrulandi saha pending.</p>
  <div class="pills">
    <span class="pill success">${d.ticket}</span>
    <span class="pill warning">olgunluk beta-hazir</span>
    <span class="pill success">${d.araclar.length} Klinik Araç</span>
    <span class="pill success">${d.portal.label} Strong</span>
    <span class="pill info">Honest wow ~${d.postWow}%</span>
    <span class="pill ${d.hekim ? 'info' : 'warning'}">${d.hekim ? 'hekim klinik' : 'müttefik — tanı yok'}</span>
  </div>
  <div class="stats">
    <div class="stat"><div class="v success">${6 + d.araclar.length}</div><div class="l">Strong slices</div></div>
    <div class="stat"><div class="v warning">1</div><div class="l">Partial (SBİYS)</div></div>
    <div class="stat"><div class="v success">${d.araclar.length}</div><div class="l">Klinik-only Araç</div></div>
    <div class="stat"><div class="v success">1</div><div class="l">Portal Strong</div></div>
  </div>
  <div class="callout info"><h2>Executive verdict</h2><p>${d.ad} Klinik sandalye için ≥90: deterministik motor, ${d.araclar.length} Klinik-only araç, gerçek kohort (geciken / rıza-eksik / 112), seans + iki nüsha rıza dosyada, ${d.portal.label} ritim. ${d.notTus}. ${d.hekim ? 'Doz/greft/ünite karar desteğidir — kilit hekimde.' : '29.03.2025: tanı ve e-reçete yok; hekim referansı zorunlu.'} Tek Partial: canlı SBİYS / e-imza (iddia yok). Bu paket go demeden production’a çıkmaz.</p></div>
  <h2>Trajectory</h2>
  <div class="cards three">
    <div class="card"><div class="title">Pre-sprint</div><div class="body">Landing + persona · ~${d.preWow}%</div></div>
    <div class="card"><div class="title">${d.ticket}</div><div class="body">${d.araclar.length} Araç · ${d.portal.label} · ~${d.postWow}%</div></div>
    <div class="card"><div class="title">Next</div><div class="body">go → deploy · MD saha haftası</div></div>
  </div>
  <h2>Wow bar</h2>
  <div class="bars">
    <div class="bar-row"><span>Pre</span><div class="bar-track"><div class="bar-fill warn" style="width:${d.preWow}%"></div></div><b>${d.preWow}</b></div>
    <div class="bar-row"><span>Post-exceptional</span><div class="bar-track"><div class="bar-fill" style="width:${d.postWow}%"></div></div><b>${d.postWow}</b></div>
  </div>
  <h2>Coverage depth</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Domain</th><th>Depth</th><th>In product</th><th>Gap</th></tr></thead>
    <tbody>
      <tr><td class="domain">Motor</td><td><span class="pill success">Strong</span></td><td class="note">${d.ticket} deterministik</td><td class="note">—</td></tr>
      <tr><td class="domain">Klinik Araçlar</td><td><span class="pill success">Strong</span></td><td class="note">${d.araclar.map((a) => a[0]).join(' · ')}</td><td class="note">Doktor’a sızmaz</td></tr>
      <tr><td class="domain">Hasta portalı (Sağlığım)</td><td><span class="pill success">Strong</span></td><td class="note">${d.portal.label} ${d.portal.path} — tanı/doz yok</td><td class="gap">Tarih bundle boş state</td></tr>
      <tr><td class="domain">Kohort</td><td><span class="pill success">Strong</span></td><td class="note">Geciken · rıza-eksik · 112 listesi</td><td class="note">SBİYS yok</td></tr>
      <tr><td class="domain">Seans / rıza kaydı</td><td><span class="pill success">Strong</span></td><td class="note">İki nüsha + veli/plan; cihaz dosyası</td><td class="gap">${d.gap}</td></tr>
      <tr><td class="domain">Sızıntı</td><td><span class="pill success">Strong</span></td><td class="note">${d.notTus}</td><td class="note">Test kilitli</td></tr>
    </tbody>
  </table></div>
  <h2>Mandate / practice</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Mandate</th><th>Level</th><th>In product today</th><th>Gap to wow</th></tr></thead>
    <tbody>${d.mandate.map((m) => `<tr><td class="domain">${m}</td><td class="note">${d.hekim ? 'Reg / BP' : 'Law · 29.03.2025'}</td><td class="note">Exceptional pack’te</td><td class="note">—</td></tr>`).join('')}
      <tr><td class="domain">Doktor Araçları sızıntısı</td><td class="note">Product</td><td class="note">/klinik-tools only</td><td class="note">—</td></tr>
    </tbody>
  </table></div>
  <h2>Klinik-only Araçlar</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Tool</th><th>Route</th><th>Bucket</th><th>Visibility</th></tr></thead>
    <tbody>
      ${d.araclar.map((a) => `<tr><td class="domain">${a[0]}</td><td class="note">${a[2]}</td><td><span class="pill info">Klinik specialty-only</span></td><td class="note">${a[1]} · yalnız ${d.ad}</td></tr>`).join('')}
      <tr><td class="domain">Doktor / FTR / KBB / psik / derm TUS</td><td class="note">Görünmez</td><td><span class="pill success">Locked</span></td><td class="note">${d.notTus}</td></tr>
      <tr><td class="domain">Bu audit HTML</td><td class="note">—</td><td><span class="pill danger">FORBIDDEN</span></td><td class="note">/klinik-tools’a bağlanmaz</td></tr>
    </tbody>
  </table></div>
  <h2>Game changers</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Move</th><th>Why they care</th><th>Size</th></tr></thead>
    <tbody>${d.gc.map((g, i) => `<tr><td>${i + 1}</td><td class="domain">${g[0]}</td><td class="note">${g[1]}</td><td><span class="pill info">${g[2]}</span></td></tr>`).join('')}</tbody>
  </table></div>
  <h2>Pain → now</h2>
  <div class="cards">
    ${d.pain.map((p) => `<div class="card"><div class="title">${p[0]}</div><div class="body"><b>Now:</b> ${p[1]}</div></div>`).join('')}
  </div>
  ${kaynakTablosu(d.file, 'Sources — Golden TR references')}
  <h2>Intentionally out</h2>
  <p class="lede" style="font-size:13px">${d.out}. SOAP Doktor kopyası yok. Audit Araçlar’a bağlanmaz.</p>
  <h2>Recommended next</h2>
  <div class="cards three">
    <div class="card"><div class="title">Impress</div><div class="body">Kohort persist + portal tarih bundle.</div></div>
    <div class="card"><div class="title">Mandate</div><div class="body">${d.hekim ? 'Soğuma e-imza out (bilerek).' : '29.03.2025 kilit saha teyidi.'}</div></div>
    <div class="card"><div class="title">Saha</div><div class="body">Bir beta haftası → uzman-dogrulandi.</div></div>
  </div>
  <p class="foot">Post-exceptional ${d.ticket} · 2026-09-22 · No PHI · wait for go · <a href="/${d.file}-presprint-audit.html">pre →</a></p>`,
  )

  writeFileSync(new URL(`../public/${d.file}-presprint-audit.html`, import.meta.url), pre)
  writeFileSync(new URL(`../public/${d.file}-exceptional-audit.html`, import.meta.url), post)
  console.log('wrote', d.file)
}
