import * as Sentry from "@sentry/nextjs";

/**
 * Tente de réparer un JSON tronqué en fermant les accolades et crochets manquants.
 * Utile pour les réponses de LLM qui s'arrêtent avant la fin.
 */
function repairTruncatedJSON(jsonString: string): string {
  const stack: string[] = [];
  let isInsideString = false;
  let isEscaped = false;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === '\\') {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      isInsideString = !isInsideString;
      continue;
    }
    if (!isInsideString) {
      if (char === '{' || char === '[') {
        stack.push(char === '{' ? '}' : ']');
      } else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  let repaired = jsonString;
  // S'il reste des éléments dans la pile, on les ajoute à l'envers
  if (isInsideString) repaired += '"'; // Ferme la string si besoin
  while (stack.length > 0) {
    repaired += stack.pop();
  }

  return repaired;
}

/**
 * Extrait et parse un objet JSON depuis un texte brut (LLM).
 */
export function extractJSON<T>(text: string): T {
  let jsonString = text.trim();

  // 1. Nettoyage initial : blocs Markdown
  const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch && markdownMatch[1]) {
    jsonString = markdownMatch[1].trim();
  }

  // 2. Extraction du contenu entre les premières et (éventuellement) dernières accolades
  const firstBrace = jsonString.indexOf('{');
  if (firstBrace === -1) {
    throw new Error("Aucun objet JSON trouvé dans la réponse.");
  }
  
  const lastBrace = jsonString.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace > firstBrace) {
    // Si on a un bloc complet, on l'extrait
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  } else {
    // Sinon on prend tout depuis la première accolade et on tentera de réparer
    jsonString = jsonString.substring(firstBrace);
  }

  // 3. Sanitisation pré-parse
  jsonString = jsonString.replace(/,(\s*[\]}])/g, '$1');

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    // 4. Tentatives de secours
    
    // a) Réparation des sauts de lignes dans les strings
    try {
      const sanitized = jsonString.replace(/(?<=:\s*")([\s\S]*?)(?=")/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      });
      return JSON.parse(sanitized) as T;
    } catch (_e1) {
      // b) Réparation de la troncature (fermeture des accolades)
      try {
        const repaired = repairTruncatedJSON(jsonString);
        return JSON.parse(repaired) as T;
      } catch (_e2) {
        // c) Log détaillé et échec final
        console.error("❌ [AI:JSON] Échec final du parsing.");
        console.error("--- DEBUT TEXTE FAUTIF ---");
        console.error(jsonString.substring(0, 1000) + (jsonString.length > 1000 ? "..." : ""));
        console.error("--- FIN TEXTE FAUTIF ---");

        if (typeof Sentry.captureException === 'function') {
          Sentry.captureException(error, { extra: { rawText: text, jsonAttempt: jsonString } });
        }
        throw new Error(`Erreur de syntaxe JSON. L'IA a renvoyé un format illisible.`);
      }
    }
  }
}
