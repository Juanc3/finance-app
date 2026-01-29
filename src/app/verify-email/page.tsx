'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] p-4 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617]">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <GlassCard className="border-white/10 bg-slate-900/50 backdrop-blur-xl text-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 ring-1 ring-violet-500/20">
              <Mail className="h-8 w-8 text-violet-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Revisa tu correo</h2>
            <p className="text-slate-400">
              Hemos enviado un enlace de verificación a
              {email ? <span className="block font-medium text-white mt-1">{email}</span> : ' tu dirección de correo'}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <p>Haz clic en el enlace del correo para verificar tu cuenta e iniciar sesión.</p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
