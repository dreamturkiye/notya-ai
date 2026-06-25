'use client';

import React from 'react';

const colors = {
  primary: '#00A89D',
  primaryDark: '#008F85',
  dark: '#0A1628',
  light: '#FFFFFF',
  gray: '#F9FAFB',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
};

export default function HomePage() {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 60;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition - bodyRect - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, height: 52,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: colors.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>N</span>
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px' }}>Notya AI</span>
          </div>

          <div style={{ display: 'none', gap: 32, fontSize: 14, color: '#374151' }} className="desktop-nav">
            <a onClick={() => scrollTo('ozellikler')} style={{ cursor: 'pointer' }}>Özellikler</a>
            <a onClick={() => scrollTo('uzmanlar')} style={{ cursor: 'pointer' }}>Uzmanlar</a>
            <a onClick={() => scrollTo('fiyatlar')} style={{ cursor: 'pointer' }}>Fiyatlar</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
            <button style={{ padding: '8px 18px', border: 'none', background: 'transparent', color: '#374151', cursor: 'pointer' }}>Giriş</button>
            <button onClick={() => scrollTo('fiyatlar')} style={{
              padding: '8px 18px', background: colors.primary, color: 'white', border: 'none',
              borderRadius: 6, fontWeight: 500, cursor: 'pointer'
            }}>Ücretsiz Deneyin</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: colors.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '80px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-block', background: 'rgba(0,168,157,0.15)', color: colors.primary,
              padding: '4px 14px', borderRadius: 20, fontSize: 13, marginBottom: 24
            }}>
              Türkiye’nin İlk AI Tıp Uzmanı
            </div>
            <h1 style={{ fontSize: 'clamp(42px, 6vw, 58px)', lineHeight: 1.05, color: 'white', fontWeight: 400, margin: 0 }}>
              Artık yalnız değilsin.<br />
              <span style={{ color: colors.primary, fontWeight: 600 }}>Asistanınız burada.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, maxWidth: 420, margin: '28px 0 40px' }}>
              Her seans için hazır, her zaman öğrenen.
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={() => scrollTo('fiyatlar')} style={{
                background: colors.primary, color: 'white', padding: '14px 32px', borderRadius: 8,
                border: 'none', fontSize: 16, fontWeight: 500, cursor: 'pointer'
              }}>Başla</button>
              <button onClick={() => scrollTo('demo')} style={{
                background: 'transparent', color: 'white', padding: '14px 32px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)', fontSize: 16, cursor: 'pointer'
              }}>Canlı Demo</button>
            </div>
            <div style={{ marginTop: 60, display: 'flex', gap: 28, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <span>Nelson 22e</span><span>Braunwald 12e</span><span>Harrison 22e</span><span>KVKK</span><span>AES-256</span>
            </div>
          </div>

          {/* Chat Mockup */}
          <div style={{ display: 'none' }} className="desktop-chat">
            <div style={{ background: '#111827', borderRadius: 20, padding: 20, boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: colors.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 600 }}>AY</div>
                <div>
                  <div style={{ color: 'white', fontWeight: 500 }}>Prof. Dr. Ayşe Kaya</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>Pediatri • Çevrimiçi</div>
                </div>
              </div>
              <div style={{ background: '#1f2937', borderRadius: 16, padding: 14, marginBottom: 10, color: '#e5e7eb', fontSize: 14 }}>
                4 yaşındaki hastada 39.2° ateş ve öksürük var. Öneriniz?
              </div>
              <div style={{ background: colors.primary, borderRadius: 16, padding: 14, color: 'white', fontSize: 14 }}>
                Nelson 22e ve Harriet Lane 23e’ye göre ampirik tedavi önerisi...
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  <div style={{ width: 4, height: 4, background: '#64748b', borderRadius: '50%', animation: 'typing 1.2s infinite' }}></div>
                  <div style={{ width: 4, height: 4, background: '#64748b', borderRadius: '50%', animation: 'typing 1.2s infinite 0.2s' }}></div>
                  <div style={{ width: 4, height: 4, background: '#64748b', borderRadius: '50%', animation: 'typing 1.2s infinite 0.4s' }}></div>
                </div>
                <span style={{ color: '#64748b', fontSize: 12 }}>Yazıyor...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAT BAR */}
      <div style={{ height: 80, background: 'white', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', justifyContent: 'center', gap: 80, fontSize: 15 }}>
          <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 600 }}>Günlük 2+ hasta daha</span></div>
          <div style={{ width: 1, height: 18, background: '#e5e7eb' }}></div>
          <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 600 }}>Seans başına 12 dakika tasarruf</span></div>
          <div style={{ width: 1, height: 18, background: '#e5e7eb' }}></div>
          <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 600 }}>%94 doktor memnuniyeti</span></div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="ozellikler" style={{ padding: '120px 0', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ color: colors.primary, fontSize: 12, letterSpacing: '1.5px', marginBottom: 12 }}>TEMEL ÖZELLİKLER</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 500, margin: 0 }}>Doktorun ihtiyacı olan her şey, tek yerde.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { icon: '🎙️', title: 'Sesli ve doğal', desc: 'Mikrofona bir kez dokunun. Doğal konuşma ile anında kayıt.' },
              { icon: '📚', title: 'Textbook zekası', desc: 'Nelson, Braunwald ve Harrison’dan anında erişim.' },
              { icon: '🧠', title: 'Öğrenen sistem', desc: 'Her seansla birlikte daha akıllı hale gelir.' }
            ].map((f, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 16, padding: 40, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 52, marginBottom: 24 }}>{f.icon}</div>
                <div style={{ fontSize: 21, fontWeight: 600, marginBottom: 12 }}>{f.title}</div>
                <div style={{ color: '#4B5563', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO SECTION */}
      <section id="demo" style={{ background: colors.dark, padding: '120px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 80, alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: 'clamp(32px, 4.5vw, 42px)', fontWeight: 500, lineHeight: 1.1 }}>Gerçek bir pediatri konsültasyonu.</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, margin: '24px 0 40px' }}>iPhone ekranında canlı klinik senaryo deneyimi.</p>
            <button onClick={() => scrollTo('fiyatlar')} style={{ background: colors.primary, color: 'white', padding: '14px 36px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 500 }}>Şimdi deneyin</button>
          </div>
          {/* iPhone Mockup */}
          <div style={{ background: '#111827', borderRadius: 60, padding: 12, boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)' }}>
            <div style={{ background: '#0f172a', borderRadius: 48, padding: 20, height: 520, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 120, height: 6, background: '#334155', borderRadius: 3 }}></div>
              </div>
              <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16, paddingLeft: 8 }}>Pediatri Konsültasyonu</div>
              <div style={{ background: '#1e2937', borderRadius: 18, padding: 14, marginBottom: 10, fontSize: 14, color: '#e2e8f0' }}>
                4 y.o. hasta, 39.2° ateş, prodüktif öksürük.
              </div>
              <div style={{ background: colors.primary, borderRadius: 18, padding: 14, fontSize: 14, color: 'white' }}>
                Nelson 22e önerisi: Amoksisilin 80mg/kg/gün.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE ASSISTANTS */}
      <section id="uzmanlar" style={{ padding: '120px 0', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ color: colors.primary, fontSize: 12, letterSpacing: '1px', marginBottom: 8 }}>UZMAN ASİSTANLARINIZ</div>
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 34px)', fontWeight: 500 }}>Size atanmış asistanınız sizi bekliyor.</h2>
            <p style={{ maxWidth: 520, margin: '16px auto 0', color: '#4B5563' }}>
              Uzmanlığınıza göre atanan birincil asistanın yanı sıra, konsültasyon için diğer uzmanlara her an erişebilirsiniz.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {/* Primary */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderLeft: `3px solid ${colors.primary}`, borderRadius: 20, padding: 32 }}>
              <div style={{ width: 72, height: 72, background: colors.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 600, marginBottom: 20 }}>AY</div>
              <div style={{ fontWeight: 600, fontSize: 19 }}>Prof. Dr. Ayşe Kaya</div>
              <div style={{ color: '#64748b', marginBottom: 16 }}>Pediatri • Birincil Asistan</div>
              <div style={{ fontSize: 13, color: '#475569' }}>Nelson 22e • Harriet Lane 23e</div>
              <div style={{ marginTop: 20, display: 'inline-block', background: 'rgba(0,168,157,0.1)', color: colors.primary, padding: '2px 10px', borderRadius: 4, fontSize: 12 }}>Birincil Asistan</div>
            </div>
            {/* Konsültasyon */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 20, padding: 32 }}>
              <div style={{ width: 72, height: 72, background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 600, marginBottom: 20 }}>MD</div>
              <div style={{ fontWeight: 600, fontSize: 19 }}>Prof. Dr. Mehmet Demir</div>
              <div style={{ color: '#64748b', marginBottom: 16 }}>Kardiyoloji • Konsültasyon</div>
              <div style={{ fontSize: 13, color: '#475569' }}>Braunwald 12e</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 20, padding: 32 }}>
              <div style={{ width: 72, height: 72, background: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 600, marginBottom: 20 }}>ES</div>
              <div style={{ fontWeight: 600, fontSize: 19 }}>Prof. Dr. Elif Şahin</div>
              <div style={{ color: '#64748b', marginBottom: 16 }}>Nöroloji • Konsültasyon</div>
              <div style={{ fontSize: 13, color: '#475569' }}>Adams &amp; Victor</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: '#64748b' }}>+ 27 uzmanlık alanı konsültasyon için hazır</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#F9FAFB', padding: '120px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px, 3.8vw, 34px)', fontWeight: 500, marginBottom: 60 }}>Üç adımda başlayın.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40 }}>
            {[
              { num: '01', title: 'Kayıt Ol', desc: '2 dakikada hesabınızı oluşturun.' },
              { num: '02', title: 'Asistanınıza Kavuşun', desc: 'Uzmanlığınıza göre atama yapılır.' },
              { num: '03', title: 'Çalışın', desc: 'İlk seansınızı bugün başlatın.' }
            ].map((step, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div style={{ width: 52, height: 52, border: `2px solid ${colors.primary}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: colors.primary, marginBottom: 20 }}>{step.num}</div>
                <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
                <div style={{ color: '#4B5563' }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="fiyatlar" style={{ padding: '120px 0', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 500 }}>Basit ve şeffaf fiyatlandırma.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { name: 'Starter', price: '299', features: ['Tek asistan', '50 seans/ay', 'Temel destek'] },
              { name: 'Pro', price: '799', features: ['Birincil + 2 konsültasyon', 'Sınırsız seans', 'Öncelikli destek'], featured: true },
              { name: 'Klinik', price: '2499', features: ['Tüm uzmanlar', 'Sınırsız seans', 'Kurumsal entegrasyon'] }
            ].map((tier, i) => (
              <div key={i} style={{
                border: tier.featured ? `2px solid ${colors.primary}` : '1px solid #e5e7eb',
                borderRadius: 20, padding: 36, background: tier.featured ? '#fafafa' : 'white',
                boxShadow: tier.featured ? '0 10px 15px -3px rgb(0 0 0 / 0.05)' : 'none'
              }}>
                <div style={{ fontSize: 21, fontWeight: 600 }}>{tier.name}</div>
                <div style={{ margin: '20px 0' }}>
                  <span style={{ fontSize: 42, fontWeight: 600 }}>{tier.price}</span>
                  <span style={{ color: '#6B7280' }}> ₺/ay</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0' }}>
                  {tier.features.map((f, idx) => (
                    <li key={idx} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: colors.primary }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button style={{
                  width: '100%', padding: '14px', background: tier.featured ? colors.primary : '#111827',
                  color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer'
                }}>Başla</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: colors.dark, padding: '80px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ color: 'white', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 500, marginBottom: 32 }}>
            Hemen bugün başlayın.
          </h2>
          <button onClick={() => scrollTo('fiyatlar')} style={{
            background: colors.primary, color: 'white', padding: '16px 52px', borderRadius: 8,
            border: 'none', fontSize: 17, fontWeight: 600, cursor: 'pointer'
          }}>14 gün ücretsiz deneyin</button>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 16 }}>Kredi kartı gerekmez</div>
        </div>
      </section>

      <style jsx>{`
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-chat { display: block !important; }
        }
      `}</style>
    </div>
  );
}
