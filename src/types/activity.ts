export type ActivityType =
  | "CHECKIN" | "POLL" | "JOURNAL" | "MEDITATION"
  | "BREATHING" | "MOVEMENT" | "VIDEO" | "DISCUSSION";

export interface SessionActivity {
  id: string;
  sessionId: string;
  title: string;
  type: ActivityType;
  durationMin: number;
  content?: string | null;
  order: number;
}
