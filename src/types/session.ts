export type SessionStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED";

export interface Session {
  id: string;
  title: string;
  description?: string | null;
  status: SessionStatus;
  joinCode: string;
  scheduledAt?: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
