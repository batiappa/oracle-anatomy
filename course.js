/* 실습 과정 공용 내비게이션: 리눅스 실습실(lab/)과 DBA 실습(dba/)을 1~11단계 한 과정으로 보여 준다.
   st는 페이지 안에서 쓰는 단계 키이고, 화면에 보이는 단계 번호(no)는 이 배열의 순서로 매긴다.
   (SQL 기초는 나중에 만들어 키가 10이지만 3단계 뒤에 두어 4단계로 보인다. RAC 기초는 키 11, 11단계. 레슨 104~108은 나중에 넣었지만 졸업 미션 103 앞에 둔다.)
   각 페이지는 이 파일을 불러 Course.render()로 단계 메뉴를 그린다. 진행 상황은 두 페이지가 각자 저장한
   localStorage 값(ohb:lab:done, ohb:dba:done)을 함께 읽어 계산한다. */
(function () {
  'use strict';
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const STAGES = [
    { st: 1, part: 'lab', group: '리눅스', name: '리눅스 기초', ids: range(1, 9) },
    { st: 2, part: 'lab', group: '리눅스', name: '오라클용 리눅스 준비', ids: range(10, 18) },
    { st: 3, part: 'dba', group: 'DBA', name: '오라클 19c 기본 운영', ids: range(21, 29) },
    { st: 10, part: 'dba', group: 'DBA', name: 'SQL 기초', ids: range(91, 96) },
    { st: 4, part: 'dba', group: 'DBA', name: '장애 대응', ids: range(31, 36) },
    { st: 5, part: 'dba', group: 'DBA', name: '고급 복구', ids: range(41, 43) },
    { st: 6, part: 'dba', group: 'DBA', name: '성능 점검', ids: range(51, 53) },
    { st: 7, part: 'dba', group: 'DBA', name: '패치', ids: range(61, 63) },
    { st: 8, part: 'dba', group: 'DBA', name: 'SQL 튜닝 입문', ids: range(71, 73) },
    { st: 9, part: 'dba', group: 'DBA', name: 'Data Guard 기초', ids: range(81, 83) },
    { st: 11, part: 'dba', group: 'DBA', name: 'RAC 기초', ids: [101, 102, 104, 105, 106, 107, 108, 103] },
    { st: 12, part: 'dba', group: 'DBA', name: 'OS 원인 장애', ids: range(111, 113) },
    { st: 13, part: 'dba', group: 'DBA', name: '현장 업무 흐름', ids: range(121, 123) },
  ];
  STAGES.forEach((s, i) => { s.no = i + 1; });
  const KEY = { lab: 'ohb:lab:done', dba: 'ohb:dba:done' };
  const progOf = (part) => { try { return JSON.parse(localStorage.getItem(KEY[part]) || '{}') || {}; } catch (e) { return {}; } };
  const stageOfId = (id) => STAGES.find(s => s.ids.includes(id));
  const firstOpen = (s, prog) => s.ids.find(id => !prog[id]) || s.ids[0];
  // 다른 페이지(part)로 가는 주소. 같은 페이지면 null.
  const hrefFor = (here, s, id) => s.part === here ? null : `../${s.part}/#lesson-${id}`;

  const CSS = `
.course { margin-bottom: 10px; }
.course-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 6px; font-size: 12px; color: var(--muted); }
.course-head b { color: var(--ink); font-weight: 600; font-size: 12.5px; }
.course-head .all { font-family: var(--font-mono); font-size: 11.5px; }
.course-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(${STAGES.length}, minmax(0, 1fr)); gap: 6px; }
.course-step { display: grid; grid-template-rows: auto 1fr auto; gap: 3px; height: 100%; box-sizing: border-box; padding: 7px 10px 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel-2); color: var(--muted); text-decoration: none; text-align: left; font: inherit; cursor: pointer; width: 100%; }
.course-step:hover { border-color: var(--muted); color: var(--ink); }
.course-step[aria-current="step"] { background: var(--panel); border-color: var(--accent); color: var(--ink); box-shadow: inset 0 0 0 1px var(--accent); }
.course-step .no { font-size: 11.5px; }
.course-step .nm { font-size: 13.5px; font-weight: 600; line-height: 1.3; }
.course-step .meta { display: flex; align-items: center; gap: 7px; }
.course-step .bar { flex: 1; height: 4px; border-radius: 99px; background: var(--line); overflow: hidden; }
.course-step .bar i { display: block; height: 100%; background: var(--ok); border-radius: 99px; }
.course-step .cnt { font-family: var(--font-mono); font-size: 11px; }
.course-step.complete .cnt { color: var(--ok); }
@media (max-width: 900px) and (min-width: 561px) { .course-steps { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 560px) {
  .course-steps { gap: 4px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .course-step { padding: 6px 7px 7px; }
  .course-step .nm { font-size: 12px; }
  .course-step .grp { display: none; }
  .course-step .meta { gap: 4px; }
  .course-step .cnt { font-size: 10px; }
}`;
  let styled = false;
  function addStyle() {
    if (styled) return; styled = true;
    const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
  }

  /* opts: { here: 'lab'|'dba', stage: 지금 단계, prog: 이 페이지의 진행 객체, onLocal(stage) } */
  function render(el, opts) {
    addStyle();
    const progs = { lab: progOf('lab'), dba: progOf('dba') };
    progs[opts.here] = opts.prog; // 이 페이지 값은 메모리에 있는 최신 값을 쓴다
    let doneAll = 0, total = 0;
    const items = STAGES.map(s => {
      const p = progs[s.part], d = s.ids.filter(id => p[id]).length; doneAll += d; total += s.ids.length;
      const href = hrefFor(opts.here, s, firstOpen(s, p));
      const pct = Math.round(d / s.ids.length * 100);
      const cls = `course-step${d === s.ids.length ? ' complete' : ''}`;
      const cur = s.st === opts.stage ? ' aria-current="step"' : '';
      const label = `${s.no}단계 ${s.name}, ${s.ids.length}개 중 ${d}개 완료`;
      const inner = `<span class="no">${s.no}단계<span class="grp"> · ${s.group}</span></span><span class="nm">${s.name}</span><span class="meta"><span class="bar"><i style="width:${pct}%"></i></span><span class="cnt">${d}/${s.ids.length}</span></span>`;
      return `<li>${href ? `<a class="${cls}" href="${href}" aria-label="${label}">${inner}</a>` : `<button class="${cls}" type="button" data-stage="${s.st}" aria-label="${label}"${cur}>${inner}</button>`}</li>`;
    });
    el.innerHTML = `<div class="course-head"><b>실습 과정</b><span class="all">전체 ${doneAll}/${total} 완료</span></div><ol class="course-steps">${items.join('')}</ol>`;
    el.querySelectorAll('button.course-step').forEach(b => b.addEventListener('click', () => { if (+b.dataset.stage !== opts.stage) opts.onLocal(+b.dataset.stage); }));
  }

  /* 이 페이지의 마지막 단계를 마쳤을 때 이어지는 다른 페이지 단계 */
  function nextElsewhere(here, stage) {
    const s = STAGES[STAGES.findIndex(x => x.st === stage) + 1];
    if (!s || s.part === here) return null;
    return { stage: s.no, name: s.name, href: hrefFor(here, s, firstOpen(s, progOf(s.part))) };
  }


  /* ---------- 해부도 ↔ 실습 연결표 ----------
     해부도(원리)의 장면 하나와 그 내용을 직접 해 보는 실습 레슨을 잇는다. 한 곳에서만 관리하고,
     해부도 쪽 "이 내용 실습하기"와 실습 쪽 "원리 먼저 보기"가 모두 이 표에서 만들어진다.
     page: 'linux'(linux/ 리눅스 해부도) | 'oracle'(루트 Oracle 해부도 · COMMIT의 여정) | 'instance'(oracle/instance/ 인스턴스와 데이터베이스) | 'archive'(oracle/archive/ Archivelog와 RMAN), step: 장면 번호(#step-N), t: 장면 이름(그 페이지 steps[].short와 같아야 한다)
     lessons: 실습 레슨 id. 제목은 아래 TITLES에서 가져온다(실습 페이지 LESSONS의 title과 같아야 한다. 자동 점검이 비교한다). */
  const THEORY = [
    { page: 'linux', step: 1, t: '문제', lessons: [1] },
    { page: 'linux', step: 2, t: '디렉터리 트리', lessons: [2, 3, 17] },
    { page: 'linux', step: 3, t: '계정', lessons: [5, 16] },
    { page: 'linux', step: 4, t: '셸과 PATH', lessons: [8, 4] },
    { page: 'linux', step: 5, t: '권한', lessons: [5, 17] },
    { page: 'linux', step: 6, t: '프로세스', lessons: [6, 22] },
    { page: 'linux', step: 7, t: '메모리', lessons: [7, 10] },
    { page: 'linux', step: 8, t: '커널 한도', lessons: [11, 12, 13] },
    { page: 'linux', step: 9, t: 'HugePages', lessons: [14] },
    { page: 'linux', step: 10, t: '디스크', lessons: [7, 15] },
    { page: 'linux', step: 11, t: '디스크 가득', lessons: [7, 34] },
    { page: 'linux', step: 12, t: '정리', lessons: [9, 18] },
    { page: 'oracle', step: 1, t: '문제', lessons: [95] },
    { page: 'oracle', step: 2, t: '블록 읽기', lessons: [91] },
    { page: 'oracle', step: 3, t: 'Undo', lessons: [95] },
    { page: 'oracle', step: 4, t: 'Redo', lessons: [28] },
    { page: 'oracle', step: 5, t: 'COMMIT;', lessons: [95] },
    { page: 'oracle', step: 6, t: 'LGWR 쓰기', lessons: [51] },
    { page: 'oracle', step: 7, t: 'DBWn', lessons: [22] },
    { page: 'oracle', step: 8, t: '정전', lessons: [22] },
    { page: 'oracle', step: 9, t: '잦은 커밋', lessons: [52] },
    { page: 'oracle', step: 10, t: '정리', lessons: [21, 95] },
    { page: 'instance', step: 1, t: '문제', lessons: [22] },
    { page: 'instance', step: 2, t: '두 가지', lessons: [21] },
    { page: 'instance', step: 3, t: '파라미터 파일', lessons: [22, 26] },
    { page: 'instance', step: 4, t: 'NOMOUNT', lessons: [22] },
    { page: 'instance', step: 5, t: 'MOUNT', lessons: [22, 28] },
    { page: 'instance', step: 6, t: 'OPEN', lessons: [22] },
    { page: 'instance', step: 7, t: '인스턴스 복구', lessons: [22] },
    { page: 'instance', step: 8, t: '컨트롤 파일', lessons: [33, 42] },
    { page: 'instance', step: 9, t: '데이터 파일', lessons: [31, 32] },
    { page: 'instance', step: 10, t: '정리', lessons: [22, 29] },
    { page: 'archive', step: 1, t: '문제', lessons: [28] },
    { page: 'archive', step: 2, t: '돌려 쓰기', lessons: [28] },
    { page: 'archive', step: 3, t: '모드 바꾸기', lessons: [28] },
    { page: 'archive', step: 4, t: 'ARCn', lessons: [28] },
    { page: 'archive', step: 5, t: 'FRA', lessons: [34] },
    { page: 'archive', step: 6, t: 'RMAN 백업', lessons: [28] },
    { page: 'archive', step: 7, t: '자동 백업', lessons: [42] },
    { page: 'archive', step: 8, t: '복원·복구', lessons: [31, 32] },
    { page: 'archive', step: 9, t: 'FRA 가득', lessons: [34] },
    { page: 'archive', step: 10, t: '정리', lessons: [41, 34] },
    { page: 'undo', step: 2, t: 'Undo', lessons: [95] },
    { page: 'undo', step: 3, t: 'ROLLBACK', lessons: [95] },
    { page: 'undo', step: 4, t: '한 시점', lessons: [95] },
    { page: 'undo', step: 9, t: '대책', lessons: [24] },
    { page: 'undo', step: 10, t: '정리', lessons: [95] },
    { page: 'lock', step: 1, t: '문제', lessons: [27, 53] },
    { page: 'lock', step: 5, t: '쓰기 줄 서기', lessons: [27] },
    { page: 'lock', step: 7, t: '찾기', lessons: [27, 51] },
    { page: 'lock', step: 8, t: '정리', lessons: [27, 53] },
    { page: 'lock', step: 10, t: '정리', lessons: [53] },
    { page: 'checkpoint', step: 1, t: '문제', lessons: [51] },
    { page: 'checkpoint', step: 6, t: '못 따라잡음', lessons: [51] },
    { page: 'checkpoint', step: 7, t: '확인', lessons: [51, 52] },
    { page: 'checkpoint', step: 9, t: 'MTTR', lessons: [22] },
    { page: 'checkpoint', step: 10, t: '정리', lessons: [52] },
    { page: 'memory', step: 1, t: '문제', lessons: [14] },
    { page: 'memory', step: 5, t: '서버 프로세스', lessons: [21] },
    { page: 'memory', step: 6, t: '백그라운드', lessons: [6, 23] },
    { page: 'memory', step: 8, t: 'HugePages', lessons: [14] },
    { page: 'memory', step: 9, t: 'HugePages 부족', lessons: [14] },
    { page: 'parse', step: 5, t: '하드 · 소프트', lessons: [51] },
    { page: 'parse', step: 6, t: '커서', lessons: [71] },
    { page: 'parse', step: 9, t: '리터럴 SQL', lessons: [52] },
    { page: 'optimizer', step: 5, t: '접근 경로', lessons: [72] },
    { page: 'optimizer', step: 7, t: '계획 읽기', lessons: [71] },
    { page: 'optimizer', step: 9, t: '통계 다시 모으기', lessons: [73] },
    { page: 'btree', step: 1, t: '문제', lessons: [72] },
    { page: 'btree', step: 5, t: '고유 스캔', lessons: [71] },
    { page: 'btree', step: 6, t: '범위 스캔', lessons: [72] },
    { page: 'btree', step: 9, t: 'NULL', lessons: [73] },
    { page: 'btree', step: 10, t: '정리', lessons: [72] },
    { page: 'dataguard', step: 1, t: '문제', lessons: [83] },
    { page: 'dataguard', step: 4, t: '적용', lessons: [82] },
    { page: 'dataguard', step: 7, t: '브로커', lessons: [81] },
    { page: 'dataguard', step: 9, t: '페일오버', lessons: [83] },
    { page: 'rac', step: 1, t: '문제', lessons: [103] },
    { page: 'rac', step: 2, t: '구조', lessons: [101] },
    { page: 'rac', step: 3, t: '접속', lessons: [102] },
    { page: 'rac', step: 6, t: 'gc 대기', lessons: [103] },
    { page: 'rac', step: 7, t: '노드 장애', lessons: [106] },
    { page: 'rac', step: 8, t: '서비스 이동', lessons: [102] },
    { page: 'rac', step: 9, t: '되돌리기', lessons: [103] },
  ];
  const TITLES = {
    1: 'DB 서버에 처음 접속하기', 2: '오라클이 사는 디렉터리 둘러보기', 3: 'alert log에서 오류 찾기', 4: 'vi로 작업 일지 쓰기', 5: 'oracle 계정과 권한 이해하기', 6: 'DB가 살아 있는지 프로세스로 확인하기',
    7: '디스크가 찼다는 연락 대응하기', 8: 'sqlplus를 찾을 수 없다고요?', 9: '졸업 미션: 아침 점검 혼자 해 보기', 10: '새 서버 받기: 설치 전 서버 점검', 11: 'preinstall RPM으로 설치 준비 한 번에 하기',
    12: '커널 파라미터 확인하기', 13: '자원 제한(limits) 확인하기', 14: 'HugePages 설정하고 THP 확인하기', 15: '디스크 I/O 스케줄러와 시계 확인하기', 16: '직무 분리 그룹과 grid 사용자 만들기',
    17: '설치 디렉터리 만들기와 경로 규칙', 18: '졸업 미션: 남이 준비한 서버 점검하고 고치기', 21: 'SQL*Plus로 DB에 처음 접속하기', 22: 'DB 내리고 단계별로 올리기', 23: '리스너 살리고 원격 접속 확인하기',
    24: '꽉 찬 테이블스페이스에 공간 늘리기', 26: '지워진 암호 파일 다시 만들기', 27: '락을 잡고 있는 세션 정리하기', 28: '아카이브 모드로 바꾸고 첫 RMAN 백업 받기', 29: '졸업 미션: 재부팅 뒤 아침 점검',
    31: '지워진 데이터 파일 하나 되살리기', 32: 'SYSTEM 데이터 파일을 잃은 DB 살리기', 33: '컨트롤 파일 사본 하나를 잃었을 때', 34: '빠른 복구 영역이 가득 차 DB가 멈췄을 때',
    41: '실수 직전 시각으로 DB 되돌리기 (시점 복구)', 42: '컨트롤 파일을 모두 잃었을 때', 51: '지금 무엇을 기다리는지 보기 (대기 이벤트)', 52: 'AWR 보고서로 어젯밤 배치 들여다보기', 53: '졸업 미션: 주문 저장이 멈춘 아침',
    71: '느린 SQL의 실행 계획 읽기', 72: '조건을 고쳐 인덱스 타게 하기', 73: '졸업 미션: 고객별 주문 조회가 느린 아침', 81: '주 DB와 대기 DB 상태 점검', 82: '적용이 멈춘 대기 DB',
    83: '졸업 미션: 계획된 전환(스위치오버)', 91: 'SELECT로 테이블 읽기', 95: 'INSERT·UPDATE·DELETE와 COMMIT·ROLLBACK', 101: 'RAC 클러스터 상태 점검', 102: '서비스를 옮기고 인스턴스 하나 내리기',
    103: '졸업 미션: 노드 장애 뒤 서비스 되돌리기', 106: '노드 정비: 인스턴스 비우고 Clusterware 내렸다 올리기',
  };
  const PAGES = { linux: { name: '리눅스 해부도', dir: 'linux/' }, oracle: { name: 'Oracle 해부도', dir: '' }, instance: { name: '인스턴스와 데이터베이스', dir: 'oracle/instance/' }, archive: { name: 'Archivelog와 RMAN', dir: 'oracle/archive/' }, undo: { name: 'Undo와 읽기 일관성', dir: 'oracle/undo/' }, lock: { name: '잠금과 대기', dir: 'oracle/lock/' }, checkpoint: { name: '체크포인트', dir: 'oracle/checkpoint/' }, memory: { name: 'SGA·PGA와 백그라운드 프로세스', dir: 'oracle/memory/' }, parse: { name: '파싱과 Shared Pool', dir: 'oracle/parse/' }, optimizer: { name: '옵티마이저와 실행계획', dir: 'oracle/optimizer/' }, btree: { name: 'B-tree 인덱스', dir: 'oracle/btree/' }, dataguard: { name: 'Data Guard', dir: 'oracle/dataguard/' }, rac: { name: 'RAC', dir: 'oracle/rac/' } };
  // "2단계 레슨 3"처럼 과정 메뉴와 같은 번호로 부른다.
  const whereOf = (id) => { const s = stageOfId(id); return s ? `${s.no}단계 레슨 ${s.ids.indexOf(id) + 1}` : ''; };
  /* 해부도 장면 → 실습 레슨 목록. base는 해부도 페이지에서 사이트 뿌리까지의 경로('' 또는 '../') */
  function practiceFor(page, step, base) {
    const seen = new Set(), out = [];
    THEORY.filter(x => x.page === page && x.step === step).forEach(x => x.lessons.forEach(id => {
      const s = stageOfId(id); if (!s || seen.has(id)) return; seen.add(id);
      out.push({ id, href: `${base}${s.part}/#lesson-${id}`, where: whereOf(id), title: TITLES[id] || '' });
    }));
    return out;
  }
  /* 실습 레슨 → 원리 장면 목록. 실습 페이지(lab/, dba/)에서 부르므로 해부도는 ../ 아래에 있다. */
  /* 한 해부도의 장면 세 개 이상이 같은 레슨에 이어지면 버튼이 너무 많아지므로, 첫 장면 하나로 묶어 장면 수를 적는다. */
  function theoryFor(id) {
    const hits = THEORY.filter(x => x.lessons.includes(id)), out = [];
    for (const x of hits) {
      const same = hits.filter(y => y.page === x.page);
      if (same.length >= 3) {
        if (same[0] !== x) continue;
        out.push({ page: x.page, step: x.step, href: `../${PAGES[x.page].dir}#step-${x.step}`, label: `${PAGES[x.page].name} ${x.step}장면부터 · 관련 장면 ${same.length}개` });
      } else out.push({ page: x.page, step: x.step, href: `../${PAGES[x.page].dir}#step-${x.step}`, label: `${PAGES[x.page].name} ${x.step}장면 · ${x.t}` });
    }
    return out;
  }
  /* 실습 레슨 카드에 넣을 "원리 먼저 보기" 줄(HTML). 연결된 장면이 없으면 빈 문자열. */
  let tStyled = false;
  function theoryHtml(id) {
    const list = theoryFor(id); if (!list.length) return '';
    if (!tStyled) { tStyled = true; const st = document.createElement('style'); st.textContent = `
.theory { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; font-size: 13px; }
.theory-k { font-size: 12px; font-weight: 600; color: var(--muted); }
.theory a { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 99px; border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--line)); background: color-mix(in srgb, var(--accent) 8%, var(--panel)); color: var(--accent); text-decoration: none; font-weight: 600; }
.theory a:hover { border-color: var(--accent); }`; document.head.appendChild(st); }
    return `<div class="theory"><span class="theory-k">원리 먼저 보기</span>${list.map(t => `<a href="${t.href}">${t.label} →</a>`).join('')}</div>`;
  }

  window.Course = { STAGES, render, nextElsewhere, stageOfId, THEORY, TITLES, practiceFor, theoryFor, theoryHtml };
})();
