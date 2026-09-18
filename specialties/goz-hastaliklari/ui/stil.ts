/** Göz chapter kart stilleri — ayrı modül (GozKartlar ↔ GozKartlarEk döngüsel içe aktarımında TDZ olmasın). */
import type React from 'react';

export const stil = {
  btn: { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 30 } as React.CSSProperties,
  ghost: { background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', minHeight: 28 } as React.CSSProperties,
  etiket: { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 } as React.CSSProperties,
  kucuk: { fontSize: 11, color: '#8FA0B5' } as React.CSSProperties,
  satir: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 } as React.CSSProperties,
  metin: { fontSize: 12, color: '#EDF1F7' } as React.CSSProperties,
};
