import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../PDFTheme';

interface MatchVerdictProps {
  verdict: string;
}

export const MatchVerdict = ({ verdict }: MatchVerdictProps) => (
  <View style={pdfStyles.sectionWrapper}>
    <Text style={pdfStyles.sectionTitle}>Analyse Globale</Text>
    <View style={pdfStyles.verdictContainer}>
      <Text style={pdfStyles.verdictHeader}>{"Synthèse et Recommandation de l'Expert AI"}</Text>
      <Text style={pdfStyles.verdictText}>
        {verdict}
      </Text>
    </View>
  </View>
);
