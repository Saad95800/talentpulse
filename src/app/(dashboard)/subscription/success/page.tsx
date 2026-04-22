"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Zap, ArrowRight, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { syncPaymentStatusAction } from '@/actions/payment.action';

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    (paymentId || userId || sessionId) ? 'loading' : 'error'
  );
  const [error, setError] = useState<string | null>(
    (paymentId || userId || sessionId) ? null : "Informations de paiement manquantes."
  );

  const handleSync = React.useCallback(async () => {
    try {
      const res = await syncPaymentStatusAction(paymentId || undefined, userId || undefined, sessionId || undefined);
      if (res.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError((res as any).error || "Impossible de valider le paiement.");
      }
    } catch (_err) {
      setStatus('error');
      setError("Une erreur technique est survenue.");
    }
  }, [paymentId, userId, sessionId]);

  useEffect(() => {
    if (paymentId || userId || sessionId) {
      queueMicrotask(() => {
        handleSync();
      });
    }
  }, [paymentId, userId, sessionId, handleSync]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200 border border-slate-100 text-center animate-in fade-in zoom-in duration-500">
        
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-3xl font-black text-main">Validation en cours...</h1>
            <p className="text-slate-500 font-medium">Nous finalisons la configuration de votre accès Premium. Cela ne prend que quelques secondes.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-main tracking-tight">Félicitations !</h1>
              <p className="text-slate-500 font-medium leading-relaxed">
                Votre abonnement **TalentPulse Premium** est désormais actif. Vous avez reçu 300 crédits pour commencer vos recherches.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center gap-4 text-left">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black text-main uppercase tracking-widest mb-0.5">Email envoyé</p>
                <p className="text-xs text-slate-500 font-bold">Un reçu vous a été envoyé par email.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Link 
                href="/dashboard"
                className="w-full py-4 bg-main text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-main/20"
              >
                Accéder au Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                href="/dashboard/matching"
                className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary-hover transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20"
              >
                Lancer un Matching IA
                <Zap className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <CheckCircle2 className="w-12 h-12 rotate-45" />
            </div>
            <h1 className="text-2xl font-black text-main">Petit contretemps...</h1>
            <p className="text-slate-500 font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-100 text-main rounded-2xl font-black hover:bg-slate-200 transition-all"
            >
              Réessayer la synchronisation
            </button>
            <Link href="/dashboard" className="block text-sm font-bold text-slate-400 hover:text-primary transition-colors">
              Retourner au dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
