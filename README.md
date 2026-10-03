# 서울둘레길 · 수서역 기준 (dulle-gil)
구글맵에 서울둘레길 코스 선과 시·종점 깃발을 표시하는 모바일 웹앱.

## 배포 (GitHub Pages)
1. GitHub에 저장소 `dulle-gil` 생성 → 이 폴더의 파일 전체 업로드
2. Settings → Pages → Branch: main / root
3. 주소: https://yjjn2005.github.io/dulle-gil/
   (config.js의 구글맵 키는 europe-trip 앱과 동일 키, yjjn2005.github.io/* 리퍼러 제한이라 그대로 동작)

## 구조
- data.js : 코스·경로·깃발 데이터 (이 파일만 교체해 데이터 갱신)
- app.js / style.css / index.html : 화면 로직
- config.js : 공용 구글맵 키

## 데이터 출처·한계
- 경로: OpenStreetMap(ODbL). 거리·난이도: 서울둘레길 누리집·숲나들e
- 1·2·3코스 개별 경로 없음(통합선만), 14코스 선 없음 → '자료 준비 중' 표시
- 수서역 이동시간은 추정치
