import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles } from '../PDFTheme';

interface MatchQuestionsProps {
  questions: string[];
}

export const MatchQuestions = ({ questions }: MatchQuestionsProps) => {
  if (!questions || questions.length === 0) return null;

  return (
    <View style={[styles.container, { marginTop: 20 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>QUESTIONS D'ENTRETIEN PRÉCONISÉES</Text>
        <Text style={styles.subtitle}>Pour vérifier la qualification réelle du candidat</Text>
      </View>

      <View style={styles.list}>
        {questions.map((question, index) => (
          <View key={index} style={styles.item}>
            <View style={styles.bullet}>
              <Text style={styles.bulletText}>{index + 1}</Text>
            </View>
            <Text style={styles.questionText}>{question}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    border: '1pt solid #e2e8f0',
  },
  header: {
    marginBottom: 15,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 8,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    border: '0.5pt solid #f1f5f9',
  },
  bullet: {
    width: 14,
    height: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletText: {
    color: '#ffffff',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  questionText: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    lineHeight: 1.3,
  },
});
