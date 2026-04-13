import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

/**
 * Nettoie le texte extrait pour le préparer à l'API IA
 */
function cleanExtractedText(text: string): string {
  let rawText = text.replace(/\n{2,}/g, '\n');
  rawText = rawText.replace(/\s{2,}/g, ' ');
  // eslint-disable-next-line no-control-regex
  rawText = rawText.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  
  if (rawText.length > 50000) {
    rawText = rawText.substring(0, 50000) + "\n...[TRUNCATED]";
  }
  return rawText.trim();
}

/**
 * Extrait le texte d'un buffer en fonction de l'extension de fichier
 * Supporte .pdf (via pdf-parse v2), .docx, .doc, .txt
 */
export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  try {
    if (ext === 'pdf') {
      // pdf-parse v2 : instanciation de la classe PDFParse
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return cleanExtractedText(result.text);
    } 
    else if (ext === 'docx' || ext === 'doc') {
      const result = await mammoth.extractRawText({ buffer });
      return cleanExtractedText(result.value);
    } 
    else if (ext === 'txt') {
      return cleanExtractedText(buffer.toString('utf-8'));
    } 
    else {
      throw new Error(`Format de fichier non supporté: .${ext}`);
    }
  } catch (error) {
    console.error(`Erreur lors de l'extraction de ${filename}:`, error);
    throw new Error(`Impossible de lire le fichier ${filename}. Vérifiez qu'il n'est pas protégé par mot de passe ou corrompu.`);
  }
}

/**
 * Rétrocompatibilité avec l'ancien fichier pdf.ts
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return extractTextFromFile(buffer, "file.pdf");
}
