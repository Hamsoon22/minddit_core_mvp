# Minddit Core MVP API/DB 변경안

## 1. Prisma 스키마 변경 제안

### 1-1. Session 확장
- 기존 Session은 프로그램 엔터티로 활용
- 추가 컬럼
  - mode ProgramMode @default(HYBRID)
  - scheduleType ScheduleType @default(WEEKLY)
  - institutionName String?
  - institutionAddress String?
  - institutionDirections String?
  - institutionPhone String?
  - institutionEmail String?
  - startDate DateTime?
  - endDate DateTime?

### 1-2. enum 추가
- ProgramMode
  - IN_PERSON
  - ONLINE
  - HYBRID
- ScheduleType
  - WEEKLY
  - DATE_SPECIFIC
  - MONTHLY

### 1-3. 일정 모델 추가
- ProgramSchedule
  - id String @id @default(cuid())
  - sessionId String
  - label String            // 예: 1주차, 2026.06.10, 6월
  - date DateTime?          // 특정 일자형
  - month Int?              // 월별형 (1~12)
  - order Int @default(0)
  - session Session @relation(... onDelete: Cascade)
  - items ProgramScheduleItem[]

### 1-4. 일정별 콘텐츠 배치 모델
- ProgramScheduleItem
  - id String @id @default(cuid())
  - scheduleId String
  - contentBlockId String?
  - titleSnapshot String
  - typeSnapshot ActivityType
  - durationMinSnapshot Int
  - contentSnapshot String?
  - order Int @default(0)
  - schedule ProgramSchedule @relation(... onDelete: Cascade)

### 1-5. 기관 설정 분리(선택)
- OrganizationSetting (권장)
  - userId(또는 orgId) 기준으로 기본 기관 정보 저장

## 2. API 변경 제안

### 2-1. 프로그램 생성/목록
- GET /api/sessions
  - 목록 + _count + 기본 일정 요약 포함
- POST /api/sessions
  - body
    - title, description?
    - mode
    - scheduleType
    - institution* fields
    - startDate?, endDate?

### 2-2. 프로그램 상세/수정
- GET /api/sessions/:id
  - include
    - schedules(order asc)
    - schedules.items(order asc)
    - participants
- PATCH /api/sessions/:id
  - 프로그램 메타 정보 수정

### 2-3. 일정 CRUD
- POST /api/sessions/:id/schedules
- PATCH /api/sessions/:id/schedules/:scheduleId
- DELETE /api/sessions/:id/schedules/:scheduleId
- PATCH /api/sessions/:id/schedules/reorder

### 2-4. 일정별 콘텐츠 CRUD
- POST /api/sessions/:id/schedules/:scheduleId/items
  - 라이브러리 ContentBlock 선택 삽입
- PATCH /api/sessions/:id/schedules/:scheduleId/items/:itemId
- DELETE /api/sessions/:id/schedules/:scheduleId/items/:itemId
- PATCH /api/sessions/:id/schedules/:scheduleId/items/reorder
- POST /api/sessions/:id/schedules/:scheduleId/items/:itemId/duplicate

### 2-5. 참여자 링크/공유
- GET /api/sessions/:id/share
  - joinCode, url 반환
- POST /api/sessions/:id/share/regenerate (선택)

### 2-6. 템플릿 메시지 생성
- POST /api/sessions/:id/messages/program
  - 프로그램 전체 안내 메시지 생성
- POST /api/sessions/:id/messages/schedule/:scheduleId
  - 회차별 안내 메시지 생성

## 3. 템플릿 메시지 변수 맵

### 프로그램 전체
- {{프로그램명}}
- {{시작일}}
- {{종료일}}
- {{전체일정}}
- {{프로그램링크}}
- {{전화번호}}
- {{이메일}}

### 회차별
- {{프로그램명}}
- {{회차명}}
- {{일정}}
- {{진행방식}}
- {{활동목록}}
- {{프로그램링크}}
- {{전화번호}}
- {{이메일}}

## 4. 마이그레이션 순서 제안
1. enum/컬럼 추가 + schedules/items 신규 테이블 생성
2. API 확장(읽기 우선)
3. 빌더 쓰기 API 연결
4. 템플릿 메시지 API 추가
5. 참여자 링크 페이지 정보 확장

## 5. 리스크/주의사항
- 기존 SessionActivity와 신규 ProgramScheduleItem 역할 중복 가능
  - 방안: SessionActivity는 레거시로 두고 신규는 ProgramScheduleItem으로 표준화
- 권한 체크 누락 방지
  - session.createdById === session.user.id 검증 필요
- 날짜/타임존
  - 저장은 UTC, 표시는 ko-KR 로컬 포맷으로 통일
