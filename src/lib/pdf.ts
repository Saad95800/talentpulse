import pdf from 'pdf-parse';

/**
 * Extrait le texte d'un buffer PDF et le nettoie pour l'IA.
 * @param buffer Buffer du fichier PDF
 * @returns Texte nettoyé
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    let rawText = data.text;

    // 1. Nettoyage : Sauts de ligne multiples -> simple
    rawText = rawText.replace(/\n{2,}/g, '\n');

    // 2. Nettoyage : Espaces multiples -> simple
    rawText = rawText.replace(/\s{2,}/g, ' ');

    // 3. Suppression des caractères non imprimables ou invisibles
    // eslint-disable-next-line no-control-regex
    rawText = rawText.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

    return rawText.trim();
  } catch (error) {
    console.error("Erreur lors de l'extraction du PDF:", error);
    throw new Error(
      "Impossible de lire le contenu du fichier PDF. Le fichier est peut-être corrompu ou protégé par un mot de passe."
    );
  }
}
