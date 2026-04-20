"use client";

import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import PricingGrid from '@/components/PricingGrid';
import { Zap, ShieldCheck, HeartPulse } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-main tracking-tight">
              Une tarification <span className="text-primary italic">simple</span>.
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Choisissez le plan qui correspond à votre volume de recrutement. 
              Pas d'engagement, annulez à tout moment dès que vos besoins changent.
            </p>
          </div>

          <PricingGrid isPublic={true} />

          {/* Trust Section */}
          <div className="mt-24 grid md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-main mb-3">Activation Instantanée</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">Vos crédits sont disponibles immédiatement après le paiement. Pas de délai d'attente.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-main mb-3">Paiement Sécurisé</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">Nous utilisons Mollie pour garantir la sécurité de vos transactions bancaires.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <HeartPulse className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-main mb-3">Sans Engagement</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">Vous pouvez résilier votre abonnement Premium en un clic depuis votre dashboard.</p>
            </div>
          </div>

          {/* FAQ Placeholder */}
          <div className="mt-32 max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-main mb-12 text-center">Questions fréquentes</h2>
            <div className="space-y-6">
              <FAQItem 
                question="Comment fonctionnent les crédits ?" 
                answer="Chaque analyse de CV (matching simple ou groupé) déduit 1 crédit de votre solde. En mode gratuit, vos crédits sont réinitialisés toutes les semaines." 
              />
              <FAQItem 
                question="Puis-je changer de forfait plus tard ?" 
                answer="Bien sûr ! Vous pouvez passer du forfait gratuit au Premium à tout moment. Si vous êtes déjà Premium, vous pouvez résilier pour revenir au mode gratuit à la fin de votre période de facturation." 
              />
            </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200">
      <h4 className="text-lg font-black text-main mb-3">{question}</h4>
      <p className="text-slate-500 font-medium text-sm leading-relaxed">{answer}</p>
    </div>
  );
}
