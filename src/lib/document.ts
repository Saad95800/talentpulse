import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import path from 'path';

/**
 * Nettoie le texte extrait pour le préparer à l'API IA
 * Supprime les caractères non imprimables, normalise les espaces et les sauts de ligne.
 */
function cleanExtractedText(text: string): string {
  if (!text) return "";
  
  // 1. Suppression des caractères de contrôle invisibles (sauf sauts de ligne et tabulations)
  // On garde \n \r \t et le range imprimable standard.
  let rawText = text.replace(/[^\x20-\x7E\s\u00A0-\u00FF\u0100-\u017F]/g, " ");
  
  // 2. Normalisation des sauts de ligne (conversion \r\n en \n, puis réduction)
  rawText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  rawText = rawText.replace(/\n{3,}/g, '\n\n'); 
  
  // 3. Normalisation des espaces blancs horizontaux
  rawText = rawText.replace(/[ \t]{2,}/g, ' ');
  
  // 4. Troncature de sécurité (50k chars ~= 15k tokens) pour éviter les overflows API
  if (rawText.length > 50000) {
    rawText = rawText.substring(0, 50000) + "\n...[Document Tronqué]";
  }
  
  return rawText.trim();
}

/**
 * Tente de décoder un buffer texte avec détection d'encodage sommaire (UTF-8 vs Latin1)
 */
function decodeTextBuffer(buffer: Buffer): string {
  const utf8String = buffer.toString('utf8');
  
  // Heuristique simple : si on trouve le caractère de remplacement UTF-8 (), 
  // ou si de nombreux caractères sont illisibles, on bascule sur Latin1 (Windows-1252)
  const replacementCharCount = (utf8String.match(/\uFFFD/g) || []).length;
  
  if (replacementCharCount > 0 || /[\x80-\x9F]/.test(utf8String)) {
    console.log(`[Document] Encodage UTF-8 suspect (${replacementCharCount} erreurs). Tentative Décodage Latin1...`);
    return buffer.toString('latin1');
  }
  
  return utf8String;
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
        const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
        const workerUrl = `file:///${workerPath.replace(/\\/g, '/')}`;
        
        PDFParse.setWorker(workerUrl);
        
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        result.text = cleanExtractedText(data.text || '');
        result.mimeType = 'application/pdf';
        
        const lowerText = result.text.toLowerCase();
        
        // Détection de scan améliorée : 
        // Si le texte est très court OU contient des messages d'erreur de conversion
        const isSuspiciouslyShort = result.text.length < 200;
        const hasNoAlpha = !/[a-zA-Z]{3,}/.test(result.text); // Pas de mots de 3+ lettres
        const isErrorMsg = lowerText.includes('forme d\'images') || lowerText.includes('no text');

        if (isSuspiciouslyShort || hasNoAlpha || isErrorMsg) {
          console.log(`[Document] PDF détecté comme scan/image (Qualité texte insuffisante).`);
          result.isScanned = true;
          // On garde le peu de texte extrait au cas où, mais l'IA privilégiera le document brut
        } else {
          console.log(`[Document] Extraction PDF textuelle réussie (${result.text.length} chars).`);
        }
        return result;
      } catch (pdfError: unknown) {
        const errorMsg = pdfError instanceof Error ? pdfError.message : String(pdfError);
        console.warn(`[Document] Échec PDFParse (${filename}), basculement OCR Gemini:`, errorMsg);
        result.isScanned = true;
        result.text = ""; 
        return result;
      }
    } 
    else if (['jpg', 'jpeg', 'png'].includes(ext)) {
      result.isScanned = true;
      result.mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      return result;
    }
    else if (ext === 'docx') {
      try {
        // Utilisation de convertToHtml pour capturer les zones de texte et en-têtes souvent ignorés par extractRawText
        const docxResult = await mammoth.convertToHtml({ buffer });
        
        const plainText = docxResult.value
          .replace(/<[^>]+>/g, ' ') 
          .replace(/\s{2,}/g, ' ')  
          .trim();

        result.text = cleanExtractedText(plainText);
        result.mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        return result;
      } catch (_docError: unknown) {
        console.warn(`[Document] Échec lecture Word (${filename}).`);
        throw new Error(`Le fichier Word est illisible ou corrompu.`);
      }
    } 
    else if (ext === 'doc') {
      // Les fichiers .doc (legacy) ne sont pas supportés par mammoth. 
      // On force le mode "scanned" pour que Gemini tente une lecture directe du binaire si possible,
      // ou on lève une erreur explicite pour que l'utilisateur convertisse en .docx.
      throw new Error(`Le format .doc (ancien) n'est pas supporté. Veuillez enregistrer votre CV au format .docx ou .pdf.`);
    }
    else if (ext === 'txt') {
      result.text = cleanExtractedText(decodeTextBuffer(buffer));
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
/**
 * Rétrocompatibilité avec l'ancien fichier pdf.ts
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const result = await extractTextFromFile(buffer, "file.pdf");
  return result.text;
}
