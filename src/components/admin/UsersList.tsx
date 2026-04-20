"use client";

import { useState, useEffect } from "react";
import { 
  Users, Search, ChevronLeft, ChevronRight, 
  ShieldCheck, User as UserIcon, Star, 
  ExternalLink, Ban, CheckCircle2, MoreHorizontal
} from "lucide-react";
import { getAdminUsersAction } from "@/actions/user.admin.action";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

export default function UsersList({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getAdminUsersAction(token, page, searchTerm);
    if (res.success) {
      setUsers(res.users || []);
      setPagination(res.pagination || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gérez les comptes, les abonnements et les crédits de vos utilisateurs.
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Rechercher par mail ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm w-full md:w-[320px] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
          />
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Utilisateur</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rôle & Plan</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Crédits (Restants/Totaux)</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Statut</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inscription</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 group-hover:border-blue-200 transition-colors">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="text-xs text-slate-500">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                          {u.role}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit ${
                          u.plan === 'PREMIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.plan === 'PREMIUM' ? <Star className="w-3 h-3 fill-amber-500" /> : null}
                          {u.plan}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-slate-900">{u.credits}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">restants</span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">{u.totalCreditsUsed}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">utilisés</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                          <Ban className="w-3 h-3" /> Banni
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">
                        {format(new Date(u.createdAt), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin-talent-scraper/users/${u.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 hover:shadow-blue-200 active:scale-95"
                      >
                        Gérer <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-6 bg-slate-50/50 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-medium">
              Affichage de <span className="font-bold text-slate-900">{users.length}</span> sur <span className="font-bold text-slate-900">{pagination.total}</span> utilisateurs
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.pages }).map((_, i) => {
                  const p = i + 1;
                  // Logique simple pour ne pas afficher trop de pages
                  if (p === 1 || p === pagination.pages || (p >= page - 1 && p <= page + 1)) {
                    return (
                      <button 
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                          page === p 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === 2 || p === pagination.pages - 1) return <span key={p} className="px-1 text-slate-400">...</span>;
                  return null;
                })}
              </div>
              <button 
                 disabled={page >= pagination.pages}
                 onClick={() => setPage(prev => prev + 1)}
                 className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
