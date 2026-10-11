/**
 * NOTYA-SES-SIRA-01 — the doctor's line belongs before the answer it caused.
 *
 * ElevenLabs can deliver the agent text (and the screen poll can paint it) before
 * the user transcript of the same turn. The question must be inserted in front of
 * that answer, never in front of the opening greeting, and never twice.
 *
 * NOTYA-SES-SIRA-02 (Kaan, 2026-10-03): on tek-beyin ElevenLabs the screen poll paints
 * the answer with no `olay`, and the user transcript arrives later — `olayYeri` then
 * appended the question AFTER the reply (screenshot: "iyiyim…" above "nasılsınız?").
 * When event ids cannot order the turn, a trailing AI block that is not preceded by a
 * user line is treated as an orphan reply and the question slots in front of it.
 */

/**
 * `sira`: the timeline key the floating panel and the saved history sort by. `soru`: on a reply painted by the
 * screen poll, the doctor line the server stored in front of it (NOTYA-AYSE-SAYI-SIRA-01).
 */
export type Balon = { role: 'user' | 'ai'; text: string; olay?: number; sira?: number; soru?: string }

/**
 * NOTYA-AYSE-SAYI-SIRA-01 (Kaan live, 2026-10-11 01:08 UTC) — the reply to the THIRD sentence of a voice
 * conversation was shown above that sentence.
 *
 * Two causes, both here:
 *   1. `yetimCevapYeri` can only see an orphan reply on the first turn. From the second turn on the trailing AI block
 *      starts right after a doctor line ([…, soru2, cevap2, cevap3]), so it answered "no orphan" and the late
 *      transcript of sentence 3 was appended AFTER its reply. The poll knows which doctor line each reply answers
 *      (the server stores the pair in order): the reply bubble now carries it (`soru`), and a late transcript of that
 *      same sentence goes in front of that reply — on any turn.
 *   2. A bubble put in front of a reply kept the `sira` of the moment it was created, i.e. a LATER one than the reply.
 *      The floating panel and the saved history sort by `sira`, so they showed the reply first even when the list was
 *      right. A bubble placed in front of later ones now takes a `sira` between its neighbours.
 */
const sozDuz = (s: string) => String(s || '').toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

/** The transcript the page received and the line the server stored are the same sentence (case, punctuation and a clipped edge aside). */
export function ayniSozMu(a: string, b: string): boolean {
  const x = sozDuz(a)
  const y = sozDuz(b)
  if (!x || !y) return false
  if (x === y) return true
  const kisa = x.length <= y.length ? x : y
  const uzun = x.length <= y.length ? y : x
  return kisa.length >= 12 && uzun.includes(kisa)
}

/** Index of the poll reply that answers `soz` and has no doctor line in front of it yet; null when there is none. */
export function sorusuzCevapYeri<T extends Balon>(prev: T[], soz: string): number | null {
  for (let i = prev.length - 1; i >= 0; i--) {
    const m = prev[i]
    if (m.role !== 'ai' || !m.soru || !ayniSozMu(m.soru, soz)) continue
    if (i > 0 && prev[i - 1].role === 'user') return null
    return i
  }
  return null
}

/** The bubble at `i` stands in front of later ones: its `sira` moves between its neighbours (no other bubble changes). */
export function siraAraya<T extends Balon>(liste: T[], i: number): T[] {
  const b = liste[i]
  const sonraki = liste[i + 1]
  if (!b || typeof b.sira !== 'number' || !sonraki || typeof sonraki.sira !== 'number' || b.sira < sonraki.sira) return liste
  const onceki = i > 0 ? liste[i - 1].sira : undefined
  const alt = typeof onceki === 'number' && onceki < sonraki.sira ? onceki : sonraki.sira - 1
  const kopya = liste.slice()
  kopya[i] = { ...b, sira: (alt + sonraki.sira) / 2 }
  return kopya
}

/**
 * Stored times of one voice turn: the doctor's line keeps ITS OWN time (the moment the sentence reached the server)
 * and the reply a strictly later one. Before, both were stamped with the same instant when the reply was written.
 */
export function turZamanlari(soruZamani: string, simdi: Date = new Date()): { soru: string; cevap: string } {
  const s = simdi.toISOString()
  const t = Date.parse(soruZamani)
  if (!Number.isFinite(t)) return { soru: s, cevap: new Date(simdi.getTime() + 1).toISOString() }
  const soru = new Date(Math.min(t, simdi.getTime())).toISOString()
  return { soru, cevap: s > soru ? s : new Date(Date.parse(soru) + 1).toISOString() }
}

function olayYeri<T extends Balon>(prev: T[], olay: number | undefined): number {
  if (olay == null) return prev.length
  for (let i = 0; i < prev.length; i++) {
    const e = prev[i].olay
    if (typeof e === 'number' && e > olay) return i
  }
  return prev.length
}

/**
 * Start index of a trailing AI reply that arrived before its user transcript.
 * Keeps the opening greeting; does not pull a new question in front of a finished turn.
 */
export function yetimCevapYeri<T extends Balon>(prev: T[]): number | null {
  let i = prev.length - 1
  if (i < 0 || prev[i].role !== 'ai') return null
  let bas = i
  while (bas > 0 && prev[bas - 1].role === 'ai') bas--
  if (bas === 0) return prev.length >= 2 ? 1 : null
  if (prev[bas - 1].role === 'user') return null
  return bas
}

/** Two model generations of the same isolation (or a cut + replay) start the same way. */
export function benzerCevapMi(a: string, b: string): boolean {
  const n = (s: string) => String(s || '').replace(/\s+/g, ' ').trim()
  const x = n(a)
  const y = n(b)
  if (!x || !y) return false
  if (x === y) return true
  const kisa = x.length <= y.length ? x : y
  const uzun = x.length <= y.length ? y : x
  if (kisa.length < 48) return false
  if (uzun.startsWith(kisa.slice(0, Math.min(72, kisa.length)))) return true
  // Aynı büyüme cevabı: kilo/boy/baş çevresi sayıları örtüşüyorsa ikinci balon açma.
  const sayilar = (s: string) => (s.match(/\d+[.,]?\d*/g) || []).slice(0, 8).join('|')
  const sx = sayilar(x)
  const sy = sayilar(y)
  if (sx && sx === sy && sx.split('|').length >= 3 && kisa.length >= 80) return true
  // NOTYA-SES-TEK-CEVAP-01: 24 ay / vizit özeti gibi uzun klinik cevaplar farklı girişle
  // başlar ama aynı bölümleri tekrarlar — önek yetmez; token + başlık örtüşmesi bak.
  if (kisa.length >= 120) {
    const tok = (s: string) =>
      s
        .toLocaleLowerCase('tr-TR')
        .split(/[^a-zçğıöşü0-9]+/i)
        .filter((w) => w.length > 2)
    const A = tok(x)
    const B = tok(y)
    if (A.length >= 20 && B.length >= 20) {
      const setA = new Set(A)
      const setB = new Set(B)
      let inter = 0
      for (const t of setA) if (setB.has(t)) inter++
      const union = setA.size + setB.size - inter
      if (union > 0 && inter / union >= 0.52) return true
    }
    const baslik = (s: string) =>
      (s.match(/\*\*[^*]{2,40}\*\*|^[A-ZÇĞİÖŞÜa-zçğıöşü][^:\n]{2,28}:/gm) || [])
        .map((h) => h.replace(/\*/g, '').replace(/:$/, '').trim().toLocaleLowerCase('tr-TR'))
        .filter(Boolean)
    const hx = new Set(baslik(x))
    const hy = new Set(baslik(y))
    if (hx.size >= 3 && hy.size >= 3) {
      let ortak = 0
      for (const h of hx) if (hy.has(h)) ortak++
      if (ortak >= 3) return true
    }
  }
  return false
}

/** A late user transcript slots in before the reply, not after it and not before the greeting. */
export function kullaniciEkle<T extends Balon>(
  prev: T[],
  text: string,
  olay: number | undefined,
  ekle: (role: 'user' | 'ai', text: string, olay?: number) => T,
): T[] {
  const t = String(text || '').trim()
  if (!t) return prev
  const ayni = prev.findIndex((m) => m.role === 'user' && m.text === t && (olay == null || m.olay == null || m.olay === olay))
  if (ayni !== -1) {
    let hedef = ayni
    if (olay != null) {
      for (let i = 0; i < ayni; i++) {
        const e = prev[i].olay
        if (typeof e === 'number' && e > olay) { hedef = i; break }
      }
    }
    const rest = prev.filter((_, i) => i !== ayni)
    if (hedef === ayni) {
      const yetim = yetimCevapYeri(rest)
      if (yetim != null) hedef = yetim
    }
    const damga = prev[ayni].olay ?? olay
    if (hedef === ayni && prev[ayni].olay === damga) return prev
    const msg = { ...prev[ayni], olay: damga }
    return siraAraya([...rest.slice(0, hedef), msg, ...rest.slice(hedef)], hedef)
  }
  const msg = ekle('user', t, olay)
  let at = olayYeri(prev, olay)
  // NOTYA-SES-SIRA-02: no usable event order (poll AI has no olay) → still put the question before the orphan reply.
  if (at >= prev.length) {
    // NOTYA-AYSE-SAYI-SIRA-01: the reply that answers THIS sentence is already on screen → in front of it, on any turn.
    const yetim = sorusuzCevapYeri(prev, t) ?? yetimCevapYeri(prev)
    if (yetim != null) at = yetim
  }
  return siraAraya([...prev.slice(0, at), msg, ...prev.slice(at)], at)
}

/**
 * Screen answer from the session poll. `soru` is the doctor line stored just
 * before it. If the answer is already on screen and the question is missing or
 * sitting after it, the question moves in front.
 */
export function cevapEkle<T extends Balon>(
  prev: T[],
  soru: string | null,
  cevap: string,
  ekle: (role: 'user' | 'ai', text: string) => T,
  /**
   * NOTYA-AYSE-SAYI-SIRA-01: the stored doctor line this reply answers, when it is a real sentence. Recorded on the
   * reply bubble only — no doctor bubble is made from it (on ElevenLabs the transcript is the one source of that
   * bubble, NOTYA-SES-ESKI-01) — so that a transcript arriving after the reply finds its place in front of it.
   */
  cevaplanan: string | null = null,
): T[] {
  const c = String(cevap || '').trim()
  if (!c) return prev
  const s = String(soru || '').trim()
  let next = prev.slice()
  const cevapIndeksi = () => {
    for (let i = next.length - 1; i >= 0; i--) if (next[i].role === 'ai' && next[i].text === c) return i
    return -1
  }
  if (s) {
    let ci = cevapIndeksi()
    const ui = next.findIndex((m) => m.role === 'user' && m.text === s)
    if (ci >= 0 && ui > ci) {
      const [u] = next.splice(ui, 1)
      ci = cevapIndeksi()
      next.splice(ci, 0, u)
      next = siraAraya(next, ci)
    } else if (ui === -1) {
      const u = ekle('user', s)
      ci = cevapIndeksi()
      if (ci >= 0) { next.splice(ci, 0, u); next = siraAraya(next, ci) }
      else next.push(u)
    }
  }
  if (cevapIndeksi() === -1) {
    // NOTYA-BUYUME-KISA-01 / multi-reply: aynı klinik cevabın 2.–3. modeli (araya kullanıcı
    // satırı girse bile) yeni balon açmasın — son birkaç AI'ya bak.
    const sonAilar = next.filter((m) => m.role === 'ai').slice(-4)
    const etiket = String(cevaplanan || '').trim()
    if (!sonAilar.some((m) => benzerCevapMi(m.text, c))) next.push(etiket ? { ...ekle('ai', c), soru: etiket } : ekle('ai', c))
  }
  return next
}
