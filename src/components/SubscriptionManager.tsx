"use client";

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Download, 
  Zap, 
  Clock,
  Sparkles
} from 'lucide-react';
import { getPremiumCheckoutUrlAction, getPaymentHistoryAction, cancelSubscriptionAction } from '@/actions/payment.action';

import PricingGrid from '@/components/PricingGrid';

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
  const [coupon, setCoupon] = useState("");
  const isPremium = userPlan === 'PREMIUM';

  useEffect(() => {
    if (userId) {
      getPaymentHistoryAction(userId).then(setHistory);
    }
  }, [userId]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await getPremiumCheckoutUrlAction(userId, coupon);
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Current Status Banner (Optional, keeping it clean) */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isPremium ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
            {isPremium ? <Zap className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut de votre compte</p>
            <h2 className="text-xl font-black text-main flex items-center gap-2">
              {isPremium ? 'Membre Premium' : 'Utilisateur Gratuit'}
              {subStatus === 'active' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Crédits disponibles</p>
          <p className="text-xl font-black text-primary">{credits > 900000 ? 'Illimités' : credits}</p>
        </div>
      </div>

      {/* Coupon Section */}
      {!isPremium && (
        <div className="bg-slate-50 rounded-[2rem] p-8 border-2 border-dashed border-slate-200 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-main">Vous avez un code promo ?</p>
              <p className="text-xs text-slate-500 font-medium">Saisissez-le ici pour bénéficier d'une réduction immédiate.</p>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Ex: ONE"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              className="w-full md:w-64 px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-main uppercase tracking-widest placeholder:text-slate-300 placeholder:normal-case placeholder:tracking-normal"
            />
          </div>
        </div>
      )}

      {/* Pricing Comparison Grid */}
      <PricingGrid 
        isPremium={isPremium}
        subStatus={subStatus}
        nextBillingDate={nextBillingDate}
        onUpgrade={handleUpgrade}
        onCancel={handleCancel}
        loading={loading}
      />

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

