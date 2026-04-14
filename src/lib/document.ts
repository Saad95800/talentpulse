import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import path from 'path';

/**
 * Nettoie le texte extrait pour le préparer à l'API IA
 */
function cleanExtractedText(text: string): string {
  let rawText = text.replace(/\n{2,}/g, '\n');
  rawText = rawText.replace(/\s{2,}/g, ' ');
  rawText = rawText.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  
  if (rawText.length > 50000) {
    rawText = rawText.substring(0, 50000) + "\n...[TRUNCATED]";
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
 * Extrait le texte d'un buffer en fonction de l'extension de fichier
 * Supporte .pdf, .docx, .doc, .txt, .jpg, .jpeg, .png
 */
export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const result: ExtractedDocument = {
    text: '',
    buffer,
    isScanned: false,
    mimeType: getMimeType(ext)
  };

  try {
    if (ext === 'pdf') {
      try {
        const cMapUrl = `file:///${path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'cmaps').replace(/\\/g, '/')}/`;
        
        const parser = new PDFParse({ 
          data: new Uint8Array(buffer),
          cMapUrl,
          cMapPacked: true,
          verbosity: 0
        });
        
        const pdfData = await parser.getText();
        result.text = cleanExtractedText(pdfData.text || '');
        
        // Si le texte est très court, on suspecte un scan
        if (result.text.trim().length < 100) {
          result.isScanned = true;
        }
        
        return result;
      } catch (pdfError) {
        const errorName = pdfError instanceof Error ? pdfError.name : '';
        const errorMsg = pdfError instanceof Error ? pdfError.message : '';
        if (errorName === 'PasswordException' || errorMsg.includes('password')) {
          throw new Error("Ce fichier PDF est protégé par un mot de passe.");
        }
        throw pdfError;
      }
    } 
    else if (['jpg', 'jpeg', 'png'].includes(ext)) {
      // Pour les images, on considère que c'est un scan (nécessite OCR via IA)
      result.isScanned = true;
      return result;
    }
    else if (ext === 'docx' || ext === 'doc') {
      const docxResult = await mammoth.extractRawText({ buffer });
      result.text = cleanExtractedText(docxResult.value);
      return result;
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
