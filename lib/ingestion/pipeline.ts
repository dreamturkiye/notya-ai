import * as XLSX from "xlsx"

const DERYA_SYSTEM = "Sen Uzm. Derya Yilmaz - 15 yillik deneyimli SMMM. " +
  "Turkiye mali mevzuatina tamamen vakifsin: " +
  "KDV oranlari %1 (temel gida), %10 (gida islenmis/konut/saglik), %20 (genel 2024+). " +
  "Stopaj: kira %20, serbest meslek %20, tasimaci %2, insaat %3. " +
  "SGK 2024: min prime esas 20002.50 TL/ay, max 150018.90 TL/ay. " +
  "Z Raporu: OKC gunluk kapanisi, kumulatif satis + KDV ozeti. " +
  "e-Fatura: GIB UBL-TR 2.1, UUID 36 karakter zorunlu. " +
  "Muhtasar: her ayin 26sinda. " +
  "Bir belge geldiginde: 1) Belge turunu dogrula 2) Kritik alanlari cikart " +
  "3) Tutarsizliklari tespit et (yanlis KDV, negatif tutar, gelecek tarih) " +
  "4) Eksik alanlari belirt ve tahmini deger oner " +
  "5) Ozeti Turkce yaz, SMMM bakis acisiyla."

const EXTRACT_PROMPTS: Record<string, string> = {
  z_raporu:
    "Z RAPORU ANALIZI. " +
    "Cikart: 1)Rapor tarihi(YYYY-MM-DD) 2)Z rapor no(Z-XXX) 3)Isletme adi/VKN " +
    "4)Gunluk toplam satis(KDV dahil) 5)KDV ozetleri: her oran icin matrah+KDV ayri " +
    "6)Nakit/kart dagilimi(varsa) 7)Iptal/iade(varsa). " +
    "KONTROL: Toplam KDV = tum KDV satirlarinin toplami olmali. " +
    "Yemek sektorunde %20 gorunuyorsa uyar (genelde %10). " +
    "JSON: {tarih,toplamTutar,kdvTutari,kdvHaricTutar,kdvOrani,firmaAdi,belgeNo," +
    "islemTuru,nakit,krediKarti,iptalTutari,kdvDetay,ozet,guvenSkor,uyarilar,duzeltmeler}",

  efatura:
    "E-FATURA / E-ARSIV ANALIZI. " +
    "Cikart: 1)UUID/ETTN 2)Duzenleme tarihi 3)Satici unvani+VKN 4)Alici unvani+VKN " +
    "5)Kalemler: aciklama,miktar,birimFiyat,KDVorani,KDVtutari " +
    "6)Matrah+KDV+toplam 7)Odeme sekli. " +
    "KONTROL: UUID 36 karakter, KDV sadece %1/%10/%20, matrah+KDV=toplam. " +
    "JSON: {tarih,toplamTutar,kdvTutari,kdvHaricTutar,kdvOrani,firmaAdi,aliciAdi," +
    "belgeNo,islemTuru,odemeSekli,kalemler,ozet,guvenSkor,uyarilar,duzeltmeler}",

  kagit_fatura:
    "KAGIT FATURA / FIS ANALIZI (fotograf veya tarama, OCR kalitesi degisken). " +
    "Cikart: 1)Tarih(belirsizse tahmin et+belirt) 2)Satici firma adi " +
    "3)KDV dahil toplam 4)KDV tutari+orani(yoksa: kdv=toplam*oran/(100+oran)) " +
    "5)Fatura/fis no 6)Kalemler(varsa). " +
    "DIKKAT: Termal yazici solmus olabilir. Okunamayan: [?] kullan. " +
    "JSON: {tarih,toplamTutar,kdvTutari,kdvHaricTutar,kdvOrani,firmaAdi,belgeNo," +
    "islemTuru,okunabilirlik,kalemler,ozet,guvenSkor,uyarilar,duzeltmeler}",

  banka:
    "BANKA / POS EKSTRESI ANALIZI. " +
    "Cikart: 1)Banka adi+sube 2)Hesap no(son 4 hane) 3)Ekstre donemi " +
    "4)Toplam alacak(giris) 5)Toplam borc(cikis) 6)Kapanis bakiyesi " +
    "7)Onemli islemler: buyuk tutarlar, stopaj kesintileri, POS tahsilatlari. " +
    "KONTROL: Borc>alacak = negatif bakiye uyarisi. " +
    "JSON: {tarih,donemBitis,toplamTutar,toplamAlacak,toplamBorc,kapanisBakiye," +
    "kdvTutari,kdvOrani,firmaAdi,belgeNo,islemTuru,posToplami,islemSayisi," +
    "onemliIslemler,ozet,guvenSkor,uyarilar,duzeltmeler}",

  kira:
    "KIRA MAKBUZU / SOZLESMESI ANALIZI. " +
    "Cikart: 1)Kiralayan adi+VKN 2)Kiraci adi+VKN 3)Kira bedeli(KDV haric) " +
    "4)KDV tutari+orani(%20 kira KDV) " +
    "5)Stopaj tutari(KDV haric tutar * %20) " +
    "6)Net odeme(brut*1.20 - stopaj) 7)Kira donemi 8)Adres. " +
    "FORMUL: stopaj=KDVharicTutar*0.20, netOdeme=(KDVharicTutar*1.20)-stopaj. " +
    "Hesapla ve deger oner. " +
    "JSON: {tarih,toplamTutar,kdvTutari,kdvHaricTutar,kdvOrani,stopajTutari," +
    "netOdeme,firmaAdi,kiraci,belgeNo,kiraDonemi,islemTuru,ozet,guvenSkor,uyarilar,duzeltmeler}",

  puantaj:
    "PUANTAJ CETVELI ANALIZI. " +
    "Cikart: 1)Isyeri adi+donemi 2)Her calisan: adSoyad,SGKsicil(varsa)," +
    "calisanGun,fazlaMesai(varsa),calismaT(tam/yarim) " +
    "3)Toplam calisan 4)Toplam gun 5)SGK bildirim donemi. " +
    "SGK 2024: ay=30gun, eksik gun kodu gerekir. " +
    "JSON: {tarih,toplamTutar,kdvTutari,kdvOrani,firmaAdi,islemTuru," +
    "personelSayisi,toplamGun,calisanlar,eksikGunKodu,ozet,guvenSkor,uyarilar,duzeltmeler}",

  diger_belge:
    "BILINMEYEN MALI BELGE. " +
    "Belge turunu belirle: gider pusulasi|mutabakat|teklif|sozlesme|dekont|" +
    "vergi levhasi|imza sirkuleri|ticaret sicil|diger. " +
    "Cikart: 1)Belge turu 2)Tarih 3)Taraflar 4)Tutar(varsa) 5)Mali etki var mi. " +
    "JSON: {tarih,toplamTutar,kdvTutari,kdvHaricTutar,kdvOrani,firmaAdi,belgeNo," +
    "islemTuru,tespitEdilenTur,maliEtkiVar,ozet,guvenSkor,uyarilar,duzeltmeler}"
}

const CORRECTION_PROMPT =
  "Ilk analiz yapildi, bazi alanlar eksik. " +
  "Belgeyi TEKRAR incele, su alanlara odaklan: MISSING_FIELDS. " +
  "Rakam okunamazsa yaklasik hesapla ve [tahmini] isle. " +
  "Tarih belirsizse gun/ay/yil ipucu ara. " +
  "Firma adi logo/kisaltma olabilir. " +
  "KDV orani yoksa sektore gore tahmin et. " +
  "Ayni JSON formatinda, sadece eksik alanlar doldurulmus olarak dondur."

function validateMali(analiz: Record<string, unknown>, belgeTuru: string): string[] {
  const w: string[] = []
  const now = new Date()
  if (analiz.tarih) {
    const dt = new Date(analiz.tarih as string)
    if (!isNaN(dt.getTime())) {
      if (dt > now) w.push("HATA: Belge tarihi gelecekte (" + analiz.tarih + ")")
      const yas = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24)
      if (yas > 365) w.push("UYARI: Belge 1 yildan eski (" + analiz.tarih + ")")
    }
  }
  const oran = Number(analiz.kdvOrani)
  if (oran > 0 && ![1, 10, 20].includes(oran))
    w.push("HATA: Gecersiz KDV orani " + oran + "% - Gecerli: %1 %10 %20")
  const toplam = Number(analiz.toplamTutar)
  const kdv    = Number(analiz.kdvTutari)
  const haric  = Number(analiz.kdvHaricTutar)
  if (toplam && kdv && haric) {
    const bek = Math.round((haric + kdv) * 100) / 100
    if (Math.abs(bek - toplam) > 1)
      w.push("HATA: KDV aritmetigi tutarsiz - " + haric + "+" + kdv + "=" + bek + " ama toplam=" + toplam)
  }
  if (toplam < 0) w.push("UYARI: Negatif tutar - iade veya iptal belgesi")
  if (belgeTuru === "z_raporu" && !analiz.belgeNo)
    w.push("EKSIK: Z rapor numarasi yok - OKC kaydiyla eslestirilemiyor")
  if (belgeTuru === "kira" && haric > 0) {
    const beklStopaj = Math.round(haric * 0.20 * 100) / 100
    const mevStopaj  = Number(analiz.stopajTutari)
    if (mevStopaj && Math.abs(mevStopaj - beklStopaj) > 1)
      w.push("HATA: Stopaj yanlis - Beklenen " + beklStopaj + " TL (%20), Mevcut " + mevStopaj + " TL")
    if (!mevStopaj && haric > 0)
      w.push("EKSIK: Stopaj hesaplanmamis - Kira %20 stopaja tabi, beklenen " + beklStopaj + " TL")
  }
  return w
}

export function parseExcelPuantaj(b64: string): Record<string, unknown> {
  try {
    const buf  = Buffer.from(b64, "base64")
    const wb   = XLSX.read(buf, { type: "buffer", cellDates: true })
    const ws   = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: false })
    if (!rows.length) return { ozet: "Excel bos", guvenSkor: 10, islemTuru: "bordro", uyarilar: ["Bos Excel"], calisanlar: [], duzeltmeler: [] }
    const cols   = Object.keys(rows[0])
    const adCol  = cols.find(c => /^(ad|isim|name|calisan|personel)/i.test(c))
    const gunCol = cols.find(c => /^(gun|day|calisma_gun)/i.test(c))
    const sgkCol = cols.find(c => /^(sgk|sicil|tc)/i.test(c))
    const ucCol  = cols.find(c => /^(ucret|maas|odeme|brut)/i.test(c))
    const calisanlar = rows
      .filter(r => adCol && r[adCol] && String(r[adCol]).trim().length > 1)
      .map(r => ({
        ad:    adCol  ? String(r[adCol]  || "").trim() : "",
        gun:   gunCol ? Number(r[gunCol] || 0) : 0,
        sgk:   sgkCol ? String(r[sgkCol] || "").trim() : null,
        ucret: ucCol  ? Number(r[ucCol]  || 0) : null,
      }))
      .filter(c => c.ad.length > 1)
    const personelSayisi = calisanlar.length
    const toplamGun      = calisanlar.reduce((a, c) => a + c.gun, 0)
    const eksikGunVar    = calisanlar.some(c => c.gun > 0 && c.gun < 30)
    const toplamUcret    = ucCol ? calisanlar.reduce((a, c) => a + (c.ucret || 0), 0) : null
    const w: string[] = []
    if (eksikGunVar) w.push("Bazi personel 30 gun altinda - eksik gun kodu gerekebilir")
    if (!gunCol)     w.push("Calisma gun sutunu tespit edilemedi - baslik: " + cols.slice(0,5).join(","))
    if (!adCol)      w.push("Calisan adi sutunu tespit edilemedi")
    return {
      tarih: null, toplamTutar: toplamUcret, kdvTutari: 0, kdvOrani: 0,
      firmaAdi: null, islemTuru: "bordro",
      personelSayisi, toplamGun,
      calisanlar: calisanlar.slice(0, 100),
      satirSayisi: rows.length,
      ozet: personelSayisi + " personel, " + toplamGun + " is gunu" + (toplamUcret ? ", toplam " + toplamUcret.toLocaleString("tr-TR") + " TL" : ""),
      guvenSkor: personelSayisi > 0 ? (gunCol && adCol ? 85 : 50) : 20,
      uyarilar: w, duzeltmeler: [], kaynak: "xlsx_parse"
    }
  } catch (e: unknown) {
    return { ozet: "Excel hatasi: " + String(e), guvenSkor: 5, islemTuru: "bordro",
             uyarilar: ["Excel okunamadi: " + String(e)], calisanlar: [], duzeltmeler: [] }
  }
}

export function parseEFaturaXML(xml: string): Record<string, unknown> {
  const get    = (tag: string) => { const m = xml.match(new RegExp("<(?:[^>]*:)?" + tag + "[^>]*>([^<]+)<")); return m ? m[1].trim() : null }
  const getAny = (tags: string[]) => { for (const t of tags) { const v = get(t); if (v) return v } return null }
  const num    = (s: string | null) => s ? parseFloat(s.replace(",", ".")) : null
  const tarih       = getAny(["IssueDate"])
  const toplamTutar = num(getAny(["PayableAmount", "TaxInclusiveAmount"]))
  const kdvTutari   = num(getAny(["TaxAmount"]))
  const kdvHaric    = num(getAny(["TaxExclusiveAmount", "LineExtensionAmount"]))
  const kdvOrani    = num(getAny(["Percent"]))
  const firmaAdi    = getAny(["RegistrationName", "Name"])
  const uuid        = (xml.match(/[Uu][Uu][Ii][Dd].*?>([0-9a-f-]{36})</)?.[1]) || getAny(["ID"])
  const w: string[] = []
  if (uuid && uuid.length !== 36) w.push("UUID formati gecersiz (" + uuid.length + " karakter, 36 olmali)")
  if (kdvOrani && ![1, 10, 20].includes(Number(kdvOrani))) w.push("Gecersiz KDV orani: " + kdvOrani + "%")
  if (toplamTutar && kdvTutari && kdvHaric) {
    const fark = Math.abs((kdvHaric + kdvTutari) - toplamTutar)
    if (fark > 1) w.push("Aritmetik hata: matrah+KDV=" + (kdvHaric+kdvTutari).toFixed(2) + " != toplam=" + toplamTutar)
  }
  return {
    tarih, toplamTutar, kdvTutari, kdvHaricTutar: kdvHaric, kdvOrani, firmaAdi, belgeNo: uuid,
    islemTuru: "gider",
    ozet: "e-Fatura XML islendi" + (firmaAdi ? " - " + firmaAdi : "") + (toplamTutar ? " | " + toplamTutar + " TL" : ""),
    guvenSkor: (toplamTutar && tarih && firmaAdi) ? (w.length ? 80 : 95) : 65,
    uyarilar: w, duzeltmeler: [], kaynak: "xml_parse"
  }
}

export function scoreConfidence(analiz: Record<string, unknown>, belgeTuru: string): number {
  const crit: Record<string, string[]> = {
    z_raporu:     ["tarih","toplamTutar","kdvTutari","belgeNo","firmaAdi"],
    efatura:      ["tarih","toplamTutar","kdvTutari","firmaAdi","belgeNo"],
    kagit_fatura: ["tarih","toplamTutar","kdvTutari","firmaAdi"],
    banka:        ["tarih","toplamTutar","firmaAdi"],
    kira:         ["tarih","toplamTutar","firmaAdi","stopajTutari"],
    puantaj:      ["personelSayisi","toplamGun"],
    diger_belge:  ["tespitEdilenTur","ozet"]
  }
  const fields = crit[belgeTuru] || ["tarih","toplamTutar"]
  const found  = fields.filter(f => { const v = analiz[f]; return v != null && v !== "" && v !== 0 }).length
  const base   = Math.round((found / fields.length) * 100)
  const hatali = Array.isArray(analiz.uyarilar) && (analiz.uyarilar as string[]).some(u => u.startsWith("HATA"))
  return Math.max(0, Math.min(100, base - (hatali ? 15 : 0)))
}

export async function detectType(b64: string, mime: string, filename: string): Promise<string> {
  const key  = process.env.ANTHROPIC_API_KEY!
  const hint = filename.toLowerCase()
  if (/z[_-]?rapor|zrapor/.test(hint))                   return "z_raporu"
  if (/puantaj/.test(hint))                               return "puantaj"
  if (hint.endsWith(".xlsx") || hint.endsWith(".xls"))    return "puantaj"
  if (hint.endsWith(".xml"))                              return "efatura"
  if (/kira/.test(hint))                                  return "kira"
  if (/banka|ekstre|pos/.test(hint))                      return "banka"
  if (/fatur/.test(hint))                                 return "kagit_fatura"
  if (!mime.startsWith("image/") && mime !== "application/pdf") return "diger_belge"
  const content: unknown[] = []
  if (mime.startsWith("image/")) content.push({ type: "image", source: { type: "base64", media_type: mime, data: b64 } })
  else content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } })
  content.push({ type: "text", text: "Bu Turkiye mali belgesi hangi tur? SADECE: z_raporu | efatura | kagit_fatura | banka | puantaj | kira | diger_belge" })
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 20, messages: [{ role: "user", content }] })
  })
  const d = await r.json()
  const t = (d.content?.[0]?.text || "").trim().toLowerCase().replace(/[^a-z_]/g, "")
  const ok = ["z_raporu","efatura","kagit_fatura","banka","puantaj","kira","diger_belge"]
  return ok.includes(t) ? t : "diger_belge"
}

async function extractWithDerya(b64: string, mime: string, belgeTuru: string, isletmeTipi: string, donem: string, notlar: string): Promise<Record<string, unknown>> {
  const key   = process.env.ANTHROPIC_API_KEY!
  const isImg = mime.startsWith("image/")
  const isPDF = mime === "application/pdf"
  const prompt = (EXTRACT_PROMPTS[belgeTuru] || EXTRACT_PROMPTS.diger_belge) +
    " Isletme turu: " + (isletmeTipi || "genel") +
    ". Donem: " + donem + ". Not: " + (notlar || "yok") +
    ". guvenSkor 0-100 gercek alan doluluguna gore ver. SADECE JSON."
  const content: unknown[] = []
  if (isImg)      content.push({ type: "image",    source: { type: "base64", media_type: mime,                data: b64 } })
  else if (isPDF) content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } })
  content.push({ type: "text", text: prompt })
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2048, system: DERYA_SYSTEM, messages: [{ role: "user", content }] })
  })
  const d   = await r.json()
  const txt = (d.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim()
  try   { return JSON.parse(txt) }
  catch { return { ozet: txt.substring(0,300), guvenSkor:15, islemTuru:"diger", uyarilar:["JSON parse hatasi"], duzeltmeler:[] } }
}

async function selfCorrect(b64: string, mime: string, belgeTuru: string, first: Record<string, unknown>): Promise<Record<string, unknown>> {
  const key   = process.env.ANTHROPIC_API_KEY!
  const isImg = mime.startsWith("image/")
  const isPDF = mime === "application/pdf"
  const critMap: Record<string, string[]> = {
    z_raporu: ["tarih","toplamTutar","kdvTutari","belgeNo","firmaAdi"],
    efatura:  ["tarih","toplamTutar","kdvTutari","firmaAdi","belgeNo"],
    kagit_fatura: ["tarih","toplamTutar","kdvTutari","firmaAdi"],
    banka: ["tarih","toplamTutar","firmaAdi"],
    kira:  ["tarih","toplamTutar","firmaAdi"],
    puantaj: ["tarih","personelSayisi"],
    diger_belge: ["tarih","tespitEdilenTur"]
  }
  const missing = (critMap[belgeTuru] || ["tarih","toplamTutar"])
    .filter(f => { const v = first[f]; return v == null || v === "" || v === 0 })
  if (!missing.length) return first
  const prompt = CORRECTION_PROMPT.replace("MISSING_FIELDS", missing.join(", ")) + " Mevcut: " + JSON.stringify(first).substring(0, 600)
  const content: unknown[] = []
  if (isImg)      content.push({ type: "image",    source: { type: "base64", media_type: mime,                data: b64 } })
  else if (isPDF) content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } })
  content.push({ type: "text", text: prompt })
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1024, system: DERYA_SYSTEM, messages: [{ role: "user", content }] })
  })
  const d   = await r.json()
  const txt = (d.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim()
  try {
    const corrected = JSON.parse(txt)
    const merged: Record<string, unknown> = { ...first }
    const fixes: string[] = []
    for (const f of missing) {
      if (corrected[f] != null && corrected[f] !== "") {
        merged[f] = corrected[f]
        fixes.push(f + " duzeltildi(2.pass)")
      }
    }
    merged.duzeltmeler = [...((first.duzeltmeler as string[]) || []), ...fixes]
    return merged
  } catch { return first }
}

export async function detectAndExtract(b64: string, mime: string, filename: string, belgeTuru: string, isletmeTipi: string, donem: string, notlar: string): Promise<{ detectedTuru: string; data: Record<string, unknown> }> {
  if (mime.includes("spreadsheet") || mime.includes("excel") || filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
    return { detectedTuru: "puantaj", data: parseExcelPuantaj(b64) }
  }
  if (mime.includes("xml") || filename.endsWith(".xml")) {
    const xml = Buffer.from(b64, "base64").toString("utf-8")
    if (/[Ii]nvoice/.test(xml)) return { detectedTuru: "efatura", data: parseEFaturaXML(xml) }
  }
  const detectedTuru = belgeTuru || await detectType(b64, mime, filename)
  let analiz = await extractWithDerya(b64, mime, detectedTuru, isletmeTipi, donem, notlar)
  const w = validateMali(analiz, detectedTuru)
  analiz.uyarilar = [...(Array.isArray(analiz.uyarilar) ? analiz.uyarilar as string[] : []), ...w]
  const preSkor = scoreConfidence(analiz, detectedTuru)
  if (preSkor < 75 && (mime.startsWith("image/") || mime === "application/pdf")) {
    analiz = await selfCorrect(b64, mime, detectedTuru, analiz)
  }
  analiz.guvenSkor = scoreConfidence(analiz, detectedTuru)
  return { detectedTuru, data: analiz }
}
