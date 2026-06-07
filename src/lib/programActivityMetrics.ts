export type ActivityTapMetric = {
  totalTaps: number;
  participantTaps: Record<string, number>;
  lastTappedAt: string;
};

export type ProgramActivityMetricMap = Record<string, ActivityTapMetric>;

const ACTIVITY_METRIC_KEY = "minddit.program-activity-taps.v1";

function readAllMetrics(): Record<string, ProgramActivityMetricMap> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACTIVITY_METRIC_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProgramActivityMetricMap>;
  } catch {
    return {};
  }
}

function writeAllMetrics(map: Record<string, ProgramActivityMetricMap>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVITY_METRIC_KEY, JSON.stringify(map));
}

export function getProgramActivityMetrics(sessionId: string): ProgramActivityMetricMap {
  const all = readAllMetrics();
  return all[sessionId] ?? {};
}

export function recordProgramActivityTap(input: {
  sessionId: string;
  activityId: string;
  participantId: string;
}) {
  const all = readAllMetrics();
  const sessionMetrics = all[input.sessionId] ?? {};
  const current = sessionMetrics[input.activityId] ?? {
    totalTaps: 0,
    participantTaps: {},
    lastTappedAt: "",
  };

  const participantTaps = {
    ...current.participantTaps,
    [input.participantId]: (current.participantTaps[input.participantId] ?? 0) + 1,
  };

  sessionMetrics[input.activityId] = {
    totalTaps: current.totalTaps + 1,
    participantTaps,
    lastTappedAt: new Date().toISOString(),
  };

  all[input.sessionId] = sessionMetrics;
  writeAllMetrics(all);
}
