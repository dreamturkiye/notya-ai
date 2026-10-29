'use client'

/**
 * AU Clinical Dietitian marketing landing — specialty-only surface.
 * Not part of the shared doktor landing kit.
 */
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import './dietitian-beta.css'

const HERO =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=2400&q=80'

export function DietitianBetaLanding({ className = '' }: { className?: string }) {
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
    <div ref={root} className={`db-root${hazir ? ' db-ready' : ''}${className ? ` ${className}` : ''}`}>
      <header className="db-hero">
        <div className="db-hero-media" aria-hidden="true">
          <img src={HERO} alt="" />
        </div>
        <div className="db-hero-shade" aria-hidden="true" />
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
            <p className="db-kicker db-reveal">Australia · Clinical Dietitian</p>
            <h1 className="db-display db-reveal">Your nutrition practice, with a partner who already speaks dietetics.</h1>
            <p className="db-hero-lead db-reveal">
              An AI clinical assistant steeped in Australian dietetic practice — ADIME, kJ, MST, IDDSI, and the
              patient portal your clients actually use between visits.
            </p>
            <div className="db-cta-row db-reveal">
              <Link className="db-btn db-btn-primary" href="/signup">
                Get started
              </Link>
              <Link className="db-btn db-btn-ghost" href="/login">
                Sign in
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
            <p>
              Your role is Clinical Dietitian. ADIME section titles, dietetics tools, and AU sources are already on
              — not a GP skin with nutrition bolted on.
            </p>
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
              <h3>Agreed goals &amp; weight</h3>
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
            <b>Energy &amp; protein</b> — kJ and grams from the factors you choose.
          </li>
          <li>
            <b>IDDSI levels</b> — shared with speech pathology when dysphagia care is shared.
          </li>
          <li>
            <b>Refeeding &amp; enteral rate</b> — clinician ticks and arithmetic, nothing ordered.
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
          <p className="db-kicker">Ready when you are</p>
          <h2 className="db-display">Built for Australian dietitians — ready for your next client.</h2>
          <p className="db-prose">
            Open an account, set your role to Clinical Dietitian, and work from ADIME, tools, and the patient
            portal in one place.
          </p>
          <div className="db-cta-row">
            <Link className="db-btn db-btn-primary" href="/signup">
              Create your account
            </Link>
            <Link className="db-btn db-btn-ghost" href="/demo">
              Book a walkthrough
            </Link>
          </div>
        </div>
      </section>

      <footer className="db-foot">
        <p>
          Notya for Australian Clinical Dietitians. Not medical advice. Notya does not replace clinical judgement.
          Emergencies: Triple Zero (000).
        </p>
      </footer>
    </div>
  )
}
