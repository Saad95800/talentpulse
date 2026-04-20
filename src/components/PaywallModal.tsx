"use client";

import React, { useState } from 'react';
import { 
  Lock, 
  X, 
  Zap, 
  CheckCircle2
} from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-main/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        {/* Header Decor */}
        <div className="h-32 bg-gradient-to-br from-primary via-primary-hover to-indigo-700 p-8 flex justify-between items-start">
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 -mt-10">
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-300 border border-slate-300 text-center">
            <h2 className="text-3xl font-black text-main mb-3 tracking-tight">Passez à la vitesse supérieure !</h2>
            <p className="text-slate-600 font-bold mb-6 leading-relaxed">
              Pour seulement <span className="text-primary text-2xl">39,90€ / mois</span>, libérez toute la puissance de TalentPulse.
            </p>

            <div className="space-y-4 mb-8 text-left max-w-xs mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-main">100 Crédits de matching / mois</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-main">Batch jusqu&apos;à 5 CV par demande</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-main">Export PDF de l&apos;analyse illimité</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-black text-main">Support prioritaire 24/7</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { getPremiumCheckoutUrlAction } = await import('@/actions/payment.action');
                    const userId = (window as unknown as { userId?: string }).userId;
                    if (!userId) {
                      alert("Session expirée. Veuillez vous reconnecter.");
                      setLoading(false);
                      return;
                    }
                    const res = await getPremiumCheckoutUrlAction(userId);
                    if (res.success && res.url) {
                      window.location.href = res.url;
                    } else {
                      alert(res.error || "Erreur lors de l'initialisation du paiement.");
                      setLoading(false);
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Une erreur technique est survenue.");
                  }
                }}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                <Zap className="w-5 h-5" />
                Démarrer l&apos;abonnement Premium
              </button>
              
              <button 
                onClick={onClose}
                className="w-full bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-sm hover:bg-slate-300 transition-all border border-slate-300"
              >
                Peut-être plus tard
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 py-3 rounded-2xl border border-primary/20">
            <Zap className="w-4 h-4 fill-current" />
            Activation instantanée après paiement
          </div>
        </div>
      </div>
    </div>
  );
}
