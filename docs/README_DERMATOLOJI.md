# README_DERMATOLOJI — Dermatoloji eksik paket (NOTYA-DERM-02, 2026-09-16)

**Audit result:** the chapter already had (Cursor clinic-fit): lezyon + vücut haritası + foto serisi (aynı lezyon_id), dermoskopi galerisi, PASI/EASI/DLQI/UAS7/SALT/PDAI skor anları (spark vs önceki), fototerapi defteri (cihaz, J/cm², kümülatif doz, yanık), yama kursları (48/96 s okuma takvimi), izotretinoin GOP motoru, biyolojik TB/HBV alanları, onam paneli, karar kartları, vision reads. Built only the gaps; nothing duplicated. **Visibility: dermatoloji only** — partograf/C-S/NST/ikili tarama never appear here.

| Ticket | Built (gap) | Improvement |
|---|---|---|
| A. Lezyon + dermoskopi | `derm_lezyonlar` gains size_mm, ABCDE, dermoskop notu/uyarı, çirkin ördek, engine draft, **resmi tanı (hekim)**, acil, patoloji bağı | `lezyonDegerlendir()`: ≥3 ABCDE or dermoscopy alert or ugly-duckling → **melanom şüphesi = acil bayrak + sevk görevi**, shave biopsy explicitly discouraged; asistan tanı koymaz. Görüntü raporu = Belgeler › Asistana raporla (Derm Foundation / Claude, engines unchanged — no new weights) |
| B. Biyopsi paketi | `derm_islemler` (punch/shave/eksizyon) with onam snapshot into `onamlar`, işlem notu alanları (anestezi, punch mm/sınır mm, sütür, hemostaz, numune etiketi), sütür + patoloji görevleri | Patoloji sonucu **aynı lezyon_id'ye** ve işlem satırına bağlanır, günün notuna düşer; Path belge → Belgeler › Asistana raporla (hekim kilitler) |
| C. Skorlar | already there | — |
| D. Fototerapi | already there | — |
| E. Yama | already there | — |
| F. Küçük cerrahi | kriyo / koter / tırnak avülsiyonu / siğil / küretaj in the same table with **template wound-care instructions** and a kontrol görevi per kind | Templates are derm's; the checklist shell is shareable with genel cerrahi later |
| G. İlaç güvenlik | **İzotretinoin gate**: kadın hasta → son 30 gün negatif β-hCG **onaylı labdan** + korunma onamı, else refused; aylık β-hCG görevi; **cross-specialty task written to jine_gorevleri** so kadın-doğum sees it for the same patient. **Biyolojik gate**: IGRA/PPD (≤12 ay), HBsAg, Anti-HBc, Anti-HCV, HIV, hemogram/ALT from approved labs + approved CXR report; positives → latent TB / HBV profilaksi warnings; start refused when incomplete | New canonical lab keys: IGRA, HBsAg, AntiHBs, AntiHBc, AntiHCV, HIV, PPD (metin sonuçlar) |
| H. Pediatrik | atopik / hemanjiom / pişik templates; if the patient is a bebek (bebek_kartlari.bebek_patient_id) the task is also written to the bebek kartı (pediatri/Ayşe görür) | — |
| I. Kozmetik | tab **off by default** ("+ Kozmetik" reveals it); botoks / dolgu / lazer onam stubs only; no AI | — |

Files: `specialties/dermatoloji/engines/derm-spine.ts` (+ 4 tests), API `/api/doktor/dermatoloji/spine` (adim: lezyon_degerlendir | lezyon_tani | onam | islem | islem_patoloji | biyolojik_kapisi | biyolojik_basla | izotretinoin_basla | pediatrik | gorev), UI `specialties/dermatoloji/ui/DermSpine.tsx` mounted in `components/doktor/HastaDermatoloji.tsx`, migration `032_derm_spine.sql` (derm_lezyonlar columns, derm_islemler, derm_ilac_guvenlik, derm_gorevleri).
