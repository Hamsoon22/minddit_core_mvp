"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ActivityType, SessionActivity } from "@/types/activity";
import type { ProgramSession } from "@/lib/programSessions";
import { CONTENT_CATALOG, getActivityTypeMeta } from "@/lib/contentCatalog";

const CONTENT_OPTIONS: {
  id: string;
  type: ActivityType;
  label: string;
  color: string;
  description: string;
  defaultMin: number;
  content: string;
}[] = [
  ...CONTENT_CATALOG.map((content) => ({
    id: content.id,
    type: content.type,
    label: content.title,
    color: content.typeMeta.color,
    description: content.description ?? "",
    defaultMin: content.durationMin,
    content: content.content ?? "",
  })),
];

type ScheduleActivitiesMap = Record<string, SessionActivity[]>;

type SavePayload = {
  activities: SessionActivity[];
  scheduleActivities: ScheduleActivitiesMap;
};

interface Props {
  session: ProgramSession;
  onSaveActivities?: (payload: SavePayload) => void;
}

function normalizeOrders(items: SessionActivity[]) {
  return items.map((item, index) => ({ ...item, order: index }));
}

function formatDateText(dateText?: string) {
  if (!dateText) return "-";
  const direct = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (direct) {
    return `${direct[1]}.${direct[2].padStart(2, "0")}.${direct[3].padStart(2, "0")}`;
  }

  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return "-";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function formatDate(date?: Date | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function SortableActivityItem({
  activity,
  index,
  onRemove,
}: {
  activity: SessionActivity;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: activity.id,
  });
  const typeInfo = getActivityTypeMeta(activity.type);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group flex items-center gap-3 rounded-lg bg-gray-50 p-3"
    >
      <button
        type="button"
        className="cursor-grab text-black active:cursor-grabbing"
        aria-label="활동 순서 변경"
        {...attributes}
        {...listeners}
      >
        ☰
      </button>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500">{index + 1}</span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
      <span className="flex-1 text-sm font-medium text-gray-800">{activity.title}</span>
      <span className="text-xs text-gray-400">{activity.durationMin}분</span>
      <button
        type="button"
        onClick={() => onRemove(activity.id)}
        className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 opacity-0 transition group-hover:opacity-100 hover:bg-red-100"
      >
        ✕
      </button>
    </li>
  );
}

export default function SessionBuilder({ session, onSaveActivities }: Props) {
  const router = useRouter();
  const scheduleSections =
    session.scheduleItems.length > 0
      ? session.scheduleItems
      : [{ id: "default", label: "기본 세션" }];

  const [selectedSectionId, setSelectedSectionId] = useState(scheduleSections[0].id);
  const [scheduleActivities, setScheduleActivities] = useState<ScheduleActivitiesMap>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const nextMap: ScheduleActivitiesMap = {};

    scheduleSections.forEach((section, index) => {
      const fromStored = session.scheduleActivities?.[section.id] ?? [];
      if (fromStored.length > 0) {
        nextMap[section.id] = normalizeOrders(fromStored);
        return;
      }

      if (index === 0) {
        nextMap[section.id] = normalizeOrders(session.activities ?? []);
        return;
      }

      nextMap[section.id] = [];
    });

    setScheduleActivities(nextMap);
    setSelectedSectionId(scheduleSections[0].id);
  }, [session.id, session.activities, session.scheduleActivities, session.scheduleItems]);

  const currentActivities = scheduleActivities[selectedSectionId] ?? [];
  const totalMin = currentActivities.reduce((sum, activity) => sum + activity.durationMin, 0);
  const selectedSection = scheduleSections.find((section) => section.id === selectedSectionId) ?? scheduleSections[0];

  function getSectionLabel(section: ProgramSession["scheduleItems"][number] | { id: string; label: string }) {
    if (session.scheduleType === "DATE_SPECIFIC") {
      const date = "date" in section ? section.date : undefined;
      return `${section.label}(${formatDateText(date)})`;
    }

    if (session.scheduleType === "WEEKLY") {
      const weekStart = "weekStart" in section ? section.weekStart : undefined;
      const weekEnd = "weekEnd" in section ? section.weekEnd : undefined;
      return `${section.label}(${formatDateText(weekStart)} ~ ${formatDateText(weekEnd)})`;
    }

    return section.label;
  }

  const selectedSectionText = selectedSection ? getSectionLabel(selectedSection) : "1회차";

  function patchCurrentActivities(updater: (items: SessionActivity[]) => SessionActivity[]) {
    setScheduleActivities((prev) => {
      const base = prev[selectedSectionId] ?? [];
      return {
        ...prev,
        [selectedSectionId]: normalizeOrders(updater(base)),
      };
    });
  }

  function addActivity(option: {
    type: ActivityType;
    label: string;
    defaultMin: number;
    content: string;
  }) {
    patchCurrentActivities((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        sessionId: session.id,
        title: option.label,
        type: option.type,
        durationMin: option.defaultMin,
        content: option.content,
        order: prev.length,
      },
    ]);
  }

  function removeActivity(id: string) {
    patchCurrentActivities((prev) => prev.filter((activity) => activity.id !== id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    patchCurrentActivities((prev) => {
      const oldIndex = prev.findIndex((activity) => activity.id === active.id);
      const newIndex = prev.findIndex((activity) => activity.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  const flattenedActivities = useMemo(() => {
    return scheduleSections.flatMap((section) => scheduleActivities[section.id] ?? []);
  }, [scheduleActivities, scheduleSections]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/sessions/${session.id}`)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-xl font-semibold leading-none text-gray-900 hover:bg-gray-50"
            >
              ←
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">{session.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/sessions/${session.id}`)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              onSaveActivities?.({
                activities: flattenedActivities,
                scheduleActivities,
              });
              router.push(`/sessions/${session.id}`);
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#485763] px-4 text-sm font-medium text-white transition hover:bg-[#3f4c56]"
          >
            활동 저장
          </button>
        </div>
      </div>

      <div className="mb-4 space-y-4">
        <div className="rounded-lg border border-[#292929] bg-[#292929] px-4 py-3 text-sm text-white">
          <span className="font-semibold">프로그램 기간:</span> {formatDate(session.startDate)} ~ {formatDate(session.endDate)}
        </div>

        {scheduleSections.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {scheduleSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setSelectedSectionId(section.id)}
                className={
                  selectedSectionId === section.id
                    ? "rounded-lg border border-[#485763] bg-[#485763] px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                }
              >
                {getSectionLabel(section)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="min-h-64 rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{selectedSectionText}</h2>
              <span className="text-sm font-medium text-gray-600">총 소요시간 {totalMin}분</span>
            </div>
            {currentActivities.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-400">오른쪽에서 활동 유형을 선택하세요</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext
                  items={currentActivities.map((activity) => activity.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="space-y-2">
                    {currentActivities.map((activity, index) => (
                      <SortableActivityItem
                        key={activity.id}
                        activity={activity}
                        index={index}
                        onRemove={removeActivity}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">활동 추가</h2>
            <div className="space-y-2">
              {CONTENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => addActivity(option)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-left transition hover:bg-gray-50"
                >
                  {(() => {
                    const typeMeta = getActivityTypeMeta(option.type);
                    return (
                      <>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeMeta.color}`}>{typeMeta.label}</span>
                    <span className="ml-auto rounded-md bg-black px-2 py-0.5 text-xs font-semibold text-white">+ 추가</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{option.label}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <p className="text-gray-500">{option.description || "설명 없음"}</p>
                    <p className="font-semibold text-gray-700">{option.defaultMin}분</p>
                  </div>
                      </>
                    );
                  })()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
