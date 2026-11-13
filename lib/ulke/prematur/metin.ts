/**
 * PREMATUR-ULKE-01 — EVERY WORD of the prematurity screens, as the pack writes them. The kit's screens
 * (components/ulke/uygulama/PrematurPaneli.tsx, ErkenDogumPaneli.tsx) write none: they take codes from the engine and
 * sentences from here. `%`, `%1`, `%2`… are filled by `yerine` (lib/ulke/arayuz/yerTutucu.ts).
 * The words belong to the pack (once per language form); the protocol's own words (rule titles, timing labels, source notes)
 * are in the protocol table, beside the thresholds they describe.
 */
export type TriDeger = { bilinmiyor: string; evet: string; hayir: string }

export interface PrematurMetni {
  ortak: {
    yukleniyor: string
    yuklenemedi: string
    /** The tables of the records are not on this database yet. */
    depoYok: string
    kaydedilemedi: string
    kaydet: string
    kaydediliyor: string
    kopyala: string
    kopyalandi: string
    kopyalanamadi: string
    kaynak: string
    /** What was read of a source: the three reading states. */
    kaynakDurumu: { birincil: string; ikincil: string; dogrulanmadi: string }
    /** "% protocol · checked %" — the country's name and the day the table was checked. */
    protokolSatiri: string
    evet: string
    hayir: string
    bilinmiyor: string
    /** "Open the patient's file". */
    dosyayaGit: string
    /** The patient is not chosen: how to open the screen for one. */
    hastaSec: string
    hastaBulunamadi: string
    /** "Gestation 29+3" and the like use these. */
    hafta: string
    gun: string
    ay: string
    gram: string
    mm: string
  }
  bebek: {
    baslik: string
    /** The cohort (no patient chosen). */
    kohortBaslik: string
    kohortBos: string
    kohortNot: string
    kohortSatir: { gestasyon: string; agirlik: string; duzeltilmis: string; siradaki: string; yok: string; hedef: string }
    /** Stats of the card. */
    bebek: string
    gestasyonDogumda: string
    dogumAgirligi: string
    kronolojikYas: string
    duzeltilmisYas: string
    postmenstruel: string
    terimTarihi: string
    /** "Corrected age is for growth and development; vaccines follow the chronological age." */
    duzeltmeNotu: string
    duzeltmeUygulanmaz: string
    /** "% months", "% days", "% days before term", "% years % months". */
    yasAy: string
    yasGun: string
    yasTermOncesi: string
    yasYilAy: string
    /** Why there is no plan. */
    kapsamNedeni: { bilinmiyor: string; degil: string; ustAy: string; tarihGecersiz: string }
    /** The missing data. */
    eksikVeri: string
    eksikAlan: { gestasyon: string; kilo: string }
    dogumTarihiYok: string
    /** The history form. */
    oykuBaslik: string
    oykuNot: string
    gestasyonHafta: string
    gestasyonGun: string
    kilo: string
    nicuGun: string
    oykuKaydet: string
    anneBaslik: string
    anneNot: string
    /** The tri-state fields. */
    alanlar: { oksijen28Gun: string; oksijen36Hafta: string; hsKkh: string; ototoksik5Gun: string; degisimTransfuzyonu: string; ecmo: string; ropSecili: string; antenatalSteroid: string; pprom: string; magnezyum: string }
    /** The plan. */
    planBaslik: string
    ozet: { gecikti: string; zamaniGeldi: string; yaklasiyor: string; kayitEksik: string; yapildi: string; veriEksik: string }
    durum: { gecikti: string; zamaniGeldi: string; yaklasiyor: string; planli: string; kayitEksik: string; yapildi: string; uygulanmaz: string; kriterDisi: string; bilgi: string; veriEksik: string; yerel: string }
    kategori: { goz: string; beyin: string; isitme: string; akciger: string; kan: string; kemik: string; enfeksiyon: string; diger: string }
    /** "Criterion: %" and the label of a condition the history does not state. */
    kriter: string
    kriterBelirsiz: string
    varsayim: string
    /** "Follow your local protocol" — what the screen says for an item the pack could not source. */
    yerelBaslik: string
    yerelNot: string
    yerelKutu: string
    /** The doctor's marks. */
    planaAl: string
    yapildi: string
    uygulanmaz: string
    yapildiGun: string
    kriterDisiBaslik: string
    kriterDisiYok: string
    planiKopyala: string
    /** The first line of the copied plan: "Preterm follow-up plan (%1, %2) — decision support, confirmed by the doctor". */
    kopyaBaslik: string
    kopyaGestasyon: string
    kopyaYas: string
    kopyaSatir: string
    karar: string
    /** The line under every plan: what the scope of the table is. "Scope: %". */
    kapsam: string
  }
  gebelik: {
    baslik: string
    kohortBaslik: string
    kohortBos: string
    kohortNot: string
    kohortNeden: { kisaServiks: string; pprom: string; oykuOlcumYok: string }
    gebelik: string
    /** "Gestation today: %" (a sentence for the list) and "Gestation today" (the label of the figure). */
    gestasyonBugun: string
    gestasyonEtiket: string
    sat: string
    tdt: string
    gebelikNotu: string
    cogulTipi: string
    cogulSecenek: { bos: string; tekil: string; ikiz: string; ucuzVeUstu: string }
    durum: string
    durumSecenek: { aktif: string; dogumYapti: string }
    oncekiPreterm: string
    eksikVeri: string
    eksik: { gebelikBaslangici: string; oyku: string; serviksOlcumu: string }
    /** Cervical measurements. */
    serviksBaslik: string
    olcumTarih: string
    olcumGestasyon: string
    olcumMm: string
    olcumYontem: string
    yontem: { transvajinal: string; transabdominal: string }
    olcumEkle: string
    olcumSil: string
    olcumYok: string
    trendFark: string
    trendPencere: string
    /** Steroid courses. */
    steroidBaslik: string
    steroidTarih: string
    steroidEkle: string
    steroidSil: string
    steroidYok: string
    steroidGuncel: string
    steroidSatir: string
    steroidPencere: { oncesi: string; yasayabilirlik: string; ana: string; gec: string; disi: string; bilinmiyor: string; yerel: string }
    steroidTekrar: string
    /** The doctor's facts. */
    olgularBaslik: string
    pprom: string
    pprom_tarih: string
    magnezyum: string
    magnezyum_tarih: string
    progesteron: string
    progesteron_baslangic: string
    progesteron_yol: string
    yol: { bos: string; vajinal: string; im: string; oral: string }
    olguNot: string
    kaydet: string
    /** The flags. */
    bayrakBaslik: string
    bayrak: { onceki_spontan_preterm: string; kisa_serviks: string; progesteron_degerlendirme: string; cok_kisa_serviks: string; cogul_gebelik: string; pprom: string }
    bayrakDurum: { karsilandi: string; karsilanmadi: string; belirsiz: string; yerel: string }
    /** The codes of a flag's reasons. Each takes the numbers the engine gives it (see the engine's GerekceKodu). */
    gerekce: Record<string, string>
    /** What a definition's yes/no is called inside the `tanimlar` sentence (%1 = the first definition, %2 = the second): met / not met / the source states none. */
    tanimSonuc: { evet: string; hayir: string; yok: string }
    yerelBaslik: string
    yerelNot: string
    /** The record's own errors, by the engine's cleaning codes. */
    hata: { serviksTarih: string; serviksIleri: string; serviksMm: string; serviksGestasyon: string; steroidTarih: string; steroidIleri: string; ileriTarih: string; gebelikTarih: string }
    kaynakBaslik: string
    karar: string
    kapsam: string
  }
}
