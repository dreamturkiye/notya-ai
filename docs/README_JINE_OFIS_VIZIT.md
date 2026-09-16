# README_JINE_OFIS_VIZIT — Bugünkü jinekoloji muayenesi (NOTYA-JINE-OFIS, 2026-09-16)

**Gold:** ACOG (practice). **Ulusal:** DÖBYR / SB KETEM tarama. **Textbook:** Williams / Berek & Novak / Temel KD. Çelişki = iki sütun, birleştirilmez. TR UI (Temel KD muayenehane tonu).

## Neden
Prod E2E (2026-09-16): ofis jine yalnız modül kartlarıydı. Bu paket **tek oturumda biten ziyaret omurgası** ekler; V1/V2 hastalık kartları isteğe bağlı kalır.

## Omurga (Jinekoloji modu)
1. Hikaye — şikayet, süre, jine SAT, G/P, ilaç, allerji, kontrasepsiyon  
2. Muayene — spekulum / bimanuel / TVUS + serbest  
3. Değerlendirme / Plan (A/P)  
4. Tarama / patoloji — Pap/HPV / sitoloji / histoloji + due cue (SB vs ofis ayrı satır)  
5. Görüntü / kolposkopi — Görüntüleme derin bağlantısı; boş CTA  
6. Reçete / işlem — mevcut ilaç/seans; Medula yok  
7. Kontrol / sonraki randevu — tarih + neden + randevu CTA  

**Sticky jine şerit:** Jine SAT, yaş, kontrasepsiyon, Pap/HPV due, sonraki kontrol. **Gebelik GA/TDT yok.** Aktif gebe ise tek satır çip: «Aktif gebelik → Klinik/Doğum spine».

Taşıma: son vizitten kronik sorun / G/P / SAT / ilaç / allerji / kontrasepsiyon / Pap slot; bugünün şikayet-muayene-planı boş kalır.

## Persist
`jine_vizitler.soap` jsonb + `kontrol_tarihi` / `kontrol_neden` (migration **034**). `specialty_records.payload` kullanılmaz. API `adim: ofis_vizit`.

## Audit
- Klinik sevk: «öneri yok» durum olarak kalır; **Sevk oluştur / not ekle** her zaman var (`gebelik` action `sevk` → `sevkler` + günün notu).
- Tarih alanları `gg.aa.yyyy` (`TrTarihAlan`); `mm/dd/yyyy` yok.
- Doğum Gerçekleşti / Lohusa kapıları aynı.

## Uygula-sonra-QA
Paylaşılan Supabase’te `lib/db/migrations/034_jine_ofis_vizit.sql` uygulanmadan persist QA yapılmaz. PR #255 yenidoğan `029` kullanır; main’de 029 zaten dogum spine — bu paket **034**.
