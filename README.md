# 아즈텍 주식회사 · Sapphire Manager

판매제품 및 자산관리 웹앱 (Next.js 14 정적 export + Supabase + GitHub Pages)

| 항목 | 내용 |
|---|---|
| 화면 | Next.js 14 (정적 export) → GitHub Pages |
| 데이터 · 로그인 · 사진 | Supabase (Postgres, Auth, Storage) |
| 자동 배포 | `.github/workflows/deploy.yml` (main 브랜치에 올리면 자동 빌드·배포) |
| 정지 방지 | `.github/workflows/keepalive.yml` (3일마다 Supabase 조회) |

## 설정 순서 (요약)
1. Supabase 프로젝트 생성 → SQL Editor 에서 `supabase-schema.sql` 실행
2. Authentication 에서 직원 계정 생성, 신규 가입 비활성화
3. `admins` 표에 관리자 이메일 등록 (수정·삭제 권한)
4. GitHub 저장소(Public) 생성 → Settings → Secrets 에 아래 값 등록
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (선택) `NEXT_PUBLIC_ADMIN_PIN` : 관리자 모드 진입 시 한 번 더 묻는 확인 비밀번호
5. Settings → Pages → Source 를 **GitHub Actions** 로 선택
6. 이 폴더의 파일을 저장소에 올리면 자동 배포

자세한 설명은 함께 제공된 Word 설정 설명서를 참고하세요.

## 로컬 실행 (선택)
```
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```
