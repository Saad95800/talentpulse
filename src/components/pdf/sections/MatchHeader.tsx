import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../PDFTheme';

interface MatchHeaderProps {
  candidateName: string;
  score: number;
}

export const MatchHeader = ({ candidateName, score }: MatchHeaderProps) => (
  <View>
    {/* Branding & Metadata */}
    <View style={pdfStyles.headerBranding}>
      <Text style={pdfStyles.brandName}>
        TALENT<Text style={pdfStyles.brandDot}>MATCHER</Text>
      </Text>
      <View>
        <Text style={pdfStyles.reportMeta}>RAPPORT D&apos;ANALYSE IA v1.2</Text>
        <Text style={pdfStyles.reportMeta}>{new Date().toLocaleDateString('fr-FR')}</Text>
      </View>
    </View>

    {/* Section Titre */}
    <View style={pdfStyles.sectionWrapper}>
      <Text style={pdfStyles.summaryTitle}>Synthèse de Matching : {candidateName}</Text>
      <Text style={pdfStyles.summarySubtitle}>Évaluation prédictive des compétences par rapport à l&apos;offre de mission</Text>
      
      {/* Score Professionnel */}
      <View style={pdfStyles.scoreLabelRow}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.main }}>Indice d&apos;Adéquation :</Text>
        <Text style={pdfStyles.scoreValueText}>{score}%</Text>
      </View>
      <View style={pdfStyles.scoreBarContainer}>
        <View style={[
          pdfStyles.scoreBarFill, 
          { 
            width: `${score}%`, 
            backgroundColor: score >= 80 ? COLORS.success : score >= 50 ? COLORS.accent : COLORS.danger 
          }
        ]} />
      </View>
    </View>
  </View>
);
