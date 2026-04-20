"use client";

import { useState, useEffect } from "react";
import { 
  User as UserIcon, Mail, Phone, Shield, 
  Star, Ban, CheckCircle2, Save, 
  Plus, Minus, TrendingUp, FileText, 
  Users, History, ArrowLeft, Loader2
} from "lucide-react";
import { getAdminUserDetailAction, updateAdminUserAction, adjustUserCreditsAction } from "@/actions/user.admin.action";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

export default function UserDetailEditor({ token, userId }: { token: string, userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "candidates" | "missions">("info");
  
  // States pour l'édition
  const [formData, setFormData] = useState<any>({});
  const [creditAdjustment, setCreditAdjustment] = useState(1);

  const fetchUser = async () => {
    setLoading(true);
    const res = await getAdminUserDetailAction(token, userId);
    if (res.success && res.user) {
      setUser(res.user);
      setFormData({
        firstName: res.user.firstName || "",
        lastName: res.user.lastName || "",
        email: res.user.email,
        phone: res.user.phone,
        role: res.user.role,
        plan: res.user.plan,
        isActive: res.user.isActive,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, [userId, token]);

  const handleUpdate = async (patch: any) => {
    setSaving(true);
    const res = await updateAdminUserAction(token, userId, patch);
    if (res.success) {
      // Notification succès (optionnel)
      fetchUser();
    }
    setSaving(false);
  };

  const handleAdjustCredits = async (amount: number) => {
    setSaving(true);
    const res = await adjustUserCreditsAction(token, userId, amount);
    if (res.success) {
      fetchUser();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium animat-pulse">Chargement du profil...</p>
      </div>
    );
  }

  if (!user) return <div className="p-10 text-center text-red-500">Utilisateur introuvable.</div>;

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Header avec Actions rapides */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin-talent-scraper/users" 
            className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900">
                {user.firstName} {user.lastName}
              </h1>
              {user.plan === 'PREMIUM' && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black uppercase tracking-wider border border-amber-200 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  Premium
                </span>
              )}
            </div>
            <p className="text-slate-500 font-medium">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.isActive ? (
            <button 
              onClick={() => handleUpdate({ isActive: false })}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <Ban className="w-4 h-4" /> Bannir l&apos;utilisateur
            </button>
          ) : (
            <button 
              onClick={() => handleUpdate({ isActive: true })}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-bold text-sm hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" /> Réactiver le compte
            </button>
          )}
        </div>
      </div>

      {/* Grid Stats Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">Crédits Restants</p>
          <p className="text-3xl font-black text-slate-900">{user.credits}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">Crédits Utilisés</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-blue-600">{user.totalCreditsUsed}</p>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">Candidats</p>
          <p className="text-3xl font-black text-slate-900">{user.candidates.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">Missions</p>
          <p className="text-3xl font-black text-slate-900">{user.missions.length}</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Tabs (Sidebar de la page) */}
        <div className="lg:col-span-3 space-y-2">
          <button 
            onClick={() => setActiveTab("info")}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm ${
              activeTab === 'info' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="w-5 h-5" /> Informations Profil
          </button>
          <button 
            onClick={() => setActiveTab("candidates")}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm ${
              activeTab === 'candidates' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Users className="w-5 h-5" /> Candidats ({user.candidates.length})
          </button>
          <button 
            onClick={() => setActiveTab("missions")}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm ${
              activeTab === 'missions' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-5 h-5" /> Missions ({user.missions.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden min-h-[500px]">
          {activeTab === "info" && (
             <div className="p-8 space-y-10">
                {/* Formulaire Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        < Shield className="w-5 h-5 text-blue-600" /> Profil de base
                      </h3>
                      <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1">Prénom</label>
                               <input 
                                  value={formData.firstName}
                                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                               />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1">Nom</label>
                               <input 
                                  value={formData.lastName}
                                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                               />
                            </div>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1">Email</label>
                            <input 
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 ml-1">Téléphone</label>
                            <input 
                              value={formData.phone}
                              onChange={e => setFormData({...formData, phone: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            />
                         </div>
                         <button 
                           onClick={() => handleUpdate(formData)}
                           disabled={saving}
                           className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                         >
                           {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                           Enregistrer les modifications
                         </button>
                      </div>
                   </div>

                   <div className="space-y-10">
                      {/* Rôle & Plan */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-500" /> Plan & Accès
                        </h3>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-600">Plan d&apos;abonnement</span>
                              <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                                 <button 
                                   onClick={() => handleUpdate({ plan: 'FREE' })}
                                   className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${user.plan === 'FREE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                 >FREE</button>
                                 <button 
                                   onClick={() => handleUpdate({ plan: 'PREMIUM' })}
                                   className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${user.plan === 'PREMIUM' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-amber-600'}`}
                                 >PREMIUM</button>
                              </div>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-600">Rôle système</span>
                              <select 
                                value={user.role}
                                onChange={(e) => handleUpdate({ role: e.target.value })}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                           </div>
                        </div>
                      </div>

                      {/* Gestionnaire de Crédits */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <History className="w-5 h-5 text-emerald-600" /> Gestion des Crédits
                        </h3>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                           <div className="flex items-center justify-between">
                              <span className="text-3xl font-black text-slate-900">{user.credits}</span>
                              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Crédits Actuels</span>
                           </div>
                           <div className="flex gap-2">
                              <input 
                                type="number"
                                value={creditAdjustment}
                                onChange={e => setCreditAdjustment(parseInt(e.target.value) || 0)}
                                className="w-20 px-3 py-3 bg-white border border-slate-200 rounded-xl font-bold text-center outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button 
                                onClick={() => handleAdjustCredits(creditAdjustment)}
                                className="flex-1 bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 font-black text-xs hover:bg-emerald-500 transition-all active:scale-95 shadow-md shadow-emerald-600/10"
                              >
                                <Plus className="w-4 h-4" /> Ajouter
                              </button>
                              <button 
                                onClick={() => handleAdjustCredits(-creditAdjustment)}
                                className="flex-1 bg-red-600 text-white rounded-xl flex items-center justify-center gap-2 font-black text-xs hover:bg-red-500 transition-all active:scale-95 shadow-md shadow-red-600/10"
                              >
                                <Minus className="w-4 h-4" /> Retirer
                              </button>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === "candidates" && (
             <div className="p-0 animate-fadeIn">
               <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                 <h3 className="font-black text-slate-900">Base de Candidats</h3>
                 <p className="text-xs text-slate-500">Liste des {user.candidates.length} profils importés par cet utilisateur.</p>
               </div>
               <div className="divide-y divide-slate-50">
                  {user.candidates.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 italic">Aucun candidat importé.</div>
                  ) : (
                    user.candidates.map((c: any) => (
                      <div key={c.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                            {c.firstName?.[0] || c.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-slate-500">{c.email || "Pas d'email"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importé le</p>
                          <p className="text-xs font-bold text-slate-600">{format(new Date(c.createdAt), "dd/MM/yyyy")}</p>
                        </div>
                      </div>
                    ))
                  )}
               </div>
             </div>
          )}

          {activeTab === "missions" && (
             <div className="p-0 animate-fadeIn">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                 <h3 className="font-black text-slate-900">Offres de Missions</h3>
                 <p className="text-xs text-slate-500">Liste des {user.missions.length} offres créées par cet utilisateur.</p>
               </div>
               <div className="divide-y divide-slate-50">
                  {user.missions.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 italic">Aucune mission créée.</div>
                  ) : (
                    user.missions.map((m: any) => (
                      <div key={m.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="max-w-[400px]">
                            <p className="font-bold text-slate-900 truncate">{m.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{m.description.substring(0, 80)}...</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Créée le</p>
                           <p className="text-xs font-bold text-slate-600">{format(new Date(m.createdAt), "dd/MM/yyyy")}</p>
                        </div>
                      </div>
                    ))
                  )}
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
