import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { COLORS } from './PDFTheme';

/**
 * Template de reçu de paiement pour TalentPulse (Auto-Entrepreneur)
 * Respecte les mentions légales obligatoires sans TVA.
 */

const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 20,
  },
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.main,
  },
  brandAccent: {
    color: COLORS.accent,
  },
  receiptInfo: {
    textAlign: 'right',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  meta: {
    fontSize: 10,
    color: COLORS.muted,
  },
  addressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  addressBlock: {
    width: '45%',
  },
  addressLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 11,
    lineHeight: 1.5,
    color: COLORS.main,
  },
  table: {
    marginTop: 20,
    marginBottom: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.light,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  rowText: {
    fontSize: 11,
    color: COLORS.main,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalBox: {
    width: '40%',
    padding: 10,
    backgroundColor: COLORS.light,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 11,
    color: COLORS.muted,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.main,
  },
  noVatMention: {
    marginTop: 60,
    fontSize: 10,
    fontStyle: 'italic',
    color: COLORS.muted,
    textAlign: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  }
});

interface PaymentReceiptProps {
  receiptNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  planName: string;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  receiptNumber,
  date,
  customerName,
  customerEmail,
  amount,
  planName
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Talent<Text style={styles.brandAccent}>Pulse</Text></Text>
        </View>
        <View style={styles.receiptInfo}>
          <Text style={styles.title}>REÇU DE PAIEMENT</Text>
          <Text style={styles.meta}>N° {receiptNumber}</Text>
          <Text style={styles.meta}>Date : {date}</Text>
        </View>
      </View>

      {/* Addresses */}
      <View style={styles.addressSection}>
        <View style={styles.addressBlock}>
          <Text style={styles.addressLabel}>Émetteur</Text>
          <Text style={styles.addressText}>Reactive Digital</Text>
          <Text style={styles.addressText}>108 rue jean jaurès</Text>
          <Text style={styles.addressText}>93240 STAINS</Text>
          <Text style={styles.addressText}>SIRET : 828 004 424 000 36</Text>
        </View>
        <View style={styles.addressBlock}>
          <Text style={styles.addressLabel}>Client</Text>
          <Text style={styles.addressText}>{customerName}</Text>
          <Text style={styles.addressText}>{customerEmail}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={styles.colDesc}><Text style={styles.headerText}>Description</Text></View>
          <View style={styles.colQty}><Text style={styles.headerText}>Qté</Text></View>
          <View style={styles.colPrice}><Text style={styles.headerText}>Prix Unit.</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.colDesc}><Text style={styles.rowText}>{planName} (100 crédits/mois)</Text></View>
          <View style={styles.colQty}><Text style={styles.rowText}>1</Text></View>
          <View style={styles.colPrice}><Text style={styles.rowText}>{amount.toFixed(2)} €</Text></View>
        </View>
      </View>

      {/* Totals */}
      <View style={styles.totalSection}>
        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{amount.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA (0%)</Text>
            <Text style={styles.totalValue}>0,00 €</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: COLORS.border }]}>
            <Text style={[styles.totalLabel, { fontWeight: 'bold', color: COLORS.main }]}>Total TTC</Text>
            <Text style={[styles.totalValue, { color: COLORS.primary }]}>{amount.toFixed(2)} €</Text>
          </View>
        </View>
      </View>

      {/* Legal Mention */}
      <View style={styles.noVatMention}>
        <Text>TVA non applicable, art. 293 B du CGI</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Reactive Digital - SIRET 828 004 424 000 36 - 108 rue jean jaurès, 93240 STAINS</Text>
        <Text style={{ marginTop: 2 }}>Généré automatiquement par TalentPulse</Text>
      </View>
    </Page>
  </Document>
);

export default PaymentReceipt;
