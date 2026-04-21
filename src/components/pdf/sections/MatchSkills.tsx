import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfStyles, COLORS } from '../PDFTheme';

interface MatchSkillsProps {
  validees: {
    nom: string;
    preuve: string;
    niveau: number;
  }[];
  manquantes: string[];
}

export const MatchSkills = ({ validees, manquantes }: MatchSkillsProps) => (
  <View style={pdfStyles.sectionWrapper}>
    <Text style={pdfStyles.sectionTitle}>Évaluation Technique & Compétences (Basée sur Preuves)</Text>
    
    <View style={pdfStyles.skillsGrid}>
      {/* Colonne Gauche : Atouts */}
      <View style={pdfStyles.skillsColumn}>
        <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.success, marginBottom: 8, textTransform: 'uppercase' }}>
          • Atouts & Aptitudes Confirmés
        </Text>
        {validees.map((skill, index) => (
          <View key={index} style={[pdfStyles.skillRow, { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 6 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <View style={[pdfStyles.skillBullet, { backgroundColor: COLORS.success }]} />
              <Text style={[pdfStyles.skillText, { fontWeight: 'bold' }]}>{skill.nom} (Niveau {skill.niveau}/5)</Text>
            </View>
            <Text style={{ fontSize: 7, color: COLORS.muted, marginLeft: 14, fontStyle: 'italic' }}>
              {"Preuve : "}{skill.preuve}
            </Text>
          </View>
        ))}
      </View>

      {/* Colonne Droite : Points de Vigilance */}
      <View style={pdfStyles.skillsColumn}>
        <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.danger, marginBottom: 8, textTransform: 'uppercase' }}>
          • Écarts & Points de Vigilance
        </Text>
        {manquantes.map((skill, index) => (
          <View key={index} style={pdfStyles.skillRow}>
            <View style={[pdfStyles.skillBullet, { backgroundColor: COLORS.danger }]} />
            <Text style={pdfStyles.skillText}>{skill}</Text>
          </View>
        ))}
        {manquantes.length === 0 && (
          <Text style={{ fontSize: 9, color: COLORS.muted, fontStyle: 'italic', marginLeft: 14 }}>
            Aucun point de vigilance critique identifié.
          </Text>
        )}
      </View>
    </View>
  </View>
);
