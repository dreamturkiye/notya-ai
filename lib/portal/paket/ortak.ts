/**
 * BRANS-PAKETI Phase 2 — shared building blocks for the medical branş packages (one wording for the same red flag in
 * every branş — one look, one voice). Pure data. Every acil line names 112 (pinned by lib/portal/bransPaketi.test.ts).
 * No diagnosis words, no drug doses.
 */
import type { PaketAlan, PaketBayrak } from '../bransPaketi'

export const ACIL_112 = '112’yi arayın ya da en yakın acil servise gidin.'

/** Post-operative diary fields every surgical branş shares. */
export const POSTOP_ALANLAR: PaketAlan[] = [
  { id: 'agri', etiket: 'Ağrı', tur: 'olcek' },
  { id: 'ates', etiket: '38 °C ve üzeri ateş', tur: 'evet' },
  { id: 'yara', etiket: 'Yarada artan kızarıklık, sıcaklık, akıntı ya da açılma', tur: 'evet' },
  { id: 'baldir', etiket: 'Tek bacakta (baldırda) ağrılı şişlik', tur: 'evet' },
  { id: 'nefes', etiket: 'Nefes darlığı ya da göğüs ağrısı', tur: 'evet' },
]

export const POSTOP_BAYRAKLAR: PaketBayrak[] = [
  { id: 'nefes', kosullar: [{ alan: 'nefes', evet: true }], duzey: 'acil', hasta: `Ameliyattan sonra nefes darlığı ya da göğüs ağrısı acildir: hemen ${ACIL_112}`, hekim: 'Ameliyat sonrası günlük: nefes darlığı / göğüs ağrısı bildirdi.' },
  { id: 'baldir', kosullar: [{ alan: 'baldir', evet: true }], duzey: 'acil', hasta: `Tek bacakta ağrılı şişlik pıhtı belirtisi olabilir: bugün beklemeden ${ACIL_112}`, hekim: 'Ameliyat sonrası günlük: tek taraflı baldır şişliği / ağrısı (DVT?).' },
  { id: 'ates-yara', kosullar: [{ alan: 'ates', evet: true }, { alan: 'yara', evet: true }], duzey: 'hekime_bildir', hasta: 'Ateşle birlikte yara değişikliği bildirdiniz. Hekiminize ilettik; bugün sizinle iletişime geçmesi beklenir. Kötüleşirseniz acile başvurun.', hekim: 'Ameliyat sonrası günlük: ateş + yara bulgusu (enfeksiyon?).' },
  { id: 'yara', kosullar: [{ alan: 'yara', evet: true }], duzey: 'hekime_bildir', hasta: 'Yaranızdaki değişikliği hekiminize ilettik. Yaranın fotoğrafını çekip mesajla gönderebilirsiniz.', hekim: 'Ameliyat sonrası günlük: yarada kızarıklık / akıntı / açılma.' },
  { id: 'ates', kosullar: [{ alan: 'ates', evet: true }], duzey: 'hekime_bildir', hasta: 'Ateşinizi hekiminize ilettik. Titreme, halsizlik ya da kötüleşme olursa acile başvurun.', hekim: 'Ameliyat sonrası günlük: ≥ 38 °C ateş.' },
  { id: 'agri', kosullar: [{ alan: 'agri', enAz: 8 }], duzey: 'hekime_bildir', hasta: 'Ağrınız yüksek. Hekiminize ilettik; ağrı kesicinizi hekiminizin tarif ettiği gibi kullanın. Dayanılmaz ağrıda acile başvurun.', hekim: 'Ameliyat sonrası günlük: ağrı ≥ 8/10.' },
]

/** Self-harm / suicide thoughts — the crisis copy (portal is not an emergency service). */
export const KRIZ_ALANI: PaketAlan = { id: 'zarar', etiket: 'Kendime zarar verme ya da yaşamıma son verme düşünceleri', tur: 'evet' }
export const KRIZ_BAYRAGI: PaketBayrak = {
  id: 'zarar', kosullar: [{ alan: 'zarar', evet: true }], duzey: 'acil',
  hasta: 'Yalnız değilsiniz ve bu düşünceler tedavi edilebilir. Şimdi 112’yi arayın ya da en yakın acil servise gidin; güvendiğiniz birini yanınıza çağırın. Bu sayfa acil yardımın yerini tutmaz.',
  hekim: 'Günlük: kendine zarar / intihar düşüncesi bildirdi.',
}

/** Allergic reaction with airway signs — acil in every branş. */
export const ANAFILAKSI_ALANI: PaketAlan = { id: 'alerji', etiket: 'Dudak, dil ya da yüzde şişme, nefes darlığı, yaygın kaşıntılı döküntü', tur: 'evet' }
export const ANAFILAKSI_BAYRAGI: PaketBayrak = {
  id: 'alerji', kosullar: [{ alan: 'alerji', evet: true }], duzey: 'acil',
  hasta: `Bu belirtiler ciddi bir alerjik tepki olabilir: hemen ${ACIL_112}`,
  hekim: 'Günlük: yüz / dil şişliği, nefes darlığı, yaygın ürtiker (anafilaksi?).',
}
