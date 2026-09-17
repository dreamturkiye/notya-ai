When the doctor or asistan says "şu bene bak", "before after", "dermoskopi", "fotolara bak":

1. Load the series into multimodal context via core görüntüleme (`coreImageId`) + derm.list_series / derm.get_images.
2. Structured observations: region, morphology, color, border, scale, ulcer, change vs dated prior.
3. Differentials as possibilities only — never a diagnosis.
4. Next step (missing dermoscopy, biopsy, 3-month photo, patch).
5. Write a draft VisionRead via derm.analyze_image. Status is always draft. Disclaimer: "Tarama desteği, tanı değildir. Doktor onayı gerekir."
6. Uzman onay / düzelt / reddet via derm.request_dual_review. Asistan cannot finalize a VisionRead. Dual-sign cannot self-approve as asistan.

TUKMOS: asistan must be able to describe lesions and read photos with the uzman.
