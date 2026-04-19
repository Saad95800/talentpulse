export interface Candidate {
  id: string;
  userId: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  linkedin?: string | null;
  website?: string | null;
  summary?: string | null;
  languages?: unknown;
  skills?: unknown;
  experiences?: unknown;
  educations?: unknown;
  createdAt: Date | string;
  cvText?: string;
}

export interface Mission {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: Date | string;
}
