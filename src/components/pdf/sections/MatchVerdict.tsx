import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../PDFTheme';

interface MatchVerdictProps {
  verdict: string;
  scientificVerdict?: string;
}

export const MatchVerdict = ({ verdict, scientificVerdict }: MatchVerdictProps) => (
  <View style={pdfStyles.sectionWrapper}>
    <Text style={pdfStyles.sectionTitle}>Analyse Globale & Recommandation</Text>
    <View style={pdfStyles.verdictContainer}>
      <Text style={pdfStyles.verdictHeader}>{"Synthèse de l'Expert AI"}</Text>
      <Text style={pdfStyles.verdictText}>
        {verdict}
      </Text>
    </View>

    {scientificVerdict && (
      <View style={[pdfStyles.verdictContainer, { marginTop: 10, backgroundColor: '#f8fafc', borderLeftColor: '#64748b' }]}>
        <Text style={[pdfStyles.verdictHeader, { color: '#64748b' }]}>{"Analyse Psychométrique & Scientifique"}</Text>
        <Text style={[pdfStyles.verdictText, { color: '#475569', fontStyle: 'italic', fontSize: 8 }]}>
          {scientificVerdict}
        </Text>
      </View>
    )}
  </View>
);
