/**
 * DOZ-KAYDI-ISTEGE-BAGLI (Kaan, 2026-11-26: "Go ahead and make the change.") — reminders are the core of Doz Takvimi;
 * logging doses is optional. CORE: every one of the 30 medical branches and the 10 Özel Branşlar.
 *
 * Why: reminders help adherence, but most patients stop logging within weeks. Treating an unlogged dose as "missed"
 * showed doctors false non-adherence ("İlaç uyumu düşük — N doz alınmadı" when the patient simply did not tap).
 *
 *   - per medicine, the patient logs ('acik') or gets reminders only ('kapali'); effective value (etkinKayit):
 *       own choice for that medicine → doctor-flagged kritik medicine = logging requested → the one-time answer
 *       ("Dozlarınızı işaretlemek ister misiniz?") → reminder only (nobody is made to log by default).
 *   - slot / adherence math lives in dozPlani.ts (unlogged = 'kayit_yok', only "Atladım" counts as not taken).
 *   - texts here never say "almadı": the doctor reads "kayıt yok" or "Atladım" — facts, never a judgement.
 *   - part 2 (Kaan, 2026-11-26 11:06 ET: "some might be bothered") — reminders are optional too. The one-time question
 *     has three answers (DozSecimi). Until it is answered reminders stay ON (research-backed default) and both the Bugün
 *     card and every dose push carry a plain "Hatırlatmaları kapat". Per medicine: Hatırlat on/off, İşaretle on/off;
 *     globally: Tercihler › Hatırlatmalar (ev_tercihler.hatirlatma_acik). Off = no push for those doses and no two-day
 *     nudge to the patient; the plan is never deleted. A kritik medicine may be switched off too (the patient's choice):
 *     one gentle sentence why the doctor marked it, and a neutral note on the doctor's card — no nagging.
 * Pure, no I/O.
 */
import type { DozPlani, DozSecimi, EvTercihler, KayitTutma } from './tipler'
import type { IkiGunNedeni } from './dozPlani'
import { gunEkle, trGun } from './zaman'

export function etkinKayit(kendi: KayitTutma | null | undefined, kritik: boolean, varsayilan: KayitTutma | null | undefined): boolean {
  if (kendi) return kendi === 'acik'
  if (kritik) return true
  return varsayilan === 'acik'
}

/** Sets the effective kayitAcik on every plan from its own choice, the kritik flag and the patient's one-time answer. */
export function kayitTercihiUygula<T extends DozPlani>(planlar: T[], varsayilan: KayitTutma | null | undefined): T[] {
  return planlar.map((p) => ({ ...p, kayitAcik: etkinKayit(p.kayitTutma, p.kritik, varsayilan) }))
}

export const DOZ_SECIMLERI: readonly DozSecimi[] = ['hatirlat_isaretle', 'sadece_hatirlat', 'istemiyorum']

/** What each one-time answer stores: the logging default and the global reminder switch. */
export function dozSecimiEtkisi(secim: DozSecimi): { dozKaydi: KayitTutma; hatirlatmaAcik: boolean } {
  if (secim === 'hatirlat_isaretle') return { dozKaydi: 'acik', hatirlatmaAcik: true }
  if (secim === 'sadece_hatirlat') return { dozKaydi: 'kapali', hatirlatmaAcik: true }
  return { dozKaydi: 'kapali', hatirlatmaAcik: false }
}

/**
 * Show the one-time question? Only while it is unanswered (no doz_secimi and no logging answer from part 1) and the
 * patient has at least one active scheduled medicine. Asked once: answering — or "Hatırlatmaları kapat" — closes it.
 */
export function kayitSorusuGosterilsinMi(planlar: DozPlani[], t: Pick<EvTercihler, 'dozKaydi' | 'dozSecimi'> & { hatirlatmaAcik?: boolean }): boolean {
  // Answered — or reminders already switched off in Tercihler (no point asking about them again).
  if (t.dozSecimi || t.dozKaydi || t.hatirlatmaAcik === false) return false
  return planlar.some((p) => p.aktif && !p.gerektikce)
}

/** Does this medicine get reminders? Global switch AND its own switch (absent = on). */
export function hatirlatmaAcikMi(p: Pick<DozPlani, 'hatirlatmaAcik'>, t: Pick<EvTercihler, 'hatirlatmaAcik'> | null | undefined): boolean {
  return (t?.hatirlatmaAcik ?? true) !== false && p.hatirlatmaAcik !== false
}

/** The doctor-side "kritik_ilac" alert for one medicine (cron + demo share it). veri.neden drives the card sentence. */
export function kritikIlacKurali(p: Pick<DozPlani, 'id' | 'ad'>, neden: IkiGunNedeni) {
  const kayitYok = neden === 'kayit_yok'
  return {
    kural: 'kritik_ilac',
    anahtar: `kritik_ilac:${p.id}`,
    duzey: 'hekime_bildir' as const,
    metrik: 'ilac',
    hastaMetni: kayitYok
      ? `${p.ad} için iki gündür kayıt yok. Doktorunuza bildirdik. Aldıysanız Doz Takvimi'nden işaretleyebilirsiniz; ilacınızı bıraktıysanız ya da bir sorun yaşıyorsanız Mesajlar'dan yazın.`
      : `${p.ad} için iki gündür "Atladım" işaretlediniz. Doktorunuza bildirdik. Bir sorun yaşıyorsanız Mesajlar'dan yazın.`,
    hekimMetni: kayitYok
      ? `Kritik ilaç "${p.ad}": 2 gündür kayıt yok (hasta bu ilaç için doz kaydı tutuyor).`
      : `Kritik ilaç "${p.ad}": hasta son 2 günde dozları "Atladım" olarak işaretledi.`,
    veri: { planId: p.id, neden },
  }
}

/** Patient push for the two-day rule — only for a medicine the patient logs (never for reminder-only), no PHI. */
export function hastaIkiGunPushMetni(n: number): string {
  return n > 1
    ? `${n} ilacınız için iki gündür kayıt yok. Unuttuysanız sorun değil — bugün yeniden başlayabilirsiniz.`
    : 'Bir ilacınız için iki gündür kayıt yok. Unuttuysanız sorun değil — bugün yeniden başlayabilirsiniz.'
}

/** The plain "Hatırlatmaları kapat" action carried by dose pushes until the patient answered the one-time question. It
 *  opens Tercihler at the reminder switch (portal-relative path; the worker prefixes the patient's own link). */
export const HATIRLATMA_KAPAT_EYLEMI = { eylem: 'hatirlatma-kapat', baslik: 'Hatırlatmaları kapat', yol: '/tercihler?hatirlatma=kapat' } as const

/** Dose-time push (lock screen: no drug name, no dose). Logging patients are invited to tap "Aldım"; others just reminded. */
export function dozHatirlatmaMetni(o: { saat: string; sayi: number; kayitli: number; ertele: boolean }): { baslik: string; govde: string } {
  const baslik = o.ertele ? 'Ertelediğiniz ilaç' : `İlaç saati · ${o.saat}`
  if (o.kayitli > 0) return { baslik, govde: o.sayi > 1 ? `${o.sayi} ilacınızın zamanı geldi. Aldıysanız "Aldım"a dokunabilirsiniz.` : 'İlacınızın zamanı geldi. Aldıysanız "Aldım"a dokunabilirsiniz.' }
  return { baslik, govde: o.sayi > 1 ? `${o.sayi} ilacınızın zamanı geldi.` : 'İlacınızın zamanı geldi.' }
}

// ─── founder usage metrics (counts only, no PHI) ────────────────────────────────────────────────────────────────

export interface DozKaydiKullanimi {
  olusturma: string
  /** Patients with at least one active scheduled medicine. */
  hastaSayisi: number
  /** Logging default (part 1 answer). */
  tercih: { acik: number; kapali: number; secilmedi: number }
  /** The three-option answer (part 2) + patients with reminders switched off globally / for at least one medicine. */
  secim: { hatirlat_isaretle: number; sadece_hatirlat: number; istemiyorum: number; secilmedi: number }
  hatirlatma: { globalKapali: number; ilacKapaliHasta: number; ilacKapali: number; kritikKapali: number }
  /** Patients with at least one medicine logged (effective). */
  kayitTutanHasta: number
  /** Medicines: logged / reminder-only, and how many of the logged ones are kritik (logging requested by the doctor). */
  ilac: { kayitli: number; hatirlatma: number; kritikKayitli: number }
  /** Last 4 complete-or-current Türkiye weeks (Monday start), oldest first. Hastalar: patients by doses marked that week. */
  haftalar: Array<{ hafta: string; isaretleyenHasta: number; alindi: number; atlandi: number; hastalar: { sifir: number; birAlti: number; yediOnUc: number; ondortUstu: number } }>
  /** First dose record ever (any patient) — the 2-week review clock starts here. */
  ilkKayit: string | null
}

const pazartesi = (gun: string) => gunEkle(gun, -((new Date(`${gun}T00:00:00Z`).getUTCDay() + 6) % 7))

/**
 * Aggregates rows to counts. Input rows carry only ids (never shown), flags and timestamps; output has no id at all.
 * Hastalar buckets: doses marked in that week — 0, 1–6, 7–13, 14+.
 */
export function dozKaydiKullanimiHesapla(g: {
  planlar: Array<{ doctor_id: string; patient_id: string; kritik: boolean | null; kayit_tutma: string | null; hatirlatma_acik?: boolean | null }>
  tercihler: Array<{ doctor_id: string; patient_id: string; doz_kaydi: string | null; doz_secimi?: string | null; hatirlatma_acik?: boolean | null }>
  kayitlar: Array<{ doctor_id: string; patient_id: string; durum: string; kayit_at: string }>
  ilkKayit: string | null
  simdiMs: number
}): DozKaydiKullanimi {
  const tercih = new Map(g.tercihler.map((t) => [`${t.doctor_id}|${t.patient_id}`, t.doz_kaydi === 'acik' || t.doz_kaydi === 'kapali' ? t.doz_kaydi : null]))
  const hastalar = new Set<string>()
  const kayitTutan = new Set<string>()
  const ilac = { kayitli: 0, hatirlatma: 0, kritikKayitli: 0 }
  const tRow = new Map(g.tercihler.map((x) => [`${x.doctor_id}|${x.patient_id}`, x]))
  const hat = { globalKapali: 0, ilacKapaliHasta: 0, ilacKapali: 0, kritikKapali: 0 }
  const ilacKapaliHasta = new Set<string>()
  for (const p of g.planlar) {
    const k = `${p.doctor_id}|${p.patient_id}`
    hastalar.add(k)
    if (p.hatirlatma_acik === false) { hat.ilacKapali++; ilacKapaliHasta.add(k); if (p.kritik) hat.kritikKapali++ }
    const kendi = p.kayit_tutma === 'acik' || p.kayit_tutma === 'kapali' ? p.kayit_tutma : null
    if (etkinKayit(kendi, !!p.kritik, (tercih.get(k) as KayitTutma | null | undefined) ?? null)) { ilac.kayitli++; kayitTutan.add(k); if (p.kritik) ilac.kritikKayitli++ } else ilac.hatirlatma++
  }
  const t = { acik: 0, kapali: 0, secilmedi: 0 }
  const secim = { hatirlat_isaretle: 0, sadece_hatirlat: 0, istemiyorum: 0, secilmedi: 0 }
  for (const k of hastalar) {
    const v = tercih.get(k); if (v === 'acik') t.acik++; else if (v === 'kapali') t.kapali++; else t.secilmedi++
    const row = tRow.get(k)
    const sc = row?.doz_secimi
    if (sc === 'hatirlat_isaretle' || sc === 'sadece_hatirlat' || sc === 'istemiyorum') secim[sc]++; else secim.secilmedi++
    if (row?.hatirlatma_acik === false) hat.globalKapali++
  }
  hat.ilacKapaliHasta = ilacKapaliHasta.size
  const buHafta = pazartesi(trGun(g.simdiMs))
  const haftalar = [-21, -14, -7, 0].map((d) => gunEkle(buHafta, d)).map((hafta) => {
    const bit = gunEkle(hafta, 6)
    const sayac = new Map<string, number>()
    let alindi = 0, atlandi = 0
    for (const r of g.kayitlar) {
      const gun = trGun(r.kayit_at)
      if (gun < hafta || gun > bit || (r.durum !== 'alindi' && r.durum !== 'atlandi')) continue
      if (r.durum === 'alindi') alindi++; else atlandi++
      const k = `${r.doctor_id}|${r.patient_id}`
      sayac.set(k, (sayac.get(k) || 0) + 1)
    }
    const b = { sifir: 0, birAlti: 0, yediOnUc: 0, ondortUstu: 0 }
    for (const k of hastalar) { const n = sayac.get(k) || 0; if (!n) b.sifir++; else if (n < 7) b.birAlti++; else if (n < 14) b.yediOnUc++; else b.ondortUstu++ }
    return { hafta, isaretleyenHasta: sayac.size, alindi, atlandi, hastalar: b }
  })
  return { olusturma: new Date(g.simdiMs).toISOString(), hastaSayisi: hastalar.size, tercih: t, secim, hatirlatma: hat, kayitTutanHasta: kayitTutan.size, ilac, haftalar, ilkKayit: g.ilkKayit }
}
