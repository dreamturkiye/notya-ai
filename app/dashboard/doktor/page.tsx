'use client';

export const dynamic = 'force-dynamic';

import DoktorNav from '@/components/doktor/DoktorNav';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface KPI {
  bugunMuayene: number;
  bekleyenOnay: number;
  buAyToplam: number;
  aktifHasta: number;
}

interface Note {
  id: string;
  specialty: string;
  date: string;
  content_subjektif: string;
  approved_at: string | null;
}

export default function DoktorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doktorAdi, setDoktorAdi] = useState('');
  const [kpi, setKpi] = useState<KPI>({
    bugunMuayene: 0,
    bekleyenOnay: 0,
    buAyToplam: 0,
    aktifHasta: 0,
  });
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      router.push('/giris/doktor');
      return;
    }

    const loadData = async () => {
      try {
        // users/me
        const meRes = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) throw new Error();
        const me = await meRes.json();
        setDoktorAdi(me.name || me.email.split('@')[0]);

        // raporlar
        const raporRes = await fetch('/api/doktor/raporlar', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (raporRes.ok) {
          const r = await raporRes.json();
          setKpi({
            bugunMuayene: r.bugunMuayene || 0,
            bekleyenOnay: r.bekleyenOnay || 0,
            buAyToplam: r.buAyMuayene || 0,
            aktifHasta: r.aktifHasta || 0,
          });
        }

        // Supabase notes
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.auth.setSession({ access_token: token, refresh_token: '' });

        const { data } = await supabase
          .from('notes')
          .select('id,specialty,date,content_subjektif,approved_at')
          .eq('doctor_id', me.id)
          .order('date', { ascending: false })
          .limit(5);

        setRecentNotes(data || []);
      } catch {
        router.push('/giris/doktor');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const getSpecialtyColor = (spec: string) => {
    const colors: Record<string, string> = {
      Kardiyoloji: 'bg-red-100 text-red-700',
      Nöroloji: 'bg-purple-100 text-purple-700',
      Dahiliye: 'bg-blue-100 text-blue-700',
    };
    return colors[spec] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] p-8">
        <div className="max-w-[1200px] mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <DoktorNav />

      {/* SECTION 1: Welcome bar */}
      <div className="h-16 bg-gradient-to-r from-[#0A1628] to-[#0F2942] flex items-center justify-between px-6">
        <div>
          <div className="text-[18px] font-semibold">Hoşgeldiniz, Dr. {doktorAdi}</div>
          <div className="text-sm text-gray-400">{today}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#10B981] rounded-full animate-[pulse_2s_infinite]" />
          <span className="text-[#10B981] text-xs">Sistem aktif</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto">
        {/* SECTION 2: KPI Grid */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Bugünkü Muayene', value: kpi.bugunMuayene, sub: 'hasta bugün', color: '#0F9B8E' },
            { label: 'Bekleyen Onay', value: kpi.bekleyenOnay, sub: 'not onayı bekliyor', color: '#D97706' },
            { label: 'Bu Ay Toplam', value: kpi.buAyToplam, sub: 'muayene bu ay', color: '#2563EB' },
            { label: 'Aktif Hasta', value: kpi.aktifHasta, sub: 'kayıtlı aktif hasta', color: '#10B981' },
          ].map((card, idx) => (
            <div
              key={idx}
              className="bg-white text-black rounded-2xl p-6 border-l-4 transition hover:-translate-y-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              style={{ borderLeftColor: card.color }}
            >
              <div className="text-sm text-gray-500">{card.label}</div>
              <div className="text-[40px] font-bold mt-1">{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* SECTION 3: Quick Actions */}
        <div className="px-6 pb-6 flex gap-3 overflow-x-auto md:flex-wrap">
          {[
            { label: 'Asistanı Aç', path: '/asistan', icon: '🤖' },
            { label: 'Hasta Ekle', path: '/dashboard/doktor/hasta-ekle', icon: '➕' },
            { label: 'Belge Yükle', path: '/dashboard/doktor/belgeler', icon: '📄' },
            { label: 'İnceleme Kuyruğu', path: '/dashboard/doktor/inceleme', icon: '🔍' },
            { label: 'Araçlar', path: '/doktor-tools', icon: '🛠️' },
            { label: 'Raporlar', path: '/dashboard/doktor/raporlar', icon: '📊' },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={() => router.push(btn.path)}
              className="bg-white text-[#1E293B] border-l-[3px] border-[#0F9B8E] rounded-2xl px-5 py-3 text-sm flex items-center gap-2 whitespace-nowrap"
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        {/* SECTION 4: Two columns */}
        <div className="px-6 pb-12 grid grid-cols-1 lg:grid-cols-[60%,40%] gap-4">
          {/* Son Notlar */}
          <div className="bg-white text-black rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold text-base">Son Notlar</div>
              <a href="/dashboard/doktor/inceleme" className="text-[#0F9B8E] text-sm">Tüm Notlar →</a>
            </div>

            {recentNotes.length > 0 ? (
              recentNotes.map((note) => (
                <div key={note.id} className="flex justify-between items-center py-3 border-b last:border-none">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-0.5 rounded-full text-xs ${getSpecialtyColor(note.specialty)}`}>
                      {note.specialty}
                    </span>
                    <span className="text-sm text-gray-700 line-clamp-1 max-w-[280px]">
                      {note.content_subjektif.slice(0, 70)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {note.date}
                    {note.approved_at ? (
                      <span className="text-[#10B981]">✓</span>
                    ) : (
                      <span className="text-amber-500">⏳</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Henüz not yok. Asistanı başlatın.
                <button onClick={() => router.push('/asistan')} className="block mx-auto mt-3 text-[#0F9B8E]">
                  Asistanı Aç
                </button>
              </div>
            )}
          </div>

          {/* Bu Hafta Özeti */}
          <div className="bg-white text-black rounded-2xl p-6">
            <div className="font-semibold mb-4">Bu Hafta Özeti</div>
            {[
              { label: 'Bu Hafta Seans', value: 18, color: '#0F9B8E' },
              { label: 'Onaylanan Not', value: 12, color: '#10B981' },
              { label: 'Bekleyen', value: 4, color: '#D97706' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                  {row.label}
                </div>
                <div className="font-semibold">{row.value}</div>
              </div>
            ))}
            <div className="h-px bg-gray-200 my-4" />
            <div className="text-sm font-medium mb-2">Hızlı Erişim</div>
            <div className="flex gap-4 text-sm">
              <a href="/dashboard/doktor/raporlar" className="text-[#0F9B8E]">Epikriz Üret</a>
              <a href="/dashboard/doktor/inceleme" className="text-[#0F9B8E]">ICD-10 Kodla</a>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pb-8 text-xs text-gray-500">Notya AI 2026 • KVKK Uyumlu</div>

      <style jsx>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  );
}
