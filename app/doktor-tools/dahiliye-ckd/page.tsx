'use client'
/** DAH-EXCEPTIONAL-01 — Araçlar › KDIGO CKD evreleme. Dahiliye-only (BRANS_DOKTOR_ARACLARI); kapı doktorAraciBransaUygun içinde DahiliyeAracKabugu. */
import DahiliyeAracKabugu from '@/specialties/dahiliye/ui/araclar/DahiliyeAracKabugu'
import CkdAraci from '@/specialties/dahiliye/ui/araclar/CkdAraci'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <DahiliyeAracKabugu route="/doktor-tools/dahiliye-ckd" baslik="KDIGO CKD evreleme" aciklama="eGFR ve UACR ile KDIGO ısı haritası hücresi, kronisite, izlem sıklığı ve sınıf düzeyinde plan; sevk ölçütü oluşursa nefroloji sevk paketini kopyalayın.">
      <CkdAraci />
    </DahiliyeAracKabugu>
  )
}
