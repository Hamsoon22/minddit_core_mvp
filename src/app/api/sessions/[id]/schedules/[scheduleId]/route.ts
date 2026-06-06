import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({
  label: z.string().min(1).optional(),
  date: z.string().nullable().optional(),
  month: z.number().int().min(1).max(12).nullable().optional(),
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
  { params }: { params: { id: string; scheduleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await assertOwner(params.id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = patchSchema.parse(await req.json());

  const updated = await db.programSchedule.update({
    where: { id: params.scheduleId },
    data: {
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.date !== undefined ? { date: body.date ? new Date(body.date) : null } : {}),
      ...(body.month !== undefined ? { month: body.month } : {}),
      ...(body.order !== undefined ? { order: body.order } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string; scheduleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await assertOwner(params.id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.programSchedule.delete({ where: { id: params.scheduleId } });
  return NextResponse.json({ ok: true });
}
