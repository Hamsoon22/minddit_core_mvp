export type SessionStatus = "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED";
export type ProgramMode = "IN_PERSON" | "ONLINE" | "HYBRID";
export type ScheduleType = "WEEKLY" | "DATE_SPECIFIC" | "MONTHLY";
export type ProgramThemeKey = "slate" | "rose" | "forest" | "teal" | "olive";

export interface Session {
  id: string;
  title: string;
  description?: string | null;
  expertName?: string | null;
  status: SessionStatus;
  mode?: ProgramMode;
  scheduleType?: ScheduleType;
  joinCode: string;
  scheduledAt?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  institutionName?: string | null;
  institutionAddress?: string | null;
  institutionDirections?: string | null;
  institutionPhone?: string | null;
  institutionEmail?: string | null;
  linkSharingEnabled?: boolean;
  themeKey?: ProgramThemeKey;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
