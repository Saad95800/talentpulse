"use client";

import React from 'react';
import { 
  Lock, 
  X, 
  Calendar, 
  Zap, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
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
            <h2 className="text-3xl font-black text-main mb-3 tracking-tight">Oups ! Crédits épuisés.</h2>
            <p className="text-slate-600 font-bold mb-8 leading-relaxed">
              Vous avez utilisé vos 3 analyses gratuites. Pour continuer à transformer votre recrutement avec l&apos;IA, passez au niveau supérieur.
            </p>

            <div className="space-y-4 mb-8 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-main">Analyses illimitées</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-main">Export PDF illimité</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-sm font-black text-main">Support prioritaire</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <a 
                href="https://calendly.com/contact-reactivedigital/30min" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                <Calendar className="w-5 h-5" />
                Réserver une démo RH
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
              
              <button 
                onClick={onClose}
                className="w-full bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-sm hover:bg-slate-300 transition-all border border-slate-300"
              >
                Peut-être plus tard
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 py-3 rounded-2xl animate-pulse border border-primary/20">
            <Zap className="w-4 h-4 fill-current" />
            Offre spéciale : 1 mois offert pour les early adopters
          </div>
        </div>
      </div>
    </div>
  );
}
