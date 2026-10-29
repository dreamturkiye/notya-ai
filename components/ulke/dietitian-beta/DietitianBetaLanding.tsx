'use client'

/**
 * Temporary AU Clinical Dietitian beta invite landing — specialty-only marketing surface.
 * Not part of the shared doktor landing kit; remove when the invite closes.
 */
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const HERO =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=2400&q=80'

export function DietitianBetaLanding() {
  const [hazir, setHazir] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setHazir(true))
    const dugum = root.current
    if (!dugum) return () => cancelAnimationFrame(id)
    const gozlem = new IntersectionObserver(
      (girisler) => {
        for (const g of girisler) {
          if (g.isIntersecting) g.target.classList.add('db-in')
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    )
    dugum.querySelectorAll('.db-reveal').forEach((el) => gozlem.observe(el))
    return () => {
      cancelAnimationFrame(id)
      gozlem.disconnect()
    }
  }, [])

  return (
    <div ref={root} className={`db-root${hazir ? ' db-ready' : ''}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600&display=swap');

        .db-root {
          --ink: #10241f;
          --ink-soft: #2a433c;
          --mist: #e7efea;
          --paper: #f3f7f4;
          --leaf: #1f6b52;
          --leaf-deep: #0c3d30;
          --glow: #9fd6b8;
          --line: rgba(16, 36, 31, 0.14);
          min-height: 100vh;
          color: var(--ink);
          background: var(--paper);
          font-family: 'Literata', Georgia, serif;
          font-optical-sizing: auto;
          line-height: 1.55;
          overflow-x: clip;
        }
        .db-root *,
        .db-root *::before,
        .db-root *::after {
          box-sizing: border-box;
        }
        .db-root a {
          color: inherit;
          text-decoration: none;
        }
        .db-display {
          font-family: 'Syne', system-ui, sans-serif;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 0.98;
        }
        .db-kicker {
          font-family: 'Syne', system-ui, sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .db-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .db-reveal.db-in {
          opacity: 1;
          transform: none;
        }
        .db-ready .db-hero-copy .db-reveal:nth-child(1) {
          transition-delay: 0.05s;
        }
        .db-ready .db-hero-copy .db-reveal:nth-child(2) {
          transition-delay: 0.18s;
        }
        .db-ready .db-hero-copy .db-reveal:nth-child(3) {
          transition-delay: 0.3s;
        }
        .db-ready .db-hero-copy .db-reveal:nth-child(4) {
          transition-delay: 0.42s;
        }
        .db-ready .db-hero-copy .db-reveal {
          opacity: 1;
          transform: none;
        }

        .db-hero {
          position: relative;
          min-height: 100svh;
          display: grid;
          align-items: end;
          color: #f5faf7;
          isolation: isolate;
        }
        .db-hero-media {
          position: absolute;
          inset: 0;
          z-index: -2;
          overflow: hidden;
          background: var(--leaf-deep);
        }
        .db-hero-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 58% 40%;
          transform: scale(1.08);
          animation: db-drift 22s ease-in-out infinite alternate;
          filter: saturate(0.92) contrast(1.05);
        }
        @keyframes db-drift {
          from {
            transform: scale(1.08) translate3d(0, 0, 0);
          }
          to {
            transform: scale(1.14) translate3d(-1.5%, -1%, 0);
          }
        }
        .db-hero-shade {
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            linear-gradient(180deg, rgba(8, 28, 22, 0.25) 0%, rgba(8, 28, 22, 0.15) 38%, rgba(8, 28, 22, 0.78) 78%, rgba(8, 28, 22, 0.94) 100%),
            radial-gradient(90% 60% at 80% 10%, rgba(159, 214, 184, 0.22), transparent 55%);
        }
        .db-hero-inner {
          width: min(1120px, calc(100% - 2.5rem));
          margin: 0 auto;
          padding: 1.25rem 0 4.5rem;
        }
        .db-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: clamp(4rem, 18vh, 9rem);
        }
        .db-brand {
          font-family: 'Syne', system-ui, sans-serif;
          font-weight: 800;
          font-size: clamp(2rem, 5vw, 2.75rem);
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .db-brand span {
          display: inline-block;
          border-bottom: 3px solid var(--glow);
          padding-bottom: 0.08em;
          animation: db-underline 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;
        }
        @keyframes db-underline {
          from {
            border-bottom-color: transparent;
            transform: translateY(6px);
            opacity: 0.4;
          }
          to {
            border-bottom-color: var(--glow);
            transform: none;
            opacity: 1;
          }
        }
        .db-top-link {
          font-family: 'Syne', system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          opacity: 0.9;
          border: 1px solid rgba(245, 250, 247, 0.35);
          padding: 0.65rem 1rem;
          transition: background 0.25s ease, border-color 0.25s ease;
        }
        .db-top-link:hover {
          background: rgba(245, 250, 247, 0.1);
          border-color: rgba(245, 250, 247, 0.7);
        }
        .db-hero-copy {
          max-width: 38rem;
        }
        .db-hero-copy .db-kicker {
          color: var(--glow);
          margin-bottom: 1rem;
        }
        .db-hero h1 {
          font-size: clamp(2.6rem, 7.2vw, 4.6rem);
          margin: 0 0 1.1rem;
          text-wrap: balance;
        }
        .db-hero-lead {
          font-size: clamp(1.05rem, 2.1vw, 1.25rem);
          max-width: 32rem;
          color: rgba(245, 250, 247, 0.9);
          margin: 0 0 1.75rem;
        }
        .db-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem 1.1rem;
          align-items: center;
        }
        .db-btn {
          font-family: 'Syne', system-ui, sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.02em;
          padding: 0.95rem 1.35rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
        }
        .db-btn:hover {
          transform: translateY(-1px);
        }
        .db-btn-primary {
          background: var(--glow);
          color: var(--leaf-deep);
        }
        .db-btn-primary:hover {
          background: #c5ecd6;
        }
        .db-btn-ghost {
          color: #f5faf7;
          border-bottom: 1px solid rgba(245, 250, 247, 0.55);
          padding-left: 0;
          padding-right: 0;
          border-radius: 0;
        }

        .db-section {
          width: min(1120px, calc(100% - 2.5rem));
          margin: 0 auto;
          padding: clamp(4rem, 10vw, 7rem) 0;
        }
        .db-section + .db-section {
          border-top: 1px solid var(--line);
        }
        .db-section h2 {
          font-size: clamp(2rem, 4.5vw, 3.15rem);
          margin: 0 0 1rem;
          max-width: 16ch;
          text-wrap: balance;
        }
        .db-section .db-kicker {
          color: var(--leaf);
          margin-bottom: 0.85rem;
        }
        .db-prose {
          font-size: 1.12rem;
          color: var(--ink-soft);
          max-width: 38rem;
          margin: 0;
        }
        .db-prose + .db-prose {
          margin-top: 1rem;
        }

        .db-split {
          display: grid;
          gap: clamp(2rem, 5vw, 4rem);
          align-items: start;
        }
        @media (min-width: 860px) {
          .db-split {
            grid-template-columns: 1.05fr 0.95fr;
          }
        }
        .db-quote {
          position: relative;
          padding: 1.75rem 0 0;
          border-top: 2px solid var(--leaf);
          font-size: clamp(1.35rem, 2.8vw, 1.75rem);
          font-family: 'Syne', system-ui, sans-serif;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.25;
          color: var(--leaf-deep);
          max-width: 22ch;
        }

        .db-list {
          list-style: none;
          margin: 1.75rem 0 0;
          padding: 0;
          display: grid;
          gap: 0;
        }
        .db-list li {
          display: grid;
          grid-template-columns: 4.5rem 1fr;
          gap: 1rem;
          padding: 1.15rem 0;
          border-top: 1px solid var(--line);
        }
        .db-list li:last-child {
          border-bottom: 1px solid var(--line);
        }
        .db-list strong {
          font-family: 'Syne', system-ui, sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--leaf);
          padding-top: 0.2rem;
        }
        .db-list p {
          margin: 0;
          color: var(--ink-soft);
          font-size: 1.05rem;
        }

        .db-portal {
          background:
            radial-gradient(80% 70% at 100% 0%, rgba(159, 214, 184, 0.35), transparent 50%),
            linear-gradient(160deg, #14362c 0%, #0c3d30 55%, #163f34 100%);
          color: #f3faf6;
        }
        .db-portal .db-section {
          border-top: none;
        }
        .db-portal .db-kicker {
          color: var(--glow);
        }
        .db-portal .db-prose {
          color: rgba(243, 250, 246, 0.86);
        }
        .db-portal-grid {
          display: grid;
          gap: 1.25rem;
          margin-top: 2.25rem;
        }
        @media (min-width: 720px) {
          .db-portal-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
        }
        .db-portal-grid article {
          padding-top: 1rem;
          border-top: 1px solid rgba(245, 250, 247, 0.28);
        }
        .db-portal-grid h3 {
          font-family: 'Syne', system-ui, sans-serif;
          font-size: 1.15rem;
          letter-spacing: -0.02em;
          margin: 0 0 0.55rem;
        }
        .db-portal-grid p {
          margin: 0;
          color: rgba(243, 250, 246, 0.78);
          font-size: 0.98rem;
        }

        .db-tools {
          columns: 1;
          gap: 0;
          margin: 2rem 0 0;
          padding: 0;
          list-style: none;
        }
        @media (min-width: 720px) {
          .db-tools {
            columns: 2;
            column-gap: 2.5rem;
          }
        }
        .db-tools li {
          break-inside: avoid;
          padding: 0.85rem 0;
          border-bottom: 1px solid var(--line);
          font-size: 1.05rem;
          color: var(--ink-soft);
        }
        .db-tools b {
          color: var(--ink);
          font-weight: 600;
        }

        .db-close {
          text-align: left;
        }
        .db-close h2 {
          max-width: 18ch;
        }
        .db-close .db-cta-row {
          margin-top: 1.75rem;
        }
        .db-close .db-btn-primary {
          background: var(--leaf);
          color: #f5faf7;
        }
        .db-close .db-btn-primary:hover {
          background: var(--leaf-deep);
        }
        .db-close .db-btn-ghost {
          color: var(--ink);
          border-bottom-color: rgba(16, 36, 31, 0.35);
        }

        .db-foot {
          width: min(1120px, calc(100% - 2.5rem));
          margin: 0 auto;
          padding: 0 0 2.5rem;
          font-size: 0.85rem;
          color: rgba(16, 36, 31, 0.55);
        }
        .db-foot p {
          margin: 0;
          max-width: 42rem;
        }

        @media (max-width: 640px) {
          .db-list li {
            grid-template-columns: 1fr;
            gap: 0.35rem;
          }
          .db-hero-inner {
            width: min(1120px, calc(100% - 1.5rem));
          }
          .db-section {
            width: min(1120px, calc(100% - 1.5rem));
          }
          .db-foot {
            width: min(1120px, calc(100% - 1.5rem));
          }
        }
      `}</style>

      <header className="db-hero">
        <div className="db-hero-media" aria-hidden="true">
          <img src={HERO} alt="" />
          <div className="db-hero-shade" />
        </div>
        <div className="db-hero-inner">
          <div className="db-top">
            <div className="db-brand">
              <span>Notya</span>
            </div>
            <Link className="db-top-link" href="/login">
              Sign in
            </Link>
          </div>
          <div className="db-hero-copy">
            <p className="db-kicker db-reveal">Australia · Clinical Dietitian beta</p>
            <h1 className="db-display db-reveal">Your nutrition practice, with a partner who already speaks dietetics.</h1>
            <p className="db-hero-lead db-reveal">
              An AI clinical assistant steeped in Australian dietetic practice — ADIME, kJ, MST, IDDSI, and the
              patient portal your clients actually use between visits.
            </p>
            <div className="db-cta-row db-reveal">
              <Link className="db-btn db-btn-primary" href="/signup">
                Join the dietitian beta
              </Link>
              <Link className="db-btn db-btn-ghost" href="/login">
                I already have access
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="db-section">
        <div className="db-split">
          <div className="db-reveal">
            <p className="db-kicker">The assistant</p>
            <h2 className="db-display">A subject-matter expert for Australian clinical dietetics — not a generic scribe.</h2>
            <p className="db-prose">
              She works inside Dietitians Australia scope: kilojoules not calories, malnutrition screening as you
              actually record it, IDDSI levels shared with speech pathology, NEMO-style starting estimates, and
              Australian Dietary Guidelines when the care setting is here. When a dual-country client needs US
              depth, she can name both — and leave the call with you.
            </p>
            <p className="db-prose">
              Voice or typed. She drafts with you in the room, stays quiet on diagnosis that is not yours to make,
              and never invents a lab interval from a number alone.
            </p>
          </div>
          <p className="db-quote db-reveal">
            Less charting choreography. More of the conversation only you can have with the client.
          </p>
        </div>
      </section>

      <section className="db-section">
        <div className="db-reveal">
          <p className="db-kicker">Partner in crime</p>
          <h2 className="db-display">She gets to know you — then she works like someone who has.</h2>
          <p className="db-prose">
            First visits, she listens hard: how you phrase PES statements, which goals you tick with clients, how
            you write a breakfast line that a patient will actually follow. Over time she mirrors your cadence —
            so the draft feels like your hand, not a template that wandered in from another specialty.
          </p>
        </div>
        <ol className="db-list">
          <li className="db-reveal">
            <strong>Day one</strong>
            <p>Your role is Clinical Dietitian. ADIME section titles, dietetics tools, and AU sources are already on — not a GP skin with nutrition bolted on.</p>
          </li>
          <li className="db-reveal">
            <strong>Week one</strong>
            <p>She learns your meal-plan voice, your diary habits, and which screening and lab values you reach for most.</p>
          </li>
          <li className="db-reveal">
            <strong>Ongoing</strong>
            <p>She stays beside the visit: note, tools, portal share, messages back from the client — one thread, not five tabs.</p>
          </li>
        </ol>
      </section>

      <div className="db-portal">
        <section className="db-section">
          <div className="db-reveal">
            <p className="db-kicker">Patient portal</p>
            <h2 className="db-display">A portal your patients will open again.</h2>
            <p className="db-prose">
              One link and a PIN — no account to abandon. They see the meal plan you kept, log intake in plain
              language, and keep the goals you agreed together. You see their diary on the file. Coaching continues
              between reviews without WhatsApp archaeology.
            </p>
          </div>
          <div className="db-portal-grid">
            <article className="db-reveal">
              <h3>Meal plan on their page</h3>
              <p>Breakfast, lunch, dinner, snacks — the wording you wrote, readable on a phone.</p>
            </article>
            <article className="db-reveal">
              <h3>Food diary back to you</h3>
              <p>Short dated intake notes from the client or from you, capped and newest-first on the file.</p>
            </article>
            <article className="db-reveal">
              <h3>Agreed goals & weight</h3>
              <p>Person-centred ticks and clinic weight trend where you have kept them — fuel for the next visit.</p>
            </article>
          </div>
        </section>
      </div>

      <section className="db-section">
        <div className="db-reveal">
          <p className="db-kicker">Built for your day</p>
          <h2 className="db-display">Full Notya — tuned for an Australian dietitian.</h2>
          <p className="db-prose">
            Visits, calendar, messages, documents, clinic desk, billing hooks, and the live assistant — with a
            dietetics toolkit that other roles simply do not see.
          </p>
        </div>
        <ul className="db-tools">
          <li>
            <b>ADIME notes</b> — assessment through evaluation, labelled for dietetics.
          </li>
          <li>
            <b>MST score record</b> — total only; questions stay on the MST form.
          </li>
          <li>
            <b>Energy & protein</b> — kJ and grams from the factors you choose.
          </li>
          <li>
            <b>IDDSI levels</b> — shared with speech pathology when dysphagia care is shared.
          </li>
          <li>
            <b>Refeeding & enteral rate</b> — clinician ticks and arithmetic, nothing ordered.
          </li>
          <li>
            <b>Nutrition labs</b> — AU units you type from the report; no invented intervals.
          </li>
          <li>
            <b>Anthropometry trend</b> — weight, waist, BMI from kept measures on the file.
          </li>
          <li>
            <b>Voice assistant</b> — Australian English, dietetics sources first.
          </li>
        </ul>
      </section>

      <section className="db-section db-close">
        <div className="db-reveal">
          <p className="db-kicker">Private beta</p>
          <h2 className="db-display">Come pressure-test it with real clients in mind.</h2>
          <p className="db-prose">
            We are inviting practising Australian dietitians to use Notya on their own workflows and tell us where
            it shines — and where it must improve — before we open wider.
          </p>
          <div className="db-cta-row">
            <Link className="db-btn db-btn-primary" href="/signup">
              Request beta access
            </Link>
            <Link className="db-btn db-btn-ghost" href="/demo">
              Book a walkthrough
            </Link>
          </div>
        </div>
      </section>

      <footer className="db-foot">
        <p>
          Temporary invite page for the Australian Clinical Dietitian beta. Not medical advice. Notya does not
          replace clinical judgement. Emergencies: Triple Zero (000).
        </p>
      </footer>
    </div>
  )
}
