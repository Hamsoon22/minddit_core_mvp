# 나중에 DB 설정할 때 체크리스트

## 1) 환경변수 준비
- 프로젝트 루트에 `.env` 파일 생성
- 최소 필수값 입력
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

## 2) Prisma 반영
- `npm run db:generate`
- `npm run db:push`

## 3) 초기 데이터(선택)
- `npm run db:seed`
- 데모 계정 확인: `demo@mindflow.kr`

## 4) 이번 작업 기준 확인 포인트
- 설정 페이지 저장/재조회 동작 확인
- `GET /api/settings` 응답 확인
- `PATCH /api/settings` 저장 후 새로고침 유지 확인

## 5) 문제 발생 시 빠른 점검
- `DATABASE_URL` 누락 여부
- DB 서버 기동 여부
- Prisma 스키마 변경 후 `db:generate` 재실행 여부
