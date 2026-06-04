import { mockContentBlocks } from "@/lib/mock";
import type { ActivityType } from "@/types/activity";

export const ACTIVITY_TYPE_META: Record<ActivityType, { label: string; color: string }> = {
  CHECKIN: { label: "체크인", color: "bg-blue-50 text-blue-700" },
  POLL: { label: "설문", color: "bg-purple-50 text-purple-700" },
  JOURNAL: { label: "저널", color: "bg-amber-50 text-amber-700" },
  MEDITATION: { label: "명상", color: "bg-green-50 text-green-700" },
  BREATHING: { label: "호흡", color: "bg-teal-50 text-teal-700" },
  MOVEMENT: { label: "동작", color: "bg-orange-50 text-orange-700" },
  VIDEO: { label: "영상", color: "bg-indigo-50 text-indigo-700" },
  DISCUSSION: { label: "토론", color: "bg-rose-50 text-rose-700" },
};

export function getActivityTypeMeta(type: string) {
  return ACTIVITY_TYPE_META[type as ActivityType] ?? {
    label: type,
    color: "bg-gray-100 text-gray-700",
  };
}

export const CONTENT_CATALOG = mockContentBlocks.map((content) => ({
  ...content,
  typeMeta: getActivityTypeMeta(content.type),
}));
