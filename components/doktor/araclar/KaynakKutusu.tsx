'use client';
/**
 * KD-OPERATOR-01 — the SOURCE BOX under a clinical tool of the Türkiye build: body, document (title / number) and year of
 * every source the tool computes or cites, each marked national or international. It is part of the page, so it is on the
 * printout too. Words only arrive as props.
 */
import React from 'react';
import type { Kaynak } from '@/lib/doktor/cerrahiGuvenlikMetinleri';
import { useAracStil } from '@/lib/doktor/aracUi';

export default function KaynakKutusu({ kaynaklar, not }: { kaynaklar: readonly Kaynak[]; not?: string }) {
  const st = useAracStil();
  return (
    <div style={{ ...st.kutu, background: '#FBF8F2' }} data-kaynak-kutusu>
      <div style={st.etiket}>Kaynaklar</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {kaynaklar.map((k, i) => (
          <li key={i} style={{ ...st.kucuk, marginBottom: 4 }}>
            <b>{k.kurum}</b> — {k.belge} ({k.yil}) · {k.tur === 'ulusal' ? 'ulusal kılavuz' : 'uluslararası kaynak'}
          </li>
        ))}
      </ul>
      {not ? <div style={{ ...st.kucuk, marginTop: 6 }}>{not}</div> : null}
      <div style={{ ...st.kucuk, marginTop: 6 }}>Araç hesaplar ve kaynağını gösterir; klinik karar hekimindir.</div>
      <div className="yazdirma-gizle no-print" style={{ marginTop: 10 }}>
        <button type="button" onClick={() => window.print()} style={st.ghost}>Yazdır / PDF</button>
      </div>
    </div>
  );
}
