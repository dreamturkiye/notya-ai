// Shared ingestion pipeline - used by web upload, WhatsApp, and future channels

const PROMPTS: Record<string, string> = {
  z_raporu: "Z Raporu analizi. Gun sonu toplam satis, KDV, Z no, tarih, isletme adi. SADECE JSON don: {tarih, toplamTutar, kdvTutari, kdvHaricTutar, kdvOrani, firmaAdi, belgeNo, islemTuru, ozet, guvenSkor, uyarilar}",
  efatura: "e-Fatura analizi. Fatura no, tarih, satici/alici, matrah, KDV, toplam. SADECE JSON don: {tarih, toplamTutar, kdvTutari, kdvHaricTutar, kdvOrani, firmaAdi, belgeNo, islemTuru, ozet, guvenSkor, uyarilar}",
  kagit_fatura: "Kagit fatura veya fis. Tarih, firma, KDV dahil toplam, KDV, fatura no. SADECE JSON don: {tarih, toplamTutar, kdvTutari, kdvHaricTutar, kdvOrani, firmaAdi, belgeNo, islemTuru, ozet, guvenSkor, uyarilar}",
  banka: "Banka/POS ekstresi. Donem, toplam alacak, borc, net bakiye, banka adi. SADECE JSON don: {tarih, toplamTutar, kdvTutari, kdvHaricTutar, kdvOrani, firmaAdi, belgeNo, islemTuru, ozet, guvenSkor, uyarilar}",
  kira: "Kira makbuzu. Kiralik yer, tutar, donem, stopaj. SADECE JSON don: {tarih, toplamTutar, kdvTutari, kdvHaricTutar, kdvOrani, firmaAdi, belgeNo, islemTuru, ozet, guvenSkor, uyarilar}",
  puantaj: "Puantaj cetveli. Calisma donemi, personel sayisi, toplam gun, tutar. SADECE JSON don: {tarih, toplamTutar, kdvTutari, kdvHaricTutar, kdvOrani, firmaAdi, belgeNo, islemTuru, ozet, guvenSkor, uyarilar}",
  diger_belge: "Mali belge. Tarih, tutar, firma, belge turu. SADECE JSON don: {tarih, toplamTutar, kdvTutari, kdvHaricTutar, kdvOrani, firmaAdi, belgeNo, islemTuru, ozet, guvenSkor, uyarilar}",
}

export function parseEFaturaXML(xml: string): Record<string, unknown> {
  const get = (tag: string) => { const m = xml.match(new RegExp("<[^>]*" + tag + "[^>]*>([^<]+)<")); return m ? m[1].trim() : null }
  const num = (s: string | null) => s ? parseFloat(s.replace(",", ".")) : null
  return {
    tarih: get("IssueDate") || get("PaymentDueDate"),
    toplamTutar: num(get("PayableAmount") || get("TaxInclusiveAmount")),
    kdvTutari: num(get("TaxAmount")),
    kdvHaricTutar: num(get("TaxExclusiveAmount")),
    kdvOrani: num(get("Percent")),
    firmaAdi: get("RegistrationName") || get("Name"),
    belgeNo: get("ID"),
    islemTuru: "gider",
    ozet: "e-Fatura XML olarak islendi",
    guvenSkor: 95,
    uyarilar: [],
    kaynak: "xml_parse"
  }
}

export function scoreConfidence(analiz: Record<string, unknown>, belgeTuru: string): number {
  const crit: Record<string, string[]> = {
    z_raporu:     ["tarih", "toplamTutar", "kdvTutari", "belgeNo"],
    efatura:      ["tarih", "toplamTutar", "kdvTutari", "firmaAdi", "belgeNo"],
    kagit_fatura: ["tarih", "toplamTutar", "firmaAdi"],
    banka:        ["tarih", "toplamTutar", "firmaAdi"],
    kira:         ["tarih", "toplamTutar", "firmaAdi"],
    puantaj:      ["tarih", "ozet"],
    diger_belge:  ["tarih", "ozet"]
  }
  const fields = crit[belgeTuru] || ["tarih", "toplamTutar"]
  const found  = fields.filter(f => analiz[f] != null && analiz[f] !== "").length
  const base   = Math.round((found / fields.length) * 100)
  const penalty = (!analiz.ozet || analiz.ozet === "ozet" || analiz.ozet === "") ? 15 : 0
  return Math.max(0, Math.min(100, base - penalty))
}

export async function detectType(b64: string, mime: string, filename: string): Promise<string> {
  const key  = process.env.ANTHROPIC_API_KEY!
  const hint = filename.toLowerCase()
  if (hint.includes("z_rapor") || hint.includes("zrapor"))  return "z_raporu"
  if (hint.includes("puantaj") || hint.endsWith(".xlsx") || hint.endsWith(".xls")) return "puantaj"
  if (hint.endsWith(".xml"))          return "efatura"
  if (hint.includes("kira"))          return "kira"
  if (hint.includes("banka") || hint.includes("ekstre")) return "banka"
  if (!mime.startsWith("image/") && mime !== "application/pdf") return "diger_belge"

  const content: unknown[] = []
  if (mime.startsWith("image/")) content.push({ type: "image", source: { type: "base64", media_type: mime, data: b64 } })
  else content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } })
  content.push({ type: "text", text: "Bu Turkiye mali belgesi hangi tur? SADECE: z_raporu | efatura | kagit_fatura | banka | puantaj | kira | diger_belge. Tek kelime." })

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 20, messages: [{ role: "user", content }] })
  })
  const d = await res.json()
  const t = (d.content?.[0]?.text || "").trim().toLowerCase().replace(/[^a-z_]/g, "")
  const valid = ["z_raporu", "efatura", "kagit_fatura", "banka", "puantaj", "kira", "diger_belge"]
  return valid.includes(t) ? t : "diger_belge"
}

export async function detectAndExtract(
  b64: string, mime: string, filename: string,
  belgeTuru: string, isletmeTipi: string, donem: string, notlar: string
): Promise<{ detectedTuru: string; data: Record<string, unknown> }> {
  // XML fast path
  if (mime.includes("xml") || filename.endsWith(".xml")) {
    const xml = Buffer.from(b64, "base64").toString("utf-8")
    if (xml.includes("<Invoice")) return { detectedTuru: "efatura", data: parseEFaturaXML(xml) }
  }

  // Excel path
  if (mime.includes("spreadsheet") || mime.includes("excel") || filename.endsWith(".xlsx")) {
    return { detectedTuru: "puantaj", data: { tarih: null, toplamTutar: null, kdvTutari: 0, kdvOrani: 0, islemTuru: "bordro", ozet: "Puantaj Excel - manuel inceleme gerekli", guvenSkor: 30, uyarilar: ["Excel dosyasi satir analizi gerekli"] } }
  }

  const detectedTuru = belgeTuru || await detectType(b64, mime, filename)
  const key = process.env.ANTHROPIC_API_KEY!
  const isImg = mime.startsWith("image/")
  const isPDF = mime === "application/pdf"

  const prompt = (PROMPTS[detectedTuru] || PROMPTS.diger_belge) +
    " Isletme: " + (isletmeTipi || "genel") +
    ". Donem: " + donem +
    ". Not: " + (notlar || "yok") +
    ". guvenSkor 0-100 gercek skor ver. SADECE JSON."

  const content: unknown[] = []
  if (isImg) content.push({ type: "image", source: { type: "base64", media_type: mime, data: b64 } })
  else if (isPDF) content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } })
  content.push({ type: "text", text: prompt })

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1024, messages: [{ role: "user", content }] })
  })
  const d = await res.json()
  const txt = (d.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim()

  let parsed: Record<string, unknown> = {}
  try { parsed = JSON.parse(txt) } catch { parsed = { ozet: txt.substring(0, 200), guvenSkor: 20, islemTuru: "diger", uyarilar: ["JSON parse hatasi"] } }

  // Real confidence score
  parsed.guvenSkor = scoreConfidence(parsed, detectedTuru)
  return { detectedTuru, data: parsed }
}
