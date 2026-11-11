# TR outreach durum (canlı)

**Anti-ban (2026-11-10 24s yasak sonrası):** soft restart **2026-11-13 12:00 TR**’ye kadar.  
Caps: **≥20 dk** aralık · **4/saat** · **6/gün**. Her gönderi unique variant.  
Playbook: `TR-WHATSAPP-ANTI-BAN.md` · log: `tr-wa-send-log.csv` · gate: `python3 scripts/tr-outreach-next.py --check-pace`

**Sıradaki:** Doç. Dr. **Songül Alemdaroğlu** · KD · Adana · `+905339627636`  
(WA-verified · variant `kd-C-4000` · paket W6-21)

**Göndermeden önce:**
1. WhatsApp Business yasağının kalktığını doğrula.
2. `python3 scripts/tr-outreach-next.py --check-pace` → OK.
3. Kişiyi rehbere kaydet → mesajı yapıştır → OG kartı **X** → gönder.
4. Sonraki doktor için **en az 20 dk bekle**; aynı metni tekrar kullanma.
5. `gitti` işaretle:  
   `python3 scripts/tr-outreach-next.py --mark-gitti "Doç. Dr. Songül Alemdaroğlu" --phone +905339627636 --brans kadin-dogum --city Adana --variant-id kd-C-4000`

## Continuous scraper

Pool **~247**; tmux `tr-wa-continuous` çalışıyor.

## Son (2026-11-10) — yasak öncesi yoğun dalga

| Kişi | Telefon | Sonuç |
|------|---------|--------|
| Doç. Dr. Sabri Berkem Ökten | `+905356630757` | **gitti** |
| Doç. Dr. Meral Tuğba Çimşir | `+905468111316` | gitti |

Bu gün ~1/dk + benzer kopya → 24s Business restriction. Tekrar etme.
