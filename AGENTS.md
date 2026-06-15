# AGENTS.md

## 목적
이 문서는 이 저장소에서 작업하는 AI 코딩 에이전트가 빠르게 안전하게 기여하도록 돕는 최소 실행 지침입니다.

## 빠른 시작
- 의존성 설치: `npm install`
- 개발 서버: `npm run dev`
- 프로덕션 빌드: `npm run build`
- DB 스키마 반영: `npm run db:push`
- Prisma Studio: `npm run db:studio`
- 시드 데이터: `npm run db:seed`

## 필수 환경 변수
- `DATABASE_URL` (없으면 Prisma 명령 실패, P1012)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

DB/환경 설정 체크리스트: [docs/db-setup-later-checklist.md](docs/db-setup-later-checklist.md)

## 아키텍처 맵
- App Router: `src/app`
- 인증 화면: `src/app/(auth)`
- 운영 대시보드: `src/app/(dashboard)`
- API 라우트: `src/app/api`
- 참여자 공개 진입: `src/app/s/[code]`
- Prisma 스키마: `prisma/schema.prisma`
- DB 클라이언트: `src/lib/db.ts`

## 데이터 동작 규칙
- 세션 상태는 `src/lib/programSessions.ts`에서 날짜 기반으로 파생됩니다.
- 로컬 시드 데이터는 `STORAGE_KEY` 버전 키로 관리됩니다. 시드 변경 반영이 필요하면 키를 올립니다.
- 스키마 관계를 바꿀 때는 양방향 relation 필드를 모두 맞추고 generate/build를 진행합니다.

## 인증/접근 제어 주의
- NextAuth 설정은 `src/lib/auth.ts`에 있습니다.
- 대시보드 레이아웃 보호 로직은 `src/app/(dashboard)/layout.tsx`에서 확인합니다.

## 변경 위치 가이드
- UI 컴포넌트: `src/components/dashboard`, `src/components/session`, `src/components/ui`
- 도메인 유틸/서비스: `src/lib`
- 타입: `src/types`
- API 엔드포인트: `src/app/api/**/route.ts`

## 작업 원칙
- 기존 폴더 경계(components/hooks/lib/types/app routes)를 유지합니다.
- 문서가 이미 있으면 중복 작성 대신 링크합니다.
- mock/localStorage 의존 로직과 DB 연동 로직을 혼동하지 않습니다.

## 참고 문서
- [docs/program-management-mvp-spec.md](docs/program-management-mvp-spec.md)
- [docs/mvp-phase-plan.md](docs/mvp-phase-plan.md)
- [docs/mvp-page-checklist.md](docs/mvp-page-checklist.md)
- [docs/mvp-api-db-change-proposal.md](docs/mvp-api-db-change-proposal.md)
