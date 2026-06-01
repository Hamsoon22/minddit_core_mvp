# Mindflow — 정신건강 프로그램 플랫폼

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local에 DATABASE_URL, NEXTAUTH_SECRET 등 입력
```

### 3. DB 초기화
```bash
npm run db:push     # 스키마 적용
npm run db:seed     # 샘플 데이터 삽입
```

### 4. 개발 서버 실행
```bash
npm run dev
```

→ http://localhost:3000  
데모 계정: `demo@mindflow.kr` / `password123`

## 주요 라우트

| 경로 | 설명 |
|------|------|
| `/` | 대시보드 홈 |
| `/sessions` | 세션 목록 |
| `/sessions/[id]/builder` | 세션 빌더 |
| `/sessions/[id]/live` | 실시간 세션 운영 |
| `/participants` | 참여자 관리 |
| `/library` | 콘텐츠 라이브러리 |
| `/s/[code]` | 참여자 QR 입장 페이지 |

## 기술 스택
- **프레임워크**: Next.js 14 (App Router)
- **스타일**: Tailwind CSS
- **DB**: PostgreSQL + Prisma ORM
- **인증**: NextAuth.js
- **실시간**: Socket.io (hooks/useSocket.ts)
- **이메일**: Nodemailer
