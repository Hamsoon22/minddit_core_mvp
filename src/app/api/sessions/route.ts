import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  mode: z.enum(["IN_PERSON", "ONLINE", "HYBRID"]).optional(),
  scheduleType: z.enum(["WEEKLY", "DATE_SPECIFIC", "MONTHLY"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  institutionName: z.string().optional(),
  institutionAddress: z.string().optional(),
  institutionDirections: z.string().optional(),
  institutionPhone: z.string().optional(),
  institutionEmail: z.string().email().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await db.session.findMany({
    where: { createdById: session.user.id },
    include: { _count: { select: { participants: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = createSchema.parse(await req.json());

  const {
    scheduledAt,
    startDate,
    endDate,
    ...rest
  } = body;

  const created = await db.session.create({
    data: {
      ...rest,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      joinCode: nanoid(8),
      createdById: session.user.id,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
