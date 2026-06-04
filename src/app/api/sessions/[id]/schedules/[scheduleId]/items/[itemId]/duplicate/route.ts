import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function assertOwner(sessionId: string, userId: string) {
  const owner = await db.session.findFirst({
    where: { id: sessionId, createdById: userId },
    select: { id: true },
  });
  return Boolean(owner);
}

export async function POST(
  _: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await assertOwner(params.id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const target = await db.programScheduleItem.findUnique({
    where: { id: params.itemId },
  });

  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const duplicated = await db.programScheduleItem.create({
    data: {
      scheduleId: target.scheduleId,
      contentBlockId: target.contentBlockId,
      titleSnapshot: `${target.titleSnapshot} (복제)`,
      typeSnapshot: target.typeSnapshot,
      durationMinSnapshot: target.durationMinSnapshot,
      contentSnapshot: target.contentSnapshot,
      order: target.order + 1,
    },
  });

  return NextResponse.json(duplicated, { status: 201 });
}
