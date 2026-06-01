import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const db = new PrismaClient();

async function main() {
  const hashed = crypto.createHash("sha256").update("password123").digest("hex");

  const user = await db.user.upsert({
    where: { email: "demo@mindflow.kr" },
    update: {},
    create: { name: "데모 전문가", email: "demo@mindflow.kr", password: hashed },
  });

  await db.contentBlock.createMany({
    skipDuplicates: true,
    data: [
      { title: "감정 체크인", type: "CHECKIN", durationMin: 5, description: "지금 이 순간 감정 상태를 확인합니다.", content: "현재 감정을 1~10점으로 표현해보세요." },
      { title: "마음챙김 호흡", type: "BREATHING", durationMin: 7, description: "4-7-8 호흡법으로 마음을 안정시킵니다.", content: "4초 흡입 → 7초 유지 → 8초 날숨" },
      { title: "감사 저널", type: "JOURNAL", durationMin: 10, description: "오늘 감사한 것 3가지를 적어봅니다." },
      { title: "바디스캔 명상", type: "MEDITATION", durationMin: 15, description: "몸의 각 부분에 주의를 기울입니다." },
      { title: "그룹 토론", type: "DISCUSSION", durationMin: 20, description: "참여자들과 경험을 나눕니다." },
      { title: "스트레칭 동작", type: "MOVEMENT", durationMin: 8, description: "간단한 스트레칭으로 긴장을 풉니다." },
    ],
  });

  console.log("✓ Seed complete. Demo account: demo@mindflow.kr / password123");
}

main().finally(() => db.$disconnect());
