"use client";

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  Download, 
  Zap, 
  Clock
} from 'lucide-react';
import { getPremiumCheckoutUrlAction, getPaymentHistoryAction, cancelSubscriptionAction } from '@/actions/payment.action';

interface PaymentRecord {
  id: string;
  receiptNumber: string;
  createdAt: string | Date;
  amount: number;
  status: string;
}

interface SubscriptionManagerProps {
  userId: string;
  userPlan: string;
  subStatus?: string | null;
  nextBillingDate?: string | Date | null;
  credits: number;
}

export default function SubscriptionManager({ 
  userId, 
  userPlan, 
  subStatus, 
  nextBillingDate, 
  credits 
}: SubscriptionManagerProps) {
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const isPremium = userPlan === 'PREMIUM';

  useEffect(() => {
    if (userId) {
      getPaymentHistoryAction(userId).then(setHistory);
    }
  }, [userId]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await getPremiumCheckoutUrlAction(userId);
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        alert(res.error || "Erreur lors de l'accès au paiement.");
      }
    } catch {
      alert("Une erreur technique est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement Premium ? Vos avantages resteront actifs jusqu'à la prochaine échéance.")) return;
    
    const res = await cancelSubscriptionAction(userId);
    if (res.success) {
      alert(res.message);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Plan Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200 border border-slate-200 relative overflow-hidden">
          {/* Background Decor */}
          <div className={`absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full opacity-5 blur-3xl ${isPremium ? 'bg-primary' : 'bg-slate-400'}`}></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block ${isPremium ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  Plan Actuel
                </span>
                <h2 className="text-4xl font-black text-main">{isPremium ? 'Premium' : 'Gratuit'}</h2>
              </div>
              <div className={`p-4 rounded-3xl ${isPremium ? 'bg-primary/10' : 'bg-slate-100'}`}>
                {isPremium ? <Zap className="w-8 h-8 text-primary" /> : <CreditCard className="w-8 h-8 text-slate-400" />}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <TextLabel icon={<Zap className="w-4 h-4 text-primary" />} label="Crédits Restants" />
                <p className="text-3xl font-black text-main">{credits > 900000 ? 'Illimités' : credits}</p>
                <p className="text-[10px] font-bold text-muted uppercase mt-2">Réinitialisé le prochain mois</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <TextLabel icon={<Calendar className="w-4 h-4 text-primary" />} label="Prochaine Échéance" />
                <p className="text-3xl font-black text-main">
                  {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
                <p className="text-[10px] font-bold text-muted uppercase mt-2">
                  Status: <span className={subStatus === 'active' ? 'text-emerald-500' : 'text-amber-500'}>{subStatus || 'Inactif'}</span>
                </p>
              </div>
            </div>

            {!isPremium ? (
              <button 
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Redirection...' : 'Passer à Premium   39,90€'}
              </button>
            ) : subStatus === 'active' && (
              <button 
                onClick={handleCancel}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                Annuler mon abonnement
              </button>
            )}
          </div>
        </div>

        {/* Benefits Card */}
        <div className="bg-gradient-to-br from-main to-slate-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-main/20 flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            Avantages Premium
          </h3>
          <ul className="space-y-4 flex-1">
            <BenefitItem text="100 Crédits par mois" />
            <BenefitItem text="Batch Matching (5 CV max)" />
            <BenefitItem text="Export PDF Illimité" />
            <BenefitItem text="Support Réactif 24/7" />
            <BenefitItem text="Accès aux nouvelles IA" />
          </ul>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Paiement Sécurisé par</p>
            <p className="text-lg font-black tracking-tighter opacity-50 uppercase">MOLLIE</p>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-main flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary" />
            Historique de Facturation
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">N° Reçu</th>
                <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Montant</th>
                <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Statut</th>
                <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    Aucun paiement trouvé
                  </td>
                </tr>
              ) : history.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 text-xs font-black text-main">{p.receiptNumber}</td>
                  <td className="px-8 py-4 text-xs text-slate-600">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-8 py-4 text-xs font-bold text-main">{p.amount.toFixed(2)} €</td>
                  <td className="px-8 py-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md uppercase">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <a 
                      href={`/api/receipts/${p.id}`} 
                      className="inline-flex items-center gap-2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Télécharger le reçu"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TextLabel({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</span>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-5 h-5 bg-emerald-400/20 rounded-full flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
      </div>
      <span className="text-sm font-medium text-slate-200">{text}</span>
    </li>
  );
}
