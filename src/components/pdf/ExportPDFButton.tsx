"use client";

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MatchReportPDF from './MatchReportPDF';
import { MatchResult } from '@/lib/ai';
import { Download } from 'lucide-react';

interface ExportPDFButtonProps {
  result: MatchResult;
  candidateName: string;
}

/**
 * Composant isolé pour l'export PDF.
 * Ce composant est conçu pour être chargé via next/dynamic (ssr: false)
 * pour éviter les erreurs de contexte React/Hydration avec @react-pdf/renderer.
 */
export default function ExportPDFButton({ result, candidateName }: ExportPDFButtonProps) {
  const fileName = `Analyse_TalentMatcher_${candidateName.replace(/\s+/g, '_')}.pdf`;

  return (
    <PDFDownloadLink
      document={<MatchReportPDF result={result} candidateName={candidateName} />}
      fileName={fileName}
      className="flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95"
    >
      {/* @ts-expect-error - PDFDownloadLink child type can be a function */}
      {({ loading, error }) => (
        <>
          <Download className={`w-5 h-5 ${loading ? 'animate-bounce' : ''}`} />
          {loading ? "Génération du PDF..." : error ? "Erreur Export" : "Exporter l'analyse (PDF)"}
        </>
      )}
    </PDFDownloadLink>
  );
}
