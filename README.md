# 회전초밥 브레이커 (Sushi Breaker)

Zuma 스타일의 세로형 하이퍼 캐주얼 퍼즐 게임.

## 실행

```bash
npm install
npm run dev
```

빌드: `npm run build`  
미리보기: `npm run preview`

## 기술 스택

- TypeScript, Vite
- PixiJS v8 (렌더링)
- Zustand (상태)
- Tailwind CSS (UI)
- PWA (vite-plugin-pwa)

## 에셋

- `public/assets/sushi/` — 7종 초밥 스프라이트 (egg, shrimp, tobiko, ikura, salmon, tuna, whitefish)
- `public/assets/items/` — 와사비·초생강 아이콘
- `public/assets/sounds/` — 효과음 (발사, 매칭, 콤보, 아이템)

현재는 플레이스홀더 그래픽/비프 사운드로 동작합니다. 위 경로에 에셋을 넣고 로더를 연동하면 교체할 수 있습니다.
