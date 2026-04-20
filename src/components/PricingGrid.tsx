"use client";

import React from 'react';
import { 
  Zap, 
  CheckCircle2, 
  Download, 
  Clock,
  ArrowRight
} from 'lucide-react';

import ConfirmationModal from './ConfirmationModal';

interface PricingGridProps {
  isPremium?: boolean;
  subStatus?: string | null;
  nextBillingDate?: string | Date | null;
  onUpgrade?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  isPublic?: boolean;
}

export default function PricingGrid({
  isPremium = false,
  subStatus,
  nextBillingDate,
  onUpgrade,
  onCancel,
  loading = false,
  isPublic = false
}: PricingGridProps) {
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  
  const handlePublicCTA = () => {
    // Si public, on scrolle vers l'inscription ou on redirige
    const registerSection = document.getElementById('register');
    if (registerSection) {
      registerSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/?mode=register';
    }
  };

  const primaryAction = isPublic ? handlePublicCTA : onUpgrade;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
        
        {/* FREE PLAN */}
        <div className={`relative flex flex-col p-10 rounded-[3rem] border-2 transition-all ${!isPremium ? 'border-slate-300 bg-white shadow-xl' : 'border-slate-100 bg-slate-50/50 opacity-80'}`}>
          {!isPremium && !isPublic && (
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
               Actif
             </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-2xl font-black text-main mb-2">Forfait Gratuit</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Découvrez la puissance de TalentPulse sans frais.</p>
          </div>

          <div className="mb-10 flex items-baseline gap-1">
            <span className="text-5xl font-black text-main">0€</span>
            <span className="text-slate-400 font-bold">/mois</span>
          </div>

          <ul className="space-y-5 flex-1 mb-10">
            <BenefitItem text="3 Crédits par semaine" icon={<Zap className="w-4 h-4 text-amber-500" />} />
            <BenefitItem text="Analyse Groupée (3 CV max)" icon={<Clock className="w-4 h-4 text-slate-400" />} />
            <BenefitItem text="Export PDF Illimité & Gratuit" icon={<Download className="w-4 h-4 text-emerald-500" />} />
            <BenefitItem text="Matching Intelligent IA" />
            <BenefitItem text="Support standard" />
          </ul>

          <div className="pt-6 border-t border-slate-100">
            <button 
              disabled={!isPremium && !isPublic}
              onClick={isPublic ? handlePublicCTA : undefined}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 border-slate-200 text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {isPublic ? 'Démarrer gratuitement' : (!isPremium ? 'Votre offre actuelle' : 'Offre de base')}
            </button>
          </div>
        </div>

        {/* PREMIUM PLAN */}
        <div className={`relative flex flex-col p-10 rounded-[3rem] border-2 transition-all ${isPremium ? 'border-primary bg-white shadow-2xl scale-[1.02]' : 'border-slate-200 bg-white hover:border-primary/50 shadow-xl'}`}>
          {isPremium && subStatus === 'active' && (
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
               Abonnement Actif
             </div>
          )}
          {!isPremium && (
             <div className="absolute -top-4 right-10 bg-amber-400 text-slate-900 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-400/20">
               Recommandé
             </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-2xl font-black text-main mb-2">Forfait Premium</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Boostez votre productivité et gérez plus de candidatures.</p>
          </div>

          <div className="mb-10 flex items-baseline gap-1">
            <span className="text-5xl font-black text-primary">39,90€</span>
            <span className="text-slate-400 font-bold">/mois</span>
          </div>

          <ul className="space-y-5 flex-1 mb-10">
            <BenefitItem text="300 Crédits par mois" icon={<Zap className="w-4 h-4 text-amber-500 fill-amber-500" />} isStrong />
            <BenefitItem text="Analyse Groupée (10 CV max)" icon={<Zap className="w-4 h-4 text-primary" />} isStrong />
            <BenefitItem text="Export PDF Illimité & Gratuit" icon={<Download className="w-4 h-4 text-emerald-500" />} />
            <BenefitItem text="Support Prioritaire 24/7" icon={<CheckCircle2 className="w-4 h-4 text-primary" />} />
            <BenefitItem text="Aucune limite journalière" />
          </ul>

          <div className="pt-6 border-t border-slate-100">
            {!isPremium ? (
              <button 
                onClick={primaryAction}
                disabled={loading}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-primary-hover hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                {loading ? 'Redirection...' : (isPublic ? 'S\'abonner maintenant' : 'Passer à Premium')}
                <Zap className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 mb-4 italic">Prochain prélèvement le {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('fr-FR') : 'N/A'}</p>
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors uppercase tracking-widest border-b border-transparent hover:border-red-200 pb-1"
                >
                  Résilier mon abonnement
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      <ConfirmationModal 
        isOpen={showCancelModal}
        title="Résilier l'abonnement"
        message="Êtes-vous sûr de vouloir annuler votre abonnement Premium ? Vos avantages resteront actifs jusqu'à la prochaine échéance."
        confirmLabel="Confirmer la résiliation"
        cancelLabel="Garder mon abonnement"
        onConfirm={() => {
          if (onCancel) onCancel();
          setShowCancelModal(false);
        }}
        onCancel={() => setShowCancelModal(false)}
        isLoading={loading}
        type="warning"
      />
    </>
  );
}

function BenefitItem({ text, icon, isStrong }: { text: string, icon?: React.ReactNode, isStrong?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      {icon ? (
        <div className={`p-1 rounded-md ${isStrong ? 'bg-primary/10' : 'bg-slate-100'}`}>
          {icon}
        </div>
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      )}
      <span className={`text-sm ${isStrong ? 'font-black text-main' : 'font-medium text-slate-600'}`}>{text}</span>
    </li>
  );
}
