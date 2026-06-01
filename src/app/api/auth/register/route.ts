import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "입력 값이 올바르지 않습니다." }, { status: 400 });

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });

  const hashed = crypto.createHash("sha256").update(password).digest("hex");
  await db.user.create({ data: { name, email, password: hashed } });
  return NextResponse.json({ ok: true });
}
