"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyEmailAction } from '@/actions/auth.action';
import { CheckCircle2, XCircle, Loader2, BrainCircuit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification de votre compte...');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Lien de vérification invalide.');
        return;
      }

      try {
        const result = await verifyEmailAction(token);
        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Compte activé !');
        } else {
          setStatus('error');
          setMessage(result.error || 'Cette vérification a échoué.');
        }
      } catch {
        setStatus('error');
        setMessage('Une erreur serveur est survenue.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-slate-100">
        <div className="flex justify-center mb-8">
          <div className="bg-primary p-3 rounded-2xl">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
        </div>

        {status === 'loading' && (
          <div className="space-y-6">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto opacity-20" />
            <h1 className="text-2xl font-bold text-main">{message}</h1>
            <p className="text-muted">Un instant, nous validons vos informations...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-extrabold text-main tracking-tight">C&apos;est tout bon !</h1>
            <p className="text-muted leading-relaxed">
              Votre compte a été activé avec succès. Vous disposez maintenant de 3 crédits pour vos analyses de matching.
            </p>
            <Link 
              href="/"
              className="block w-full bg-primary text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Se connecter maintenant
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-in shake duration-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-main">Oups...</h1>
            <p className="text-red-600 font-medium bg-red-50 p-4 rounded-2xl italic">
              {message}
            </p>
            <p className="text-muted text-sm px-4">
              Ce lien a peut-être déjà été utilisé ou est expiré. Essayez de vous connecter ou contactez le support.
            </p>
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 text-primary font-bold hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Retourner à l&apos;accueil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
