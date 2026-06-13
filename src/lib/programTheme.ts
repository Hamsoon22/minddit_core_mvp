import type { ProgramThemeKey } from "@/types/session";

export type ProgramTheme = {
  key: ProgramThemeKey;
  label: string;
  panelColor: string;
  panelSoftColor: string;
  accentColor: string;
  accentSoftColor: string;
  textColor: string;
};

export const PROGRAM_THEMES: ProgramTheme[] = [
  { key: "slate", label: "슬레이트", panelColor: "#DAE3E9", panelSoftColor: "#C0CBD3", accentColor: "#0688D3", accentSoftColor: "#BCDFF3", textColor: "#485763" },
  { key: "rose", label: "로즈", panelColor: "#DCD6D9", panelSoftColor: "#CCC4C8", accentColor: "#AD4E70", accentSoftColor: "#F4D5E0", textColor: "#594B51" },
  { key: "forest", label: "포레스트", panelColor: "#DBDED5", panelSoftColor: "#C8CBC2", accentColor: "#68814E", accentSoftColor: "#C8D5BA", textColor: "#4F5847" },
  { key: "teal", label: "틸", panelColor: "#CDDBDC", panelSoftColor: "#BCCBCC", accentColor: "#417572", accentSoftColor: "#C1DBD9", textColor: "#475858" },
  { key: "olive", label: "올리브", panelColor: "#E7E5DC", panelSoftColor: "#CDCDC5", accentColor: "#8C8A47", accentSoftColor: "#F0EEB5", textColor: "#595849" },
];

export const PROGRAM_LINK_THEMES: ProgramTheme[] = [
  { key: "slate", label: "슬레이트", panelColor: "#DDEFF9", panelSoftColor: "#C0CBD3", accentColor: "#0688D3", accentSoftColor: "#BCDFF3", textColor: "#485763" },
  { key: "rose", label: "로즈", panelColor: "#F9EAEF", panelSoftColor: "#CCC4C8", accentColor: "#AD4E70", accentSoftColor: "#F4D5E0", textColor: "#594B51" },
  { key: "forest", label: "포레스트", panelColor: "#E6ECE0", panelSoftColor: "#C8CBC2", accentColor: "#68814E", accentSoftColor: "#C8D5BA", textColor: "#4F5847" },
  { key: "teal", label: "틸", panelColor: "#E3EFEE", panelSoftColor: "#BCCBCC", accentColor: "#417572", accentSoftColor: "#C1DBD9", textColor: "#475858" },
  { key: "olive", label: "올리브", panelColor: "#F1F1E6", panelSoftColor: "#CDCDC5", accentColor: "#8C8A47", accentSoftColor: "#F0EEB5", textColor: "#595849" },
];

export function getProgramTheme(themeKey?: ProgramThemeKey | null): ProgramTheme {
  return PROGRAM_THEMES.find((theme) => theme.key === themeKey) ?? PROGRAM_THEMES[0];
}

export function getProgramLinkTheme(themeKey?: ProgramThemeKey | null): ProgramTheme {
  return PROGRAM_LINK_THEMES.find((theme) => theme.key === themeKey) ?? PROGRAM_LINK_THEMES[0];
}
