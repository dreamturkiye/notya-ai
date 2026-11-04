/**
 * AU Competitive Analysis — Notya vs Heidi · Lyrebird · Medow
 * Mirrors public/au-competitive-heidi-lyrebird-medow.html
 * Per .cursor/skills/specialty-audit-report/SKILL.md visual system.
 * Snapshot 2026-11-02. No patient data.
 */
import { Pill, Stat, Callout, Table, Card, BarChart } from 'cursor/canvas'

const DOMAIN_ROWS = [
  ['Ambient visit → note (consent + approve)', 'success', 'Record → transcript → draft → approval hard-gated; unclear marked, not guessed'],
  ['Referral / GP / patient letters / certificates', 'success', 'Letter studio under approved note + clinician sign-off before export (AU-GAP-CLOSE-01/02)'],
  ['AU PMS write-back (Bp / Genie / Gentu / Cliniko)', 'warning', 'Cliniko live draft treatment-note write; Magentus adapter ready (needs partner keys); Bp back burner (Partner Network)'],
  ['Dictate / telehealth / desktop capture', 'success', 'Tab/window capture + paste transcript + telehealth tip on shared visit screen'],
  ['Specialty depth / templates', 'success', '~44 AU roles, specialty note shapes, 40+ tools, named assistants'],
  ['MBS / PBS / care plans / CCMP', 'success', 'GPMP/TCA/CCMP/MHCP studio + MBS suggest (plan families); never lodge — Bp live write still Partial'],
  ['Clinical evidence / citations', 'warning', 'Specialty assistant with AU college framing; not Heidi Evidence journal RAG'],
  ['Patient portal (patient page)', 'success', 'PIN page: appointments, summaries, intake, messages, consent / privacy requests'],
  ['Calendar + patients + clinic multi-doctor', 'success', 'Full practice OS — scribes assume you already have a PMS'],
  ['Invoicing / payments', 'success', 'AUD invoices, GST per line, bring-your-own Stripe'],
  ['Front desk / phone AI', 'danger', 'Human desk only — Medow Front Desk answers calls into PMS'],
  ['Document inbox sorter', 'danger', 'Attachments/photo archive only — Lyrebird Document Sorter for Bp'],
  ['Pricing / acquisition', 'success', 'Founding A$79 invite + note-only freemium 5/day + A$149 paid; Heidi Free still broader'],
  ['Trust / compliance signalling', 'warning', 'APP copy + approval gates + hekimOnayi export gate; leaders lead with ISO/SOC'],
  ['Market presence / proof', 'danger', 'AU launch/beta — need named clinics + evaluations to enter shortlists'],
] as const

const WOW_BARS = [
  { label: 'Full practice OS', value: 88 },
  { label: 'Visit note + approval safety', value: 78 },
  { label: 'Specialty coverage', value: 72 },
  { label: 'Patient portal / privacy ops', value: 80 },
  { label: 'Letters & certificates', value: 72 },
  { label: 'Incumbent PMS write-back', value: 58 },
  { label: 'MBS co-pilot / care plans', value: 72 },
  { label: 'Telehealth / dictate / desktop', value: 70 },
  { label: 'Price & free-entry', value: 68 },
  { label: 'Brand proof / evaluation', value: 18 },
] as const

const PAIN_CARDS = [
  { title: 'Already live in Best Practice', cost: 'Lyrebird still ahead on live Bp sync', wow: 'Bp vault + outbox; Partner Network back burner', now: 'Partial — Cliniko live for allied; Bp pending committee' },
  { title: 'Genie/Gentu specialist, letters same day', cost: 'Needs Magentus sandbox keys', wow: 'Magentus FHIR DocumentReference adapter + letter studio', now: 'Letters Strong · Magentus HTTP ready, keys open' },
  { title: 'Want free forever + evidence citations', cost: 'Heidi still wins evidence RAG', wow: 'Note-only freemium 5/day + OS value story', now: 'Freemium shipped · citations still Partial' },
  { title: 'Opening new rooms / hate my PMS', cost: 'Notya can win', wow: 'Calendar + portal + invoices + letters in one', now: 'Strong OS · letters closed' },
  { title: 'Patients need a page + consent trail', cost: 'Notya wins', wow: 'Lead marketing with PIN portal + privacy timer', now: 'Strong — productised' },
  { title: 'Front desk drowning in calls', cost: 'Medow wins today', wow: 'Later: Front Desk AI; now sell human desk + portal', now: 'Missing phone AI' },
] as const

const depth = (tone: 'success' | 'warning' | 'danger') =>
  ({ success: 'Strong', warning: 'Partial', danger: 'Thin/Missing' } as const)[tone]

export default function AuCompetitiveAnalysis() {
  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px 56px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
          Notya · AU market competitive analysis
        </span>
        <span style={{ fontSize: 12, color: '#14B8A6', fontWeight: 600 }}>au.notya.io</span>
      </div>

      <Callout tone="info">
        Snapshot 2 Nov 2026. Competitors as marketed: Heidi Health, Lyrebird Health (often misspelled
        Lyrabird), Medow Health (often misspelled Meadow). Sources: vendor pricing/product pages +
        Notya AU pack and live app QA. Shareable HTML: public/au-competitive-heidi-lyrebird-medow.html
      </Callout>

      <h1>Notya AU vs Heidi · Lyrebird · Medow</h1>
      <p>
        What au.notya.io is today versus the three Australian AI documentation leaders — the gaps that
        keep Notya off shortlists, and the ships required to pass them.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 20px' }}>
        <Pill tone="success">Notya = practice OS, not a scribe overlay</Pill>
        <Pill tone="success">Letters + MBS sign-off shipped (AU-GAP-CLOSE-02)</Pill>
        <Pill tone="success">Cliniko write-back live · Magentus adapter ready</Pill>
        <Pill tone="warning">Bp Partner Network on back burner</Pill>
        <Pill tone="success">Freemium: 5 notes/day · founding A$79 invite intact</Pill>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Stat value="4" label="Products compared" />
        <Stat value="7" tone="success" label="Domains where Notya is Strong / unique" />
        <Stat value="6" tone="danger" label="Must-close gaps to win Aussie clinics" />
        <Stat value="A$149" tone="warning" label="Notya doctor plan (15-day free trial)" />
      </div>

      <Callout tone="warning" title="Executive verdict">
        Notya plays a different game. Heidi, Lyrebird and Medow are ambient scribes that sit on top of
        Best Practice / Genie / Gentu / Cliniko and push notes + letters back. Notya is a full clinical
        practice application (patients, calendar, consented note + approval, patient portal, invoices,
        clinic accounts, ~44 roles, AU tools, named voice assistant). That OS wedge wins greenfield —
        and is invisible when doctors shop “AI scribe”. On their frame (scribe + letters + PMS sync),
        Notya loses today on every high-frequency buying criterion. Close the six gaps below without
        abandoning the OS bet.
      </Callout>

      <h2>Who each product is</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <Card title="Heidi Health" subtitle="Global scribe +">
          Ambient scribe, Evidence (cited answers), Heidi II agents. Free forever. Desktop for telehealth.
          Clinician ~A$85/mo annual / ~A$120 monthly; Practice ~A$130 for team + full EHR. Huge brand.
        </Card>
        <Card title="Lyrebird Health" subtitle="AU GP platform">
          Notes + referral/patient letters + WorkCover + care plans. Deep Best Practice (+ Cubiko,
          BetterConsult). Bp Free. Pro A$160 annual / A$240 monthly. Suites A$299–A$1,649 + GST with
          Document Sorter + MBS prompts.
        </Card>
        <Card title="Medow Health" subtitle="Specialist suite">
          Per-specialty models (50+), Smart Dictation, Front Desk AI. Genie/Gentu/Elixir/Meditech
          bi-directional. Letters + op reports. Quote-only + 60-day money-back. Local CS onboarding.
        </Card>
      </div>

      <Callout tone="success" title="Notya AU positioning (honest)">
        One product for the doctor’s day: record with consent → transcript → specialty draft → approval;
        calendar; patient file; PIN patient page; on-page messages; Medicare/PBS/GST checklists;
        BYO Stripe invoices; privacy request timer; multi-doctor clinic; live specialty-named assistant.
        15-day trial, A$149/mo. Not a Best Practice plugin. Not a free forever scribe.
      </Callout>

      <h2>Capability depth (Notya today)</h2>
      <Table
        columns={['Domain', 'Depth', 'Note']}
        rows={DOMAIN_ROWS.map(([domain, tone, note]) => [
          domain,
          <Pill tone={tone}>{depth(tone)}</Pill>,
          note,
        ])}
      />

      <h2>Scorecard vs wow bar</h2>
      <p style={{ fontSize: 12, color: '#64748B' }}>
        “Would an Australian GP or specialist choose Notya over these competitors for that job today?”
      </p>
      <BarChart data={[...WOW_BARS]} max={100} />

      <h2>Pricing matrix (AUD, public list)</h2>
      <Table
        columns={['Product', 'Entry', 'Working solo', 'Team / practice']}
        rows={[
          ['Notya AU', '15-day free trial', 'A$149/mo doctor', 'Clinic by quote'],
          ['Heidi', 'Free forever (capped)', '~A$85 annual / ~A$120 monthly', '~A$130/user Practice'],
          ['Lyrebird', 'Free caps · Bp Free', 'Pro A$160 annual / A$240 mo', 'A$299–A$1,649 + GST'],
          ['Medow', 'Demo → quote', 'Custom', 'Custom + CS onboarding'],
        ]}
      />

      <h2>Who wins the pain today</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {PAIN_CARDS.map((c) => (
          <Card key={c.title} title={c.title} subtitle={c.cost}>
            <div><b>Wow move</b>: {c.wow}</div>
            <div style={{ color: '#64748B' }}>Now: {c.now}</div>
          </Card>
        ))}
      </div>

      <h2>Gaps to close — ordered to pass them</h2>
      <Table
        columns={['#', 'Move', 'Why clinics care', 'Size']}
        rows={[
          [1, 'Letter studio from one visit', 'GP letter, referral, patient summary, certificates → PDF', <Pill tone="warning">L</Pill>],
          [2, 'Best Practice write-back (then Genie/Gentu)', 'Installed-base deals; notes land in the record they trust', <Pill tone="danger">L+</Pill>],
          [3, 'Telehealth + dictate path', 'Call audio / natural dictation without punctuation commands', <Pill tone="warning">M</Pill>],
          [4, 'Pricing redesign for AU acquisition', 'Annual A$99–119 and/or free note-only; keep A$149 as full OS', <Pill tone="info">S</Pill>],
          [5, 'Trust centre + clinical proof', 'ISO/SOC roadmap, region diagram, named clinic case studies', <Pill tone="warning">M</Pill>],
          [6, 'MBS assist (prompts, not lodging)', 'Suggest items from approved note; doctor confirms', <Pill tone="warning">M</Pill>],
        ]}
      />

      <h2>How to pass each competitor</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <Card title="Pass Heidi">
          Don’t fight Free on scribe-only — fight on OS completeness. Ship letters + annual ladder.
          Publish approval/safety story. Add telehealth capture so Desktop isn’t a hard block.
        </Card>
        <Card title="Pass Lyrebird">
          GP market priority #1: Bp write-back. Then letter + certificate pack; then MBS prompts.
          Keep Notya OS as the “leave Bp eventually” upgrade path.
        </Card>
        <Card title="Pass Medow">
          Specialist letter pack with tone presets. Genie/Gentu bi-directional. Lean on specialty
          roles + patient portal; white-glove first 20 specialist clinics.
        </Card>
      </div>

      <h2>Recommended next ships</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Card title="Sprint A — Impress (letters)">
          From approved note: GP letter, referral, patient summary. PDF. Templates for GP,
          cardiology, ortho, psych first.
        </Card>
        <Card title="Sprint B — Velocity (price + proof)">
          Annual plan, “OS vs scribe” landing, trust centre v1, 3 clinic case studies, telehealth path.
        </Card>
        <Card title="Sprint C — Mandate (PMS)">
          Best Practice write-back pilot (notes + letters). Genie/Gentu next. Keep Notya as
          system-of-record for new practices.
        </Card>
      </div>

      <Callout tone="info" title="Strategic rule">
        Do not shrink Notya into “just another scribe” to match Heidi’s framing. Close scribe-category
        gaps (letters, PMS sync, telehealth, price) while keeping the OS wedge (portal, calendar,
        invoices, clinic, specialty tools). Pass them on both comparison frames.
      </Callout>

      <h3>Sources</h3>
      <p style={{ fontSize: 12, color: '#64748B' }}>
        Heidi en-au pricing/product; Lyrebird AU pricing + help centre + comparison blog; Medow
        product/Genie/Gentu pages; Notya countries/au pack + au.notya.io live QA Nov 2026.
      </p>

      <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: '#64748B', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>AU competitive analysis · 2026-11-02 · Heidi · Lyrebird · Medow</span>
        <span>No patient data · Strong · Partial · Thin/Missing</span>
      </div>
    </div>
  )
}
