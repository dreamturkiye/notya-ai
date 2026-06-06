# Notya AI 🇹🇷

> **Konuş, Biz Yazalım** — Türkiye'nin Evrensel Profesyonel AI Not Asistanı

[![CI/CD](https://github.com/dreamturkiye/notya-ai/actions/workflows/cicd.yml/badge.svg)](https://github.com/dreamturkiye/notya-ai/actions/workflows/cicd.yml)

## 🌐 Ortamlar

| Ortam | Branch | URL |
|-------|--------|-----|
| 🟢 Production | `main` | [notya-ai.vercel.app](https://notya-ai.vercel.app) |
| 🟡 Staging | `staging` | Preview URL (Vercel auto) |
| 🔵 Dev | `dev` | Preview URL (Vercel auto) |

## 💼 Desteklenen Meslekler

| Kategori | Meslekler |
|----------|-----------|
| 🏥 Sağlık | 14 tıbbi uzmanlık (Kardiyoloji, Nöroloji, Psikiyatri, Acil...) |
| ⚖️ Hukuk | 6 hukuk alanı (Ceza, Aile, İş, Ticaret, İcra, Gayrimenkul) |
| 🧠 Ruh Sağlığı | 8 terapi türü (BDT, EMDR, Aile, Travma...) |
| 📊 Mali Müşavirlik | 6 hizmet türü (Vergi, Muhasebe, SGK, Denetim...) |
| 👥 İnsan Kaynakları | Performans, İşe Alım, Disiplin, Kariyer |
| 🏠 Gayrimenkul | Alım, Satım, Kiralama |
| 🛡️ Sigorta | Hayat, Sağlık, Araç, Konut |
| 📚 Eğitim | Okul ve özel danışmanlık |
| 💼 Yönetim | Toplantı ve strateji notları |

## 🔧 Tech Stack

- **Next.js 14** App Router + TypeScript
- **Supabase** EU Frankfurt — KVKK uyumlu
- **Claude API** — AI not üretimi
- **Deepgram** — Gerçek zamanlı Türkçe transkripsiyon
- **iyzico** — Türk ödeme sistemi
- **WhatsApp Business API** — Not teslimi

## ✅ Uyumluluk

- 🇹🇷 KVKK (Kişisel Verilerin Korunması Kanunu)
- 🏥 Sağlık Bakanlığı veri düzenlemeleri
- 🔐 AES-256-GCM şifreleme
- 🌍 EU data residency (Frankfurt)
- 📋 Tam denetim kayıtları

## 💰 Fiyatlandırma

| Plan | Fiyat/ay | Seans | Kullanıcı |
|------|----------|-------|-----------|
| Starter | ₺499 | 50/ay | 1 |
| Pro | ₺1.299 | Sınırsız | 1 |
| Klinik | ₺3.999 | Sınırsız | 5 |
| Hastane | Özel | Sınırsız | Sınırsız |

## 🚀 Kurulum

```bash
git clone https://github.com/dreamturkiye/notya-ai.git
cd notya-ai
npm install
cp .env.example .env.local
# .env.local dosyasını doldurun
npm run dev
```

---
Built with ❤️ by Dream Türkiye
<!-- deploy -->
