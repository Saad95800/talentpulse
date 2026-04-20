"use client";

import React from 'react';
import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';

interface PublicNavbarProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

export default function PublicNavbar({ onLoginClick, onRegisterClick }: PublicNavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="group bg-primary p-2 rounded-xl">
                <BrainCircuit className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
              </div>
              <span className="text-xl font-bold text-main tracking-tight">
                Talent<span className="text-primary">Pulse</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/pricing" className="text-sm font-bold text-muted hover:text-primary transition-colors">
                Tarifs
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onLoginClick || (() => window.location.href = '/?mode=login')}
              className="text-sm font-bold text-muted hover:text-primary transition-colors px-3 py-2"
            >
              Connexion
            </button>
            <button 
              onClick={onRegisterClick || (() => window.location.href = '/?mode=register')}
              className="bg-main text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm"
            >
              Essayer gratuitement
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
