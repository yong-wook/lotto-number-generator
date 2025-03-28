# 로또 번호 생성기

로또 번호를 생성하고 관리하는 애플리케이션입니다.

## 데이터베이스 구조

### lotto_numbers 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 고유 식별자 (Primary Key) |
| numbers | INTEGER[] | 생성된 로또 번호 배열 |
| created_at | TIMESTAMP WITH TIME ZONE | 생성 시간 |
| is_winner | BOOLEAN | 당첨 여부 |
| draw_round | INTEGER | 추첨 회차 |
| matching_count | INTEGER | 맞은 번호 개수 |

## 기술 스택

- Database: Supabase (PostgreSQL)
- Backend: Node.js
- Frontend: React (예정)

## 설정 방법

1. Supabase 프로젝트 생성
2. `schema.sql` 파일의 내용을 Supabase SQL 편집기에서 실행
3. 환경 변수 설정 (추후 추가 예정)

## 개발 예정 기능

- 로또 번호 자동 생성
- 당첨 번호 비교
- 통계 분석
- 번호 추천

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.