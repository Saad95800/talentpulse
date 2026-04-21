"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Ticket, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Tag
} from "lucide-react";
import { getCouponsAction, addCouponAction, deleteCouponAction } from "@/actions/coupon.action";

export default function CouponManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    value: 0,
    type: "FIXED_PRICE"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    const data = await getCouponsAction();
    setCoupons(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Appel asynchrone sécurisé dans useEffect
    const init = async () => {
      await loadCoupons();
    };
    init();
  }, [loadCoupons]);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || newCoupon.value <= 0) return;
    
    setIsSubmitting(true);
    setMessage(null);
    
    const res = await addCouponAction(newCoupon);
    if (res.success) {
      setMessage({ type: 'success', text: "Coupon ajouté avec succès !" });
      setNewCoupon({ code: "", value: 0, type: "FIXED_PRICE" });
      setShowAddForm(false);
      loadCoupons();
    } else {
      setMessage({ type: 'error', text: res.error || "Erreur lors de l'ajout." });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce coupon ?")) return;
    const res = await deleteCouponAction(id);
    if (res.success) {
      loadCoupons();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Ticket className="w-6 h-6 text-blue-500" />
            Gestion des Coupons ProMo
          </h2>
          <p className="text-sm text-slate-400 mt-1">Gérez vos codes de réduction et offres spéciales.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          Nouveau Coupon
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {showAddForm && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
          <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Code Coupon</label>
              <input 
                type="text" 
                placeholder="ex: SOMMER2026"
                value={newCoupon.code}
                onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Type</label>
              <select 
                value={newCoupon.type}
                onChange={e => setNewCoupon({...newCoupon, type: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FIXED_PRICE">Prix Fixe (ex: 1€)</option>
                <option value="DISCOUNT">Réduction (ex: -10€)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valeur (€)</label>
              <input 
                type="number" 
                step="0.01"
                value={newCoupon.value}
                onChange={e => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-white text-slate-950 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Ajout..." : "Confirmer"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800/30 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Valeur</th>
              <th className="px-6 py-4 text-center">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                  Aucun coupon configuré.
                </td>
              </tr>
            ) : coupons.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3 text-blue-400" />
                    <span className="text-white font-bold tracking-wider">{c.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${c.type === 'FIXED_PRICE' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {c.type === 'FIXED_PRICE' ? 'Prix Fixe' : 'Réduction'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white font-medium">
                    {c.type === 'FIXED_PRICE' ? `${c.value.toFixed(2)}€` : `-${c.value.toFixed(2)}€`}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-md uppercase">
                    Actif
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
