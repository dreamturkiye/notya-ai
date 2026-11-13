'use client';
/** PREMATURE-MODUL — Araçlar › Prematüre takip planı: hasta seçimi + PrematurPlanPaneli (hasta dosyası sekmesiyle aynı bileşen). */
import React, { useState } from 'react';
import { pediStil, PediHastaSecici, useUrlHasta } from './PediAracKabugu';
import PrematurPlanPaneli from './PrematurPlanPaneli';

export default function PrematurTakipAraci() {
  const [hastaId, setHastaId] = useState('');
  useUrlHasta(setHastaId);
  return (
    <>
      <div style={pediStil.kutu}>
        <div style={pediStil.etiket}>Hasta</div>
        <PediHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
      </div>
      <PrematurPlanPaneli patientId={hastaId} />
    </>
  );
}
