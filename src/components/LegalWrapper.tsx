"use client";

import React from 'react';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

interface LegalWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function LegalWrapper({ title, subtitle, children }: LegalWrapperProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />
      
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[3rem] border border-slate-200 p-8 md:p-16 shadow-sm">
            <header className="mb-12 border-b border-slate-100 pb-10">
              <h1 className="text-4xl font-black text-main mb-4 tracking-tight">{title}</h1>
              {subtitle && <p className="text-slate-500 font-medium text-lg leading-relaxed">{subtitle}</p>}
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-8">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </header>
            
            <div className="prose prose-slate prose-headings:text-main prose-headings:font-black prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-main max-w-none">
              {children}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
