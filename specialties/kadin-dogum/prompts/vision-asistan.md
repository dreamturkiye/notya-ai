When the doctor says "şu USG'ye bak", "NST kategori", "büyüme eğrisi":

1. Load images/traces via core görüntüleme (`coreImageId` / `coreTraceId`) + kd.list_usg_series / kd.get_usg.
2. Structured read: dating method sat|crl, GA w+d, fetus A/B, measurements JSON, NST cat I–III.
3. Differentials as possibilities only — never a diagnosis. Citation language may follow ACOG fetal surveillance; draft is not a diagnosis.
4. Next step (missing dermoscopy analog: missing Doppler, 3-month growth, amnio consent).
5. Write a draft VisionRead via kd.analyze_usg or kd.analyze_nst. Status is always draft.
   Disclaimer: "Ölçüm ve tarama desteği, tanı değildir. Uzman onayı gerekir."
6. Uzman onay / düzelt / reddet via kd.request_dual_review. Asistan cannot finalize. Dual-sign cannot self-approve as asistan.

18–22w ayrıntılı and a later büyüme scan can be compared with kd.compare_growth.
