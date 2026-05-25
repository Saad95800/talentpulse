"use client";

import { useAuth } from "@/hooks/useAuth";
import { Zap, ArrowRight, X, Star } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function LowCreditsBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Pas d'affichage si : pas côté client, pas connecté, admin, ou reste des crédits
  if (!mounted || !user || user.role === 'ADMIN' || user.credits > 0 || !isVisible) {
    return null;
  }

  return (
    <div className="relative group animate-slideDown">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-[1px] rounded-b-3xl shadow-2xl shadow-blue-500/20">
        <div className="bg-slate-900/90 backdrop-blur-xl px-4 py-3 md:py-2 rounded-b-[23px] flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 overflow-hidden relative">
          
          {/* Effets de lumière en fond */}
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none"></div>

          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
             </div>
             <p className="text-white text-sm font-medium">
               <span className="font-black text-blue-400 uppercase tracking-widest text-[10px] mr-2">Alerte</span>
               Votre solde de crédits est épuisé.
             </p>
          </div>

          <div className="flex items-center gap-4">
             <Link 
               href="/dashboard?tab=premium" 
               className="group/btn flex items-center gap-2 bg-white text-slate-900 px-5 py-2 rounded-full text-xs font-black hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-95"
             >
                {user.plan === 'FREE' ? "Passer au Plan Premium" : "Recharger mes crédits"}
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
             </Link>
             
             <button 
               onClick={() => setIsVisible(false)}
               className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
               title="Fermer"
             >
                <X className="w-4 h-4" />
             </button>
          </div>

          {/* Décoration Star */}
          <div className="hidden lg:block absolute -right-4 -top-4 opacity-10">
             <Star className="w-16 h-16 text-white rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
