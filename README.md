# Oracle 해부도

Oracle Database 19c의 내부 구조를 한 단계씩 넘겨 보며 이해하는 인터랙티브 학습 사이트입니다.

**사이트:** https://batiappa.github.io/oracle-anatomy/

![COMMIT의 여정 레슨 화면](og.jpg)

## 무엇을 보여 주나

첫 레슨 **COMMIT의 여정**은 `UPDATE` 한 문장과 `COMMIT` 한 번을 10단계로 따라갑니다. 주요 내용은 다음과 같습니다.

1. 블록을 Buffer Cache로 읽기
2. 이전 값을 Undo에 기록
3. 변경 벡터를 Redo Log Buffer에 기록하고 블록이 dirty가 됨
4. `COMMIT`: SCN 할당, 커밋 레코드, LGWR 호출, `log file sync` 대기
5. LGWR의 온라인 Redo 로그 순차 쓰기
6. DBWn의 지연 쓰기와 Write-Ahead Logging
7. 사례: 커밋 직후 정전과 SMON 인스턴스 복구
8. 사례: 한 건마다 커밋하는 배치와 `log file sync`

단계마다 오른쪽 설명, 왼쪽 다이어그램, 위쪽 지표(SCN, dirty 블록, Redo 버퍼, 대기 시간), 아래쪽 SQL*Plus·alert.log 화면이 함께 바뀝니다.

## 구현

- **외부 라이브러리 없이** HTML, CSS, JavaScript 파일 하나로 동작합니다.
- **아이소메트릭 다이어그램은 SVG로 그립니다.** 격자 좌표를 화면 좌표로 바꾸는 변환, 상자와 원통 그리기, 연결선을 따라 움직이는 흐름 애니메이션(`requestAnimationFrame`, `getPointAtLength`)으로 구성됩니다.
- **레슨은 데이터입니다.** `LESSON` 객체에 영역, 구성 요소, 연결선, 단계별 상태(보일 요소, 흐름, 태그, 지표, 콘솔)를 적으면 엔진이 그립니다. 새 레슨은 엔진을 고치지 않고 데이터만 추가합니다.
- 단계별 주소(`#step-6`), 키보드 조작(←/→, Space, R), 다크 모드, 모바일 화면, 움직임 줄이기 설정을 지원합니다.

## 로컬에서 보기

`index.html`을 브라우저로 열면 됩니다. 또는:

```bash
python3 -m http.server 8000
```

## 로드맵

- 레슨 추가: 인스턴스와 데이터베이스(STARTUP 단계), SQL 처리와 메모리 구조
- Oracle Database 19c 실습 환경에서 수치를 측정해 예시 값을 실측값으로 교체하고, 검증 스크립트와 결과를 저장소에 기록

## 참고

- 설명은 Oracle Database 19c 기준입니다. 현재 화면의 SCN, 블록 번호, 시간 수치는 설명용 예시 값입니다.
- 이 프로젝트는 Oracle Corporation 및 그 계열사와 관련이 없으며, 후원이나 승인을 받지 않았습니다. Oracle과 Java는 Oracle 및 그 계열사의 등록상표입니다.
