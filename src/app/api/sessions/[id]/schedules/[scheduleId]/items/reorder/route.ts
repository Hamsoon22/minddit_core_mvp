import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number().int(),
    })
  ),
});

async function assertOwner(sessionId: string, userId: string) {
  const owner = await db.session.findFirst({
    where: { id: sessionId, createdById: userId },
    select: { id: true },
  });
  return Boolean(owner);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await assertOwner(params.id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = reorderSchema.parse(await req.json());

  await db.$transaction(
    body.items.map((item) =>
      db.programScheduleItem.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
