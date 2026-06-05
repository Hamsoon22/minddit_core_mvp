export type ProgramParticipantAccount = {
  name: string;
  username: string;
  password: string;
};

const ACCOUNTS_KEY = "minddit.program-participant-accounts.v1";
const LINK_AUTH_KEY = "minddit.program-link-auth.v1";

function readJsonMap<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, T>;
  } catch {
    return {};
  }
}

function writeJsonMap<T>(key: string, map: Record<string, T>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(map));
}

export function buildDefaultParticipantAccounts(count: number): ProgramParticipantAccount[] {
  const size = Math.max(1, count);
  return Array.from({ length: size }, (_, index) => {
    const no = index + 1;
    return {
      name: `참여자${no}`,
      username: `user${no}`,
      password: "1234",
    };
  });
}

export function getParticipantAccounts(sessionId: string, fallbackCount = 1): ProgramParticipantAccount[] {
  const map = readJsonMap<ProgramParticipantAccount[]>(ACCOUNTS_KEY);
  const existing = map[sessionId];
  if (existing && existing.length > 0) return existing;

  const defaults = buildDefaultParticipantAccounts(fallbackCount);
  map[sessionId] = defaults;
  writeJsonMap(ACCOUNTS_KEY, map);
  return defaults;
}

export function saveParticipantAccounts(sessionId: string, accounts: ProgramParticipantAccount[]) {
  const map = readJsonMap<ProgramParticipantAccount[]>(ACCOUNTS_KEY);
  map[sessionId] = accounts;
  writeJsonMap(ACCOUNTS_KEY, map);
}

export function verifyParticipantLogin(sessionId: string, username: string, password: string) {
  const accounts = getParticipantAccounts(sessionId, 1);
  const trimmedId = username.trim();
  const trimmedPw = password.trim();
  return accounts.find((account) => account.username === trimmedId && account.password === trimmedPw) ?? null;
}

export function getProgramLinkLoggedInUser(joinCode: string) {
  const map = readJsonMap<string>(LINK_AUTH_KEY);
  return map[joinCode] ?? null;
}

export function setProgramLinkLoggedInUser(joinCode: string, username: string | null) {
  const map = readJsonMap<string>(LINK_AUTH_KEY);
  if (!username) {
    delete map[joinCode];
  } else {
    map[joinCode] = username;
  }
  writeJsonMap(LINK_AUTH_KEY, map);
}
