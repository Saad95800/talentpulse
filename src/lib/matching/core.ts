import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateMatchingScore, CandidateInfo } from "@/lib/ai";
import { handleActionError } from "../error-handler";

/**
 * Traite un matching individuel (IA + Sauvegarde DB)
 * Utilisé par l'action synchrone ET par le worker BullMQ.
 */
export async function processSingleMatch(params: {
  userId: string;
  jobTitle: string;
  jobText: string;
  candidateName: string;
  cvText: string;
  candidateInfo: CandidateInfo;
}) {
  const { userId, jobTitle, jobText, candidateName, cvText, candidateInfo } = params;

  // 1. Analyse de Matching
  let resultIA;
  try {
    resultIA = await generateMatchingScore(jobText, cvText, candidateInfo);
  } catch (error) {
    // Propagate the error with context for Sentry and logs
    return handleActionError("Échec de l'analyse IA du matching", error, {
      userId,
      actionName: "processSingleMatch",
      context: { candidateName }
    });
  }

  // 2. Sauvegarde Structurelle BDD
  const truncate = (str: string | undefined | null, max: number) => 
    str ? str.substring(0, max) : str;

  const finalCandidateName = `${candidateInfo.firstName || ''} ${candidateInfo.lastName || ''}`.trim() || candidateName;

  const mission = await prisma.mission.create({
    data: {
      userId,
      title: truncate(jobTitle, 1000) || "Sans titre",
      description: jobText,
    }
  });

  const candidate = await prisma.candidate.create({
    data: {
      userId,
      name: truncate(finalCandidateName, 500) || "Candidat",
      firstName: truncate(candidateInfo.firstName, 200),
      lastName: truncate(candidateInfo.lastName, 200),
      email: truncate(candidateInfo.email, 200),
      phone: truncate(candidateInfo.phone, 200),
      address: truncate(candidateInfo.address, 500),
      linkedin: truncate(candidateInfo.linkedin, 500),
      website: truncate(candidateInfo.website, 500),
      summary: candidateInfo.summary,
      languages: (candidateInfo.languages || []) as Prisma.InputJsonValue,
      skills: (candidateInfo.skills || []) as Prisma.InputJsonValue,
      experiences: (candidateInfo.experiences || []) as Prisma.InputJsonValue,
      educations: (candidateInfo.educations || []) as Prisma.InputJsonValue,
      cvText,
    }
  });

  const newRecord = await prisma.matchRecord.create({
    data: {
      userId,
      missionId: mission.id,
      candidateId: candidate.id,
      jobTitle,
      candidateName: finalCandidateName,
      score: resultIA.score,
      aiResponse: resultIA as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    success: true,
    recordId: newRecord.id,
    resultIA,
    candidate,
    mission
  };
}
