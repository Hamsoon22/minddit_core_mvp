import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string(),
  title: z.string().min(1),
  type: z.string(),
  durationMin: z.number().int().min(1),
  content: z.string().optional(),
  order: z.number().int(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = schema.parse(await req.json());
  const activity = await db.sessionActivity.create({ data: body });
  return NextResponse.json(activity, { status: 201 });
}
