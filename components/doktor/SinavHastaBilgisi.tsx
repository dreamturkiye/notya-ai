/**
 * PEDIATRI-SINAV-01 — muayene ekranı hasta bilgi satırı (sunum bileşeni). Karar mantığı lib/doktor/sinavHastaBilgisi.ts'te;
 * bu bileşen yalnız `sinavHastaBilgisi()` çıktısını çizer, branşa kendisi bakmaz.
 */
import React from "react"
import type { SinavHastaBilgisi as Bilgi } from "@/lib/doktor/sinavHastaBilgisi"

export default function SinavHastaBilgisi({ bilgi }: { bilgi: Bilgi }) {
  const { adSoyad, cinsiyet, yas, ebeveyn, goster } = bilgi
  if (!goster || (!adSoyad && !cinsiyet && !yas && !ebeveyn)) return null
  const parcalar = [cinsiyet, yas].filter(Boolean).join(" · ")
  return (
    <div data-testid="sinav-hasta-bilgisi" style={{ background: "#faf6ee", border: "1px solid rgba(58,44,34,0.08)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, color: "#3b2e24" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", alignItems: "baseline" }}>
        {adSoyad && <span style={{ fontSize: 16, fontWeight: 600 }}>{adSoyad}</span>}
        {parcalar && <span style={{ fontSize: 14, color: "#6d6055" }}>{parcalar}</span>}
      </div>
      {ebeveyn && (
        <div style={{ fontSize: 13, color: "#6d6055", marginTop: 4 }}>
          {ebeveyn.anne && <span>Anne: {ebeveyn.anne}</span>}
          {ebeveyn.anne && ebeveyn.baba && <span> · </span>}
          {ebeveyn.baba && <span>Baba: {ebeveyn.baba}</span>}
        </div>
      )}
    </div>
  )
}
