import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const settingsSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  directions: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  enableEmailNotification: z.boolean().optional(),
  enableAutoBackup: z.boolean().optional(),
});

async function resolveUserId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  const demo = await db.user.findUnique({ where: { email: "demo@mindflow.kr" } });
  return demo?.id ?? null;
}

export async function GET() {
  const userId = await resolveUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await db.organizationSetting.findUnique({ where: { userId } });

  return NextResponse.json(
    setting ?? {
      name: "",
      description: "",
      address: "",
      directions: "",
      phone: "",
      email: "",
      enableEmailNotification: true,
      enableAutoBackup: true,
    }
  );
}

export async function PATCH(req: Request) {
  const userId = await resolveUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = settingsSchema.parse(await req.json());

  const updated = await db.organizationSetting.upsert({
    where: { userId },
    create: {
      userId,
      name: body.name,
      description: body.description,
      address: body.address,
      directions: body.directions,
      phone: body.phone,
      email: body.email || null,
      enableEmailNotification: body.enableEmailNotification ?? true,
      enableAutoBackup: body.enableAutoBackup ?? true,
    },
    update: {
      name: body.name,
      description: body.description,
      address: body.address,
      directions: body.directions,
      phone: body.phone,
      email: body.email || null,
      enableEmailNotification: body.enableEmailNotification,
      enableAutoBackup: body.enableAutoBackup,
    },
  });

  return NextResponse.json(updated);
}
