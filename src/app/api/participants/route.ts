import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1), sessionId: z.string() });

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const participant = await db.participant.create({ data: body });
  return NextResponse.json(participant, { status: 201 });
}
