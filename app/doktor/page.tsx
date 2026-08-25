'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import './doktor-landing.css'

const PHOTOS = {
  hero: '/doctors/dr_elif.jpg',
  ayse: '/doctors/dr_ayse.jpg',
  mehmet: '/doctors/dr_mehmet.jpg',
  elif: '/doctors/dr_elif.jpg',
}

const BIREYSEL = [
  {
    name: 'Starter',
    price: '₺499',
    seat: 'Tek kullanıcı',
    items: ['50 seans / ay', 'Tüm uzmanlar', 'SOAP notları'],
    href: '/kayit',
    featured: false,
  },
  {
    name: 'Pro · En popüler',
    price: '₺1.299',
    seat: 'Tek kullanıcı',
    items: ['Sınırsız seans', 'Pabau entegrasyon', 'Öğrenen sistem'],
    href: '/kayit',
    featured: true,
  },
  {
    name: 'Uzman',
    price: '₺2.499',
    seat: 'Tek kullanıcı',
    items: ['Öncelikli destek', 'Özel AI konfig', 'Pabau + ICD-10'],
    href: '/kayit',
    featured: false,
  },
]

const KLINIK = [
  {
    name: 'Klinik 5',
    price: '₺3.999',
    seat: '5 koltuk',
    items: ['5 kullanıcı', 'Admin paneli', 'Pabau'],
    href: '/kayit?plan=klinik',
    featured: false,
  },
  {
    name: 'Klinik 10',
    price: '₺6.999',
    seat: '10 koltuk',
    items: ['10 kullanıcı', 'Marka ayarları', 'Öncelikli destek'],
    href: '/kayit?plan=klinik',
    featured: true,
  },
  {
    name: 'Klinik 20',
    price: '₺11.999',
    seat: '20 koltuk',
    items: ['20 kullanıcı', 'Her şey dahil', 'Dedicated destek'],
    href: '/kayit?plan=klinik',
    featured: false,
  },
  {
    name: 'Kurumsal',
    price: 'Teklif',
    seat: 'Sınırsız',
    items: ['Özel SLA', 'API erişimi', 'Dedicated ekip'],
    href: '/kayit?plan=kurumsal',
    featured: false,
    cta: 'İletişime geçin',
  },
]

function PricingPlans() {
  const [tab, setTab] = useState<'bireysel' | 'klinik'>('bireysel')
  const plans = tab === 'bireysel' ? BIREYSEL : KLINIK

  return (
    <>
      <div className="price-head">
        <div>
          <div className="idx reveal">05 — Fiyatlandırma</div>
          <h2 className="sec-title reveal reveal-d1">Sade. Şeffaf. Adil.</h2>
        </div>
        <div className="tabs reveal reveal-d2" role="tablist" aria-label="Plan türü">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'bireysel'}
            onClick={() => setTab('bireysel')}
          >
            Bireysel
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'klinik'}
            onClick={() => setTab('klinik')}
          >
            Klinik
          </button>
        </div>
      </div>

      <div className={`price-grid${tab === 'klinik' ? ' is-klinik' : ''}`}>
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`plan${plan.featured ? ' featured' : ''}`}
          >
            <div className="name">{plan.name}</div>
            <div className="amount">
              {plan.price}
              {plan.price.startsWith('₺') ? <small>/ay</small> : null}
            </div>
            <div className="seat">{plan.seat}</div>
            <ul>
              {plan.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="btn" href={plan.href}>
              {'cta' in plan && plan.cta ? plan.cta : 'Başlayın'}
            </Link>
          </article>
        ))}
      </div>
    </>
  )
}

export default function DoktorLandingPage() {
  useEffect(() => {
    const nav = document.getElementById('doktor-nav')
    const onScroll = () => {
      nav?.classList.toggle('is-solid', window.scrollY > 24)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll('.doktor-landing .reveal').forEach((el) => io.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [])

  return (
    <main className="doktor-landing">
      <div className="grain" aria-hidden="true" />

      <nav className="nav" id="doktor-nav">
        <Link className="nav-brand" href="/doktor">
          NOTYA<span>.</span>AI
        </Link>
        <div className="nav-links">
          <a href="#ozellik">Özellikler</a>
          <a href="#uzmanlar">Uzmanlar</a>
          <a href="#fiyat">Fiyatlar</a>
          <Link className="nav-enter" href="/giris/doktor">
            Giriş
          </Link>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-media">
          <img
            src={PHOTOS.hero}
            alt="Notya AI uzman doktor portresi"
            width={1920}
            height={2400}
            fetchPriority="high"
          />
        </div>
        <div className="hero-veil" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-brand">
            NOTYA<span>.</span>AI
          </div>
          <h1>Cebinizdeki dünyaca ünlü uzman doktor.</h1>
          <p className="hero-lead">
            Nelson, Braunwald, Harrison bilen meslektaş. Sesli konuşun — tanı, reçete ve güvenlik ağı
            aynı anda.
          </p>
          <div className="hero-cta">
            <Link className="btn" href="/giris/doktor">
              Ücretsiz başlayın
            </Link>
            <Link className="btn-link" href="/asistan">
              Asistanı dene
            </Link>
          </div>
        </div>
      </header>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[
            ['Nelson 22e', 'Pediatri'],
            ['Braunwald 12e', 'Kardiyoloji'],
            ['Harrison’s 22e', 'Dahiliye'],
            ['Adams & Victor', 'Nöroloji'],
            ['DSM-5-TR', 'Psikiyatri'],
            ['KVKK', 'AB Merkezi'],
          ]
            .concat([
              ['Nelson 22e', 'Pediatri'],
              ['Braunwald 12e', 'Kardiyoloji'],
              ['Harrison’s 22e', 'Dahiliye'],
              ['Adams & Victor', 'Nöroloji'],
              ['DSM-5-TR', 'Psikiyatri'],
              ['KVKK', 'AB Merkezi'],
            ])
            .map(([book, field], i) => (
              <span key={`${book}-${i}`}>
                <em>{book}</em> {field} <i />
              </span>
            ))}
        </div>
      </div>

      <section id="ozellik">
        <div className="wrap voice">
          <div>
            <div className="idx reveal">01 — Sesli konuşma</div>
            <h2 className="sec-title reveal reveal-d1">İki meslektaş gibi konuşun.</h2>
            <p className="sec-copy reveal reveal-d2">
              Buton yok. Bekleme yok. Bir kez dokunun — Prof. Ayşe sizi karşılar. Araya girseniz
              anında durur. Gerçek zamanlı, tamamen doğal.
            </p>
          </div>
          <figure className="voice-media reveal reveal-d3">
            <img
              src={PHOTOS.ayse}
              alt="Sesli klinik danışma"
              width={1200}
              height={1500}
              loading="lazy"
            />
            <figcaption className="voice-caption">
              <div className="live">Canlı seans</div>
              <p>
                7 yaşında, 18 kilo. Ateş ve kulak ağrısı — Amoksisilin 40&nbsp;mg/kg/gün yazayım mı
                doktor?
              </p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="learn">
        <div className="wrap">
          <div className="idx reveal">02 — Öğrenen sistem</div>
          <h2 className="sec-title reveal reveal-d1">10 seans sonra yıllardır birliktesiniz.</h2>
          <p className="sec-copy reveal reveal-d2">
            Her düzelttiğiniz doz ve tercih öğrenilir. Sorulmadan hatırlar. Meslektaş gibi davranır.
          </p>
          <div className="timeline">
            <article className="t-item reveal">
              <div className="t-label">1. seans</div>
              <q>“Amoksisilin yaz.”</q>
              <p>Hangi dozu yazayım, doktor? Hangi markayı tercih edersiniz?</p>
            </article>
            <article className="t-item hot reveal reveal-d1">
              <div className="t-label">10. seans</div>
              <q>“Amoksisilin yaz.”</q>
              <p>
                40&nbsp;mg/kg/gün, bu kiloda 720&nbsp;mg. Amoksiklav tercih ediyorsunuz — onu mu
                yazayım?
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="uzmanlar">
        <div className="wrap">
          <div className="experts-head">
            <div>
              <div className="idx reveal">03 — Uzman kadro</div>
              <h2 className="sec-title reveal reveal-d1">Üç uzman. Tek uygulama.</h2>
            </div>
            <p className="sec-copy reveal reveal-d2">
              Her biri kendi alanında referans kitaplarla eğitildi. Karakterleri farklı; yüzünüz aynı
              kalır.
            </p>
          </div>
          <div className="expert-rail">
            {[
              {
                name: 'Prof. Ayşe Kaya',
                role: 'Pediatri',
                books: 'Nelson 22e · Harriet Lane 23e',
                photo: PHOTOS.ayse,
              },
              {
                name: 'Prof. Mehmet Demir',
                role: 'Kardiyoloji',
                books: 'Braunwald 12e · ESC 2024',
                photo: PHOTOS.mehmet,
              },
              {
                name: 'Prof. Elif Şahin',
                role: 'Nöroloji & Dahiliye',
                books: 'Harrison’s 22e · Adams & Victor',
                photo: PHOTOS.elif,
              },
            ].map((spec, i) => (
              <figure key={spec.name} className={`expert reveal${i ? ` reveal-d${i}` : ''}`}>
                <img
                  src={spec.photo}
                  alt={spec.name}
                  width={900}
                  height={1200}
                  loading="lazy"
                />
                <figcaption>
                  <h3>{spec.name}</h3>
                  <div className="role">{spec.role}</div>
                  <div className="books">{spec.books}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="safety">
        <div className="safety-bg" aria-hidden="true">
          <img src={PHOTOS.mehmet} alt="" width={1920} height={1080} loading="lazy" />
        </div>
        <div className="wrap">
          <div className="idx reveal">04 — Güvenlik ağı</div>
          <h2 className="sec-title reveal reveal-d1">
            50 hasta, yorgun bir gün — o asla susmaz.
          </h2>
          <p className="sec-copy reveal reveal-d2">
            Yanlış doz, tehlikeli kombinasyon, atlanmış SGK kısıtlaması — sormadan söyler.
          </p>
          <aside className="safety-quote reveal reveal-d3">
            <div className="warn">Örnek uyarı</div>
            <p>
              “Doktor, bir saniye — bu doz yetişkin dozudur. Nelson’a göre bu kiloda maksimum
              250&nbsp;mg olmalı. Düzelteyim mi?”
            </p>
          </aside>
        </div>
      </section>

      <section id="fiyat">
        <div className="wrap">
          <PricingPlans />
        </div>
      </section>

      <section className="final">
        <div className="final-bg" aria-hidden="true">
          <img src={PHOTOS.ayse} alt="" width={1920} height={1080} loading="lazy" />
        </div>
        <div className="wrap">
          <h2 className="reveal">
            Bugün başlayın.<em>İlk 15 gün ücretsiz.</em>
          </h2>
          <Link className="btn reveal reveal-d1" href="/giris/doktor">
            Ücretsiz hesap aç
          </Link>
          <p className="note reveal reveal-d2">
            Kredi kartı gerekmez · KVKK uyumlu · Türkçe destek
          </p>
        </div>
      </section>

      <footer>
        <div>
          <strong>NOTYA.AI</strong>
        </div>
        <div>© 2026 Dream Türkiye · KVKK uyumlu · Frankfurt, EU</div>
      </footer>
    </main>
  )
}
