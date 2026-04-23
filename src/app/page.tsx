"use client";

import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  BarChart3
} from "lucide-react";

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/RegisterForm';
import LoginForm from '@/components/LoginForm';
import { X } from 'lucide-react';

import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import PricingGrid from '@/components/PricingGrid';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useSelector((state: RootState) => state.user);
  const [authMode, setAuthMode] = React.useState<'none' | 'login' | 'register'>('none');

  // Redirection automatique vers le dashboard si déjà connecté
  React.useEffect(() => {
    if (isLoggedIn) {
      router.push('/dashboard');
    }
    
    // Détection du mode via URL
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const mode = sp.get('mode');
      if (mode === 'login' || mode === 'register') {
        setAuthMode(mode as any);
      }
    }
  }, [isLoggedIn, router]);

  const handleStart = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      setAuthMode('register');
    }
  };

  const closeModal = () => {
    setAuthMode('none');
    // Nettoyer l'URL
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <PublicNavbar 
        onLoginClick={() => setAuthMode('login')} 
        onRegisterClick={() => setAuthMode('register')} 
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Cercles de décoration en arrière-plan */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-main mb-8 tracking-tight leading-[1.1]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Matchez vos talents
            </span> <br />
            à la vitesse de l&apos;IA.
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted mb-10 leading-relaxed font-medium">
            Évaluez instantanément la pertinence de n&apos;importe quel candidat. 
            Économisez 80% de votre temps de sourcing grâce à notre algorithme de matching intelligent.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleStart}
              className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-3xl text-xl font-black hover:bg-primary-hover transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/25"
            >
              Analyser un CV gratuitement
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-main mb-4">Une offre simple, sans surprise.</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Commencez gratuitement et passez à la vitesse supérieure dès que vous en avez besoin.
            </p>
          </div>
          
          <PricingGrid isPublic={true} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-main mb-4">Pourquoi choisir TalentPulse ?</h2>
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

      {/* Modale d'Authentification Unique */}
      {authMode !== 'none' && (
        <div id="register" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-main/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-500">
            <button 
              onClick={closeModal}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors hidden md:block"
            >
              <X className="w-8 h-8" />
            </button>
            
            {authMode === 'register' ? (
              <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
            ) : (
              <LoginForm 
                onSuccess={() => {/* La redirection est gérée par le useEffect ci-dessus */}} 
                onSwitchToRegister={() => setAuthMode('register')} 
              />
            )}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white hover:bg-slate-50 hover:shadow-2xl hover:shadow-slate-300 transition-all border border-slate-200 hover:border-primary/30 group">
      <div className="mb-6 p-4 bg-slate-100 rounded-2xl w-fit shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-main mb-3">{title}</h3>
      <p className="text-muted leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}
