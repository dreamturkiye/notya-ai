"use client"
/**
 * MUAYENE-EKLERI-01 — "Ekleri Ekle": kayıt durduktan sonra, not üretilmeden önce.
 *
 * - Sürükle-bırak / dosya / kamera (input capture) / barkod (BarcodeDetector, yoksa fotoğraf + OCR, ayrıca elle giriş).
 * - Çoklu yükleme (ilerleme çubuğu, eşzamanlı 3), her ek hemen Kasa'ya bu muayeneye bağlı yüklenir.
 * - Ayşe türü tahmin eder; emin değilse tek dokunuşluk "Bu nedir?".
 * - Birincil eylem: "Değerlendir ve Raporu Oluştur" (eşzamanlı 3; her ek ayrı durum, hata → yeniden dene).
 * - ASLA engellemez: "Ekler olmadan oluştur", "Kalanları atla ve raporu oluştur"; bileşen çökerse yedek kart not üretimini sürdürür.
 * Klinik metin tarayıcı konsoluna yazılmaz.
 */
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { CHROME_FONT, CHROME_RENK } from "@/lib/doktor/chromeTheme"
import { ensureDoctorAccessToken } from "@/lib/doktor/clientAuth"
import { bitmapKalitesi } from "@/components/doktor/fotoArsivi/istemciGorsel"
import { ekHatirlaticilar, eksikHatirlaticilar, type Hatirlatici } from "@/lib/doktor/muayeneEk/hatirlatici"
import { EK_DEGERLENDIRME_SURUMU, EK_TURLERI, EK_TUR_ETIKETI, type EkAsiSatiri, type EkSonuc, type EkTuru } from "@/lib/doktor/muayeneEk/tipler"

export interface EkPayload {
  ekler: { belgeId: string; sonuc: EkSonuc }[]
  asiOnay: { belgeId: string; satirlar: { asiAdi: string; dozNo: number | null; uygulamaTarihi: string | null; lotNo: string | null; kaynakTuru: "bu_muayene" | "karne" }[] }[]
}

type Durum = "yukleniyor" | "yukleme_hata" | "siniflaniyor" | "tur_sor" | "hazir" | "degerlendiriliyor" | "tamam" | "hata" | "atlandi"
interface Oge {
  key: string; ad: string; kaynak: "dosya" | "kamera" | "barkod"; durum: Durum; yuzde: number
  belgeId?: string; tur?: EkTuru; adaylar?: { tur: EkTuru; guven: number }[]; sonuc?: EkSonuc; hata?: string
  dosya?: Blob; gorselB64?: string; gorselMime?: string; ipucu?: EkTuru | null
  asiOnay?: boolean; asiSatirlari?: EkAsiSatiri[]
}

const GORSEL_TURLERI: EkTuru[] = ["rontgen", "ekg", "foto"]
const AZAMI_BAYT = 3.8 * 1024 * 1024
const ESZAMANLI = 3
let sayac = 0

async function token(): Promise<string> { try { return (await ensureDoctorAccessToken()) || "" } catch { return "" } }
async function api<T>(yol: string, govde?: unknown, imza?: AbortSignal): Promise<{ ok: boolean; durum: number; veri: T | null }> {
  const t = await token()
  try {
    const r = await fetch(yol, {
      method: govde === undefined ? "GET" : "POST", signal: imza,
      headers: { Authorization: `Bearer ${t}`, ...(govde === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(govde === undefined ? {} : { body: JSON.stringify(govde) }),
    })
    const veri = (await r.json().catch(() => null)) as T | null
    return { ok: r.ok, durum: r.status, veri }
  } catch { return { ok: false, durum: 0, veri: null } }
}

/** Görseli 4 MB altına ve makul çözünürlüğe indirir (HEIC/büyük kamera fotoğrafları); PDF ve küçük dosyalar aynen. */
async function kucult(f: File): Promise<{ blob: Blob; ad: string; b64?: string; mime?: string }> {
  const gorselMi = f.type.startsWith("image/")
  if (!gorselMi) return { blob: f, ad: f.name }
  const tara = async (azami: number, kalite: number): Promise<Blob | null> => {
    try {
      const bmp = await createImageBitmap(f)
      const oran = Math.min(1, azami / Math.max(bmp.width, bmp.height))
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * oran); c.height = Math.round(bmp.height * oran)
      c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height)
      return await new Promise<Blob | null>((res) => c.toBlob((b) => res(b), "image/jpeg", kalite))
    } catch { return null }
  }
  const turev = await tara(1600, 0.82) // kimliksiz değerlendirme türevi (yalnız belleğe)
  const b64 = turev ? await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] || ""); r.readAsDataURL(turev) }) : undefined
  if (f.size <= AZAMI_BAYT && /jpeg|png|webp|gif/.test(f.type)) return { blob: f, ad: f.name, b64, mime: turev ? "image/jpeg" : undefined }
  const kucuk = (await tara(2400, 0.85)) || turev
  if (kucuk) return { blob: kucuk, ad: f.name.replace(/\.[^.]+$/, "") + ".jpg", b64, mime: "image/jpeg" }
  return { blob: f, ad: f.name }
}

function yukle(blob: Blob, ad: string, patientId: string, sessionId: string, tok: string, ilerleme: (y: number) => void): Promise<{ id?: string; hata?: string }> {
  return new Promise((res) => {
    const x = new XMLHttpRequest()
    const form = new FormData()
    form.append("file", blob, ad); form.append("patientId", patientId); form.append("visitId", sessionId)
    x.open("POST", "/api/doktor/documents")
    x.setRequestHeader("Authorization", `Bearer ${tok}`)
    x.upload.onprogress = (e) => { if (e.lengthComputable) ilerleme(Math.round((e.loaded / e.total) * 100)) }
    x.onload = () => {
      try { const j = JSON.parse(x.responseText); if (x.status < 300 && j?.document?.id) return res({ id: String(j.document.id) }); res({ hata: String(j?.error || "Yüklenemedi") }) }
      catch { res({ hata: "Yüklenemedi" }) }
    }
    x.onerror = () => res({ hata: "Bağlantı kesildi" })
    x.send(form)
  })
}

/** Sınırlı eşzamanlılıkla çalıştırır. */
async function havuz<T>(isler: (() => Promise<T>)[], n: number, durdur: () => boolean): Promise<void> {
  let i = 0
  const isci = async () => { while (i < isler.length && !durdur()) { const k = i++; try { await isler[k]() } catch { /* tek iş diğerlerini durdurmaz */ } } }
  await Promise.all(Array.from({ length: Math.min(n, isler.length) }, isci))
}

const atlaSonucu = (tur: EkTuru, neden: string): EkSonuc => ({ tur, durum: "atlandi", baslik: "", ozet: "", bulgular: [], uyarilar: [], sinirlar: [], izinliSayilar: [], surum: EK_DEGERLENDIRME_SURUMU, hataNedeni: neden })

// ─── Yedek: bileşen çökerse not üretimi eski yoldan sürer ────────────────────────────────────────────────
class Sinir extends Component<{ devam: () => void; children: ReactNode }, { hata: boolean }> {
  state = { hata: false }
  static getDerivedStateFromError() { return { hata: true } }
  componentDidCatch() { console.error("[muayene-ekleri] ek adimi hata verdi — eski akis") }
  render() {
    if (!this.state.hata) return this.props.children
    return (
      <div style={{ background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 16, padding: 24, textAlign: "center", fontFamily: CHROME_FONT.sans }}>
        <div style={{ color: CHROME_RENK.ink, marginBottom: 12 }}>Ek ekranı şu an açılamadı. Notunuz yine de oluşturulabilir.</div>
        <button onClick={this.props.devam} style={{ padding: "14px 20px", background: CHROME_RENK.pine, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, cursor: "pointer" }}>Notu Oluştur</button>
      </div>
    )
  }
}

interface Props {
  sessionId: string; patientId: string; transcript: string; pediatrik: boolean
  hata?: string
  onDevam: (payload: EkPayload | null) => void
}

export default function MuayeneEklerAdimi(p: Props) {
  return <Sinir devam={() => p.onDevam(null)}><Ic {...p} /></Sinir>
}

function Ic({ sessionId, patientId, transcript, pediatrik, hata, onDevam }: Props) {
  const [ogeler, setOgeler] = useState<Oge[]>([])
  const [surukle, setSurukle] = useState(false)
  const [kapatilan, setKapatilan] = useState<string[]>([])
  const [calisiyor, setCalisiyor] = useState(false)
  const [kimliksiz, setKimliksiz] = useState(false)
  const [barkodAcik, setBarkodAcik] = useState(false)
  const [barkodYazi, setBarkodYazi] = useState("")
  const [bildirim, setBildirim] = useState("")
  const [asiBekliyor, setAsiBekliyor] = useState(false)
  const atlaRef = useRef(false)
  const dosyaRef = useRef<HTMLInputElement>(null)
  const kameraRef = useRef<HTMLInputElement>(null)
  const ogelerRef = useRef<Oge[]>([])
  ogelerRef.current = ogeler

  const guncelle = useCallback((key: string, y: Partial<Oge>) => {
    setOgeler((l) => l.map((o) => (o.key === key ? { ...o, ...y } : o)))
  }, [])

  // Hatırlatıcılar: hafif, kapatılabilir, asla engellemez.
  const hatirlaticilar = useMemo(() => {
    try { return eksikHatirlaticilar(ekHatirlaticilar(transcript, { pediatrik }), ogeler.map((o) => o.tur).filter((t): t is EkTuru => !!t)).filter((h) => !kapatilan.includes(h.kod)) }
    catch { return [] as Hatirlatici[] }
  }, [transcript, pediatrik, ogeler, kapatilan])

  const islemeAl = useCallback(async (f: File, kaynak: Oge["kaynak"], ipucu: EkTuru | null) => {
    const key = `o${++sayac}`
    setOgeler((l) => [...l, { key, ad: f.name || "belge", kaynak, durum: "yukleniyor", yuzde: 0, ipucu }])
    const k = await kucult(f)
    // FOTO-ARSIV-01: kayıttan ÖNCE çekim kalitesi kapısı (yalnız kamera çekimleri; ağır bulanıklık / karanlık). Engellemez: hekim "yine de kaydet" diyebilir.
    if (kaynak === "kamera" && k.blob.type.startsWith("image/")) {
      try {
        const bmp = await createImageBitmap(k.blob)
        const q = bitmapKalitesi(bmp); bmp.close()
        if (q.sorunlar.some((s) => s.agir && (s.kod === "bulanik" || s.kod === "karanlik"))
          && !window.confirm(`Çekimi yenileyin: ${q.oneri ?? "Fotoğraf yeterince net veya aydınlık değil."}\n\nYine de kaydedilsin mi? (İptal: kaydetme, yeniden çekin)`)) {
          setOgeler((l) => l.filter((o) => o.key !== key)); return
        }
      } catch { /* kalite kapısı yardımcıdır; hata kaydı engellemez */ }
    }
    guncelle(key, { dosya: k.blob, gorselB64: k.b64, gorselMime: k.mime })
    if (k.blob.size > 4 * 1024 * 1024) { guncelle(key, { durum: "yukleme_hata", hata: "Dosya 4 MB sınırını aşıyor." }); return }
    const tok = await token()
    const y = await yukle(k.blob, k.ad, patientId, sessionId, tok, (yuzde) => guncelle(key, { yuzde }))
    if (!y.id) { guncelle(key, { durum: "yukleme_hata", hata: y.hata || "Yüklenemedi" }); return }
    guncelle(key, { belgeId: y.id, yuzde: 100, durum: "siniflaniyor" })
    const s = await api<{ siniflandirma?: { tur: EkTuru; guven: number; adaylar: { tur: EkTuru; guven: number }[]; sor: boolean } }>(
      "/api/doktor/muayene-ekleri/siniflandir", { sessionId, belgeId: y.id, kaynak, ipucuTur: ipucu })
    const c = s.veri?.siniflandirma
    if (!s.ok || !c) guncelle(key, { durum: "tur_sor", adaylar: [], tur: undefined })
    else guncelle(key, { tur: c.tur, adaylar: c.adaylar, durum: c.sor ? "tur_sor" : "hazir" })
  }, [guncelle, patientId, sessionId])

  // Yükleme havuzu: aynı anda en fazla 3
  const kuyrukRef = useRef<Promise<void>>(Promise.resolve())
  const ekle = useCallback((dosyalar: File[], kaynak: Oge["kaynak"], ipucu: EkTuru | null = null) => {
    const liste = dosyalar.slice(0, 12)
    kuyrukRef.current = kuyrukRef.current.then(() => havuz(liste.map((f) => () => islemeAl(f, kaynak, ipucu)), ESZAMANLI, () => false))
  }, [islemeAl])

  async function turSec(o: Oge, tur: EkTuru) {
    if (!o.belgeId) return
    guncelle(o.key, { tur, durum: "hazir", sonuc: undefined })
    void api("/api/doktor/muayene-ekleri/tur", { sessionId, belgeId: o.belgeId, tur, onceki: o.adaylar?.[0]?.tur ?? null, kaynak: o.kaynak })
  }

  async function degerlendirOge(key: string, yeniden = false) {
    const o = ogelerRef.current.find((x) => x.key === key)
    if (!o?.belgeId || !o.tur) return
    const tur = o.tur
    if (GORSEL_TURLERI.includes(tur) && o.gorselB64 && !kimliksiz) {
      guncelle(key, { durum: "atlandi", sonuc: atlaSonucu(tur, "Görselde kimlik bilgisi olmadığı onaylanmadı."), hata: "Görselde kimlik bilgisi olmadığını onaylayın, sonra yeniden deneyin." })
      return
    }
    guncelle(key, { durum: "degerlendiriliyor", hata: undefined })
    const r = await api<{ sonuc?: EkSonuc }>("/api/doktor/muayene-ekleri/degerlendir", {
      sessionId, belgeId: o.belgeId, tur, yeniden,
      deid: GORSEL_TURLERI.includes(tur) && o.gorselB64 ? { mime: o.gorselMime || "image/jpeg", base64: o.gorselB64 } : null,
    })
    const s = r.veri?.sonuc
    if (!r.ok || !s) { guncelle(key, { durum: "hata", hata: "Değerlendirilemedi — yeniden deneyin." }); return }
    guncelle(key, { sonuc: s, durum: s.durum === "tamam" ? "tamam" : s.durum === "atlandi" ? "atlandi" : "hata", hata: s.durum === "hata" ? s.hataNedeni || "Değerlendirilemedi — yeniden deneyin." : undefined,
      asiSatirlari: s.asiSatirlari, asiOnay: false })
  }

  /** Raporu hazırlayıp devam eder; yükleme sürüyorsa beklemez, o ekler dışarıda kalır. */
  function devamEt(onayAsiyla: boolean) {
    const l = ogelerRef.current
    const ekler: EkPayload["ekler"] = []
    const asiOnay: EkPayload["asiOnay"] = []
    for (const o of l) {
      if (!o.belgeId || !o.tur) continue
      const sonuc = o.sonuc ?? atlaSonucu(o.tur, o.durum === "tur_sor" ? "Tür seçilmedi — atlandı." : "Değerlendirilmedi.")
      ekler.push({ belgeId: o.belgeId, sonuc })
      if (onayAsiyla && o.asiOnay && o.asiSatirlari?.length) {
        const bu = o.asiSatirlari.filter((s) => s.kaynakTuru === "bu_muayene" && s.asiAdi.trim()).map((s) => ({ asiAdi: s.asiAdi.trim(), dozNo: s.dozNo, uygulamaTarihi: s.uygulamaTarihi, lotNo: s.lotNo, kaynakTuru: "bu_muayene" as const }))
        if (bu.length) asiOnay.push({ belgeId: o.belgeId, satirlar: bu })
      }
    }
    onDevam({ ekler, asiOnay })
  }

  async function karneYaz() {
    for (const o of ogelerRef.current) {
      if (!o.asiOnay || !o.belgeId || !o.asiSatirlari) continue
      const k = o.asiSatirlari.filter((s) => s.kaynakTuru === "karne" && s.asiAdi.trim())
      if (!k.length) continue
      const r = await api("/api/doktor/asilar/karne", { adim: "onayla", belgeId: o.belgeId, hekimOnayi: true,
        satirlar: k.map((s) => ({ asiAdi: s.asiAdi.trim(), dozNo: s.dozNo, uygulamaTarihi: s.uygulamaTarihi, okunamadi: s.okunamadi, hekimDuzeltti: true })) })
      if (!r.ok) setBildirim("Geçmiş aşı kayıtlarından bazıları karneye yazılamadı — Belgeler bölümünden onaylayabilirsiniz.")
    }
  }

  async function degerlendirVeOlustur() {
    if (calisiyor) return
    atlaRef.current = false
    setCalisiyor(true); setBildirim("")
    try {
      const isler = ogelerRef.current
        .filter((o) => o.belgeId && o.tur && o.durum !== "tur_sor" && o.durum !== "tamam" && o.durum !== "atlandi")
        .map((o) => () => degerlendirOge(o.key))
      await havuz(isler, ESZAMANLI, () => atlaRef.current)
    } catch { /* tek tek durumlar zaten işlendi */ }
    setCalisiyor(false)
    await sonrasi()
  }

  async function sonrasi() {
    await new Promise((r) => setTimeout(r, 80)) // son durum güncellemeleri ekrana/ref'e işlensin
    const l = ogelerRef.current
    const asiVar = l.some((o) => o.durum === "tamam" && o.tur === "asi" && o.asiSatirlari?.some((s) => !s.okunamadi || s.asiAdi))
    const hataVar = l.some((o) => o.durum === "hata")
    if (atlaRef.current || (!asiVar && !hataVar)) { await karneYaz(); devamEt(true); return }
    setAsiBekliyor(true) // aşı onayı veya hata inceleme: hekim "Raporu Oluştur" der
  }

  function atlaVeOlustur() {
    atlaRef.current = true
    setCalisiyor(false)
    setOgeler((l) => l.map((o) => (o.durum === "degerlendiriliyor" || o.durum === "hazir" || o.durum === "tur_sor" ? { ...o, durum: "atlandi" as Durum, sonuc: o.tur ? atlaSonucu(o.tur, "Hekim atladı.") : undefined } : o)))
    window.setTimeout(() => { void karneYaz().finally(() => devamEt(true)) }, 50)
  }

  // Kamera / barkod
  async function barkodDosyasi(metin: string) {
    const t = metin.trim().slice(0, 400)
    if (!t) return
    ekle([new File([t], "barkod.txt", { type: "text/plain" })], "barkod", "asi")
  }
  const bdSupported = typeof window !== "undefined" && "BarcodeDetector" in window
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (!barkodAcik || !bdSupported) return
    let dur = false
    let akis: MediaStream | null = null
    ;(async () => {
      try {
        akis = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        if (videoRef.current) { videoRef.current.srcObject = akis; await videoRef.current.play().catch(() => undefined) }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const det = new (window as any).BarcodeDetector({ formats: ["data_matrix", "qr_code", "code_128", "ean_13", "ean_8"] })
        while (!dur) {
          await new Promise((r) => setTimeout(r, 300))
          if (!videoRef.current) continue
          const b = await det.detect(videoRef.current).catch(() => [])
          if (b?.[0]?.rawValue) { await barkodDosyasi(String(b[0].rawValue)); setBarkodAcik(false); return }
        }
      } catch { setBarkodAcik(false); setBildirim("Kamera açılamadı — barkodun fotoğrafını çekebilir ya da kodu yazabilirsiniz.") }
    })()
    return () => { dur = true; akis?.getTracks().forEach((t) => t.stop()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barkodAcik])

  const yuklemede = ogeler.some((o) => o.durum === "yukleniyor" || o.durum === "siniflaniyor")
  const gorselVar = ogeler.some((o) => o.tur && GORSEL_TURLERI.includes(o.tur) && o.gorselB64)

  const btn = (ana?: boolean): React.CSSProperties => ({ padding: "14px 18px", minHeight: 48, borderRadius: 12, border: ana ? "none" : `1px solid ${CHROME_RENK.border}`, background: ana ? CHROME_RENK.pine : "#fff", color: ana ? "#fff" : CHROME_RENK.ink, fontSize: 15, fontWeight: ana ? 600 : 500, cursor: "pointer", fontFamily: CHROME_FONT.sans })

  return (
    <div style={{ background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 20, padding: 20, fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink }}>
      <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 22, marginBottom: 4 }}>Ekleri Ekle</div>
      <div style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 14 }}>Muayeneyle ilgili tahlil, aşı, görüntü ya da fotoğrafları ekleyin. Hepsi bu muayeneye bağlanır; eklemeden de devam edebilirsiniz.</div>

      {hata && <div role="alert" style={{ background: "#fdf1ec", color: CHROME_RENK.warn, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 }}>{hata}</div>}

      {hatirlaticilar.map((h) => (
        <div key={h.kod} style={{ background: "#fff8e8", border: `1px solid ${CHROME_RENK.gold}`, borderRadius: 12, padding: 12, marginBottom: 10, fontSize: 14 }}>
          <div style={{ marginBottom: 8 }}>{h.mesaj}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={{ ...btn(), minHeight: 40, padding: "8px 14px" }} onClick={() => (h.kod === "barkod" ? setBarkodAcik(true) : dosyaRef.current?.click())}>Yükle</button>
            <button style={{ ...btn(), minHeight: 40, padding: "8px 14px", color: CHROME_RENK.muted }} onClick={() => setKapatilan((k) => [...k, h.kod])}>Şimdi değil</button>
          </div>
        </div>
      ))}

      <div
        onDragOver={(e) => { e.preventDefault(); setSurukle(true) }} onDragLeave={() => setSurukle(false)}
        onDrop={(e) => { e.preventDefault(); setSurukle(false); ekle(Array.from(e.dataTransfer.files), "dosya") }}
        style={{ border: `2px dashed ${surukle ? CHROME_RENK.pine : CHROME_RENK.gold}`, borderRadius: 14, padding: 18, textAlign: "center", background: surukle ? "#eef3ea" : "#fff", marginBottom: 10 }}>
        <div style={{ fontSize: 14, color: CHROME_RENK.muted, marginBottom: 10 }}>Dosyaları buraya bırakın ya da seçin</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={btn()} onClick={() => dosyaRef.current?.click()}>Dosya seç</button>
          <button style={btn()} onClick={() => kameraRef.current?.click()}>Fotoğraf çek</button>
          <button style={btn()} onClick={() => setBarkodAcik(true)}>Barkod okut</button>
        </div>
        <input ref={dosyaRef} type="file" multiple accept="application/pdf,image/*,.csv,.xlsx,.xls,.txt" style={{ display: "none" }}
          onChange={(e) => { ekle(Array.from(e.target.files || []), "dosya"); e.target.value = "" }} />
        <input ref={kameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
          onChange={(e) => {
            const barkodMu = e.target.getAttribute("data-barkod") === "1"
            e.target.removeAttribute("data-barkod")
            ekle(Array.from(e.target.files || []), barkodMu ? "barkod" : "kamera", barkodMu ? "asi" : null); e.target.value = ""
            if (barkodMu) setBarkodAcik(false)
          }} />
      </div>

      {barkodAcik && (
        <div style={{ background: "#fff", border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
          {bdSupported ? (
            <video ref={videoRef} playsInline muted style={{ width: "100%", maxHeight: 260, borderRadius: 8, background: "#000" }} />
          ) : (
            <div style={{ fontSize: 14, marginBottom: 8 }}>Bu cihaz canlı barkod okumayı desteklemiyor. Barkodun net bir fotoğrafını çekin; Ayşe etiketi okuyacak. Okuyucunuz varsa kodu aşağıya da yazabilirsiniz.</div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {!bdSupported && <button style={btn()} onClick={() => { kameraRef.current?.setAttribute("data-barkod", "1"); kameraRef.current?.click() }}>Barkodu fotoğrafla</button>}
            <input value={barkodYazi} onChange={(e) => setBarkodYazi(e.target.value)} placeholder="Barkodu yazın veya okutun" aria-label="Barkod"
              style={{ flex: 1, minWidth: 160, fontSize: 16, padding: 10, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 8 }}
              onKeyDown={(e) => { if (e.key === "Enter") { void barkodDosyasi(barkodYazi); setBarkodYazi(""); setBarkodAcik(false) } }} />
            <button style={btn()} onClick={() => { void barkodDosyasi(barkodYazi); setBarkodYazi(""); setBarkodAcik(false) }}>Ekle</button>
            <button style={{ ...btn(), color: CHROME_RENK.muted }} onClick={() => setBarkodAcik(false)}>Kapat</button>
          </div>
        </div>
      )}

      {bildirim && <div role="status" style={{ fontSize: 14, color: CHROME_RENK.warn, marginBottom: 10 }}>{bildirim}</div>}

      {ogeler.map((o) => (
        <div key={o.key} style={{ background: "#fff", border: `1px solid ${CHROME_RENK.border}`, borderRadius: 12, padding: 12, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
            <div style={{ fontSize: 15, fontWeight: 600, overflowWrap: "anywhere" }}>{o.ad}</div>
            <div style={{ fontSize: 13, color: CHROME_RENK.muted, whiteSpace: "nowrap" }}>{durumMetni(o)}</div>
          </div>
          {o.durum === "yukleniyor" && <div style={{ height: 6, background: "#eee", borderRadius: 3, marginTop: 8 }}><div style={{ width: `${o.yuzde}%`, height: 6, background: CHROME_RENK.pine, borderRadius: 3 }} /></div>}
          {o.durum === "yukleme_hata" && <div style={{ fontSize: 13, color: CHROME_RENK.warn, marginTop: 6 }}>{o.hata}</div>}
          {o.durum === "tur_sor" && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Bu nedir?</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[...(o.adaylar || []).map((a) => a.tur).slice(0, 3), ...EK_TURLERI.filter((t) => t === "diger")].filter((t, i, a) => a.indexOf(t) === i).map((t) => (
                  <button key={t} style={{ ...btn(), minHeight: 44, padding: "8px 14px" }} onClick={() => turSec(o, t)}>{EK_TUR_ETIKETI[t]}</button>
                ))}
              </div>
            </div>
          )}
          {o.tur && o.durum !== "tur_sor" && o.durum !== "yukleniyor" && (
            <div style={{ marginTop: 6, fontSize: 13, color: CHROME_RENK.muted }}>
              {EK_TUR_ETIKETI[o.tur]} ·{" "}
              <select aria-label="Türü değiştir" value={o.tur} onChange={(e) => turSec(o, e.target.value as EkTuru)} disabled={calisiyor}
                style={{ fontSize: 14, padding: 4, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 6 }}>
                {EK_TURLERI.map((t) => <option key={t} value={t}>{EK_TUR_ETIKETI[t]}</option>)}
              </select>
            </div>
          )}
          {o.sonuc && o.durum === "tamam" && (
            <div style={{ marginTop: 8, fontSize: 14 }}>
              {o.sonuc.ozet && <div style={{ marginBottom: 4 }}>{o.sonuc.ozet}</div>}
              {o.sonuc.uyarilar.map((u, i) => <div key={i} style={{ color: CHROME_RENK.warn }}>! {u}</div>)}
              <button style={{ ...btn(), minHeight: 36, padding: "6px 12px", fontSize: 13, marginTop: 6 }} onClick={() => void degerlendirOge(o.key, true)} disabled={calisiyor}>Yeniden değerlendir</button>
            </div>
          )}
          {(o.durum === "hata" || o.durum === "atlandi") && o.hata && (
            <div style={{ marginTop: 6, fontSize: 13, color: CHROME_RENK.warn }}>{o.hata}</div>
          )}
          {o.durum === "hata" && <button style={{ ...btn(), minHeight: 40, padding: "8px 14px", marginTop: 6 }} onClick={() => void degerlendirOge(o.key, true)}>Yeniden dene</button>}
          {asiBekliyor && o.durum === "tamam" && o.tur === "asi" && o.asiSatirlari && (
            <AsiKart o={o} guncelle={guncelle} />
          )}
        </div>
      ))}

      {gorselVar && (
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, margin: "10px 0" }}>
          <input type="checkbox" checked={kimliksiz} onChange={(e) => setKimliksiz(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2 }} />
          <span>Röntgen / EKG / fotoğraflarda hasta adı ya da kimlik bilgisi görünmüyor (görüntü yalnızca bu onayla değerlendirilir).</span>
        </label>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        {asiBekliyor ? (
          <button style={{ ...btn(true), flex: 2 }} onClick={() => { void karneYaz().finally(() => devamEt(true)) }}>Raporu Oluştur</button>
        ) : (
          <button style={{ ...btn(true), flex: 2, opacity: calisiyor ? 0.7 : 1 }} disabled={calisiyor} onClick={() => void degerlendirVeOlustur()}>
            {calisiyor ? "Değerlendiriliyor…" : ogeler.length ? "Değerlendir ve Raporu Oluştur" : "Raporu Oluştur"}
          </button>
        )}
        {calisiyor ? (
          <button style={{ ...btn(), flex: 1 }} onClick={atlaVeOlustur}>Kalanları atla ve raporu oluştur</button>
        ) : (
          ogeler.length > 0 && <button style={{ ...btn(), flex: 1 }} onClick={() => onDevam(null)}>Ekler olmadan oluştur</button>
        )}
      </div>
      {yuklemede && <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 8 }}>Yüklemeler sürüyor; bitmeyenler rapora girmez.</div>}
    </div>
  )
}

function durumMetni(o: Oge): string {
  switch (o.durum) {
    case "yukleniyor": return `Yükleniyor %${o.yuzde}`
    case "yukleme_hata": return "Yüklenemedi"
    case "siniflaniyor": return "Türü anlaşılıyor…"
    case "tur_sor": return "Tür seçin"
    case "hazir": return "Hazır"
    case "degerlendiriliyor": return "Değerlendiriliyor…"
    case "tamam": return "Değerlendirildi"
    case "hata": return "Değerlendirilemedi"
    case "atlandi": return "Atlandı"
  }
}

function AsiKart({ o, guncelle }: { o: Oge; guncelle: (key: string, y: Partial<Oge>) => void }) {
  const satirlar = o.asiSatirlari || []
  const degistir = (i: number, y: Partial<EkAsiSatiri>) => guncelle(o.key, { asiSatirlari: satirlar.map((s, j) => (j === i ? { ...s, ...y } : s)) })
  return (
    <div style={{ marginTop: 10, borderTop: `1px solid ${CHROME_RENK.border}`, paddingTop: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Aşı bilgisini kontrol edin</div>
      {satirlar.map((s, i) => (
        <div key={s.anahtar + i} style={{ display: "grid", gap: 6, marginBottom: 8 }}>
          <input aria-label="Aşı adı" value={s.asiAdi} onChange={(e) => degistir(i, { asiAdi: e.target.value, okunamadi: false })} placeholder="Aşı adı" style={{ fontSize: 16, padding: 10, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 8 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input aria-label="Doz" type="number" min={1} max={9} value={s.dozNo ?? ""} onChange={(e) => degistir(i, { dozNo: e.target.value ? Number(e.target.value) : null })} placeholder="Doz" style={{ width: 70, fontSize: 16, padding: 10, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 8 }} />
            <input aria-label="Tarih" type="date" value={s.uygulamaTarihi || ""} onChange={(e) => degistir(i, { uygulamaTarihi: e.target.value || null })} style={{ fontSize: 16, padding: 10, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 8 }} />
            <select aria-label="Kayıt türü" value={s.kaynakTuru} onChange={(e) => degistir(i, { kaynakTuru: e.target.value as "bu_muayene" | "karne" })} style={{ fontSize: 15, padding: 10, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 8 }}>
              <option value="bu_muayene">Bu muayenede yapıldı</option>
              <option value="karne">Geçmiş kayıt (karne)</option>
            </select>
          </div>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted }}>{s.eslesme}{s.neden ? ` · ${s.neden}` : ""}</div>
        </div>
      ))}
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
        <input type="checkbox" checked={!!o.asiOnay} onChange={(e) => guncelle(o.key, { asiOnay: e.target.checked })} style={{ width: 20, height: 20 }} />
        <span>Bu aşı bilgilerini onaylıyorum</span>
      </label>
      <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>Onay vermezseniz hiçbir aşı kaydı yazılmaz. Karneye yazılanlar hemen, bu muayenedekiler notu onayladığınızda işlenir.</div>
    </div>
  )
}
