"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProgramSession,
  getProgramSessionById,
  updateProgramSession,
  type LocalScheduleItem,
  type ProgramSession,
} from "@/lib/programSessions";
import type { ProgramMode, ScheduleType } from "@/types/session";

const DRAFT_CREATE_GUARD_KEY = "mindflow.new-session-create-guard";
const DRAFT_CREATED_ID_KEY = "mindflow.new-session-created-id";

type DraftScheduleItem = {
  id: string;
  date: string;
  weekStart: string;
  weekEnd: string;
  year: string;
  month: string;
};

const SCHEDULE_TYPE_LABEL: Record<ScheduleType, string> = {
  DATE_SPECIFIC: "일자별",
  WEEKLY: "주별",
  MONTHLY: "월별",
};

const MODE_LABEL: Record<ProgramMode, string> = {
  IN_PERSON: "대면",
  ONLINE: "비대면",
  HYBRID: "대면+비대면",
};

const EXPERT_OPTIONS = ["서윤희", "김서연", "박정민", "이현우"];

function formatDate(dateText?: string) {
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

function toDateInput(date?: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function openNativePicker(e: React.MouseEvent<HTMLInputElement>) {
  const target = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
  if (!target.showPicker) return;
  try {
    target.showPicker();
  } catch {
    // Some browsers block showPicker unless they detect a direct user gesture.
  }
}

function DatePickerRow({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <div className="relative rounded-lg border border-gray-300 bg-white px-3">
      <div className="flex h-11 items-center justify-between gap-3">
        <p className="shrink-0 text-sm text-gray-700">
          <span className="opacity-50">{label}</span> {value ? formatDate(value) : "0000.00.00"}
        </p>
        <span className="text-gray-500" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16 2V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 9.5H21" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={openNativePicker}
        min={min}
        max={max}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

function MonthPickerRow({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  min?: string;
  max?: string;
}) {
  const displayValue = value
    ? (() => {
        const [year, month] = value.split("-");
        if (!year || !month) return "0000년.00월";
        return `${year}년.${month}월`;
      })()
    : "0000년.00월";

  return (
    <div className="relative rounded-lg border border-gray-300 bg-white px-3">
      <div className="flex h-11 items-center justify-between gap-3">
        <p className="shrink-0 text-sm text-gray-700">
          <span className="opacity-50">{label}</span> {displayValue}
        </p>
        <span className="text-gray-500" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M16 2V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 9.5H21" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      </div>
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={openNativePicker}
        min={min}
        max={max}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

function blankItem(): DraftScheduleItem {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: "",
    weekStart: "",
    weekEnd: "",
    year: "",
    month: "",
  };
}

function monthValueFromItem(item: DraftScheduleItem) {
  if (!item.year || !item.month) return "";
  return `${item.year}-${item.month.padStart(2, "0")}`;
}

function fromLocalScheduleItem(item: LocalScheduleItem): DraftScheduleItem {
  return {
    id: item.id,
    date: item.date ?? "",
    weekStart: item.weekStart ?? "",
    weekEnd: item.weekEnd ?? "",
    year: item.year ? String(item.year) : "",
    month: item.month ? String(item.month) : "",
  };
}

function toLocalScheduleItems(
  draftItems: DraftScheduleItem[],
  scheduleType: ScheduleType
): LocalScheduleItem[] {
  return draftItems.map((item, index) => {
    if (scheduleType === "DATE_SPECIFIC") {
      return {
        id: item.id,
        label: `${index + 1}회차`,
        date: item.date,
      };
    }

    if (scheduleType === "WEEKLY") {
      return {
        id: item.id,
        label: `${index + 1}주차`,
        weekStart: item.weekStart,
        weekEnd: item.weekEnd,
      };
    }

    return {
      id: item.id,
      label: `${item.year}.${item.month}`,
      year: Number(item.year),
      month: Number(item.month),
    };
  });
}

function isItemValid(item: DraftScheduleItem, scheduleType: ScheduleType) {
  if (scheduleType === "DATE_SPECIFIC") return Boolean(item.date);
  if (scheduleType === "WEEKLY") return Boolean(item.weekStart && item.weekEnd);
  return Boolean(item.year && item.month);
}

function isDateOutsideRange(value: string, start: string, end: string) {
  if (!value) return false;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return false;
  if (start) {
    const min = new Date(start);
    if (!Number.isNaN(min.getTime()) && target < min) return true;
  }
  if (end) {
    const max = new Date(end);
    if (!Number.isNaN(max.getTime()) && target > max) return true;
  }
  return false;
}

function toYearMonthNumber(year: string, month: string) {
  if (!year || !month) return null;
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  return y * 100 + m;
}

function toDateYearMonthNumber(value: string) {
  if (!value) return null;
  const [y, m] = value.split("-");
  return toYearMonthNumber(y ?? "", m ?? "");
}

function isMonthOutsideRange(item: DraftScheduleItem, start: string, end: string) {
  const current = toYearMonthNumber(item.year, item.month);
  if (current === null) return false;

  const min = toDateYearMonthNumber(start);
  const max = toDateYearMonthNumber(end);

  if (min !== null && current < min) return true;
  if (max !== null && current > max) return true;
  return false;
}

function syncItemsWithRange(
  items: DraftScheduleItem[],
  type: ScheduleType,
  startDate: string,
  endDate: string,
  options?: {
    syncStartBoundary?: boolean;
    syncEndBoundary?: boolean;
    clearMiddleBoundaries?: boolean;
  }
) {
  const syncStartBoundary = options?.syncStartBoundary ?? false;
  const syncEndBoundary = options?.syncEndBoundary ?? false;
  const clearMiddleBoundaries = options?.clearMiddleBoundaries ?? false;

  if (items.length === 0) return [blankItem()];

  const nextItems = [...items];
  const firstIndex = 0;
  const lastIndex = nextItems.length - 1;

  if (type === "DATE_SPECIFIC") {
    if (clearMiddleBoundaries && nextItems.length > 2) {
      for (let i = 1; i < lastIndex; i += 1) {
        nextItems[i] = { ...nextItems[i], date: "" };
      }
    }

    const firstItem = nextItems[firstIndex];
    nextItems[firstIndex] = {
      ...firstItem,
      date: syncStartBoundary && startDate ? startDate : firstItem.date || startDate,
    };

    if (lastIndex > firstIndex) {
      const lastItem = nextItems[lastIndex];
      nextItems[lastIndex] = {
        ...lastItem,
        date: syncEndBoundary && endDate ? endDate : lastItem.date || endDate,
      };
    }

    return nextItems;
  }

  if (type === "WEEKLY") {
    if (clearMiddleBoundaries && nextItems.length > 2) {
      for (let i = 1; i < lastIndex; i += 1) {
        nextItems[i] = { ...nextItems[i], weekStart: "", weekEnd: "" };
      }
    }

    const firstItem = nextItems[firstIndex];
    nextItems[firstIndex] = {
      ...firstItem,
      weekStart:
        syncStartBoundary && startDate ? startDate : firstItem.weekStart || startDate,
      weekEnd: clearMiddleBoundaries ? "" : firstItem.weekEnd || endDate,
    };

    if (lastIndex > firstIndex) {
      const lastItem = nextItems[lastIndex];
      nextItems[lastIndex] = {
        ...lastItem,
        weekStart: clearMiddleBoundaries ? "" : lastItem.weekStart || startDate,
        weekEnd: syncEndBoundary && endDate ? endDate : lastItem.weekEnd || endDate,
      };
    }

    return nextItems;
  }

  if (!startDate) return nextItems;

  const [year, month] = startDate.split("-");
  const firstItem = nextItems[firstIndex];
  nextItems[firstIndex] = {
    ...firstItem,
    year: firstItem.year || year,
    month: firstItem.month || month,
  };
  return nextItems;
}

export default function SessionSetupPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<ProgramSession | null>(null);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<ProgramMode>("IN_PERSON");
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const [description, setDescription] = useState("");
  const [selectedExperts, setSelectedExperts] = useState<string[]>(["서윤희"]);
  const [expertDropdownOpen, setExpertDropdownOpen] = useState(false);
  const expertDropdownRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("DATE_SPECIFIC");
  const [scheduleItems, setScheduleItems] = useState<DraftScheduleItem[]>([blankItem()]);

  useEffect(() => {
    const found = getProgramSessionById(params.id);
    setSession(found);
    setTitle(found?.title ?? "");
    setMode((found?.mode as ProgramMode) ?? "IN_PERSON");
    setDescription(found?.description ?? "");
    setSelectedExperts(
      found?.expertName
        ? found.expertName
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean)
        : ["서윤희"]
    );
    setStartDate(toDateInput(found?.startDate));
    setEndDate(toDateInput(found?.endDate));

    const nextType = (found?.scheduleType ?? "DATE_SPECIFIC") as ScheduleType;
    setScheduleType(nextType);

    if (found?.scheduleItems && found.scheduleItems.length > 0) {
      setScheduleItems(found.scheduleItems.map(fromLocalScheduleItem));
      return;
    }

    if (found?.scheduledAt) {
      setScheduleItems([
        {
          id: `legacy-${found.id}`,
          date: toDateInput(found.scheduledAt),
          weekStart: toDateInput(found.startDate),
          weekEnd: toDateInput(found.endDate),
          year: "",
          month: "",
        },
      ]);
      return;
    }

    setScheduleItems([blankItem()]);
  }, [params.id]);

  useEffect(() => {
    window.sessionStorage.removeItem(DRAFT_CREATE_GUARD_KEY);
    window.sessionStorage.removeItem(DRAFT_CREATED_ID_KEY);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (expertDropdownRef.current && !expertDropdownRef.current.contains(e.target as Node)) {
        setExpertDropdownOpen(false);
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setModeDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const invalidRange = Boolean(startDate && endDate && new Date(startDate) > new Date(endDate));

  useEffect(() => {
    if (!session) return;
    if (invalidRange) return;

    const timeoutId = window.setTimeout(() => {
      updateProgramSession(session.id, {
        title: title.trim() || session.title,
        mode,
        description: description.trim() || null,
        expertName: selectedExperts.join(", "),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        scheduledAt: startDate ? new Date(startDate) : null,
        scheduleType,
        scheduleItems: toLocalScheduleItems(scheduleItems, scheduleType),
      });
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [
    session?.id,
    title,
    mode,
    description,
    selectedExperts,
    startDate,
    endDate,
    scheduleType,
    scheduleItems,
    invalidRange,
    session?.title,
  ]);

  const displayItems = useMemo(
    () => toLocalScheduleItems(scheduleItems, scheduleType),
    [scheduleItems, scheduleType]
  );

  const setupTitle = session?.status === "DRAFT" ? "프로그램 생성" : "프로그램 편집";
  const setupActionLabel = session?.status === "DRAFT" ? "프로그램 생성" : "프로그램 저장";

  const hasScheduleRangeViolation =
    scheduleType === "DATE_SPECIFIC"
      ? scheduleItems.some((item) => isDateOutsideRange(item.date, startDate, endDate))
      : scheduleType === "WEEKLY"
      ? scheduleItems.some(
          (item) =>
            isDateOutsideRange(item.weekStart, startDate, endDate) ||
            isDateOutsideRange(item.weekEnd, startDate, endDate) ||
            (item.weekStart && item.weekEnd && new Date(item.weekStart) > new Date(item.weekEnd))
        )
      : scheduleItems.some((item) => isMonthOutsideRange(item, startDate, endDate));

  const canCreate =
    title.trim().length > 0 &&
    selectedExperts.length > 0 &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    !invalidRange &&
    !hasScheduleRangeViolation &&
    scheduleItems.length > 0 &&
    scheduleItems.every((item) => isItemValid(item, scheduleType));

  function onAddScheduleItem() {
    setScheduleItems((prev) =>
      syncItemsWithRange(
        [...prev, blankItem()],
        scheduleType,
        startDate,
        endDate,
        {
          syncStartBoundary: true,
          syncEndBoundary: true,
          clearMiddleBoundaries: true,
        }
      )
    );
  }

  function onRemoveScheduleItem(id: string) {
    setScheduleItems((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((item) => item.id !== id);
      return syncItemsWithRange(filtered, scheduleType, startDate, endDate, {
        syncStartBoundary: true,
        syncEndBoundary: true,
        clearMiddleBoundaries: true,
      });
    });
  }

  function onChangeScheduleItem(id: string, patch: Partial<DraftScheduleItem>) {
    const targetIndex = scheduleItems.findIndex((item) => item.id === id);
    if (targetIndex === 0) {
      if (scheduleType === "DATE_SPECIFIC" && patch.date) {
        setStartDate(patch.date);
      }
      if (scheduleType === "WEEKLY" && patch.weekStart) {
        setStartDate(patch.weekStart);
      }
      if (scheduleType === "MONTHLY") {
        const nextYear = patch.year ?? scheduleItems[targetIndex]?.year;
        const nextMonth = patch.month ?? scheduleItems[targetIndex]?.month;
        if (nextYear && nextMonth) {
          setStartDate(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01`);
        }
      }
    }

    setScheduleItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function onChangeScheduleType(nextType: ScheduleType) {
    setScheduleType(nextType);
    setScheduleItems((prev) =>
      syncItemsWithRange(prev, nextType, startDate, endDate, {
        syncStartBoundary: true,
        syncEndBoundary: true,
      })
    );
  }

  function onChangeStartDate(next: string) {
    setStartDate(next);
    setScheduleItems((prev) =>
      syncItemsWithRange(prev, scheduleType, next, endDate, { syncStartBoundary: true })
    );
  }

  function onChangeEndDate(next: string) {
    setEndDate(next);
    setScheduleItems((prev) =>
      syncItemsWithRange(prev, scheduleType, startDate, next, { syncEndBoundary: true })
    );
  }

  function onToggleExpert(name: string) {
    setSelectedExperts((prev) => {
      if (prev.includes(name)) {
        return prev.length === 1 ? prev : prev.filter((item) => item !== name);
      }
      return [...prev, name];
    });
  }

  function onSelectMode(nextMode: ProgramMode) {
    setMode(nextMode);
    setModeDropdownOpen(false);
  }

  function onCancel() {
    if (!session) {
      router.push("/sessions");
      return;
    }

    if (session.status === "DRAFT") {
      deleteProgramSession(session.id);
      window.dispatchEvent(
        new CustomEvent("minddit:toast", {
          detail: { message: "삭제되었습니다.", tone: "error" },
        })
      );
      router.push("/sessions");
      return;
    }

    router.push(`/sessions/${session.id}`);
  }

  function onCreateProgram() {
    if (!session || !canCreate) return;

    const isDraft = session.status === "DRAFT";

    updateProgramSession(session.id, {
      title: title.trim(),
      mode,
      description: description.trim() || null,
      expertName: selectedExperts.join(", "),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      scheduledAt: new Date(startDate),
      scheduleType,
      scheduleItems: toLocalScheduleItems(scheduleItems, scheduleType),
      status: isDraft ? "SCHEDULED" : session.status,
    });

    window.dispatchEvent(
      new CustomEvent("minddit:toast", {
        detail: { message: isDraft ? "생성되었습니다." : "저장되었습니다.", tone: "success" },
      })
    );

    router.push(isDraft ? `/sessions/${session.id}/builder` : `/sessions/${session.id}`);
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">프로그램을 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push("/sessions")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
        >
          목록으로 이동
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/sessions/${session.id}`)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-xl font-semibold leading-none text-gray-900 hover:bg-gray-50"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{setupTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onCreateProgram}
            disabled={!canCreate}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#485763] px-4 text-sm font-medium text-white transition hover:bg-[#3f4c56] disabled:opacity-50"
          >
            {setupActionLabel}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-[#485763] p-4">
        <p className="mb-2 text-base font-bold text-white">{title.trim() || session.title}</p>
        {displayItems.length > 0 ? (
          <div className="space-y-1.5">
            {displayItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-white/20 bg-white/10 px-3 py-2"
              >
                <p className="text-sm font-bold text-white">{item.label || `${index + 1}번째 섹션`}</p>
                <p className="text-sm font-semibold text-gray-100">
                  {scheduleType === "DATE_SPECIFIC" && formatDate(item.date)}
                  {scheduleType === "WEEKLY" && `${formatDate(item.weekStart)} ~ ${formatDate(item.weekEnd)}`}
                  {scheduleType === "MONTHLY" && (item.year && item.month ? `${item.year}년 ${item.month}월` : "-")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-gray-100">아직 추가된 일정이 없습니다.</p>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              프로그램 명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              진행 방식 <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={modeDropdownRef}>
              <button
                type="button"
                onClick={() => setModeDropdownOpen((prev) => !prev)}
                className="relative h-11 w-full rounded-lg border border-black bg-white px-3 pr-11 text-left text-sm text-gray-700"
              >
                {MODE_LABEL[mode]}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-900 transition-transform ${modeDropdownOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {modeDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                  {(Object.keys(MODE_LABEL) as ProgramMode[]).map((modeKey) => {
                    const checked = mode === modeKey;
                    return (
                      <button
                        key={modeKey}
                        type="button"
                        onClick={() => onSelectMode(modeKey)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${checked ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        <span>{MODE_LABEL[modeKey]}</span>
                        {checked && <span className="text-xs font-bold">선택</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">설명</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              placeholder="프로그램 설명을 입력하세요"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              전문가 선택 <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={expertDropdownRef}>
              <button
                type="button"
                onClick={() => setExpertDropdownOpen((prev) => !prev)}
                className="relative h-11 w-full rounded-lg border border-black bg-white px-3 pr-11 text-left text-sm text-gray-700"
              >
                {selectedExperts.length > 0 ? `${selectedExperts.length}명 선택됨` : "전문가를 선택하세요"}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-900 transition-transform ${expertDropdownOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {expertDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                  {EXPERT_OPTIONS.map((expert) => {
                    const checked = selectedExperts.includes(expert);
                    return (
                      <button
                        key={expert}
                        type="button"
                        onClick={() => onToggleExpert(expert)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${checked ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        <span>{expert} 전문가</span>
                        {checked && <span className="text-xs font-bold">선택</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-2 min-h-[28px] flex flex-wrap gap-2">
              {selectedExperts.map((expert) => (
                <span
                  key={expert}
                  className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                >
                  {expert}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            프로그램 일정 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DatePickerRow
              label="시작일"
              value={startDate}
              onChange={onChangeStartDate}
            />
            <DatePickerRow
              label="종료일"
              value={endDate}
              onChange={onChangeEndDate}
            />
          </div>
          {invalidRange && (
            <p className="mt-2 text-xs text-red-500">종료일은 시작일 이후여야 합니다.</p>
          )}
        </div>
      </div>

      <div className="my-10 border-t border-gray-200" />

      <div className="mb-6 space-y-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{setupTitle} ({scheduleItems.length}개)</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-gray-700">{SCHEDULE_TYPE_LABEL[scheduleType]} 섹션</p>
              <div className="flex items-center gap-2">
                {(Object.keys(SCHEDULE_TYPE_LABEL) as ScheduleType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onChangeScheduleType(type)}
                    className={
                      scheduleType === type
                        ? "rounded-lg border border-[#485763] bg-[#485763] px-3 py-1.5 text-xs font-medium text-white"
                        : "rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    }
                  >
                    {SCHEDULE_TYPE_LABEL[type]}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={onAddScheduleItem}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#485763] text-lg leading-none text-white transition hover:bg-[#3f4c56]"
              aria-label="섹션 추가"
            >
              <span className="-translate-y-[1px]">+</span>
            </button>
          </div>

          {scheduleItems.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">{index + 1}번째 섹션</p>
                <button
                  type="button"
                  onClick={() => onRemoveScheduleItem(item.id)}
                  className="rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
                  disabled={scheduleItems.length <= 1}
                >
                  -
                </button>
              </div>

              {scheduleType === "DATE_SPECIFIC" && (
                <div>
                  <DatePickerRow
                    label="일자"
                    value={item.date}
                    onChange={(next) => onChangeScheduleItem(item.id, { date: next })}
                    min={index === 0 ? undefined : startDate || undefined}
                    max={endDate || undefined}
                  />
                </div>
              )}

              {scheduleType === "WEEKLY" && (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <DatePickerRow
                      label="시작일"
                      value={item.weekStart}
                      onChange={(next) => onChangeScheduleItem(item.id, { weekStart: next })}
                      min={index === 0 ? undefined : startDate || undefined}
                      max={endDate || undefined}
                    />
                  </div>
                  <div>
                    <DatePickerRow
                      label="종료일"
                      value={item.weekEnd}
                      onChange={(next) => onChangeScheduleItem(item.id, { weekEnd: next })}
                      min={startDate || undefined}
                      max={endDate || undefined}
                    />
                  </div>
                </div>
              )}

              {scheduleType === "MONTHLY" && (
                <div>
                  <MonthPickerRow
                    label="월별"
                    value={monthValueFromItem(item)}
                    onChange={(next) => {
                      const [year, month] = next.split("-");
                      onChangeScheduleItem(item.id, {
                        year: year || "",
                        month: month || "",
                      });
                    }}
                    min={index === 0 ? undefined : startDate ? startDate.slice(0, 7) : undefined}
                    max={endDate ? endDate.slice(0, 7) : undefined}
                  />
                </div>
              )}
            </div>
          ))}

          {hasScheduleRangeViolation && (
            <p className="text-xs font-medium text-red-500">프로그램 기간을 벗어난 일정은 저장할 수 없습니다.</p>
          )}
        </div>

      </div>

    </div>
  );
}
