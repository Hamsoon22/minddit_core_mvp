import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  contentBlockId: z.string().nullable().optional(),
  titleSnapshot: z.string().min(1).optional(),
  typeSnapshot: z
    .enum([
      "CHECKIN",
      "POLL",
      "JOURNAL",
      "MEDITATION",
      "BREATHING",
      "MOVEMENT",
      "VIDEO",
      "DISCUSSION",
    ])
    .optional(),
  durationMinSnapshot: z.number().int().min(1).optional(),
  contentSnapshot: z.string().nullable().optional(),
  order: z.number().int().optional(),
});

async function assertOwner(sessionId: string, userId: string) {
  const owner = await db.session.findFirst({
    where: { id: sessionId, createdById: userId },
    select: { id: true },
  });
  return Boolean(owner);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await assertOwner(params.id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = patchSchema.parse(await req.json());

  const updated = await db.programScheduleItem.update({
    where: { id: params.itemId },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await assertOwner(params.id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.programScheduleItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ ok: true });
}
