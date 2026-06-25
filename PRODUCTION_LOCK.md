# NOTYA AI — PRODUCTION LOCK

**Locked:** June 25, 2026  
**Tag:** v1.1-production-locked  
**Commit:** e74e8a9  

## Authorization Required

No changes to production (`main` branch) without explicit authorization from Kaan Arioglu (CEO, Dream Türkiye).

## Approved State

All items below are QA-verified and live:

| Module | Status |
|--------|--------|
| Dr. Ayşe — Pediatri voice | ✅ Live |
| Dr. Mehmet — Kardiyoloji MALE voice | ✅ Live |
| Dashboard name display (iPhone/Android) | ✅ Fixed |
| Ana Sayfa removed from mobile nav | ✅ Fixed |
| Epikriz — no Application Error | ✅ Fixed |
| İlaç İnteraksiyon — rebuilt | ✅ Live |
| All mobile pages responsive | ✅ Verified |
| /kayit signup page — 15-day trial | ✅ Live |
| Onboarding — specialty → asistan pairing | ✅ Live |
| Trial API — 15-day professional access | ✅ Live |

## Test Accounts

| User | Email | Role |
|------|-------|------|
| Kaan Arioglu | kaanari@mac.com | Owner |
| Dr. Gokhan Mamur | dr.gokhanmamur@gmail.com | Superadmin / Pediatri |

## Change Process

1. All work goes to `dev` branch only
2. PR created from `dev` → `main`
3. Kaan reviews and approves
4. Merge to `main` triggers Vercel production deploy
