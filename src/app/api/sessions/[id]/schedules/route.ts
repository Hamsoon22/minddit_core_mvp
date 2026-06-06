import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  label: z.string().min(1),
  date: z.string().optional(),
  month: z.number().int().min(1).max(12).optional(),
  order: z.number().int().optional(),
});

async function assertOwner(sessionId: string, userId: string) {
  const owner = await db.session.findFirst({
    where: { id: sessionId, createdById: userId },
    select: { id: true },
  });
  return Boolean(owner);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await assertOwner(params.id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const schedules = await db.programSchedule.findMany({
    where: { sessionId: params.id },
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await assertOwner(params.id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = createSchema.parse(await req.json());

  const created = await db.programSchedule.create({
    data: {
      sessionId: params.id,
      label: body.label,
      date: body.date ? new Date(body.date) : undefined,
      month: body.month,
      order: body.order ?? 0,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
