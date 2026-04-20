"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import UsersList from "@/components/admin/UsersList";

export default function AdminUsersPage() {
  const { user, token, logout, checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/admin-talent-scraper");
        return;
      }
      if (user?.role !== 'ADMIN') {
        router.push("/");
      }
    };
    init();
  }, [checkAuth, router, user]);

  if (!user || !token) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin-talent-scraper/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                T
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                TalentPulse Admin
              </h1>
            </Link>

            <div className="hidden md:flex items-center gap-1">
               <Link 
                href="/admin-talent-scraper/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
               >
                 <LayoutDashboard className="w-4 h-4" /> Dashboard
               </Link>
               <Link 
                href="/admin-talent-scraper/users"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 shadow-lg shadow-blue-600/20 transition-all"
               >
                 <Users className="w-4 h-4" /> Utilisateurs
               </Link>
            </div>
          </div>

          <button 
            onClick={() => { logout(); router.push("/admin-talent-scraper"); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UsersList token={token} />
      </main>
    </div>
  );
}
