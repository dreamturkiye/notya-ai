'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      router.push('/giris/doktor');
      return;
    }

    const redirectUser = async () => {
      try {
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem('auth-token');
          router.push('/giris/doktor');
          return;
        }

        const data = await res.json();
        const type = data.profession_type;

        if (type === 'doktor') router.push('/dashboard/doktor');
        else if (type === 'mali') router.push('/dashboard/mali');
        else if (type === 'avukat') router.push('/dashboard/avukat');
        else router.push('/giris/doktor');
      } catch {
        localStorage.removeItem('auth-token');
        router.push('/giris/doktor');
      }
    };

    redirectUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full bg-[#0F9B8E] flex items-center justify-center">
          <span className="text-white text-3xl font-bold">N</span>
        </div>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-[#0F9B8E] border-t-transparent animate-spin" />
        </div>
        <p className="text-white text-lg tracking-wide">Yükleniyor...</p>
      </div>
    </div>
  );
}
