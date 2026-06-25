'use client';

import React, { useEffect, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

interface PendingNote {
  id: string;
  maskedPatient: string;
  specialty: string;
  date: string;
  subjektif: string;
}

export default function IncelemePage() {
  const [notes, setNotes] = useState<PendingNote[]>([]);

  useEffect(() => {
    const _raw = localStorage.getItem('auth-token') || localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('sb-'))||''); const token = _raw ? (() => { try { return JSON.parse(_raw).access_token || _raw } catch { return _raw } })() : null;
    fetch('/api/notes?pending=true', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setNotes);
  }, []);

  const approve = async (id: string) => {
    const _raw = localStorage.getItem('auth-token') || localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('sb-'))||''); const token = _raw ? (() => { try { return JSON.parse(_raw).access_token || _raw } catch { return _raw } })() : null;
    await fetch(`/api/notes/${id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>İnceleme Kuyruğu</h1>
        
        {notes.map(note => (
          <div key={note.id} style={{ background: '#1E2937', padding: 20, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>{note.maskedPatient} • {note.specialty} • {note.date}</div>
              <div>
                <button onClick={() => approve(note.id)} style={{ background: '#10B981', padding: '6px 14px', borderRadius: 6, color: 'white', border: 'none', marginRight: 8 }}>Onayla</button>
                <button style={{ background: '#EF4444', padding: '6px 14px', borderRadius: 6, color: 'white', border: 'none' }}>Reddet</button>
              </div>
            </div>
            <div style={{ marginTop: 12, color: '#94A3B8' }}>{note.subjektif.substring(0, 120)}...</div>
          </div>
        ))}
      </div>
    </div>
  );
}
