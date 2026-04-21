import { extractTextFromFile } from "@/lib/document";
import { extractCandidateInfo, validateDocumentConformity, generateJobTitle } from "@/lib/ai";
import { processSingleMatch } from "./core";
import { deductCredit, checkCredits } from "@/actions/credits.action";

export interface MatchingWorkflowParams {
  userId: string;
  jobFile?: File | null;
  cvFile?: File | null;
  jobTextRaw?: string | null;
  cvTextRaw?: string | null;
  skipDeduction?: boolean;
}

export interface MatchingWorkflowResult {
  success: boolean;
  data?: {
    candidateInfo: any;
    jobTitle: string;
    jobDescription: string;
    fullCandidate: any;
    score: number;
    recordId: string;
  };
  creditsRemaining?: number;
  error?: string;
  recordId?: string;
}

/**
 * Service orchestrating the complete matching workflow.
 * Centralizes text extraction, IA validations, matching processing and credit deduction.
 */
export class MatchingService {
  
  static async runFullWorkflow(params: MatchingWorkflowParams): Promise<MatchingWorkflowResult> {
    const { userId, jobFile, cvFile, jobTextRaw, cvTextRaw, skipDeduction } = params;

    // 1. Initial Validations
    if (!userId) return { success: false, error: "ID Utilisateur manquant." };
    
    // 2. Credit check
    const creditCheck = await checkCredits(userId);
    if (!creditCheck.success) return { success: false, error: creditCheck.error };

    try {
      // 3. Job Description Extraction & Title Generation
      let jobText = "";
      if (jobFile && jobFile.size > 0) {
        const jobBuffer = Buffer.from(await jobFile.arrayBuffer());
        const jobDoc = await extractTextFromFile(jobBuffer, jobFile.name);
        jobText = jobDoc.text.substring(0, 30000);
      } else if (jobTextRaw) {
        jobText = jobTextRaw.substring(0, 30000);
      }

      if (!jobText) return { success: false, error: "Fiche de poste manquante." };

      const jobTitle = await generateJobTitle(jobText);

      // 4. Job Conformity check
      const jobValidation = await validateDocumentConformity(jobText, 'job');
      if (!jobValidation.isConform) {
        return { success: false, error: `Fiche de poste non conforme: ${jobValidation.reason}` };
      }

      // 5. CV Extraction
      let cvText = "";
      let candidateNameFallback = "Candidat Anonyme";
      let cvFileData: any;

      if (cvFile && cvFile.size > 0) {
        const cvBuffer = Buffer.from(await cvFile.arrayBuffer());
        const cvDoc = await extractTextFromFile(cvBuffer, cvFile.name);
        cvText = cvDoc.text.substring(0, 30000);
        candidateNameFallback = cvFile.name.replace(/\.[^/.]+$/, "");
        cvFileData = {
          buffer: cvBuffer,
          mimeType: cvDoc.mimeType || 'application/pdf',
          isScanned: cvDoc.isScanned
        };
      } else if (cvTextRaw) {
        cvText = cvTextRaw.substring(0, 30000);
      }

      if (!cvText && !cvFileData?.isScanned) return { success: false, error: "CV manquant ou illisible." };

      // 6. CV Conformity check
      const cvValidation = await validateDocumentConformity(cvText, 'cv', cvFileData);
      if (!cvValidation.isConform) {
        return { success: false, error: `CV non conforme: ${cvValidation.reason}` };
      }

      // 7. Data Extraction (Candidate Profile)
      const candidateInfo = await extractCandidateInfo(cvText, cvFileData);

      // CRITIQUE : Si on est sur un scan, cvText est vide. On le bascule sur le résumé de l'IA
      // pour que l'étape de Matching suivante ait du contenu textuel à comparer.
      const firstName = candidateInfo?.firstName || '';
      const lastName = candidateInfo?.lastName || '';
      const finalCandidateName = `${firstName} ${lastName}`.trim() || candidateNameFallback;
      
      if (!cvText && cvFileData?.isScanned) {
        cvText = candidateInfo?.summary || `CV de ${finalCandidateName}`;
      }

      // 8. Matching Core Processing & DB Persistence
      const resultIA = await processSingleMatch({
        userId,
        jobTitle,
        jobText,
        candidateName: finalCandidateName,
        cvText,
        candidateInfo
      });

      if (!resultIA.success) {
        return { success: false, error: (resultIA as any).error || "Erreur de matching" };
      }

      // 9. Credit Deduction
      let creditsRemaining = creditCheck.currentCredits as number;
      if (!skipDeduction) {
        const deductResult = await deductCredit(userId);
        if (deductResult.success) {
          creditsRemaining = deductResult.creditsRemaining ?? creditsRemaining - 1;
        }
      }

      return {
        success: true,
        data: {
          candidateInfo,
          jobTitle: resultIA.mission.title,
          jobDescription: resultIA.mission.description,
          fullCandidate: resultIA.candidate,
          score: resultIA.resultIA.score,
          recordId: resultIA.recordId
        },
        creditsRemaining,
        recordId: resultIA.recordId
      };

    } catch (error) {
      throw error; // Let the action handle high-level logging
    }
  }
}
