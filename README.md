# Vercel 소개 페이지

모던한 정적 소개 홈페이지입니다. Vercel에서 별도 빌드 설정 없이 배포할 수 있습니다.

## 수정할 곳

- `index.html`의 이름, 소개 문구, 이메일, GitHub 링크
- `styles.css`의 색상과 간격
- `assets/hero-workspace.png`의 히어로 이미지
- `script.js`의 관리자 패널 기본 비밀번호

## 관리자 기능

상단 `Admin` 버튼을 누르고 기본 비밀번호 `admin1234`를 입력하면 주요 문구를 수정할 수 있습니다. 변경 내용은 현재 브라우저의 `localStorage`에 저장됩니다.

정적 사이트에서 동작하는 간단한 편집 기능이므로 실제 사용자 인증이나 서버 저장이 필요한 경우에는 Vercel 서버리스 함수, 데이터베이스, 인증 서비스를 추가해야 합니다.

## Vercel 배포

1. 이 폴더를 GitHub 저장소로 push합니다.
2. [Vercel](https://vercel.com)에 로그인합니다.
3. `Add New...` → `Project`를 누릅니다.
4. GitHub 저장소를 선택하고 `Import`합니다.
5. Framework Preset은 `Other` 또는 자동 감지 그대로 둡니다.
6. Build Command와 Output Directory는 비워 둔 상태로 `Deploy`합니다.

배포가 끝나면 Vercel이 `https://프로젝트명.vercel.app` 주소를 제공합니다.
