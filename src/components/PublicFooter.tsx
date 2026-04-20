"use client";

import React from 'react';
import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="py-20 bg-background border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-sm font-bold text-muted uppercase tracking-widest">
          <Link href="/pricing" className="hover:text-primary transition-colors">Tarifs</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">CGV</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Confidentialité</Link>
          <Link href="/legal" className="hover:text-primary transition-colors">Mentions Légales</Link>
        </div>
        
        <div className="pt-10 border-t border-slate-100">
          <p className="text-slate-400 text-sm">
            © 2026 TalentPulse. Produit micro-SaaS pour recruteurs autonomes.
          </p>
        </div>
      </div>
    </footer>
  );
}
