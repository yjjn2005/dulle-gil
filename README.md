# 전국 둘레길 · 수서역 기준 (dulle-gil)
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

## 지역
- 서울(서울둘레길 21코스), 경기(경기둘레길 60코스) 제공
- 인천·강원·충청·경상·전라·제주·울릉도는 버튼만 있고 "자료 준비 중" (공식 노선 확인 후 순차 추가)
- 경기 데이터: gg-data.js (경기둘레길 누리집 ggtour.or.kr 의 코스 목록·노선 좌표, 2026-10-04 수집)

## 대중교통 이동시간 (ODsay)
- config.js 의 `window.ODSAY_API_KEY` 에 ODsay 키(플랫폼 URL: https://yjjn2005.github.io)를 넣으면 코스 상세의 "길찾기 API로 확인"과 상단 "대중교통 이동시간 확인(ODsay)" 버튼이 동작합니다.
- 조회 결과는 브라우저에 저장되고, access-data.js 에 넣어 두면 모든 기기에서 바로 표시됩니다.
- ODsay 결과는 조회 시각의 시간표 기준이며, 대중교통 경로가 없는 구간은 "경로 없음"으로 표시합니다(택시·자가용 필요).
