import QRCode from "qrcode";

export async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 300, margin: 2 });
}

export function buildJoinUrl(joinCode: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/s/${joinCode}`;
}
