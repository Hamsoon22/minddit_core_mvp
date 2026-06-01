export interface Participant {
  id: string;
  name: string;
  email?: string | null;
  sessionId: string;
  attended: boolean;
  joinedAt?: Date | null;
  createdAt: Date;
}
