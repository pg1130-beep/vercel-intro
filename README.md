# Vercel 소개 페이지

간단한 정적 소개 페이지입니다. Vercel에서 별도 빌드 설정 없이 배포할 수 있습니다.

## 수정할 곳

- `index.html`의 이름, 소개 문구, 이메일, GitHub 링크
- `styles.css`의 색상과 간격

## Vercel 배포

1. 이 폴더를 GitHub 저장소로 push합니다.
2. [Vercel](https://vercel.com)에 로그인합니다.
3. `Add New...` → `Project`를 누릅니다.
4. GitHub 저장소를 선택하고 `Import`합니다.
5. Framework Preset은 `Other` 또는 자동 감지 그대로 둡니다.
6. Build Command와 Output Directory는 비워 둔 상태로 `Deploy`합니다.

배포가 끝나면 Vercel이 `https://프로젝트명.vercel.app` 주소를 제공합니다.
