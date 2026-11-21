/**
 * KRONIK-SECIM-01 (beta feedback, KBB doctor, 2026-11-21): "Kronik hastalıklar seçeneği sınırlı, ekleme yapabilmeliyiz."
 * The new-patient screen offered four fixed chips (Diyabet, Hipertansiyon, Astım, Kalp Hastalığı) and nothing else; the
 * summary card took one comma-separated line. The picker (components/doktor/KronikHastalikSecici.tsx) now offers:
 *   - the branş's own common conditions on top (gated per branş — a KBB list is never shown to kardiyoloji),
 *   - a searchable list of common chronic conditions with their ICD-10 code (search by Turkish name or code),
 *   - free-text add for anything not in the list, multi-select, removable chips.
 *
 * Stored shape is unchanged: `kronikHastaliklar` is an array of strings in the encrypted notes blob
 * (lib/doktor/hastaKayitAlanlari.ts). A chosen list item is stored as its Turkish name — the same words the intake form
 * and old records use ("Diyabet", "Hipertansiyon") — so existing records, search and Ayşe read it unchanged.
 */

export type KronikTani = { ad: string; kod: string; esAnlam?: readonly string[] };

/** Common chronic conditions (ICD-10, WHO 2019 / ICD-10-TR codes at category level). Names as Turkish clinicians write them. */
export const KRONIK_TANILAR: readonly KronikTani[] = [
  { ad: 'Diyabet', kod: 'E11', esAnlam: ['diabetes mellitus', 'dm', 'şeker hastalığı', 'tip 2 diyabet'] },
  { ad: 'Tip 1 diyabet', kod: 'E10', esAnlam: ['dm tip 1', 'insüline bağımlı diyabet'] },
  { ad: 'Prediyabet / insülin direnci', kod: 'R73.0', esAnlam: ['bozulmuş glukoz toleransı', 'insulin direnci'] },
  { ad: 'Hipertansiyon', kod: 'I10', esAnlam: ['yüksek tansiyon', 'esansiyel hipertansiyon', 'ht'] },
  { ad: 'Koroner arter hastalığı', kod: 'I25', esAnlam: ['kah', 'kalp hastalığı', 'iskemik kalp hastalığı'] },
  { ad: 'Kalp yetmezliği', kod: 'I50', esAnlam: ['kky', 'konjestif kalp yetmezliği'] },
  { ad: 'Atriyal fibrilasyon', kod: 'I48', esAnlam: ['af', 'ritim bozukluğu'] },
  { ad: 'Kalp kapak hastalığı', kod: 'I35', esAnlam: ['kapak hastalığı', 'mitral', 'aort darlığı'] },
  { ad: 'Doğuştan kalp hastalığı', kod: 'Q24', esAnlam: ['konjenital kalp hastalığı', 'vsd', 'asd'] },
  { ad: 'Periferik arter hastalığı', kod: 'I73.9' },
  { ad: 'Derin ven trombozu öyküsü', kod: 'Z86.7', esAnlam: ['dvt'] },
  { ad: 'Hiperlipidemi', kod: 'E78', esAnlam: ['kolesterol yüksekliği', 'dislipidemi'] },
  { ad: 'Obezite', kod: 'E66' },
  { ad: 'Hipotiroidi', kod: 'E03', esAnlam: ['tiroid hastalığı', 'haşimoto', 'hashimoto'] },
  { ad: 'Hipertiroidi', kod: 'E05', esAnlam: ['tiroid hastalığı', 'graves', 'tirotoksikoz'] },
  { ad: 'Tiroid nodülü', kod: 'E04.1', esAnlam: ['guatr', 'nodüler guatr'] },
  { ad: 'Osteoporoz', kod: 'M81', esAnlam: ['kemik erimesi'] },
  { ad: 'Astım', kod: 'J45', esAnlam: ['astim', 'bronşiyal astım'] },
  { ad: 'KOAH', kod: 'J44', esAnlam: ['kronik obstrüktif akciğer hastalığı', 'amfizem', 'kronik bronşit'] },
  { ad: 'Bronşektazi', kod: 'J47' },
  { ad: 'Obstrüktif uyku apnesi', kod: 'G47.3', esAnlam: ['osas', 'uyku apnesi', 'horlama'] },
  { ad: 'Alerjik rinit', kod: 'J30', esAnlam: ['saman nezlesi', 'burun alerjisi'] },
  { ad: 'Kronik sinüzit', kod: 'J32', esAnlam: ['kronik rinosinüzit', 'sinüzit'] },
  { ad: 'Nazal polip', kod: 'J33', esAnlam: ['burun polibi'] },
  { ad: 'Septum deviasyonu', kod: 'J34.2', esAnlam: ['burun eğriliği'] },
  { ad: 'Kronik tonsillit', kod: 'J35.0', esAnlam: ['kronik bademcik iltihabı'] },
  { ad: 'Adenoid hipertrofisi', kod: 'J35.2', esAnlam: ['geniz eti'] },
  { ad: 'Kronik otitis media', kod: 'H66.3', esAnlam: ['kronik orta kulak iltihabı', 'kom'] },
  { ad: 'Seröz otitis media', kod: 'H65.3', esAnlam: ['orta kulakta sıvı'] },
  { ad: 'İşitme kaybı', kod: 'H91', esAnlam: ['sağırlık', 'sensörinöral işitme kaybı', 'işitme azlığı'] },
  { ad: 'Tinnitus', kod: 'H93.1', esAnlam: ['kulak çınlaması'] },
  { ad: 'Meniere hastalığı', kod: 'H81.0', esAnlam: ['vertigo'] },
  { ad: 'Laringofaringeal reflü', kod: 'K21.9', esAnlam: ['lpr'] },
  { ad: 'Gastroözofageal reflü', kod: 'K21', esAnlam: ['reflü', 'gerd', 'gör'] },
  { ad: 'Peptik ülser', kod: 'K27', esAnlam: ['ülser', 'mide ülseri'] },
  { ad: 'İrritabl bağırsak sendromu', kod: 'K58', esAnlam: ['ibs', 'spastik kolon'] },
  { ad: 'İnflamatuvar bağırsak hastalığı', kod: 'K50', esAnlam: ['crohn', 'ülseratif kolit', 'ibh'] },
  { ad: 'Çölyak hastalığı', kod: 'K90.0', esAnlam: ['gluten enteropatisi'] },
  { ad: 'Kronik hepatit B', kod: 'B18.1', esAnlam: ['hepatit b', 'hbv'] },
  { ad: 'Kronik hepatit C', kod: 'B18.2', esAnlam: ['hepatit c', 'hcv'] },
  { ad: 'Yağlı karaciğer', kod: 'K76.0', esAnlam: ['karaciğer yağlanması', 'nafld', 'masld'] },
  { ad: 'Siroz', kod: 'K74' },
  { ad: 'Kronik böbrek hastalığı', kod: 'N18', esAnlam: ['böbrek hastalığı', 'kbh', 'böbrek yetmezliği'] },
  { ad: 'Böbrek taşı', kod: 'N20', esAnlam: ['nefrolitiazis', 'ürolitiazis'] },
  { ad: 'Benign prostat hiperplazisi', kod: 'N40', esAnlam: ['bph', 'prostat büyümesi'] },
  { ad: 'Aşırı aktif mesane', kod: 'N32.8', esAnlam: ['idrar kaçırma', 'inkontinans'] },
  { ad: 'Polikistik over sendromu', kod: 'E28.2', esAnlam: ['pkos'] },
  { ad: 'Endometriozis', kod: 'N80' },
  { ad: 'Migren', kod: 'G43', esAnlam: ['baş ağrısı'] },
  { ad: 'Epilepsi', kod: 'G40', esAnlam: ['sara', 'nöbet'] },
  { ad: 'İnme öyküsü', kod: 'Z86.73', esAnlam: ['felç', 'serebrovasküler olay', 'svo', 'inme'] },
  { ad: 'Parkinson hastalığı', kod: 'G20' },
  { ad: 'Demans / Alzheimer', kod: 'G30', esAnlam: ['alzheimer', 'bunama', 'demans'] },
  { ad: 'Multipl skleroz', kod: 'G35', esAnlam: ['ms'] },
  { ad: 'Periferik nöropati', kod: 'G62.9', esAnlam: ['nöropati'] },
  { ad: 'Serebral palsi', kod: 'G80' },
  { ad: 'Depresyon', kod: 'F32', esAnlam: ['majör depresyon'] },
  { ad: 'Anksiyete bozukluğu', kod: 'F41', esAnlam: ['kaygı bozukluğu', 'panik bozukluk'] },
  { ad: 'Bipolar bozukluk', kod: 'F31' },
  { ad: 'Şizofreni', kod: 'F20' },
  { ad: 'Dikkat eksikliği hiperaktivite bozukluğu', kod: 'F90', esAnlam: ['dehb', 'adhd'] },
  { ad: 'Otizm spektrum bozukluğu', kod: 'F84.0', esAnlam: ['otizm', 'osb'] },
  { ad: 'Romatoid artrit', kod: 'M06', esAnlam: ['ra', 'romatizma'] },
  { ad: 'Ankilozan spondilit', kod: 'M45', esAnlam: ['as'] },
  { ad: 'Ailevi Akdeniz ateşi', kod: 'M04.1', esAnlam: ['fmf'] },
  { ad: 'Sistemik lupus eritematozus', kod: 'M32', esAnlam: ['lupus', 'sle'] },
  { ad: 'Gut', kod: 'M10', esAnlam: ['ürik asit'] },
  { ad: 'Osteoartrit', kod: 'M19', esAnlam: ['kireçlenme', 'gonartroz', 'koksartroz'] },
  { ad: 'Fibromiyalji', kod: 'M79.7' },
  { ad: 'Bel fıtığı', kod: 'M51', esAnlam: ['lomber disk hernisi'] },
  { ad: 'Boyun fıtığı', kod: 'M50', esAnlam: ['servikal disk hernisi'] },
  { ad: 'Skolyoz', kod: 'M41' },
  { ad: 'Atopik dermatit', kod: 'L20', esAnlam: ['egzama', 'ekzema'] },
  { ad: 'Psoriazis', kod: 'L40', esAnlam: ['sedef'] },
  { ad: 'Kronik ürtiker', kod: 'L50', esAnlam: ['kurdeşen'] },
  { ad: 'Akne vulgaris', kod: 'L70', esAnlam: ['sivilce'] },
  { ad: 'Rozasea', kod: 'L71', esAnlam: ['gül hastalığı'] },
  { ad: 'Vitiligo', kod: 'L80' },
  { ad: 'Androgenetik alopesi', kod: 'L64', esAnlam: ['saç dökülmesi', 'erkek tipi saç dökülmesi'] },
  { ad: 'Alopesi areata', kod: 'L63', esAnlam: ['saçkıran'] },
  { ad: 'Glokom', kod: 'H40', esAnlam: ['göz tansiyonu'] },
  { ad: 'Katarakt', kod: 'H25' },
  { ad: 'Yaşa bağlı makula dejenerasyonu', kod: 'H35.3', esAnlam: ['sarı nokta hastalığı'] },
  { ad: 'Kuru göz', kod: 'H04.1' },
  { ad: 'Demir eksikliği anemisi', kod: 'D50', esAnlam: ['anemi', 'kansızlık'] },
  { ad: 'Talasemi taşıyıcılığı / talasemi', kod: 'D56', esAnlam: ['akdeniz anemisi'] },
  { ad: 'Kanser öyküsü', kod: 'Z85', esAnlam: ['kanser', 'malignite', 'tümör'] },
  { ad: 'HIV enfeksiyonu', kod: 'B20', esAnlam: ['hiv'] },
  { ad: 'Organ nakli öyküsü', kod: 'Z94', esAnlam: ['transplantasyon'] },
  { ad: 'Down sendromu', kod: 'Q90' },
  { ad: 'Prematürite öyküsü', kod: 'P07', esAnlam: ['erken doğum'] },
  { ad: 'Besin alerjisi', kod: 'T78.1', esAnlam: ['inek sütü alerjisi'] },
  { ad: 'Kronik ağrı', kod: 'G89.2' },
  { ad: 'Lenfödem', kod: 'I89.0' },
];

/** The general top list (= the intake form's chronic options), for a branş with no list of its own. */
export const GENEL_KRONIK_ONERILERI: readonly string[] = ['Diyabet', 'Hipertansiyon', 'Astım', 'KOAH', 'Koroner arter hastalığı', 'Kronik böbrek hastalığı', 'Hipotiroidi', 'Kanser öyküsü'];

/**
 * Branş-specific conditions shown on top. Branş content: shown only for that branş (brans-alan-sizmasi). Every entry is a
 * name from KRONIK_TANILAR (the test pins this), so a suggestion and a search hit are the same stored text.
 */
export const BRANS_KRONIK_ONERILERI: Readonly<Record<string, readonly string[]>> = {
  'pediatri': ['Astım', 'Alerjik rinit', 'Atopik dermatit', 'Besin alerjisi', 'Epilepsi', 'Doğuştan kalp hastalığı', 'Prematürite öyküsü', 'Dikkat eksikliği hiperaktivite bozukluğu'],
  'kardiyoloji': ['Hipertansiyon', 'Koroner arter hastalığı', 'Kalp yetmezliği', 'Atriyal fibrilasyon', 'Kalp kapak hastalığı', 'Hiperlipidemi', 'Diyabet'],
  'noroloji': ['Migren', 'Epilepsi', 'İnme öyküsü', 'Parkinson hastalığı', 'Demans / Alzheimer', 'Multipl skleroz', 'Periferik nöropati'],
  'dahiliye': ['Diyabet', 'Hipertansiyon', 'Hiperlipidemi', 'Hipotiroidi', 'Kronik böbrek hastalığı', 'KOAH', 'Demir eksikliği anemisi'],
  'psikiyatri': ['Depresyon', 'Anksiyete bozukluğu', 'Bipolar bozukluk', 'Şizofreni', 'Dikkat eksikliği hiperaktivite bozukluğu'],
  'genel-cerrahi': ['Diyabet', 'Hipertansiyon', 'Obezite', 'Gastroözofageal reflü', 'Derin ven trombozu öyküsü', 'Kanser öyküsü'],
  'ortopedi': ['Osteoartrit', 'Osteoporoz', 'Bel fıtığı', 'Boyun fıtığı', 'Romatoid artrit', 'Gut', 'Skolyoz'],
  'dermatoloji': ['Atopik dermatit', 'Psoriazis', 'Kronik ürtiker', 'Akne vulgaris', 'Rozasea', 'Vitiligo', 'Alopesi areata'],
  'kulak-burun-bogaz': ['Alerjik rinit', 'Kronik sinüzit', 'Nazal polip', 'Septum deviasyonu', 'Kronik otitis media', 'İşitme kaybı', 'Tinnitus', 'Obstrüktif uyku apnesi', 'Laringofaringeal reflü', 'Kronik tonsillit'],
  'goz-hastaliklari': ['Glokom', 'Katarakt', 'Yaşa bağlı makula dejenerasyonu', 'Kuru göz', 'Diyabet', 'Hipertansiyon'],
  'kadin-hastaliklari-dogum': ['Polikistik over sendromu', 'Endometriozis', 'Hipotiroidi', 'Diyabet', 'Hipertansiyon', 'Demir eksikliği anemisi'],
  'uroloji': ['Benign prostat hiperplazisi', 'Böbrek taşı', 'Aşırı aktif mesane', 'Kronik böbrek hastalığı', 'Diyabet'],
  'radyoloji': GENEL_KRONIK_ONERILERI,
  'anestezi': ['Hipertansiyon', 'Diyabet', 'Koroner arter hastalığı', 'Astım', 'KOAH', 'Obstrüktif uyku apnesi', 'Kronik böbrek hastalığı'],
  'acil-tip': ['Hipertansiyon', 'Diyabet', 'Koroner arter hastalığı', 'Kalp yetmezliği', 'Astım', 'KOAH', 'Epilepsi'],
  'fizik-tedavi': ['Osteoartrit', 'Bel fıtığı', 'Boyun fıtığı', 'Fibromiyalji', 'Romatoid artrit', 'Ankilozan spondilit', 'İnme öyküsü'],
  'enfeksiyon-hastaliklari': ['Kronik hepatit B', 'Kronik hepatit C', 'HIV enfeksiyonu', 'Diyabet', 'Organ nakli öyküsü'],
  'endokrinoloji': ['Diyabet', 'Tip 1 diyabet', 'Prediyabet / insülin direnci', 'Hipotiroidi', 'Hipertiroidi', 'Tiroid nodülü', 'Obezite', 'Osteoporoz', 'Polikistik over sendromu'],
  'gastroenteroloji': ['Gastroözofageal reflü', 'Peptik ülser', 'İrritabl bağırsak sendromu', 'İnflamatuvar bağırsak hastalığı', 'Çölyak hastalığı', 'Yağlı karaciğer', 'Kronik hepatit B', 'Siroz'],
  'nefroloji': ['Kronik böbrek hastalığı', 'Hipertansiyon', 'Diyabet', 'Böbrek taşı', 'Organ nakli öyküsü'],
  'romatoloji': ['Romatoid artrit', 'Ankilozan spondilit', 'Ailevi Akdeniz ateşi', 'Sistemik lupus eritematozus', 'Gut', 'Fibromiyalji', 'Osteoartrit'],
  'onkoloji': ['Kanser öyküsü', 'Diyabet', 'Hipertansiyon', 'Derin ven trombozu öyküsü', 'Demir eksikliği anemisi'],
  'gogus-hastaliklari': ['Astım', 'KOAH', 'Bronşektazi', 'Obstrüktif uyku apnesi', 'Alerjik rinit'],
  'gogus-cerrahisi': ['KOAH', 'Bronşektazi', 'Kanser öyküsü', 'Hipertansiyon', 'Diyabet'],
  'plastik-cerrahi': ['Diyabet', 'Hipertansiyon', 'Obezite', 'Lenfödem', 'Kanser öyküsü'],
  'beyin-cerrahisi': ['Bel fıtığı', 'Boyun fıtığı', 'Epilepsi', 'İnme öyküsü', 'Hipertansiyon'],
  'kalp-damar-cerrahisi': ['Koroner arter hastalığı', 'Kalp kapak hastalığı', 'Periferik arter hastalığı', 'Hipertansiyon', 'Diyabet', 'Atriyal fibrilasyon'],
  'cocuk-cerrahisi': ['Doğuştan kalp hastalığı', 'Prematürite öyküsü', 'Astım', 'Epilepsi', 'Serebral palsi'],
  'aile-hekimligi': ['Hipertansiyon', 'Diyabet', 'Hiperlipidemi', 'Astım', 'KOAH', 'Hipotiroidi', 'Obezite', 'Depresyon'],
  'spor-hekimligi': ['Astım', 'Osteoartrit', 'Bel fıtığı', 'Hipertansiyon', 'Diyabet'],
  // Özel Branşlar
  'sac-ekimi': ['Androgenetik alopesi', 'Alopesi areata', 'Hipotiroidi', 'Demir eksikliği anemisi', 'Diyabet', 'Hipertansiyon'],
  'estetik-cerrahi': ['Diyabet', 'Hipertansiyon', 'Obezite', 'Derin ven trombozu öyküsü', 'Hipotiroidi'],
  'medikal-estetik': ['Rozasea', 'Akne vulgaris', 'Atopik dermatit', 'Psoriazis', 'Diyabet'],
  'klinik-dermatoloji': ['Atopik dermatit', 'Psoriazis', 'Kronik ürtiker', 'Akne vulgaris', 'Rozasea', 'Vitiligo'],
  'longevity': ['Hipertansiyon', 'Diyabet', 'Prediyabet / insülin direnci', 'Hiperlipidemi', 'Obezite', 'Osteoporoz', 'Yağlı karaciğer'],
  'fizyoterapi': ['Bel fıtığı', 'Boyun fıtığı', 'Osteoartrit', 'Fibromiyalji', 'İnme öyküsü', 'Skolyoz'],
  'klinik-psikolog': ['Depresyon', 'Anksiyete bozukluğu', 'Bipolar bozukluk', 'Dikkat eksikliği hiperaktivite bozukluğu', 'Otizm spektrum bozukluğu'],
  'diyetisyen': ['Diyabet', 'Prediyabet / insülin direnci', 'Obezite', 'Hiperlipidemi', 'Çölyak hastalığı', 'Polikistik over sendromu', 'Yağlı karaciğer'],
  'ergoterapi': ['Serebral palsi', 'Otizm spektrum bozukluğu', 'İnme öyküsü', 'Dikkat eksikliği hiperaktivite bozukluğu', 'Demans / Alzheimer'],
  'odyoloji': ['İşitme kaybı', 'Tinnitus', 'Meniere hastalığı', 'Kronik otitis media', 'Seröz otitis media'],
};

/** Old stored keys of the same branş (legacy / alias slugs). */
const BRANS_ESDEGER: Readonly<Record<string, string>> = { 'kbb': 'kulak-burun-bogaz', 'kadin-dogum': 'kadin-hastaliklari-dogum', 'klinik-psikoloji': 'klinik-psikolog' };

export function bransKronikOnerileri(brans: string | null | undefined): readonly string[] {
  const k = String(brans || '').trim();
  return BRANS_KRONIK_ONERILERI[k] ?? BRANS_KRONIK_ONERILERI[BRANS_ESDEGER[k] ?? ''] ?? GENEL_KRONIK_ONERILERI;
}

/** Turkish-insensitive fold for search: case, dotted/dotless i, diacritics. */
export function aramaKatla(s: string): string {
  return s.toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

/** Search the list by Turkish name, synonym or ICD-10 code. Name-prefix hits first. Already chosen names are left out. */
export function kronikAra(sorgu: string, secili: readonly string[] = [], sinir = 12): KronikTani[] {
  const q = aramaKatla(sorgu);
  if (!q) return [];
  const secilen = new Set(secili.map(aramaKatla));
  const puanli: { t: KronikTani; p: number }[] = [];
  for (const t of KRONIK_TANILAR) {
    if (secilen.has(aramaKatla(t.ad))) continue;
    const ad = aramaKatla(t.ad);
    const kod = t.kod.toLowerCase();
    let p = -1;
    if (ad.startsWith(q)) p = 0;
    else if (kod.startsWith(q.replace(/\s/g, ''))) p = 1;
    else if (ad.split(/[\s/]+/).some((w) => w.startsWith(q))) p = 2;
    else if ((t.esAnlam ?? []).some((e) => aramaKatla(e).startsWith(q) || aramaKatla(e).includes(` ${q}`))) p = 3;
    else if (ad.includes(q) || (t.esAnlam ?? []).some((e) => aramaKatla(e).includes(q))) p = 4;
    if (p >= 0) puanli.push({ t, p });
  }
  return puanli.sort((a, b) => a.p - b.p || a.t.ad.localeCompare(b.t.ad, 'tr')).slice(0, sinir).map((x) => x.t);
}

/** Add a condition to the chosen list: trimmed, no duplicates (case/diacritic-insensitive), a list item keeps its own spelling. */
export function kronikEkle(secili: readonly string[], ham: string): string[] {
  const t = ham.trim().replace(/\s+/g, ' ').slice(0, 120);
  if (!t) return [...secili];
  const k = aramaKatla(t);
  if (secili.some((s) => aramaKatla(s) === k)) return [...secili];
  const listede = KRONIK_TANILAR.find((x) => aramaKatla(x.ad) === k);
  return [...secili, listede ? listede.ad : t];
}

export function kronikCikar(secili: readonly string[], ad: string): string[] {
  const k = aramaKatla(ad);
  return secili.filter((s) => aramaKatla(s) !== k);
}

/** The ICD-10 code of a chosen name, when it is a list item. */
export function kronikKodu(ad: string): string | null {
  const k = aramaKatla(ad);
  return KRONIK_TANILAR.find((x) => aramaKatla(x.ad) === k)?.kod ?? null;
}
