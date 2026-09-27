/**
 * NOTYA-HASTA-ODAK-01 — post-model lock for Asistan (yazı + ses).
 *
 * Persona kuralları (10–13) uydurmayı yasaklar; bu fonksiyon doz kilidi gibi bir geri stoptur.
 * Umutcan turunda model aşı uydurup sonra “5 yaşında kız / aşı yok” diye vazgeçti — hekim ürüne
 * güvenmez. Burada: (1) “uydurdum / erişimim yok” recant yasaktır, (2) aşı/ilaç/lab listesi yalnız
 * AKTİF HASTA DOSYASI bloğundan kurulur, (3) açık dosyanın adı kesin cümlede yoksa veya başka
 * demografik uydurulmuşsa cevap dosyaya çekilir.
 *
 * Saf fonksiyon, I/O yok.
 */

const RECANT =
  /uydurdum|uydurmuşum|dayanağı yok|erişimim yok|sisteme bağlantım yok|erişemem|ulaşamam|bu bilgileri göremem/i

const ASI_ADI =
  /\b(hepatit\s*[ab]|bcg|kk[kç]|dabt|hib|kpa|rota(vir[uü]s)?|su\s*[çc]i[cç]e[gğ]i|k[ıi]zam[ıi]k|kabakulak|k[ıi]zam[ıi]k[çc][ıi]k|polio|ipv|opv|tdap|td\b|hpv|meningokok|influenza|grip|covid|hepa[bt]|pentaxim|infanrix|priorix|varilrix|prevenar|synflorix|nimenrix|gardasil)\b/gi

const LISTE_SORUSU = /\b(a[sş][ıi]|ila[cç]|lab|tetkik|vizit|muayene not|kronik|alerji)\b/i

export type AktifHastaOdak = {
  /** NOTYA-AYSE-STANDART-01: cevap kanıt yolundan (İlk 10) geldi — aşı listesi kuralı uygulanmaz. */
  kanitYolu?: boolean
  ad: string
  dosyaMetni: string
  yasMetin?: string | null
  cinsiyet?: string | null
}

export function ilkAd(ad: string): string {
  return String(ad || '').trim().split(/\s+/)[0] || ''
}

function kucuk(s: string): string {
  return String(s || '').toLocaleLowerCase('tr-TR')
}

function dosyadaAsiVarMi(dosya: string): boolean {
  const t = kucuk(dosya)
  if (!t.trim()) return false
  if (/a[sş][ıi].{0,40}(yok|kay[ıi]t yok|kay[ıi]tl[ıi] a[sş][ıi] yok|bo[sş])/i.test(t)) return false
  return ASI_ADI.test(t)
}

/** Aşı adı + 80 karakter içinde uygulandı/yapıldı/vuruldu/tamamlandı iddiası — "kayıt yok / eksik / bekleniyor / planlandı" ile
 *  nitelenen cümleler sayılmaz. */
function uygulandiIddiasiAsilar(metin: string): string[] {
  const bulunan: string[] = []
  const cumleler = String(metin || '').split(/(?<=[.!?\n])\s+/)
  for (const c of cumleler) {
    const k = kucuk(c)
    if (/kay[ıi]t (yok|bulunam|g[öo]remiyorum)|kay[ıi]tl[ıi] de[gğ]il|eksik|bekle|planlan|[öo]neril|yap[ıi]lmam[ıi][sş]|uygulanmam[ıi][sş]|takvim/i.test(k)) continue
    if (!/uyguland[ıi]|yap[ıi]ld[ıi]|vuruldu|tamamland[ıi]|yap[ıi]lm[ıi][sş]|uygulanm[ıi][sş]/i.test(k)) continue
    for (const m of c.matchAll(ASI_ADI)) { const ad = kucuk(m[0]).replace(/\s+/g, ' '); if (!bulunan.includes(ad)) bulunan.push(ad) }
  }
  return bulunan
}
function konusmadaAsiListesi(metin: string): string[] {
  const bulunan: string[] = []
  for (const m of String(metin || '').matchAll(ASI_ADI)) {
    const ad = kucuk(m[0]).replace(/\s+/g, ' ')
    if (!bulunan.includes(ad)) bulunan.push(ad)
  }
  return bulunan
}

function dosyaAsiOzeti(dosya: string, ad: string): string {
  const satirlar = String(dosya || '').split('\n')
  const satir =
    satirlar.find((s) => /^a[sş][ıi]\s*:/i.test(s.trim())) ||
    satirlar.find((s) => /kay[ıi]tl[ıi] a[sş][ıi]/i.test(s)) ||
    satirlar.find((s) => /a[sş][ıi]/i.test(s) && !/dosyas[ıi]/i.test(s))
  if (satir && satir.trim()) return `${ad} — ${satir.trim().replace(/^[-•]\s*/, '')}`
  return `${ad} — dosyada kayıtlı aşı yok Hocam.`
}

function baskaDemografik(metin: string, aktif: AktifHastaOdak): boolean {
  const t = kucuk(metin)
  const cins = kucuk(aktif.cinsiyet || '')
  if ((cins === 'e' || cins === 'erkek' || cins === 'male' || cins === 'm') && /\b(kız|kiz çocu[gğ]|5 yaşında kız)\b/.test(t)) {
    return true
  }
  if ((cins === 'k' || cins === 'kadın' || cins === 'female' || cins === 'f' || cins === 'kız') && /\b(erkek çocu[gğ]|oğlan)\b/.test(t) && !t.includes(kucuk(ilkAd(aktif.ad)))) {
    return true
  }
  if (aktif.yasMetin) {
    const yas = aktif.yasMetin.match(/(\d+)\s*ya[sş]/i)
    if (yas) {
      const yanlis = t.match(/(\d+)\s*ya[sş]ında/)
      if (yanlis && yanlis[1] !== yas[1]) return true
    }
  }
  return false
}

/**
 * Model çıktısını açık hasta dosyasına kilitler. İhlal yoksa sonucu olduğu gibi bırakır.
 */
export function hastaOdakTemizle(speech: string, aktif: AktifHastaOdak | null): { metin: string; ihlal: string[] } {
  const metin = String(speech || '')
  const ihlal: string[] = []
  if (!metin.trim()) return { metin, ihlal }

  if (RECANT.test(metin)) {
    ihlal.push('recant')
    if (aktif?.ad) {
      return {
        metin: `${aktif.ad} — dosyadaki kayıt geçerlidir; önceki listedeki aşı / ilaç / lab uydurulmuş olamaz. ${dosyaAsiOzeti(aktif.dosyaMetni, aktif.ad).replace(`${aktif.ad} — `, '')}`,
        ihlal,
      }
    }
    return { metin: 'Dosyada bu bilgi yok Hocam. Hangi hastanın dosyasını açmamı istersiniz?', ihlal }
  }

  if (!aktif?.ad) return { metin, ihlal }

  const ad = aktif.ad
  const adIlk = kucuk(ilkAd(ad))
  const t = kucuk(metin)

  if (baskaDemografik(metin, aktif)) {
    ihlal.push('yanlis-demografik')
    return { metin: dosyaAsiOzeti(aktif.dosyaMetni, ad), ihlal }
  }

  // NOTYA-AYSE-STANDART-01 uyumu (Claude, 2026-09-27): canlı denetimde 10 cevabın 10'u bu kuralla silinip kart satırına
  // dönmüştü. Standart, takvime göre EKSİK aşıları adıyla sayar ("KKK — kayıt yok"); uydurma olan yalnız UYGULANDI iddiasıdır.
  // Kanıt yolundaysa (kanitYolu) bu kural hiç çalışmaz; değilse yalnız uygulandı/yapıldı iddiası taşıyan cümleler sayılır.
  const konusmaAsi = aktif.kanitYolu ? [] : uygulandiIddiasiAsilar(metin)
  if (konusmaAsi.length && !dosyadaAsiVarMi(aktif.dosyaMetni)) {
    ihlal.push('uydurma-asi-listesi')
    return { metin: dosyaAsiOzeti(aktif.dosyaMetni, ad), ihlal }
  }

  if (LISTE_SORUSU.test(metin) && adIlk && !t.includes(adIlk) && (konusmaAsi.length || /ila[cç]lar[ıi]|a[sş][ıi]lar[ıi]|lab sonuç/i.test(metin))) {
    ihlal.push('adsiz-liste')
    return { metin: `${ad} — ${metin.replace(/^\s*/, '')}`, ihlal }
  }

  return { metin, ihlal }
}
