import { StyleSheet } from '@react-pdf/renderer';

// Enregistrement des polices (Inter est une valeur sûre pour le design moderne)
// Note: En environnement réel, on téléchargerait les fichiers .ttf. 
// Ici on utilise les polices standard ou on simule l'enregistrement si besoin.
// Pour @react-pdf, Helvetica est souvent la police par défaut la plus propre sans assets externes.

export const COLORS = {
  primary: '#1E40AF', // Deep Blue
  accent: '#3B82F6',  // Professional Blue
  main: '#0F172A',    // Slate Dark
  muted: '#64748B',   // Slate Muted
  light: '#F8FAFC',   // Slate Background
  border: '#E2E8F0',  // Light Border
  success: '#15803D', // Forest Green
  danger: '#B91C1C',  // Deep Red
  white: '#FFFFFF',
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: '50 40 60 40', // Plus de marge en haut/bas pour l'entête/pied de page
    backgroundColor: COLORS.white,
    fontFamily: 'Helvetica',
  },
  // En-tête de rapport institutionnelle
  headerBranding: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.main,
    paddingBottom: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.main,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  brandDot: {
    color: COLORS.accent,
  },
  reportMeta: {
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'right',
  },
  // Section Titre du rapport
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.main,
    marginTop: 10,
    marginBottom: 5,
  },
  summarySubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 25,
    fontStyle: 'italic',
  },
  // Section Contenu
  sectionWrapper: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.main,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 10,
  },
  // Score indicator (Linéaire et Pro)
  scoreBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: COLORS.light,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 5,
    marginBottom: 15,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  scoreLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreValueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.main,
  },
  // Skills Lists
  skillsGrid: {
    flexDirection: 'row',
    gap: 30,
  },
  skillsColumn: {
    flex: 1,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  skillBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    marginRight: 8,
  },
  skillText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.4,
  },
  // Executive Summary (Verdict)
  verdictContainer: {
    marginTop: 10,
    padding: 20,
    backgroundColor: COLORS.light,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderRadius: 4,
  },
  verdictHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  verdictText: {
    fontSize: 11,
    color: COLORS.main,
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: COLORS.muted,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  }
});
