# Minddit Core MVP 실행 로드맵 (Phase Plan)

## 기준 문서
- 프로그램 관리 기능 명세: docs/program-management-mvp-spec.md

## 현재 코드 상태 요약
- 이미 존재:
  - 프로그램(세션) 목록/상세 화면
  - 활동(콘텐츠) 라이브러리 조회 UI
  - 참여자 목록/상세 UI
  - 기본 API: sessions, session by id, participants 생성, activities 조회
- 미구현 또는 확장 필요:
  - 프로그램 생성 입력 스펙 확장(운영방식/일정유형/기관정보)
  - 일정 유형별 하위 일정(주차/일자/월) 모델
  - 일정 단위 콘텐츠 구성(추가/삭제/순서/복제)
  - 참여자 링크 상세 페이지 정보 확장
  - 템플릿 기반 안내 메시지 생성

## Phase 1 (핵심 MVP)
목표: 프로그램 생성/수정/상세/참여자 링크의 핵심 플로우 완성

### 1. 데이터 모델 확장
- Session(프로그램) 확장 필드 추가
  - mode: IN_PERSON | ONLINE | HYBRID
  - scheduleType: WEEKLY | DATE_SPECIFIC | MONTHLY
  - institutionName, institutionAddress, institutionDirections, institutionPhone, institutionEmail
- ProgramSchedule(신규) 추가
  - id, sessionId, label, date(optional), month(optional), order
- ProgramScheduleItem(신규) 추가
  - id, scheduleId, contentBlockId(optional), titleSnapshot, typeSnapshot, durationMinSnapshot, order

### 2. 프로그램 생성/수정 폼
- 프로그램 생성 화면에 다음 입력 추가
  - 프로그램명, 설명(선택), 운영방식, 일정유형
- 설정 기관 정보 자동 채움 + 프로그램별 수정 가능
- 생성 후 상태 초안(DRAFT) 저장

### 3. 일정 구성
- 일정유형 선택 시 일정 자동 생성 보조
  - WEEKLY: N주차 생성
  - DATE_SPECIFIC: 날짜 리스트 입력
  - MONTHLY: 월 리스트 입력
- 일정 CRUD(추가/수정/삭제/순서)

### 4. 프로그램 구성
- 일정별 콘텐츠 배치
  - 콘텐츠 추가/삭제/순서 변경/복제
- 라이브러리 선택 기반으로 삽입

### 5. 참여자 링크 생성
- 프로그램 저장 시 링크 코드 생성/갱신
- 링크 복사 버튼 제공
- 참여자 링크 페이지에서 프로그램 정보 노출

## Phase 2 (운영 효율 기능)
목표: 안내 자동화 + 운영 편의성 강화

### 1. 템플릿 메시지 생성
- 프로그램 전체 안내 메시지 생성기
- 회차별 안내 메시지 생성기
- 편집/복사 기능

### 2. 상세 페이지 고도화
- 프로그램 상세에서 일정/회차/활동/기관정보 통합 표시
- 참여자 수, 상태, 생성일 노출 정교화

### 3. 공유 기능
- 링크 공유(클립보드 + 공유 API)
- QR 코드 생성(초기 버전)

## Phase 3 (v2 백로그)
- 문자/이메일/알림톡/예약 발송
- 자동 리마인더
- QR 체크인/출결/만족도
- AI 안내문/추천

## 수용 기준 (DoD)
- 프로그램 생성부터 참여자 링크 확인까지 1회 시나리오 성공
- 일정유형 3종 모두 생성/수정 가능
- 일정별 콘텐츠 편집(추가/삭제/순서/복제) 동작
- 템플릿 메시지 생성 결과가 필수 변수 누락 없이 생성
- 주요 API 입력 검증(zod) 및 권한 체크 포함
