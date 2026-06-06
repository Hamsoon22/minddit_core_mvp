import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  contentBlockId: z.string().optional(),
  titleSnapshot: z.string().min(1),
  typeSnapshot: z.enum([
    "CHECKIN",
    "POLL",
    "JOURNAL",
    "MEDITATION",
    "BREATHING",
    "MOVEMENT",
    "VIDEO",
    "DISCUSSION",
  ]),
  durationMinSnapshot: z.number().int().min(1),
  contentSnapshot: z.string().optional(),
  order: z.number().int().optional(),
});

async function assertOwner(sessionId: string, userId: string) {
  const owner = await db.session.findFirst({
    where: { id: sessionId, createdById: userId },
    select: { id: true },
  });
  return Boolean(owner);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string; scheduleId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await assertOwner(params.id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = createSchema.parse(await req.json());

  const created = await db.programScheduleItem.create({
    data: {
      scheduleId: params.scheduleId,
      contentBlockId: body.contentBlockId,
      titleSnapshot: body.titleSnapshot,
      typeSnapshot: body.typeSnapshot,
      durationMinSnapshot: body.durationMinSnapshot,
      contentSnapshot: body.contentSnapshot,
      order: body.order ?? 0,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
