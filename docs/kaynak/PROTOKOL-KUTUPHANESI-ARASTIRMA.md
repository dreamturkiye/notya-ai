# TR-PROTOKOL-KUTUPHANESI — research log

Research date: **2026-11-24** (Claude, for Kaan). Registry: `lib/kaynaklar/protokolKutuphanesi/belgeler.ts`.

Rules followed:
- Only official sources: saglik.gov.tr subdomains (incl. SB hospital sites under saglik.gov.tr, the SB e-Kütüphane, the SB file
  hosts `dosyahastane` / `dosyamerkez`), hsgm, shgm*, tuseb.gov.tr, sgk.gov.tr, and the societies' own sites.
- An edition / year / Yayın No is recorded **only** when the document's own imprint (künye) or title page was read, or an official
  saglik.gov.tr listing carries the year / revision in the document title. Everything else is `dogrulanamadi` with no edition.
- Where the imprint was read from a society-hosted copy of an SB document (Türk Nöroloji Derneği, Yara Bakımı Derneği), the
  registry's `url` is the SB-hosted file from the official listing and the society copy is named below.
- Not reachable from the research tools (proxy / robots): resmigazete.gov.tr, mevzuat.gov.tr, dosyamerkez.saglik.gov.tr (robots),
  the e-Kütüphane listing pages, tkd.org.tr / temd.org.tr home pages (direct). The monthly cron runs from Vercel and records what
  these answer.

## Official listing used for the SB documents

- **Ereğli Devlet Hastanesi — "Sağlık Bakanlığı Klinik Rehber ve Protokoller"** (page dated 05.05.2026), read in full 2026-11-24:
  https://ereglidh.saglik.gov.tr/TR-1534484/saglik-bakanligi-klinik-rehber-ve-protokoller.html — 37 SB documents linked to
  `https://dosyahastane.saglik.gov.tr/Eklenti/<no>/0/<file>`. Source of every `dh(...)` URL in the registry and of the
  `resmi-liste` year / revision claims below.
- **Eğirdir Kemik Hastalıkları Hastanesi — "Klinik Rehber ve Protokoller"** (page dated 11.02.2026), read in full 2026-11-24:
  https://egirdirkemikhastanesi.saglik.gov.tr/TR-1476202/klinik-rehber-ve-protokoller.html — 15 documents (SSVD 2024 title).
- Background (not an edition source): Eurasian J Health Technol Assess 2021 (dergipark article-file 1814145) — list of SAGEM /
  SHGM protocols 2012–2020 and the SHGM ArGe listing address; SHGM letter "Konu: Klinik Rehber ve Protokol" (sayı 60867207).

## Edition claims (one row per registry entry with an edition)

| Registry id | Edition claim | Read at (URL) | Method |
|---|---|---|---|
| sb-kp-diyabet | Versiyon 1.0 · 2019 · Yayın No. 1151 · ISBN 978-975-590-744-4 · SHGM ArGe-STD; TOC p.1–75 | https://ekutuphane.saglik.gov.tr/Home/GetDocument/567 | kunye |
| sb-kp-migren-2025 | Revizyon No. 01, Ağustos 2025 · Yayın No. 1344 · ISBN 978-975-590-958-5 (orig. 2020 / 1173); TOC | https://noroloji.org.tr/TNDData/Uploads/files/Migren%20Klinik%20Protokol%c3%bc%20(Revizyon)%20(92%20Sayfa).pdf (TND copy) · official file https://dosyahastane.saglik.gov.tr/Eklenti/589502/0/migrenklinikprotokolurevizyon28082025pdfpdf.pdf | kunye |
| sb-kp-migren-2020 | Versiyon 1.0 · 2020 · Yayın No. 1173 · ISBN 978-975-590-772-7 (superseded) | https://ekutuphane.saglik.gov.tr/Home/GetDocument/586 | kunye |
| sb-kp-epilepsi | Versiyon 1.0 · 2021 · Yayın No. 1196 · ISBN 978-975-590-803-8; TOC | https://ekutuphane.saglik.gov.tr/Home/GetDocument/602 | kunye |
| sb-kp-kbh | Versiyon 1.0 · 2020 · Yayın No. 1180 · ISBN 978-975-590-782-6; TOC | https://sivasnumunedh.saglik.gov.tr/Eklenti/297730/0/kronik-bobrek-hastaligi-klinik-protokolupdf.pdf | kunye |
| sb-kp-demir | Versiyon 1.0 · 2020 · Yayın No. 1171 · ISBN 978-975-590-773-4 | https://sivasnumunedh.saglik.gov.tr/Eklenti/250758/0/demir-eksikligi-ve-demir-eksikligi-anemisi--klinik-protokolupdf.pdf | kunye |
| sb-kp-alzheimer-2025 | Revizyon No. 01, Ağustos 2025 · Yayın No. 1342 · ISBN 978-975-590-956-1 (orig. 2020 / 1179); TOC | https://noroloji.org.tr/TNDData/Uploads/files/Alzheimer%20ve%20Di%C4%9Fer%20Demans%20Hastal%C4%B1klar%C4%B1%20Klinik%20Protokol%C3%BC%20(Revizyon)%20(78%20Sayfa).pdf (TND copy) · official file https://dosyahastane.saglik.gov.tr/Eklenti/589466/0/alzheimerkprevizyon28082025pdfpdf.pdf | kunye |
| sb-kp-alzheimer-2020 | Versiyon 1.0 · 2020 · Yayın No. 1179 · ISBN 978-975-590-781-9 (superseded) | https://sivasnumunedh.saglik.gov.tr/Eklenti/297722/0/alzheimer-ve-diger-demans-hastaliklai-klinik-protokolupdf.pdf | kunye |
| sb-kp-sezaryen | First publication June 2022 (revision "-") · Yayın No. 1239 · ISBN 978-975-590-851-9 | https://euk.saglik.gov.tr/Eklenti/43415/0/sezaryenkppdf.pdf | kunye |
| sb-kp-epidermolizis-bulloza | Publication date Ağustos 2025 · revision "-" · Yayın No / ISBN "-" | https://yarabakimidernegi.org.tr/wp-content/uploads/2025/09/EB_KP_05082025.pdf (Yara Bakımı Derneği copy) · official file https://dosyahastane.saglik.gov.tr/Eklenti/589485/0/epidermolizisbullozaebkp25082025pdfpdf.pdf | kunye |
| sb-rehber-guvenli-dogum | Versiyon 1.0 · 1st edition May 2019 · ISBN 978-975-590-715-4 · SHGM Kalite ve Akreditasyon | https://anadolutibbidergisi.saglik.gov.tr/Eklenti/31463/0/dogum-sureci-rehberi--24072019pdf.pdf | kunye |
| sb-kp-kah-2025 | "Revizyon", 2025 — listing file `kahrevizyon25082025`; search index of the document's title page: "2025 KORONER ARTER HASTALIĞI KLİNİK PROTOKOLÜ" | https://ereglidh.saglik.gov.tr/TR-1534484/saglik-bakanligi-klinik-rehber-ve-protokoller.html → https://dosyahastane.saglik.gov.tr/Eklenti/589497/0/kahrevizyon25082025pdfpdf.pdf | resmi-liste |
| sb-kp-ssvd-2024 | Title "Sezaryen Sonrası Vajinal Doğum (SSVD) Klinik Protokolü 2024" | https://egirdirkemikhastanesi.saglik.gov.tr/TR-1476202/klinik-rehber-ve-protokoller.html → https://dosyahastane.saglik.gov.tr/Eklenti/507216/0/sezaryen-sonrasi-vajinal-dogum-ssvd-klinik-protokolu-2024pdf.pdf | resmi-liste |
| sb-kp-rop-2026 | Title "Prematüre Retinopatisi (ROP) Klinik Protokolü 2026" (SB file host name + title page "2026") | https://dosyamerkez.saglik.gov.tr/Eklenti/54446/0/premature-retinopatisi-rop-klinik-protokolu-2026.pdf · listing https://dosyahastane.saglik.gov.tr/Eklenti/592583/0/premature-retinopatisi-roppdf.pdf | resmi-liste |
| sb-kp-obezite-metabolik-cerrahi-2026 | Title "Obezite ve Metabolik Cerrahi Klinik Protokolü 2026" (SB file host name) | https://dosyamerkez.saglik.gov.tr/Eklenti/54708/0/obezite-ve-metabolik-cerrahi-klinik-protokolu-2026.pdf · listing https://dosyahastane.saglik.gov.tr/Eklenti/592582/0/obezite-ve-metabolik-cerrahipdf.pdf | resmi-liste |
| sb-kp-beyin-olumu-2025 | 2025 — search index of the SB file's title page: "2025 … BEYİN ÖLÜMÜNDE NÖRORADYOLOJİK TANI KRİTERLERİ KLİNİK PROTOKOLÜ 2025" | https://dosyamerkez.saglik.gov.tr/Eklenti/51707/0/beyinolumukp01092025pdf.pdf · listing https://dosyahastane.saglik.gov.tr/Eklenti/589469/0/beyinolumukp01092025pdfpdf.pdf | resmi-liste |
| sb-kp-katarakt-2017 | "MAYIS•2017" on the SB file's title page (search index); still the listed version on 05.05.2026 | https://dosyamerkez.saglik.gov.tr/Eklenti/36805/0/kataraktcerrahisiklinikpro1407pdf.pdf · listing https://dosyahastane.saglik.gov.tr/Eklenti/589492/0/kataraktcerrahisiklinikpro1407pdfpdf.pdf | resmi-liste |
| sb-kp-yybu-2026 | Listing title "…Hasta Kabul ve Taburculuk Kriterleri Protokolü (Revizyon 2026)" | https://dosyahastane.saglik.gov.tr/Eklenti/580887/0/yenidogan-yogun-bakim-unitesine-hasta-kabul-ve-taburculuk-kriterleri-protokolu--revizyon-2026pdf.pdf | resmi-liste |
| sb-rehber-cocuk-isitme-2026 | Listing title "Çocuklarda işitme Kayıpları Klinik Rehberi 2026" | https://dosyahastane.saglik.gov.tr/Eklenti/590259/0/cocuklarda-isitme-kayiplari-klinik-rehberi-2026pdf.pdf | resmi-liste |
| sb-rehber-eriskin-isitme-2026 | Listing title "Erişkinlerde işitme Kayıpları Klinik Rehberi 2026" | https://dosyahastane.saglik.gov.tr/Eklenti/590261/0/eriskinlerde-isitme--kayiplari-klinik-rehberi-2026pdf.pdf | resmi-liste |
| hsgm-tuber-2022 | "TÜRKİYE BESLENME REHBERİ (TÜBER) 2022" · Yayın No. 1031 · HSGM; section titles | https://hsgm.saglik.gov.tr/media/attachments/2025/05/12/turkiye-beslenme-rehberi-2022.pdf | kunye |
| hsgm-bobrek-programi-2025 | (2025-2030) · 2025 · Yayın No. 1307 · ISBN 978-975-590-927-1 | https://hsgm.saglik.gov.tr/media/attachments/2025/05/13/turkiye-bobrek-hastaliklari-Onleme-ve-kontrol-programi-2025-2030.pdf | kunye |
| hsgm-hyp-ht-kilavuzu-2025 | "Hipertansiyon Tarama ve İzlem Kılavuzu (Erişkin)", Ankara 2025 (HYP); no Yayın No | https://hsgm.saglik.gov.tr/media/attachments/2025/06/13/ht-tarama-izlem-kilavuzu.pdf | kunye |
| hsgm-hyp-kvr-kilavuzu-2025 | "Kardiyovasküler Risk Değerlendirmesi Kılavuzu", Ankara 2025 (HYP); no Yayın No | https://hsgm.saglik.gov.tr/media/attachments/2025/06/13/kardiyovaskuler-risk-degerlendirmesi-kilavuzu.pdf | kunye |
| hsgm-tip1-diyabet-birinci-basamak | 2018 · Yayın No. 1079 · ISBN 978-975-590-664-5 | https://hsgm.saglik.gov.tr/depo/birimler/saglikli-beslenme-ve-hareketli-hayat-db/Dokumanlar/Rehberler/Birinci_Basamak_SK_Tip_1_Diyabet_Rehberi_duzenlenen.pdf | kunye |
| hsgm-fiziksel-aktivite-2022 | 1st edition June 2022 · Yayın No. 1248 · ISBN 978-975-590-859-5 | https://hsgm.saglik.gov.tr/depo/birimler/saglikli-beslenme-ve-hareketli-hayat-db/Dokumanlar/Kitaplar/Fiziksel_Aktivite_Bilim_Komisyonu_Raporu.pdf | kunye |
| hsgm-sma-tasiyici-tarama-2023 | Ankara 2023 · Çocuk ve Ergen Sağlığı DB | https://hsgm.saglik.gov.tr/depo/birimler/cocuk-ergen-sagligi-db/Programlar/EO_SMA_TASIYICI_TARAMA_PROGRAMI_SAHA_REHBERI.pdf | kunye |
| dernek-turk-hipertansiyon-uzlasi-2025 | "Türk Hipertansiyon Uzlaşı Raporu 2025"; 7 societies; section headings | https://file.temd.org.tr/Uploads/publications/others/TurkHipertansiyonUzlasiRaporu_2025.pdf | kunye |
| dernek-temd-diyabet-teknolojileri-2025 | 1. Baskı (çevrim içi), Nisan 2025 (online 20.04.2025) · ISBN 978-625-99759-4-8 | https://file.temd.org.tr/Uploads/publications/guides/documents/temd-diyabetteknolojilerikilavuzu-2025.pdf | kunye |
| sb-kp-total-diz-2022 | Revizyon No. 01 (Ocak 2022; ilk yayın Ekim 2017) · 2022 · Yayın No. 1219 · ISBN 978-975-590-834-2 · SHGM ArGe-STD (read 2026-11-28, source verification) | https://euk.saglik.gov.tr/Eklenti/42288/0/totaldizartkp05012022pdf.pdf | kunye |
| sb-tb-rehberi-2019 | 2. Baskı, Mayıs 2019 · 2019 · Yayın No. 1129 · ISBN 978-975-590-717-8 · HSGM Tüberküloz DB (read 2026-11-27 from the EKMUD copy) | https://ekmud.org.tr/rehber/indir/94 | kunye |
| sb-izlem-protokolleri-2018 | "Bebek, Çocuk, Ergen İzlem Protokolleri", Ankara 2018 · HSGM Çocuk ve Ergen Sağlığı DB (read 2026-11-27 from the WHO policy-platform copy; no saglik.gov.tr PDF found) | https://platform.who.int/docs/default-source/mca-documents/policy-documents/guideline/TUR-MN-62-02-GUIDELINE-2018-tur-Infant-Child-and-Adolescent-Follow-up-Protocols.PDF | kunye |
| dernek-temd-tiroid-2025 | 8. Baskı, Nisan 2025 (7. baskı Mayıs 2023) · 2025 · ISBN 978-625-95378-1-8; Bölüm 7 p. 85–94 (read 2026-11-28) | https://file.temd.org.tr/Uploads/publications/guides/documents/tiroid2025_11042025.pdf | kunye |
| dernek-temd-adrenal-gonadal-2025 | 18. Baskı (gözden geçirilmiş çevrimiçi), Mayıs 2025 (online 10.05.2025) · 2025 · ISBN 978-625-99759-5-5; 8.8.1–8.8.3 p. 104–112 (read 2026-11-27) | https://file.temd.org.tr/Uploads/publications/guides/documents/AdrenalKilavuz2025.pdf | kunye |
| dernek-tdd-tum-yonleriyle-psoriasis | Mayıs 2020 · TDD yayın dizisi No. 7 · ISBN 978-605-06264-0-7 (book, not a guideline) | https://turkdermatoloji.org.tr/media/files/file/psoriasis-kitap-kucuk.pdf | kunye |
| tuseb-nadir-kas-calistayi-2025 | Workshop 20 October 2025 · TÜSEB TAÇESE report | https://files.tuseb.gov.tr/tacese/files/yayinlar/2026-04-03-09-14-41.pdf | kunye |
| gold-2027 | "2027 GOLD Report and Pocket Guide" (goldcopd.org navigation) · file "GOLD-Report-2027-FINAL-v1.1-20Nov2026" — 2027 Report v1.1, 20 Nov 2026 (read 2026-11-26) | https://goldcopd.org/2026-gold-report-and-pocket-guide/ (page links the 2027 report) | resmi-liste |
| gina-2026 | "2026 GINA Strategy Report" — current edition on ginasthma.org; older reports under "Archived Reports" (read 2026-11-26) | https://ginasthma.org/2026-gina-strategy-report/ · PDF https://ginasthma.org/wp-content/uploads/2026/05/GINA-2026-Strategy-Report-WMS.pdf | resmi-liste |
| ada-soc-2026 | "The American Diabetes Association Releases 'Standards of Care in Diabetes—2026'" — press release 8 Dec 2025: available online as a supplement to the January 2026 issue of Diabetes Care (Vol. 49, Suppl. 1) (read 2026-11-26). Added per Kaan 2026-11-26: Turkish doctors use ADA alongside TEMD; TEMD/SB/SUT keep priority. | https://diabetes.org/newsroom/press-releases/american-diabetes-association-releases-standards-care-diabetes-2026 · https://diabetesjournals.org/care/issue/49/Supplement_1 | resmi-liste |
| kdigo-kbh-2024 | "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease", Kidney International, March 2024; 2027 medications focused update in development (read 2026-11-26) | https://kdigo.org/guidelines/ckd/ | resmi-liste |
| eau-2026 | "EAU Guidelines. Edn. presented at the EAU Annual Congress London 2026" (current edition per the EAU citation page, read 2026-11-26) | https://uroweb.org/guidelines/how-to-cite-the-eau-guidelines/ | resmi-liste |
| erc-2025 | "Guidelines 2025 — the newest edition of the ERC guidelines on resuscitation" (read 2026-11-26) | https://www.erc.edu/science-research/ → https://www.erc.edu/science-research/guidelines/guidelines-2025/ | resmi-liste |
| sgk-sut | "02.10.2026 - Değişiklik Tebliği İşlenmiş Güncel 2013 SUT" | downloaded from https://www.sgk.gov.tr and read in full 2026-10-10 — docs/OPEN-COMMITMENTS.md NOTYA-SUT-RAPOR-01f (branch `kaynak/sut-2026-10-02`) | repo-kaydi |

ESC guidelines (30 registry entries, research 2026-11-26): **docs/kaynak/ESC-KILAVUZLARI.md** (the registry test reads both logs).

## Read, but no edition recorded (`dogrulanamadi`)

| Registry id | What was read | URL |
|---|---|---|
| hsgm-yenidogan-metabolik-tarama | HSGM health-staff training document; no year / edition; screens FKU, KHT, biyotinidaz, KF, KAH, SMA (SMA added May 2022) | https://hsgm.saglik.gov.tr/depo/birimler/cocuk-ergen-sagligi-db/Dokumanlar/Egitim_Dokumanlari/Saglik_Personeli/NTP_Saglik_Personeli.pdf |
| hsgm-yenidogan-isitme-taramasi | "Ulusal Yenidoğan İşitme Taraması Uygulama Rehberi"; no issue date (only Ek 7 list as of 09.07.2014) | https://hsgm.saglik.gov.tr/depo/Mevzuat/Genelgeler/2014-27_Yenidogan_Isitme_Tarama_Programi_Genelgesi.pdf |
| shgm-kalite-sma-gosterge-kartlari | Announcement 14.02.2025 of "Spinal Musküler Atrofi Sağlık Olgusu Gösterge Kartları (S.1)" | https://shgmkalitedb.saglik.gov.tr/TR-107310/spinal-muskuler-atrofi-gosterge-kartlari-yayimlandi.html |
| SB documents on the listing without a readable imprint (hipertansiyon KP, akut iskemik inme rehberi, inme KP, tiroid kanseri KP, prostat kanseri KP, mide KP, kolorektal KP, meme kanseri KR revizyon, KOAH KP, astım KP, pnömokonyoz, anksiyete KP, total kalça / diz KP, diyaliz KP, erişkin YBÜ, çocuk YBÜ, DMD, ebelere yönelik normal doğum, geriatrik sendromlar, kadaverik donör) | Link + file name only; file names carry upload / approval date stamps (e.g. `tiroidkp25082025`), which are not edition statements | Ereğli listing above |

Also read and **not** used as current: Türk Toraks Derneği "Astım Tanı ve Tedavi Rehberi" (2009 update, 2010 reprint —
https://www.toraks.org.tr/uzman/kutuphane/indir/1182); Türkiye Diyabet Programı 2015-2020 (period ended; HSGM Yayın No. 816);
SHGM "Hipertansiyon" Klinik Kalite Standart ve Göstergeleri (https://euk.saglik.gov.tr/Eklenti/45541/0/htpdf.pdf — indicator
cards, not the protocol); Türkiye Psikiyatri Derneği "Psikiyatri Meslek Etiği İlke ve Kuralları" (no version / date in the document).

## Not found in an official source (registry: `dogrulanamadi`, no URL)

DÖBYR (repo says "2026, Yayın No. 1402" — not found online; see OPEN-COMMITMENTS 2026-11-17 KD edition check), Doğum Sonu Bakım,
Acil Obstetrik Bakım, Doğum ve Sezaryen Eylemi, Riskli Gebelikler Yönetim Rehberleri (only university-hosted copies found);
Genişletilmiş Bağışıklama Programı / aşı takvimi genelgesi; Çocuk Palyatif Bakım Rehberi; SB SMA klinik protokolü; Güvenli Cerrahi
Kontrol Listesi (current SKS form); Ulusal Kanser Tarama Standartları; SB travma protokolü; Alkol ve Madde Kullanım Bozuklukları
protokolü; NRP (Türk Neonatoloji Derneği); every society guideline edition except the three above (TEMD DM 2024 is named in TEMD's
own 2025 guide's references, but whether it is the latest edition was not confirmed); the Özel Branşlar regulations (Serbest Meslek
İcrası, İş ve Görev Tanımları, Ayakta Teşhis ve Tedavi, Saç Ekimi Birimleri, Güzellik ve Estetik Amaçlı Sağlık Kuruluşları) —
their RG dates appear only in secondary sources because resmigazete.gov.tr / mevzuat.gov.tr are closed to the research tools.

## Next research pass (owned: Claude; see docs/OPEN-COMMITMENTS.md TR-PROTOKOL-KUTUPHANESI-02)

1. Read the imprints of the listed-but-unconfirmed SB documents (from a machine that can reach dosyahastane / dosyamerkez).
2. Society guideline editions from the societies' own sites (TKD, TEMD, TTD, TND, KLİMİK, TPK, TJOD, TDD, KBB-BBC, TÜD, TOD, TARD,
   TATD, TPD, TTOD, TGD …) — and Özel Branşlar regulations from resmigazete.gov.tr.
3. Section anchors for the remaining most-used documents once their TOC is read.
