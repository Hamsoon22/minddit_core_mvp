import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED"]).optional(),
  mode: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]).optional(),
  scheduleType: z.enum(["WEEKLY", "DATE_SPECIFIC", "MONTHLY"]).optional(),
  scheduledAt: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  institutionName: z.string().nullable().optional(),
  institutionAddress: z.string().nullable().optional(),
  institutionDirections: z.string().nullable().optional(),
  institutionPhone: z.string().nullable().optional(),
  institutionEmail: z.string().nullable().optional(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const s = await db.session.findUnique({
    where: { id: params.id },
    include: {
      activities: { orderBy: { order: "asc" } },
      participants: true,
      schedules: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(s);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owner = await db.session.findFirst({
    where: { id: params.id, createdById: session.user.id },
    select: { id: true },
  });
  if (!owner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = patchSchema.parse(await req.json());
  const { scheduledAt, startDate, endDate, ...rest } = body;

  const updated = await db.session.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
      ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owner = await db.session.findFirst({
    where: { id: params.id, createdById: session.user.id },
    select: { id: true },
  });
  if (!owner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.session.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
