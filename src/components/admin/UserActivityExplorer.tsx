"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Users, 
  Clock, 
  MousePointer2, 
  Map as MapIcon, 
  Eye, 
  ExternalLink, 
  Search,
  ChevronRight,
  User as UserIcon,
  Zap,
  CreditCard
} from "lucide-react";
import { getAllUsersAdminAction, getUserDetailedActivityAdminAction } from "@/actions/activity.action";

interface AdminUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
  role: string;
  credits: number;
}

interface AdminActivity {
  id: string;
  type: string;
  description: string;
  path: string;
  target?: string;
  createdAt: string | Date;
}

interface SelectedUserDetail extends AdminUser {
  matches: Record<string, unknown>[];
  activities: AdminActivity[];
}

interface UserActivityExplorerProps {
  token: string;
}

export default function UserActivityExplorer({ token }: UserActivityExplorerProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SelectedUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await getAllUsersAdminAction(token);
    if (res.success && res.users) {
      setUsers(res.users as AdminUser[]);
    }
    setLoading(false);
  }, [token]);

  const loadUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    const res = await getUserDetailedActivityAdminAction(token, userId);
    if (res.success && res.user) {
      setSelectedUser(res.user as SelectedUserDetail);
    }
    setLoadingDetails(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.lastName && u.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Liste des Utilisateurs (Col 4) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Chercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              />
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => loadUserDetails(u.id)}
                className={`w-full p-4 text-left border-b border-slate-800/50 transition-all flex items-center gap-3 hover:bg-blue-500/5 group ${
                  selectedUser?.id === u.id ? "bg-blue-500/10 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${selectedUser?.id === u.id ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"}`}>
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}` : (u.name || "--")}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${selectedUser?.id === u.id ? "rotate-90 text-blue-500" : "group-hover:translate-x-1"}`} />
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm italic">Aucun utilisateur trouvé</div>
            )}
          </div>
        </div>
      </div>

      {/* Profil & Historique (Col 8) */}
      <div className="lg:col-span-8">
        {!selectedUser ? (
          <div className="h-[600px] bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-4">
            <div className="p-4 bg-slate-900/50 rounded-full border border-slate-800">
              <Users className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium">Sélectionnez un utilisateur pour voir son activité</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header Profil */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Zap className="w-32 h-32 text-blue-500" />
              </div>
              <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                  <UserIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">
                    {selectedUser.firstName || selectedUser.lastName ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}` : (selectedUser.name || "--")}
                  </h3>
                  <p className="text-slate-400 flex items-center gap-2">
                    {selectedUser.email}
                    {selectedUser.role === 'ADMIN' && <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-full border border-purple-500/20 uppercase tracking-tighter">Admin</span>}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 w-full md:w-auto">
                    <div className="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-emerald-500" />
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Crédits</p>
                            <p className="text-sm font-bold text-white">{selectedUser.credits}</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center gap-3">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Matchings</p>
                            <p className="text-sm font-bold text-white">{selectedUser.matches.length}</p>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* Onglets d'activité */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex border-b border-slate-800">
                <button className="px-6 py-4 text-sm font-bold text-blue-400 border-b-2 border-blue-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Timeline d&apos;Activité
                </button>
              </div>

              <div className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                {loadingDetails ? (
                  <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-slate-500 text-sm">Chargement de l&apos;historique...</p>
                  </div>
                ) : selectedUser.activities.length === 0 ? (
                  <div className="p-20 text-center text-slate-500 italic text-sm">
                    Aucune activité enregistrée pour cet utilisateur.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {selectedUser.activities.map((act: AdminActivity) => (
                      <div key={act.id} className="p-4 flex items-start gap-4 hover:bg-slate-800/30 transition-colors group">
                        <div className={`mt-1 p-2 rounded-lg ${
                          act.type === 'PAGE_VIEW' ? "bg-purple-500/10 text-purple-400" :
                          act.type === 'CLICK' ? "bg-blue-500/10 text-blue-400" :
                          act.type.includes('SUCCESS') ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-amber-500/10 text-amber-400"
                        }`}>
                          {act.type === 'PAGE_VIEW' ? <Eye className="w-4 h-4" /> :
                           act.type === 'CLICK' ? <MousePointer2 className="w-4 h-4" /> :
                           <Zap className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{act.type}</span>
                            <span className="text-[10px] text-slate-600 font-medium">{format(new Date(act.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</span>
                          </div>
                          <p className="text-sm font-medium text-white mb-1">{act.description}</p>
                          <div className="flex items-center gap-4 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1"><MapIcon className="w-3 h-3" /> {act.path}</span>
                            {act.target && act.target !== 'N/A' && (
                              <span className="flex items-center gap-1 italic"><ExternalLink className="w-3 h-3" /> Cible: {act.target}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
