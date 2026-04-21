import * as Sentry from "@sentry/nextjs";

/**
 * Extrait et parse un objet JSON depuis un texte brut (LLM).
 * Gère les blocs de code Markdown et les éventuels textes parasites.
 * Inclut une phase de "nettoyage" pour les erreurs classiques des LLMs.
 */
export function extractJSON<T>(text: string): T {
  let jsonString = text.trim();

  // 1. Nettoyage initial : blocs Markdown
  const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch && markdownMatch[1]) {
    jsonString = markdownMatch[1].trim();
  }

  // 2. Extraction du contenu entre les premières et dernières accolades
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }

  // 3. Sanitisation pour les erreurs classiques de syntaxe LLM
  // a) Suppression des virgules traînantes (ex: [1, 2, ] -> [1, 2])
  jsonString = jsonString.replace(/,(\s*[\]}])/g, '$1');

  // Breadcrumb pour le debug Sentry en cas d'échec imminent
  if (typeof Sentry.addBreadcrumb === 'function') {
    Sentry.addBreadcrumb({
      category: 'ai.json_extraction',
      message: 'Attempting to parse JSON from AI response',
      data: { 
        trimmedLength: jsonString.length,
        preview: jsonString.substring(0, 200) + '...'
      },
      level: 'info',
    });
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    // 4. Tentative de secours : remplacement des sauts de ligne réels par des \n échappés
    // Uniquement entre guillemets pour ne pas casser la structure du JSON
    try {
      const sanitized = jsonString.replace(/(?<=:\s*")([\s\S]*?)(?=")/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      });
      return JSON.parse(sanitized) as T;
    } catch (_secondError) {
      // Échec total : Report détaillé à Sentry
      if (typeof Sentry.captureException === 'function') {
        Sentry.captureException(error, {
          tags: { error_type: 'json_parsing' },
          extra: {
            rawText: text,
            jsonAttempt: jsonString,
            errorMessage: error instanceof Error ? error.message : String(error)
          }
        });
      }

      console.error("❌ [AI:JSON] Échec critique du parsing JSON.");
      throw new Error(`Erreur de syntaxe dans la réponse de l'IA (JSON malformé).`);
    }
  }
}
