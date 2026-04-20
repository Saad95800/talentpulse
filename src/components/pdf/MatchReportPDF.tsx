import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { MatchResult } from '@/lib/ai';
import { pdfStyles } from './PDFTheme';
import { MatchHeader } from './sections/MatchHeader';
import { MatchSkills } from './sections/MatchSkills';
import { MatchVerdict } from './sections/MatchVerdict';
import { MatchQuestions } from './sections/MatchQuestions';

interface MatchReportPDFProps {
  result: MatchResult;
  candidateName: string;
}

/**
 * Composant Document PDF principal.
 * Orchestre les différentes sections de l'analyse suivant une architecture modulaire.
 */
export default function MatchReportPDF({ result, candidateName }: MatchReportPDFProps) {
  return (
    <Document title={`Analyse Matching - ${candidateName}`} author="TalentPulse AI">
      <Page size="A4" style={pdfStyles.page}>
        {/* En-tête avec score et nom */}
        <MatchHeader candidateName={candidateName} score={result.score} />

        {/* Détails des compétences (Grille 2 colonnes) */}
        <MatchSkills 
          validees={result.competences_validees} 
          manquantes={result.competences_manquantes} 
        />

        {/* Verdict qualitatif */}
        <MatchVerdict verdict={result.argumentaire_client} />

        {/* Questions d'entretien */}
        <MatchQuestions questions={result.questions_candidat} />

        {/* Pied de page formel */}
        <View style={pdfStyles.footer} fixed>
          <Text>
            {"CONFIDENTIEL • Document généré par TalentPulse AI • Ce rapport constitue une aide à la décision. L'évaluation finale et la validation des compétences relèvent de la responsabilité de l'expert métier ou du recruteur."}
          </Text>
          <Text style={{ marginTop: 4, fontWeight: 'bold' }}>
            © {new Date().getFullYear()} TalentPulse
          </Text>
        </View>
      </Page>
    </Document>
  );
}
