/**
 * NOTYA-CHECKPOINT-KARSILASTIRMA-01 — compare the corpus run at the 2026-09-27 checkpoint (commit ac947eef) with
 * today's run, entry by entry, and write docs/denetim/checkpoint-vs-bugun.md.
 *
 *   npm run denetim:checkpoint:karsilastir
 *
 * Inputs (both produced by the same corpus, the same fixture patients and the same verdict rules):
 *   .denetim-out/korpus-checkpoint.jsonl (+ .meta.json)   lib/asistan/tests/gokhanKorpus.kos.ts on this branch
 *   .denetim-out/bugun-korpus.jsonl                       today's main, live
 *
 * A measurement of the old build. It ranks what is worth FIXING on today's build; it proposes no return to the
 * old one. Re-run after the live checkpoint pass: every number and list below is computed, only the notes in
 * ACIKLAMALAR and KUMELER are written by hand.
 */
import fs from 'node:fs'
import path from 'node:path'

const KOK = process.cwd()
const CP_YOL = '.denetim-out/korpus-checkpoint.jsonl'
const META_YOL = '.denetim-out/korpus-checkpoint.meta.json'
const BUGUN_YOL = '.denetim-out/bugun-korpus.jsonl'
const CIKTI = 'docs/denetim/checkpoint-vs-bugun.md'
const CHECKPOINT = 'ac947eef'

type Cp = {
  id: string; surface: string; verdict: string; route: string | null; answer: string; mode: string
  kat: string; soz: string; kaynak: string; onceki: string[]; nedenler: string[]; hamKarar: string; yeni: string | null
  cagrilan: string[]; kartlar: { eylem: string }[]; hasta: string | null; acikKusur: string | null; hata: string
}
type Bugun = {
  id: string; yuzey: string; karar: string; rota: string | null; cevap: string; sozlu: string; kat: string; soz: string
  nedenler: string[]; acikKusur: string | null; hata: string; cagrilan: string[]
}

const oku = <T,>(yol: string): T[] => {
  const tam = path.join(KOK, yol)
  if (!fs.existsSync(tam)) { console.error(`Eksik girdi: ${yol}`); process.exit(1) }
  return fs.readFileSync(tam, 'utf8').split('\n').filter((s) => s.trim()).map((s) => JSON.parse(s) as T)
}
const cp = oku<Cp>(CP_YOL)
const bugun = oku<Bugun>(BUGUN_YOL)
const meta = fs.existsSync(path.join(KOK, META_YOL)) ? JSON.parse(fs.readFileSync(path.join(KOK, META_YOL), 'utf8')) as Record<string, any> : {}
const canli = cp.every((s) => s.mode === 'live')

const BUGUN_YUZEY: Record<string, string> = { yazi: 'chat', panel: 'panel', ses: 'voice' }
const bugunMetni = (s: Bugun) => s.hata || (s.yuzey === 'ses' ? [s.sozlu && `🔊 ${s.sozlu}`, s.cevap && s.cevap !== s.sozlu ? `🖥 ${s.cevap}` : ''].filter(Boolean).join(' ') : s.cevap) || '(empty)'
const bugunHarita = new Map(bugun.map((s) => [`${s.id}|${BUGUN_YUZEY[s.yuzey]}`, s]))
/** A checkpoint row and today's row for the same entry on the same surface. voice-el has no counterpart. */
const ciftler = cp.filter((s) => s.surface !== 'voice-el').map((c) => ({ c, b: bugunHarita.get(`${c.id}|${c.surface}`) })).filter((x): x is { c: Cp; b: Bugun } => Boolean(x.b))
const eslesmeyen = cp.filter((s) => s.surface !== 'voice-el' && !bugunHarita.has(`${s.id}|${s.surface}`))

/* ───────────────────────────── notes written by hand ───────────────────────────── */

/**
 * Why an entry that passed at the checkpoint fails today: the first commit between the checkpoint and origin/main
 * that explains it, found with `git log -S` on the code path named in `yol`. Keyed by entry id.
 */
const ACIKLAMALAR: Record<string, { commit: string; yol: string; neden: string }> = {
  'Y-021': {
    commit: '5573be8a', yol: 'lib/asistan/ayseCevapla.ts — sade("kayit")',
    neden: 'S5 "records on screen" (NOTYA-AYSE-GERI-05, 2026-10-01) introduced the model-free record tables. "Son ölçümleri neler?" is now taken by the anthropometry table (weight / height / head circumference), which runs before the quick card; the last visit\'s fever and blood pressure, which the quick card used to say, are no longer in the answer. `git log -S\'sade("kayit"\'` returns this commit only.',
  },
  'Y-080': {
    commit: '7661d7fc', yol: 'lib/asistan/konusmaBaglami.ts takipCoz → lib/asistan/ayseCevapla.ts calendar branch',
    neden: 'Conversation continuity (2026-09-30) rewrites a sentence said after a calendar turn with the previous turn\'s calendar intent; the calendar reader then answers with a day list and the named patient is ignored (the quick card answered from his chart at the checkpoint). ed94ef46 (same day, "next-day fallback") is the commit that makes the list tomorrow\'s. Found with `git log -S\'takipCoz(\'`; not bisected by running the intermediate commits.',
  },
  'T-025': {
    commit: '7661d7fc', yol: 'lib/asistan/konusmaBaglami.ts takipCoz → lib/asistan/ayseCevapla.ts calendar branch',
    neden: 'Same cause as Y-080: a named-patient appointment question right after "Bugün randevum var mı?" inherits the calendar intent and gets tomorrow\'s list (ed94ef46 adds the next-day fallback). Not bisected.',
  },
}

/**
 * Today's failures grouped by cause, for the ranking. `idler` are entry ids (or prefixes ending in "-").
 * The order of the ranking is computed (see siralama()); this table only says which entries belong together.
 */
const KUMELER: { ad: string; idler: string[]; kod: string; not: string }[] = [
  {
    ad: 'A named patient\'s appointment question after a calendar turn gets a day list', idler: ['Y-080', 'T-025'],
    kod: 'lib/asistan/konusmaBaglami.ts (takipCoz) + calendar branch of lib/asistan/ayseCevapla.ts',
    not: 'When the sentence names a patient, the calendar follow-up must not take it: answer from that chart\'s appointments (what the quick card did at the checkpoint). Fails on voice too.',
  },
  {
    ad: '"Son ölçümleri" lost the fever and blood pressure of the last visit', idler: ['Y-021'],
    kod: 'record-table branch of lib/asistan/ayseCevapla.ts (sade("kayit"))',
    not: 'The anthropometry table answers a question about the LAST measurements. Either keep the vitals of the last visit next to the table or leave "son ölçümleri" to the quick card. Fails on voice too.',
  },
  {
    ad: 'Measurement follow-ups read only the last visit ("kayıtlı boy ölçümü yok")', idler: ['T-042', 'T-044', 'L-DANIS-BOYU'],
    kod: 'record-table branch of lib/asistan/ayseCevapla.ts (single-measurement answer)',
    not: 'The chart has height and head circumference in earlier visits; the single-value answer looks at the last visit only and says none is recorded. At the checkpoint these went to the model: the live pass says whether it answered them.',
  },
  {
    ad: '"Annesinin boyu" answered with the child\'s height', idler: ['Y-023'],
    kod: 'record-table branch of lib/asistan/ayseCevapla.ts (measurement matcher)',
    not: 'The word "boy" is enough for the measurement route; a parent\'s height is an intake-form field. Fails on voice too.',
  },
  {
    ad: 'Cohort filters "aşı kaydı olan / ilaç kullanan hastalarım" return 0', idler: ['G-21', 'G-22'],
    kod: 'lib/doktor/hastaDosyaAra.ts (klinikAramaYurut)',
    not: 'Failed at the checkpoint too (then with a silent 90-day window, now without it): never worked. Ledger: NOTYA-ARAMA-PENCERE-VARSAYILAN-01.',
  },
  {
    ad: '"Doğum tarihi kayıtlı olmayan hastam var mı" is taken as an identity question', idler: ['G-24'],
    kod: 'lib/doktor/kimlikSorusu.ts (kimlikSorusu classifier)',
    not: 'Same answer at the checkpoint ("Hangi hastanın bilgisini istiyorsunuz?"): never worked.',
  },
  {
    ad: '"dün gelen ateşli çocuk" answered from the open chart\'s quick card', idler: ['Y-091'],
    kod: 'lib/asistan/ayseCevapla.ts (quick card before the cohort search)',
    not: 'Identical wrong answer at the checkpoint: never worked.',
  },
  {
    ad: 'Patient-file panel: summary without the name, growth without the last height, series without a table', idler: ['I-01', 'I-03', 'L-DANIS-SERI-2'],
    kod: 'app/api/doktor/konsult/route.ts',
    not: 'Model-written at both commits; the checkpoint panel prompt forbids the patient\'s name outright, so I-01 could not pass there either. Needs the live pass for I-03 and the series.',
  },
  {
    ad: 'İlk-10 vaccine answer: assertion false positive, not a product defect', idler: ['I-04'],
    kod: 'lib/asistan/tests/gokhanSikayetKorpusu.ts (I-04 pattern)',
    not: 'Today\'s answer is right: "Hepatit A 2. dozu planlanmış; uygulandığına dair kayıt bulamadım". The pattern `Hepatit A 2\\. doz[^.\\n]*uyguland` matches that negated sentence. Fix the pattern, not the product.',
  },
  {
    ad: 'A question ("Ventolini ne zaman kestik") makes the model call a read tool', idler: ['E-33'],
    kod: 'lib/asistan/ayseCevapla.ts (read tools offered on every turn)',
    not: 'The read tools did not exist at the checkpoint. The answer itself is right; the corpus expects no tool call on a question. Fails on voice too.',
  },
  {
    ad: '"kaç tane hasta kaydım var toplam" reaches the model instead of the count template', idler: ['Y-083'],
    kod: 'lib/doktor/hastaCozumleyici.ts (count matcher)',
    not: 'Today the model answers 5, which is right; only the route differs from the expectation. At the checkpoint the template answered "Kayıtlarda 0 hasta". Lowest priority.',
  },
]

/* ───────────────────────────── helpers ───────────────────────────── */

const hucre = (m: unknown, n = 200) => { const t = String(m ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n)}…` : t }
const KARARLAR = ['PASS', 'FAIL', 'MANUAL', 'NEW', 'NOT_JUDGED'] as const
const say = <T,>(liste: T[], al: (x: T) => string) => { const h: Record<string, number> = {}; for (const x of liste) h[al(x)] = (h[al(x)] || 0) + 1; return h }
const kumeUyar = (id: string, idler: string[]) => idler.some((x) => (x.endsWith('-') ? id.startsWith(x) : id === x))
const cumle = (c: { soz: string; onceki?: string[] }) => `${hucre(c.soz, 110)}${c.onceki?.length ? ` *(after: ${hucre(c.onceki.slice(-2).join(' → '), 90)})*` : ''}`

const b: string[] = []
b.push('# Old Ayşe vs today — Dr. Gökhan complaint corpus at the 2026-09-27 checkpoint', '')
b.push(`Checkpoint: commit \`${CHECKPOINT}\` (2026-09-27 11:00 EDT — the last main commit before the Meslektaş V2 cache, the Fish hybrid and the later routers; Luna-Pro brain, ElevenLabs voice). Today: \`origin/main\`, results in \`${BUGUN_YOL}\` / \`docs/denetim/bugun-korpus-rapor.md\`.`, '')
b.push('**This is a measurement of the old build, not a proposal to go back to it.** The product stays on Luna + Fish Audio. The purpose is to see which complaints the later work fixed, which it introduced, and what to fix next on today\'s build.', '')
if (!canli) {
  b.push('> **THE LIVE PASS WAS NOT RUN.** This environment has no provider credentials, so the checkpoint was run in STAND-IN mode: a stand-in answered instead of the model. What the stand-in run establishes is every turn the old build answered WITHOUT the model (identity, patient search / count template, quick card) and every structural fact (which step answered, which chart the turn was bound to). A turn whose words the model wrote is `NOT_JUDGED` here. Today\'s results are live. Run the live pass with the command at the end and re-run this script; every table below is recomputed.', '')
} else {
  b.push(`Checkpoint run: LIVE, model \`${meta.model ?? '?'}\`, guard refused (a sentence the primary cannot answer is a failure).`, '')
}
b.push(`Checkpoint run: ${meta.tarih ?? '?'}, ${meta.mode ?? (canli ? 'live' : 'stand-in')}, ${cp.length} graded turns from ${meta.korpus ?? '?'} corpus entries. Same corpus file (byte-identical to main's \`gokhanSikayetKorpusu.ts\`), same synthetic patients, same assertion code (\`beklentiDegerlendir\`).`, '')

/* ── 1. counts ── */
b.push('## 1. Counts on the surfaces both builds have', '')
b.push(`| surface | turns | checkpoint PASS | FAIL | MANUAL | NEW |${canli ? '' : ' not judged |'} today PASS | FAIL | MANUAL |`, `|---|---|---|---|---|---|${canli ? '' : '---|'}---|---|---|`)
const satirYaz = (ad: string, liste: { c: Cp; b: Bugun }[]) => {
  const c = say(liste, (x) => x.c.verdict), t = say(liste, (x) => x.b.karar)
  b.push(`| ${ad} | ${liste.length} | ${c.PASS || 0} | ${c.FAIL || 0} | ${c.MANUAL || 0} | ${c.NEW || 0} |${canli ? '' : ` ${c.NOT_JUDGED || 0} |`} ${t.PASS || 0} | ${t.FAIL || 0} | ${t.MANUAL || 0} |`)
}
for (const y of ['chat', 'panel']) satirYaz(y, ciftler.filter((x) => x.c.surface === y))
satirYaz('**both**', ciftler)
b.push('')
if (eslesmeyen.length) b.push(`${eslesmeyen.length} checkpoint turn(s) have no row in today's file and are left out: ${eslesmeyen.map((s) => `${s.id}/${s.surface}`).join(', ')}.`, '')
b.push('NEW = the entry expects a capability that did not exist at the checkpoint (a route, a fixed sentence, an action or the conversation-context record introduced later); it was still run and its answer is in section 6. Rule: `lib/asistan/tests/checkpointYetenek.ts`.', '')

const yeniOlmayan = ciftler.filter((x) => x.c.verdict !== 'NEW')
b.push('### The same entries only (NEW left out on both sides)', '')
b.push(`| surface | turns | checkpoint PASS | FAIL | MANUAL |${canli ? '' : ' not judged |'} today PASS | FAIL | MANUAL |`, `|---|---|---|---|---|${canli ? '' : '---|'}---|---|---|`)
for (const [ad, liste] of [['chat', yeniOlmayan.filter((x) => x.c.surface === 'chat')], ['panel', yeniOlmayan.filter((x) => x.c.surface === 'panel')], ['**both**', yeniOlmayan]] as const) {
  const c = say(liste, (x) => x.c.verdict), t = say(liste, (x) => x.b.karar)
  b.push(`| ${ad} | ${liste.length} | ${c.PASS || 0} | ${c.FAIL || 0} | ${c.MANUAL || 0} |${canli ? '' : ` ${c.NOT_JUDGED || 0} |`} ${t.PASS || 0} | ${t.FAIL || 0} | ${t.MANUAL || 0} |`)
}
b.push('')
const yeniler = ciftler.filter((x) => x.c.verdict === 'NEW')
const yt = say(yeniler, (x) => x.b.karar)
b.push(`The ${yeniler.length} NEW turns today: ${yt.PASS || 0} PASS, ${yt.FAIL || 0} FAIL, ${yt.MANUAL || 0} MANUAL.`, '')

b.push('### Verdict at the checkpoint × verdict today (chat + panel)', '')
b.push('| checkpoint ↓ / today → | PASS | FAIL | MANUAL |', '|---|---|---|---|')
for (const k of KARARLAR) {
  const l = ciftler.filter((x) => x.c.verdict === k)
  if (!l.length) continue
  const t = say(l, (x) => x.b.karar)
  b.push(`| ${k === 'NOT_JUDGED' ? 'not judged (stand-in)' : k} | ${t.PASS || 0} | ${t.FAIL || 0} | ${t.MANUAL || 0} |`)
}
b.push('')

/* ── voice ── */
const ses = cp.filter((s) => s.surface === 'voice-el')
const bugunSes = bugun.filter((s) => s.yuzey === 'ses')
b.push('### Voice — NOT compared', '')
b.push('The Fish voice route (`/api/asistan/fish-tur`) does not exist at the checkpoint. The voice of that build was ElevenLabs with a Custom LLM endpoint (`/api/asistan/ses-llm`), which CAN be driven in process with the transcript as text; it was run as a separate surface, `voice-el`, graded with the corpus\'s voice expectations. It is a different stack from today\'s voice (other recogniser, other speech engine, other turn-taking, a 5-sentence spoken cap), so the two rows below are side by side for reference only and no regression is derived from them.', '')
const sc = say(ses, (x) => x.verdict), st = say(bugunSes, (x) => x.karar)
b.push(`| surface | turns | PASS | FAIL | MANUAL | NEW |${canli ? '' : ' not judged |'}`, `|---|---|---|---|---|---|${canli ? '' : '---|'}`)
b.push(`| checkpoint voice-el (ElevenLabs Custom LLM, text in) | ${ses.length} | ${sc.PASS || 0} | ${sc.FAIL || 0} | ${sc.MANUAL || 0} | ${sc.NEW || 0} |${canli ? '' : ` ${sc.NOT_JUDGED || 0} |`}`)
b.push(`| today voice (Fish route, text in) | ${bugunSes.length} | ${st.PASS || 0} | ${st.FAIL || 0} | ${st.MANUAL || 0} | — |${canli ? '' : ' — |'}`)
b.push('')

/* ── routes ── */
b.push('### Which step answered (chat)', '')
const rc = say(cp.filter((s) => s.surface === 'chat'), (x) => x.route ?? '(none)'), rb = say(bugun.filter((s) => s.yuzey === 'yazi'), (x) => x.rota ?? '(none)')
b.push('| route | checkpoint turns | today turns |', '|---|---|---|')
for (const r of [...new Set([...Object.keys(rc), ...Object.keys(rb)])].sort()) b.push(`| ${r} | ${rc[r] || 0} | ${rb[r] || 0} |`)
b.push('', 'At the checkpoint the route is derived from what the turn did (the build logs none): `model` = a model request left the brain; `kimlik`, `arama`, `hizli-kart` = the three model-free answers that existed. `kapsam`, `takvim`, `gurultu`, `dosya-ac`, `kayit` were added later.', '')

/* ── 2. regressions ── */
const gerileme = ciftler.filter((x) => x.c.verdict === 'PASS' && x.b.karar === 'FAIL')
b.push(`## 2. PASSED at the checkpoint, FAIL today — regressions since 2026-09-27 (${gerileme.length} turn(s))`, '')
if (!canli) b.push('Stand-in run: this list can only contain turns the old build answered without the model, or whose expectation is purely structural. It is a lower bound; section 4 lists today\'s failures the stand-in could not judge.', '')
if (gerileme.length) {
  b.push('| id | surface | sentence | checkpoint: route → answer | today: route → answer | why it fails today | first commit that explains it |', '|---|---|---|---|---|---|---|')
  for (const { c, b: t } of gerileme) {
    const a = ACIKLAMALAR[c.id]
    b.push(`| ${c.id} | ${c.surface} | ${cumle(c)} | ${c.route ?? '—'} → ${hucre(c.answer, 180)} | ${t.rota ?? '—'} → ${hucre(bugunMetni(t), 180)} | ${hucre(t.nedenler.join('; '), 160)}${t.acikKusur ? ` *(ledger: ${t.acikKusur} open)*` : ''} | ${a ? `\`${a.commit}\` — ${hucre(a.neden, 400)} *(path: \`${a.yol}\`)*` : 'not determined'} |`)
  }
  b.push('')
} else b.push('None.', '')

/* ── 3. improvements ── */
const iyilesme = ciftler.filter((x) => x.c.verdict === 'FAIL' && x.b.karar === 'PASS')
b.push(`## 3. FAILED at the checkpoint, PASS today (${iyilesme.length} turn(s))`, '')
if (iyilesme.length) {
  b.push('| id | surface | sentence | checkpoint: route → answer | why it failed then | today: route → answer |', '|---|---|---|---|---|---|')
  for (const { c, b: t } of iyilesme) b.push(`| ${c.id} | ${c.surface} | ${cumle(c)} | ${c.route ?? '—'} → ${hucre(c.answer, 170)} | ${hucre(c.nedenler.join('; '), 170)} | ${t.rota ?? '—'} → ${hucre(bugunMetni(t), 170)} |`)
  b.push('')
} else b.push('None.', '')

/* ── 4. fails on both / undetermined ── */
const ikisiDe = ciftler.filter((x) => x.c.verdict === 'FAIL' && x.b.karar === 'FAIL')
b.push(`## 4. Today's other failures on chat and panel`, '')
b.push(`### FAIL at the checkpoint and FAIL today — never worked (${ikisiDe.length} turn(s))`, '')
if (ikisiDe.length) {
  b.push('| id | surface | sentence | checkpoint: route → answer | today: route → answer | why it fails today |', '|---|---|---|---|---|---|')
  for (const { c, b: t } of ikisiDe) b.push(`| ${c.id} | ${c.surface} | ${cumle(c)} | ${c.route ?? '—'} → ${hucre(c.answer, 160)} | ${t.rota ?? '—'} → ${hucre(bugunMetni(t), 160)} | ${hucre(t.nedenler.join('; '), 160)} |`)
  b.push('')
} else b.push('None.', '')
const belirsiz = ciftler.filter((x) => x.c.verdict === 'NOT_JUDGED' && x.b.karar === 'FAIL')
if (!canli) {
  b.push(`### FAIL today, NOT JUDGED at the checkpoint — the live pass decides whether these are regressions (${belirsiz.length} turn(s))`, '')
  if (belirsiz.length) {
    b.push('| id | surface | sentence | checkpoint route | today: route → answer | why it fails today |', '|---|---|---|---|---|---|')
    for (const { c, b: t } of belirsiz) b.push(`| ${c.id} | ${c.surface} | ${cumle(c)} | ${c.route ?? '—'} | ${t.rota ?? '—'} → ${hucre(bugunMetni(t), 170)} | ${hucre(t.nedenler.join('; '), 170)} |`)
    b.push('')
  } else b.push('None.', '')
}
const yeniFail = ciftler.filter((x) => x.c.verdict === 'NEW' && x.b.karar === 'FAIL')
b.push(`### FAIL today on a capability that is NEW since the checkpoint (${yeniFail.length} turn(s))`, '')
if (yeniFail.length) {
  b.push('| id | surface | sentence | new capability | today: route → answer | why it fails today |', '|---|---|---|---|---|---|')
  for (const { c, b: t } of yeniFail) b.push(`| ${c.id} | ${c.surface} | ${cumle(c)} | ${hucre(c.yeni, 110)} | ${t.rota ?? '—'} → ${hucre(bugunMetni(t), 160)} | ${hucre(t.nedenler.join('; '), 160)} |`)
  b.push('')
} else b.push('None.', '')

/* ── 5. ranking ── */
b.push('## 5. What is worth fixing first (today\'s build)', '')
b.push('Ranked by: (1) a regression — it worked at the checkpoint and fails today; (2) number of failing turns today on chat and panel; (3) failing voice turns as a tie-breaker. A cluster is one cause, so one fix.', '')
type KumeSatiri = { ad: string; kod: string; not: string; gerileme: number; fail: number; sesFail: number; cpDurum: string; idler: string[] }
const kumeSatirlari: KumeSatiri[] = KUMELER.map((k) => {
  const l = ciftler.filter((x) => kumeUyar(x.c.id, k.idler))
  const failler = l.filter((x) => x.b.karar === 'FAIL')
  const cpD = say(failler, (x) => x.c.verdict)
  return {
    ad: k.ad, kod: k.kod, not: k.not,
    gerileme: failler.filter((x) => x.c.verdict === 'PASS').length, fail: failler.length,
    sesFail: bugunSes.filter((s) => s.karar === 'FAIL' && kumeUyar(s.id, k.idler)).length,
    cpDurum: Object.entries(cpD).map(([d, n]) => `${n} ${d === 'NOT_JUDGED' ? 'not judged' : d}`).join(', ') || '—',
    idler: [...new Set([...failler.map((x) => x.c.id), ...bugunSes.filter((s) => s.karar === 'FAIL' && kumeUyar(s.id, k.idler)).map((s) => s.id)])],
  }
}).filter((k) => k.fail + k.sesFail > 0)
kumeSatirlari.sort((x, y) => (y.gerileme > 0 ? 1 : 0) - (x.gerileme > 0 ? 1 : 0) || y.fail - x.fail || y.sesFail - x.sesFail)
if (kumeSatirlari.length) {
  b.push('| # | what | entries | failing today (chat+panel / voice) | those turns at the checkpoint | code path | note |', '|---|---|---|---|---|---|---|')
  kumeSatirlari.forEach((k, n) => b.push(`| ${n + 1} | ${k.gerileme ? '**REGRESSION** — ' : ''}${k.ad} | ${k.idler.join(', ')} | ${k.fail} / ${k.sesFail} | ${k.cpDurum} | \`${k.kod}\` | ${hucre(k.not, 420)} |`))
  b.push('')
}
const kumesiz = ciftler.filter((x) => x.b.karar === 'FAIL' && !KUMELER.some((k) => kumeUyar(x.c.id, k.idler)))
if (kumesiz.length) b.push(`Not clustered (${kumesiz.length}): ${kumesiz.map((x) => `${x.c.id}/${x.c.surface}`).join(', ')}.`, '')
const sesKumesiz = bugunSes.filter((s) => s.karar === 'FAIL' && !KUMELER.some((k) => kumeUyar(s.id, k.idler)))
if (sesKumesiz.length) b.push(`Voice-only failures today outside the clusters (${sesKumesiz.length}; no checkpoint counterpart): ${[...new Set(sesKumesiz.map((s) => s.id))].join(', ')}.`, '')

/* ── 6. NEW ── */
b.push(`## 6. NEW since the checkpoint (${yeniler.length} chat + panel turn(s))`, '')
const gruplar = new Map<string, { c: Cp; b: Bugun }[]>()
for (const x of yeniler) { const k = String(x.c.yeni || '?'); gruplar.set(k, [...(gruplar.get(k) || []), x]) }
b.push('| capability that did not exist | turns | today PASS / FAIL / MANUAL | what the old build did with these sentences (route: turns) | entries |', '|---|---|---|---|---|')
for (const [neden, l] of [...gruplar.entries()].sort((x, y) => y[1].length - x[1].length)) {
  const t = say(l, (x) => x.b.karar), r = say(l, (x) => x.c.route ?? '(none)')
  b.push(`| ${hucre(neden, 160)} | ${l.length} | ${t.PASS || 0} / ${t.FAIL || 0} / ${t.MANUAL || 0} | ${Object.entries(r).map(([k, n]) => `${k}: ${n}`).join(', ')} | ${hucre([...new Set(l.map((x) => x.c.id))].join(', '), 500)} |`)
}
b.push('')

/* ── 7. every turn ── */
b.push('## 7. Every chat and panel turn', '')
b.push('| id | surface | sentence | checkpoint | route | answer at the checkpoint | today | route |', '|---|---|---|---|---|---|---|---|')
for (const { c, b: t } of ciftler) b.push(`| ${c.id} | ${c.surface} | ${hucre(c.soz, 90)} | ${c.verdict === 'NOT_JUDGED' ? 'not judged' : c.verdict === 'FAIL' ? '**FAIL**' : c.verdict} | ${c.route ?? '—'} | ${hucre(c.answer, 150)} | ${t.karar === 'FAIL' ? '**FAIL**' : t.karar} | ${t.rota ?? '—'} |`)
b.push('')
b.push('## 8. Every voice-el turn at the checkpoint (reference)', '')
b.push('| id | sentence | verdict | route | answer |', '|---|---|---|---|---|')
for (const c of ses) b.push(`| ${c.id} | ${hucre(c.soz, 90)} | ${c.verdict === 'NOT_JUDGED' ? 'not judged' : c.verdict === 'FAIL' ? '**FAIL**' : c.verdict} | ${c.route ?? '—'} | ${hucre(c.answer, 200)} |`)
b.push('')

/* ── how ── */
b.push('## How this was run, and the command for the live pass', '')
b.push(
  '- Branch `audit/checkpoint-karsilastirma`, created at `ac947eef`. Product code is untouched: only harness files under `lib/asistan/tests/`, this script, the npm scripts and docs were added.',
  '- Corpus: `lib/asistan/tests/gokhanSikayetKorpusu.ts` taken from `origin/main` unchanged (`git diff origin/main -- lib/asistan/tests/gokhanSikayetKorpusu.ts` is empty). Fixture patients: the same charts (`korpusFikstur.ts`, `gokhanKorpusHastalari.ts`, `gercekciHasta.ts`), minus the name-index rows, a table this commit does not have.',
  '- Harness adaptations (each is explained at the top of `ayseSahne.ts` and `gokhanKorpusKosucu.ts`): the route is derived because this commit logs none; the bound patient of an unnamed question is read from the chart the brain put into the model request; the guard is refused at the network boundary because this commit has no switch for it; the scrypt key derivation is memoised in the harness (this commit derives it on every decrypt), so latency was not measured.',
  `- In-memory database: ${Array.isArray(meta.sahteVeritabaniHatalari) ? (meta.sahteVeritabaniHatalari.length ? `**${meta.sahteVeritabaniHatalari.length} query error(s)** — ${hucre(meta.sahteVeritabaniHatalari.join('; '), 300)}` : 'no query the fake could not run (a swallowed chart-read error would have biased the answers; none occurred)') : 'not recorded'}.`,
  '',
  `**Live pass** (Kaan or Claude, from this worktree; ${cp.length} graded turns, ${cp.filter((s) => s.route === 'model' || s.route === 'panel').length} of them reach the model — set-up turns come on top; the run is sequential):`,
  '',
  '```sh',
  '# the old Ayşe exactly as it shipped: this commit\'s own primary model',
  'OPENROUTER_API_KEY=sk-or-… npm run denetim:korpus:checkpoint',
  'npm run denetim:checkpoint:karsilastir',
  '```',
  '',
  'Progress is appended to `.denetim-out/korpus-checkpoint.ilerleme.log` while it runs. The run overwrites `.denetim-out/korpus-checkpoint.jsonl`; every row says `mode: live`. One surface or a few entries: `KORPUS_YUZEY=yazi`, `KORPUS_SADECE=Y-0,T-` (writes `korpus-checkpoint-kismi.*`, never the full file).',
  '',
  'The checkpoint\'s primary model was Luna-Pro (`lib/ai/modeller.ts` at this commit); today\'s run used `openai/gpt-6-luna`. With the default command a difference between the two builds is code and model together. To separate them, run the old code with today\'s model as a second pass:',
  '',
  '```sh',
  'NOTYA_MODEL_HIZLI=openai/gpt-6-luna OPENROUTER_API_KEY=sk-or-… npm run denetim:korpus:checkpoint',
  '```',
  '',
  'Neither pass changes production, calls Fish or ElevenLabs, or uses the guard model.',
  '',
)

fs.mkdirSync(path.dirname(path.join(KOK, CIKTI)), { recursive: true })
fs.writeFileSync(path.join(KOK, CIKTI), b.join('\n'))
console.log(`Yazıldı: ${CIKTI} — ${ciftler.length} ortak tur, ${gerileme.length} gerileme, ${iyilesme.length} iyileşme, ${yeniler.length} NEW, mod: ${canli ? 'live' : 'stand-in'}`)
