# 해부도 레슨 생성 도구

Oracle 해부도 레슨(`oracle/<key>/index.html`)을 파이썬 파일 하나로 적어 만들고 점검하는 도구입니다.
레슨 9개(lock, undo, checkpoint, memory, parse, optimizer, btree, dataguard, rac)가 이 도구로 만들어졌습니다.
instance, archive, COMMIT(루트 페이지), 리눅스 해부도는 손으로 만든 페이지라 `lessons/`에 원본이 없습니다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `gen.py` | `lessons/<key>.py`를 읽어 한국어 페이지, `course.js`·`en/course.js`의 THEORY·TITLES·PAGES, 모든 해부도의 목차, `sitemap.xml`, i18n SOURCES, 영어 사전(`tools/i18n/en/*.json`)의 빠진 항목을 만듭니다. 틀은 `oracle/archive/index.html`을 씁니다. |
| `lessons/<key>.py` | 레슨 원본. `META`(이름, 설명, 실습 연결)와 `LESSON`(장면들)을 적고, 화면 글은 모두 `T('한국어', 'English')` 짝으로 적습니다. 짝이 없는 한국어가 있으면 생성이 멈춥니다. |
| `checks/check-page.js` | 한국어·영어 페이지의 모든 장면을 390px 폭으로 열어 오류, 가로 넘침(maxScrollW), 실습 버튼 수, 영어판에 남은 한글을 확인합니다. |
| `checks/check-dba-links.js` | DBA 실습 레슨에서 해부도로 가는 연결(`Course.theoryFor`)과 제목 누락을 확인합니다. |
| `checks/shot.js` | 장면 스크린샷을 `shot-<장면>.png`로 저장합니다. |

## 순서 (저장소 루트에서)

```
python3 tools/anatomy-gen/gen.py <key> [<key> ...]
python3 tools/i18n/i18n.py prune en
python3 tools/i18n/i18n.py build en
node tools/anatomy-gen/checks/check-page.js <key>      # ERRORS [], maxScrollW 390, koInEn 비어 있어야 함
node tools/anatomy-gen/checks/shot.js 1,5,9 oracle/<key>/index.html
node tools/anatomy-gen/checks/check-dba-links.js 71,72,73
```

점검 스크립트는 Playwright(크로미움)가 필요합니다. 사전에 채우지 못한 문장은 `MISSING`으로 출력되고 `left.json`에 남습니다.

## 주의

- 장면 본문의 `<code>`는 줄바꿈되지 않습니다. 45자쯤 넘는 코드는 390px 화면을 넘치므로 `<code>` 여러 개로 나눕니다.
- `META`의 `ogdesc`·`desc`에 큰따옴표(")를 쓰지 않습니다. meta 태그 속성이 깨집니다.
- `gen.py`에 여러 레슨을 넘기면 `course.js`의 PAGES·THEORY 순서가 넘긴 순서를 따라 바뀔 수 있습니다. 순서만 바뀌었으면 `git checkout course.js en/course.js`로 되돌립니다.
- 화면 내용은 Oracle 19c 공식 문서를 근거로 하고, 문서에 없는 내용은 장면의 법적 안내에 그렇다고 밝힙니다.
