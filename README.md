# 로또 번호 생성기

이 프로젝트는 Next.js를 기반으로 한 원페이지 웹 애플리케이션으로, 사용자에게 로또 번호를 생성하고 관리할 수 있는 기능을 제공합니다. 최신 당첨 번호 조회, 과거 당첨 번호 확인, 번호 저장 및 공유 등의 기능을 포함하고 있습니다.

## 주요 기능

- **최신 당첨 번호 조회**: API를 통해 최신 로또 당첨 번호를 가져와 표시합니다.
- **과거 당첨 번호 확인**: 과거의 로또 당첨 번호를 조회할 수 있습니다.
- **로또 번호 생성**: 사용자가 지정한 포함/제외 번호를 반영하여 로또 번호를 생성합니다.
- **번호 저장 및 관리**: 생성된 번호를 저장하고, 저장된 번호를 확인하거나 삭제할 수 있습니다.
- **공유 기능**: 생성된 번호를 카카오톡으로 공유할 수 있습니다.
- **다크 모드 지원**: 사용자 인터페이스의 다크 모드/라이트 모드 전환을 지원합니다.

## 기술 스택

- **Next.js**: React 기반의 서버 사이드 렌더링 프레임워크
- **Tailwind CSS**: 스타일링을 위한 유틸리티 퍼스트 CSS 프레임워크
- **React**: 사용자 인터페이스 구축을 위한 JavaScript 라이브러리

## 설치 및 실행

1. 저장소를 클론합니다:
   ```bash
   git clone <repository-url>
   cd lotto-number-generator
   ```
2. 의존성을 설치합니다:
   ```bash
   npm install
   ```
3. 개발 서버를 실행합니다:
   ```bash
   npm run dev
   ```
4. 브라우저에서 `http://localhost:3000`에 접속하여 애플리케이션을 확인합니다.

## 기여

버그 제보, 기능 제안 등 모든 기여를 환영합니다. 이슈를 생성하거나 풀 리퀘스트를 보내주세요.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

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