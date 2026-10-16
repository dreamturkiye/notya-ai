/**
 * Pediatri — Specialty Audit (post-sprint, first build)
 *
 * Mirrors public/pediatri-presprint-audit.html — same content, same verdicts,
 * same depth pills. Built per .cursor/skills/specialty-audit-report/SKILL.md
 * (gold reference: kadin-dogum-specialty-audit.canvas.tsx / kd-jine-presprint-audit.html).
 *
 * No pre-sprint sibling exists for Pediatri — this is the first audit, scoped
 * post-sprint (Aşı Onam + Aşı Stok/Barkod merges, GİB Portalı branch review)
 * in the context of Pediatri's full current depth.
 */
import { Pill, Stat, Callout, Table, Card, BarChart } from 'cursor/canvas'

const DOMAIN_ROWS = [
  ['Muayene / pediatri chapter (büyüme, GİDR, M-CHAT, hedef boy)', 'success', 'Specialist-validated with Dr. Gökhan; Neyzi 2015 LMS, GİDR akış 11a, M-CHAT-R/F resmi TR çeviri, Tanner MPH — deterministic engines'],
  ['Ayşe clinical answers — "İlk 10" standard', 'success', 'Real query infra (dosyaSorgu: kurallar/parametreler/kanit/asiKaniti) + its own audit harness, not prompt-only'],
  ['Hasta portalı (Sağlığım) — pediatri', 'warning', 'Aşı Karnesi + Aşı Onam have real dedicated portal pages; büyüme/GİDR/M-CHAT exist only in the doctor dashboard, never in app/portal/hasta'],
  ['Hasta intake formu — pediatri adaptation', 'success', 'COCUK_FORMU_BRANSLARI adapts shared core (veli yakınlığı, doğum haftası/kilosu); pediIntakeDogum.ts resolves prematurity for the tarama panel'],
  ['Randevu sistemi', 'success', 'Shared spine, full-featured and identical for pediatri; no pediatri-specific gap found'],
  ['İletişim (e-posta/WhatsApp, aşı hatırlatma)', 'success', 'asi_hatirlatma template wired in; doctor-own-number WhatsApp reused by the new Aşı Onam remote flow'],
  ['Dijital Aşı Onam Sistemi — Türkiye (Faz 1)', 'success', 'Merged 2a9c49ef. 3 real flows, immutable record (trigger-enforced). Content awaiting Dr. Gökhan sign-off'],
  ['Aşı Onam — 6-country Phase 2', 'danger', 'i18n scaffolding only; zero legal research, zero countries live'],
  ['Aşı Stok Yönetimi ve Barkod Sistemi — Türkiye (Faz 1)', 'success', 'Merged 2b3f979e, wired into muayene + Entegrasyonlar + module toggle. NOT mid-build — verified against the actual branch graph'],
  ['Faturalama — e-Fatura/e-Arşiv (live on main today)', 'warning', 'Paraşüt-only, BEST-EFFORT confidence, never sandbox-tested; GİB Portalı not merged'],
  ['Faturalama — 6-country e-belge kits', 'danger', 'Real, tested code, confirmed unreferenced in engine.ts or the Faturalama panel — unwired'],
] as const

const WOW_BARS = [
  { label: 'Pediatri chapter (büyüme/GİDR/M-CHAT)', value: 80 },
  { label: 'Ayşe İlk 10 standardı', value: 75 },
  { label: 'Sağlığım — pediatri (veli görür mü?)', value: 35 },
  { label: 'Intake pediatri adaptasyonu', value: 70 },
  { label: 'Randevu (shared spine)', value: 85 },
  { label: 'Aşı hatırlatma / iletişim', value: 70 },
  { label: 'Aşı Onam — Türkiye (Faz 1)', value: 85 },
  { label: 'Aşı Onam — 6 ülke (Faz 2)', value: 10 },
  { label: 'Aşı Stok & Barkod — Türkiye (Faz 1)', value: 80 },
  { label: "e-Fatura/e-Arşiv (main'de canlı)", value: 40 },
  { label: 'Faturalama — 6 ülke e-belge kiti', value: 15 },
] as const

const MANDATE_ROWS = [
  ['Ulusal Aşı Takvimi uygulama + kayıt', 'info', 'Aşı Onam + Aşı Stok tek-aksiyon uygulama, lot/SKT takibi', 'e-Nabız canlı senkron yok — sadece export-ready işareti'],
  ['GİDR gelişim taraması (1–24 ay)', 'info', 'Deterministik motor şipped', 'Sadece hekim ekranında; veli Sağlığım\'da göremiyor'],
  ['Büyüme eğrileri (Neyzi 2015)', 'neutral', 'Deterministik hesaplayıcı şipped', 'Sağlığım\'da büyüme sekmesi yok'],
  ['M-CHAT-R/F otizm taraması', 'neutral', 'Resmi TR çeviri entegre', 'Veli özetine çevrilmiyor'],
  ['Veli onamı (md.15 / KVKK)', 'info', '3 akış + değiştirilemez kayıt', 'İçerik Dr. Gökhan onayı bekliyor'],
  ['Muayene + aşı faturası SUT/KDV', 'info', 'Encounter-linked taslak fatura', 'GİB Portalı main\'de değil; Paraşüt sandbox-tested değil'],
] as const

const PAIN_CARDS = [
  { title: 'Aşı günü — hangi lot, kaç doz kaldı?', cost: 'Her aşı günü', wow: 'Barkod tara → tek dokunuşla uygula', now: 'Shipped — Aşı Stok & Barkod Faz 1, main\'de canlı' },
  { title: 'Veli onamı kağıdı kaybolur', cost: 'Her yeni aşı', wow: 'Dijital onam + değiştirilemez kayıt', now: 'Shipped Faz 1 — içerik klinik onayı bekliyor' },
  { title: 'Büyüme eğrisini veliye gösteremiyorum', cost: 'Her kontrol muayenesi', wow: 'Sağlığım\'da büyüme + gelişim sekmesi', now: 'Missing — yalnız hekim panelinde' },
  { title: 'Ayşe\'ye güvenerek "aşıları tam mı" sorabilmek', cost: 'Her gün, çok sorulan', wow: 'Kanıta dayalı, tarihli cevap motoru', now: 'Shipped — İlk 10 standardı' },
  { title: 'e-Fatura için entegratöre ayrıca ödemek', cost: 'Her ay', wow: 'GİB Portalı — ücretsiz hazırla-yapıştır', now: 'Branch\'te hazır, main\'e merge edilmedi' },
  { title: '6 ülkede aşı onamı/e-belge hiç yok', cost: 'Uluslararası açılım engeli', wow: 'Her ülke için gerçek hukuki araştırma + canlı akış', now: 'Sadece araştırma/iskelet' },
] as const

export default function PediatriSpecialtyAudit() {
  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px 56px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
          Notya · Post-sprint specialty audit
        </span>
      </div>

      <Callout tone="success">
        First Pediatri audit — no earlier snapshot exists, so this is a post-sprint baseline,
        not a revision. Covers this sprint's work (Aşı Onam, Aşı Stok/Barkod, GİB Portalı branch
        review) inside Pediatri's full current depth. Audited directly against live `main`, 2026-10-16.
      </Callout>

      <h1>Pediatri — Specialty Audit</h1>
      <p>
        Notya AI codebase × T.C. Sağlık Bakanlığı Bebek ve Çocuk İzlem Protokolleri (GİDR) ×
        Ulusal Aşı Takvimi × Turkish pediatric clinic pain points. Snapshot 2026-10-16.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 20px' }}>
        <Pill tone="success">Aşı onam + aşı stok: both genuinely shipped to main</Pill>
        <Pill tone="warning">Sağlığım büyüme/gelişim/M-CHAT: doctor-only, not veli-facing</Pill>
        <Pill tone="danger">GİB Portalı built not merged · 6-country packs unwired</Pill>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Stat value="~110" label="Pediatri + aşı files (chapter, onam, stok, İlk 10)" />
        <Stat value="2 systems" tone="success" label="Merged to main this sprint: Aşı Onam, Aşı Stok/Barkod" />
        <Stat value="1 branch" tone="warning" label="GİB Portalı built, unmerged (feat/accounting-gib-portal)" />
        <Stat value="Veli view" tone="info" label="Audit bar: can the parent see it in Sağlığım, not just the doctor?" />
      </div>

      <Callout tone="info" title="Executive verdict">
        Correcting the dispatch brief: the vaccine-stock/barcode system is NOT mid-build — it is
        fully merged to main (2b3f979e), wired into the muayene screen, Entegrasyonlar and the
        module toggle, with real UI pages. Together with the already-merged Aşı Onam (2a9c49ef),
        Pediatri shipped two genuinely clinic-ready vaccine workflows this sprint. What keeps this
        from a clean "ulan bu başka": a parent in Sağlığım still can't see their child's growth
        curve, GİDR result or M-CHAT score — doctor-screen only. The free GİB Portalı e-invoicing
        path is real code on an unmerged branch, not clickable today. Both new systems' 6-country
        versions are research/scaffolding, scored apart from the Türkiye depth, not folded into it.
      </Callout>

      <h2>Coverage depth by domain</h2>
      <Table
        columns={['Domain', 'Depth', 'Note']}
        rows={DOMAIN_ROWS.map(([domain, tone, note]) => [domain, <Pill tone={tone}>{{ success: 'Strong', warning: 'Partial', danger: 'Thin' }[tone]}</Pill>, note])}
      />

      <h2>How complete vs "wow bar"</h2>
      <p style={{ fontSize: 12, color: '#64748B' }}>
        Score = completeness vs what would impress a busy Turkish pediatrician/veli (0–100).
        Direct repo read + merge graph, cross-checked with docs/OPEN-COMMITMENTS.md.
      </p>
      <BarChart data={WOW_BARS} max={100} />

      <h2>Sağlık Bakanlığı &amp; practice matrix</h2>
      <Table
        columns={['Mandate / expectation', 'Level', 'In product today', 'Gap to wow']}
        rows={MANDATE_ROWS.map(([m, level, today, gap]) => [m, <Pill tone={level}>{level === 'info' ? 'MoH/Law' : 'BP'}</Pill>, today, gap])}
      />

      <h2>Doctor pain points (typical pediatri day)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {PAIN_CARDS.map((c) => (
          <Card key={c.title} title={c.title} subtitle={c.cost}>
            <div><b>Wow move</b>: {c.wow}</div>
            <div style={{ color: '#64748B' }}>Now: {c.now}</div>
          </Card>
        ))}
      </div>

      <h2>Deep dive — Dijital Aşı Onam Sistemi</h2>
      <Callout tone="info">
        Verified directly: 2a9c49ef is on origin/main. All 3 flows real. 161_asi_onam.sql gives
        SELECT+INSERT-only RLS plus a BEFORE UPDATE/DELETE trigger that unconditionally raises —
        grep-confirmed no app code path ever updates/deletes this table. Tests wired into
        package.json's test/test:pedi scripts. One open item: Dr. Gökhan's clinical sign-off on
        asiOnamIcerigi.ts against each stocked product's kullanma talimatı — not yet done
        (docs/OPEN-COMMITMENTS.md ASI-ONAM-02). 6-country Phase 2 is scaffolding only, scored
        separately (Thin).
      </Callout>

      <h2>Deep dive — Aşı Stok Yönetimi ve Barkod Sistemi</h2>
      <Callout tone="success">
        Correcting the brief: NOT mid-build. feat/asi-stok-barkod (the branch named in the brief)
        is actually stale/behind main. The real work landed via feat/asi-stok-barkod-intl → merge
        2b3f979e on origin/main (5717/5717 tests passing, tsc clean, per the merge commit).
        Read the files directly to confirm substance: motor.ts (277 lines, atomic RPC decrement,
        ownership-checked), real UI (entegrasyonlar/asi-stok/page.tsx 203 lines, AsiStokTarama.tsx
        165 lines). e-Nabız integration is a readiness flag only (lib/enabiz/paket.ts), not a live
        push — don't over-score that part. One empty lib/asi/stok/intl/ dir exists, left untouched.
      </Callout>

      <h2>Deep dive — Faturalama: GİB Portalı &amp; 6-country e-belge</h2>
      <Callout tone="warning">
        Verified directly: feat/accounting-gib-portal (5a40186a) is real but
        git merge-base --is-ancestor returns false against origin/main. lib/accounting/ebelge/ on
        main has no gibPortal.ts — only generic_rest.ts, parasut.ts, stub.ts. Today a doctor's only
        live e-belge path is Paraşüt, BEST-EFFORT confidence, never sandbox-tested. The 6-country
        e-belge kits (lib/accounting/international/) are real and tested but confirmed unreferenced
        in engine.ts or the Faturalama panel — built, unwired, matching OPEN-COMMITMENTS'
        ACCOUNTING-INTL-04 exactly.
      </Callout>

      <h2>Game changers (priority)</h2>
      <Table
        columns={['#', 'Move', "Why they'll care", 'Size']}
        rows={[
          [1, 'Sağlığım Büyüme + Gelişim modülü', 'Clearest parent-facing wow gap left in pediatri', <Pill tone="neutral">L</Pill>],
          [2, "GİB Portalı'nı main'e merge et", 'Already written, just needs merging — fastest win', <Pill tone="warning">M</Pill>],
          [3, 'Aşı Stok → e-Nabız canlı senkron', 'Finishes the MoH integration, not just a flag', <Pill tone="warning">M</Pill>],
          [4, 'Dr. Gökhan klinik onayı — asiOnamIcerigi.ts', 'Required clinical trust gate before real patients', <Pill tone="success">S</Pill>],
          [5, '6 ülke aşı onam + e-belge paketlerini canlıya bağla', 'Biggest single blocker to international expansion', <Pill tone="neutral">L</Pill>],
          [6, 'Ayşe İlk 10 → 100 soru genişlemesi', "Kaan's approved next-sprint standard, all branşlar", <Pill tone="neutral">L</Pill>],
        ]}
      />

      <h2>Recommended next ships</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Card title="Sprint A — impress this week">
          1. Dr. Gökhan sign-off on aşı onam content{'\n'}
          2. Merge GİB Portalı + Paraşüt-optional{'\n'}
          3. Sağlığım büyüme sekmesi MVP
        </Card>
        <Card title="Sprint B — clinic velocity">
          1. e-Nabız live push for aşı stok{'\n'}
          2. GİDR/M-CHAT parent-safe summary card{'\n'}
          3. Backfill OPEN-COMMITMENTS entry for the aşı stok merge
        </Card>
        <Card title="Sprint C — mandate & expansion">
          1. Wire international e-belge kits into engine + one release/&lt;cc&gt;{'\n'}
          2. Kick off 6-country aşı onam legal research{'\n'}
          3. Promote aşı onam/stok into the heavy hasta-izolasyon harness
        </Card>
      </div>

      <h3>Sources</h3>
      <p style={{ fontSize: 12, color: '#64748B' }}>
        Code: lib/specialties/pediatri.ts, lib/asi/onam/*, lib/asi/stok/*, lib/asistan/dosyaSorgu/*,
        lib/intake/*, lib/doktor/pediIntakeDogum.ts, lib/accounting/ebelge/*,
        lib/accounting/international/*, lib/portal/moduller.ts, docs/OPEN-COMMITMENTS.md, live git
        merge graph of origin/main. External: SB Bebek ve Çocuk İzlem Protokolleri (GİDR), Ulusal
        Aşı Takvimi, mchatscreen.com resmi TR M-CHAT-R/F, Neyzi 2015, Hasta Hakları Yönetmeliği
        md.15, 509 Sıra No'lu VUK Genel Tebliği.
      </p>
      <p style={{ fontSize: 12, color: '#64748B' }}>
        Intentionally out of "wow now": live e-Nabız write access, six-country live rollout for
        either new vaccine system, GİB Portalı UI until actually merged.
      </p>

      <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: '#64748B', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>Post-sprint snapshot · notya-ai · Pediatri · 2026-10-16 · first audit, no pre-sprint sibling</span>
        <span>No patient data · internal product audit</span>
      </div>
    </div>
  )
}
