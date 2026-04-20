import { CandidateInfo } from '@/lib/ai';

export interface MatchingJobData {
  userId: string;
  batchJobId: string;
  batchItemId: string;
  jobText: string;
  cvText?: string;
  candidateInfo?: CandidateInfo;
  cvBufferBase64?: string; // Pour l'extraction différée
  cvFileName?: string;     // Pour le fallback de nom
}

export interface MatchingJobResult {
  success: boolean;
  matchRecordId?: string;
  error?: string;
}
