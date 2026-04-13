"use client";

import React from 'react';
import { 
  FileSearch, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  BrainCircuit,
  BarChart3
} from "lucide-react";

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { X } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);

  // Redirection automatique vers le dashboard si déjà connecté
  React.useEffect(() => {
    if (isLoggedIn) {
      router.push('/dashboard');
    }
  }, [isLoggedIn, router]);

  const handleStart = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      setIsRegisterOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Navbar Minimaliste */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="group bg-primary p-2 rounded-xl">
                <BrainCircuit className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <span className="text-xl font-bold text-main tracking-tight">
                Talent<span className="text-primary">Matcher</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-sm font-medium text-muted hover:text-main transition-colors mr-4 hidden md:block">
                Comment ça marche ?
              </button>
              <button 
                onClick={handleStart}
                className="bg-main text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm"
              >
                Essayer gratuitement
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Cercles de décoration en arrière-plan */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6 animate-bounce">
            <Zap className="w-3 h-3 fill-current" />
            Nouveau : Propulsé par Claude 3.5 Sonnet
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-main mb-8 tracking-tight leading-[1.1]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Matchez vos talents
            </span> <br />
            à la vitesse de l'IA.
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted mb-10 leading-relaxed">
            Évaluez instantanément la pertinence de n'importe quel candidat. 
            Économisez 80% de votre temps de sourcing grâce à notre algorithme de matching intelligent.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleStart}
              className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/25"
            >
              Analyser un CV gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={handleStart}
              className="w-full sm:w-auto bg-white text-main border border-slate-200 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              Voir une démo
            </button>
          </div>

          {/* Social Proof Placeholder */}
          <div className="mt-16 pt-8 border-t border-slate-100 italic text-muted/60 text-sm">
            Déjà +1,000 recrutements facilités par l'IA
          </div>
        </div>
      </section>

      {/* Modale d'Inscription */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-main/40 backdrop-blur-sm"
            onClick={() => setIsRegisterOpen(false)}
          />
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsRegisterOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <LeadCaptureForm onSuccess={() => router.push('/dashboard')} />
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-main mb-4">Pourquoi choisir TalentMatcher ?</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Nous combinons la puissance du NLP et du Deep Learning pour une analyse objective et sans biais.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-primary" />}
              title="Analyse Instantanée"
              description="Extraction et analyse du texte en moins de 5 secondes. Dites adieu à la lecture manuelle de CV."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-secondary" />}
              title="Score Précis"
              description="Un score de 0 à 100 basé sur les compétences techniques, l'expérience et les soft-skills demandées."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-emerald-500" />}
              title="Zéro Biais"
              description="Une évaluation factuelle basée strictement sur les données du CV et de la fiche de poste."
            />
          </div>
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="py-12 bg-background border-t border-slate-100 text-center">
        <p className="text-muted text-sm px-4">
          © 2026 TalentMatcher. Produit micro-SaaS pour recruteurs autonomes.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200 transition-all border border-transparent hover:border-slate-100 group">
      <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-main mb-3">{title}</h3>
      <p className="text-muted leading-relaxed">
        {description}
      </p>
    </div>
  );
}
