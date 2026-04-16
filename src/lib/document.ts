import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import path from 'path';

/**
 * Nettoie le texte extrait pour le préparer à l'API IA
 * Gène les espaces, les lignes vides et les caractères de contrôle.
 */
function cleanExtractedText(text: string): string {
  if (!text) return "";
  
  // Suppression des caractères de contrôle invisibles sauf \n et \t
  let rawText = text.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");
  
  // Normalisation des espaces blancs
  rawText = rawText.replace(/\n{2,}/g, '\n');
  rawText = rawText.replace(/[ \t]{2,}/g, ' ');
  
  // Troncature de sécurité (50k chars ~= 10-15k tokens)
  if (rawText.length > 50000) {
    rawText = rawText.substring(0, 50000) + "\n...[Document Tronqué]";
  }
  
  return rawText.trim();
}

export interface ExtractedDocument {
  text: string;
  buffer?: Buffer;
  mimeType?: string;
  isScanned: boolean;
}

/**
 * Extrait le texte d'un buffer en fonction de l'extension.
 */
export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const result: ExtractedDocument = { text: '', buffer, isScanned: false, mimeType: 'text/plain' };

  try {
    if (ext === 'pdf') {
      try {
        // Correction Worker PDF pour Node.js ESM sous Windows/Laragon
        // On construit un chemin 'file:///' local vers le worker présent dans node_modules
        const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
        const workerUrl = `file:///${workerPath.replace(/\\/g, '/')}`;
        
        console.log(`[Document] Initialisation PDF Worker: ${workerUrl}`);
        PDFParse.setWorker(workerUrl);
        
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        result.text = cleanExtractedText(data.text || '');
        result.mimeType = 'application/pdf';
        
        if (result.text.length < 100) {
          console.log(`[Document] PDF semble être un scan (${result.text.length} chars).`);
          result.isScanned = true;
        } else {
          console.log(`[Document] Extraction PDF locale réussie (${result.text.length} chars).`);
        }
        return result;
      } catch (pdfError: any) {
        console.warn(`[Document] Échec PDFParse (${filename}), basculement OCR Gemini:`, pdfError.message);
        result.isScanned = true;
        result.text = ""; 
        return result;
      }
    } 
    else if (['jpg', 'jpeg', 'png'].includes(ext)) {
      result.isScanned = true;
      return result;
    }
    else if (ext === 'docx' || ext === 'doc') {
      try {
        const docxResult = await mammoth.extractRawText({ buffer });
        result.text = cleanExtractedText(docxResult.value);
        return result;
      } catch (docError: any) {
        console.warn(`[Document] Échec lecture Word (${filename}): ${docError.message}.`);
        throw new Error(`Le fichier Word est illisible ou corrompu.`);
      }
    } 
    else if (ext === 'txt') {
      result.text = cleanExtractedText(buffer.toString('utf-8'));
      return result;
    } 
    else {
      throw new Error(`Format de fichier non supporté: .${ext}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Document] Erreur d'extraction (${filename}):`, error.message);
    }
    throw error;
  }
}

function getMimeType(ext: string): string {
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc': return 'application/msword';
    default: return 'text/plain';
  }
}

/**
 * Rétrocompatibilité avec l'ancien fichier pdf.ts
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const result = await extractTextFromFile(buffer, "file.pdf");
  return result.text;
}
