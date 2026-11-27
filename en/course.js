/* 실습 과정 공용 내비게이션: 리눅스 실습실(lab/)과 DBA 실습(dba/)을 1~11단계 한 과정으로 보여 준다.
   st는 페이지 안에서 쓰는 단계 키이고, 화면에 보이는 단계 번호(no)는 이 배열의 순서로 매긴다.
   (SQL 기초는 나중에 만들어 키가 10이지만 3단계 뒤에 두어 4단계로 보인다. RAC 기초는 키 11, 11단계. 레슨 104~108은 나중에 넣었지만 졸업 미션 103 앞에 둔다.)
   각 페이지는 이 파일을 불러 Course.render()로 단계 메뉴를 그린다. 진행 상황은 두 페이지가 각자 저장한
   localStorage 값(ohb:lab:done, ohb:dba:done)을 함께 읽어 계산한다. */
(function () {
  'use strict';
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const STAGES = [
    { st: 1, part: 'lab', group: 'Linux', name: 'Linux basics', ids: range(1, 9) },
    { st: 2, part: 'lab', group: 'Linux', name: 'Preparing Linux for Oracle', ids: range(10, 18) },
    { st: 3, part: 'dba', group: 'DBA', name: 'Oracle 19c basic operations', ids: range(21, 29) },
    { st: 10, part: 'dba', group: 'DBA', name: 'SQL basics', ids: range(91, 96) },
    { st: 4, part: 'dba', group: 'DBA', name: 'Incident response', ids: range(31, 36) },
    { st: 5, part: 'dba', group: 'DBA', name: 'Advanced recovery', ids: range(41, 43) },
    { st: 6, part: 'dba', group: 'DBA', name: 'Performance checks', ids: range(51, 53) },
    { st: 7, part: 'dba', group: 'DBA', name: 'Patching', ids: range(61, 63) },
    { st: 8, part: 'dba', group: 'DBA', name: 'Intro to SQL tuning', ids: range(71, 73) },
    { st: 9, part: 'dba', group: 'DBA', name: 'Data Guard basics', ids: range(81, 83) },
    { st: 11, part: 'dba', group: 'DBA', name: 'RAC basics', ids: [101, 102, 104, 105, 106, 107, 108, 103] },
    { st: 12, part: 'dba', group: 'DBA', name: 'OS-caused failures', ids: range(111, 113) },
    { st: 13, part: 'dba', group: 'DBA', name: 'Field workflow', ids: range(121, 123) },
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
      const label = `Stage ${s.no} ${s.name}, ${d} of ${s.ids.length} done`;
      const inner = `<span class="no">Stage ${s.no}<span class="grp"> · ${s.group}</span></span><span class="nm">${s.name}</span><span class="meta"><span class="bar"><i style="width:${pct}%"></i></span><span class="cnt">${d}/${s.ids.length}</span></span>`;
      return `<li>${href ? `<a class="${cls}" href="${href}" aria-label="${label}">${inner}</a>` : `<button class="${cls}" type="button" data-stage="${s.st}" aria-label="${label}"${cur}>${inner}</button>`}</li>`;
    });
    el.innerHTML = `<div class="course-head"><b>Lab course</b><span class="all">${doneAll}/${total} done overall</span></div><ol class="course-steps">${items.join('')}</ol>`;
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
    { page: 'linux', step: 1, t: 'Problem', lessons: [1] },
    { page: 'linux', step: 2, t: 'Directory tree', lessons: [2, 3, 17] },
    { page: 'linux', step: 3, t: 'Accounts', lessons: [5, 16] },
    { page: 'linux', step: 4, t: 'Shell and PATH', lessons: [8, 4] },
    { page: 'linux', step: 5, t: 'Permissions', lessons: [5, 17] },
    { page: 'linux', step: 6, t: 'Processes', lessons: [6, 22] },
    { page: 'linux', step: 7, t: 'Memory', lessons: [7, 10] },
    { page: 'linux', step: 8, t: 'Kernel limits', lessons: [11, 12, 13] },
    { page: 'linux', step: 9, t: 'HugePages', lessons: [14] },
    { page: 'linux', step: 10, t: 'Disk', lessons: [7, 15] },
    { page: 'linux', step: 11, t: 'Disk full', lessons: [7, 34] },
    { page: 'linux', step: 12, t: 'Summary', lessons: [9, 18] },
    { page: 'oracle', step: 1, t: 'Problem', lessons: [95] },
    { page: 'oracle', step: 2, t: 'Block read', lessons: [91] },
    { page: 'oracle', step: 3, t: 'Undo', lessons: [95] },
    { page: 'oracle', step: 4, t: 'Redo', lessons: [28] },
    { page: 'oracle', step: 5, t: 'COMMIT;', lessons: [95] },
    { page: 'oracle', step: 6, t: 'LGWR write', lessons: [51] },
    { page: 'oracle', step: 7, t: 'DBWn', lessons: [22] },
    { page: 'oracle', step: 8, t: 'Power loss', lessons: [22] },
    { page: 'oracle', step: 9, t: 'Frequent commits', lessons: [52] },
    { page: 'oracle', step: 10, t: 'Summary', lessons: [21, 95] },
    { page: 'instance', step: 1, t: 'Problem', lessons: [22] },
    { page: 'instance', step: 2, t: 'Two things', lessons: [21] },
    { page: 'instance', step: 3, t: 'Parameter file', lessons: [22, 26] },
    { page: 'instance', step: 4, t: 'NOMOUNT', lessons: [22] },
    { page: 'instance', step: 5, t: 'MOUNT', lessons: [22, 28] },
    { page: 'instance', step: 6, t: 'OPEN', lessons: [22] },
    { page: 'instance', step: 7, t: 'Instance recovery', lessons: [22] },
    { page: 'instance', step: 8, t: 'Control file', lessons: [33, 42] },
    { page: 'instance', step: 9, t: 'Data files', lessons: [31, 32] },
    { page: 'instance', step: 10, t: 'Summary', lessons: [22, 29] },
    { page: 'archive', step: 1, t: 'Problem', lessons: [28] },
    { page: 'archive', step: 2, t: 'Reuse', lessons: [28] },
    { page: 'archive', step: 3, t: 'Switch mode', lessons: [28] },
    { page: 'archive', step: 4, t: 'ARCn', lessons: [28] },
    { page: 'archive', step: 5, t: 'FRA', lessons: [34] },
    { page: 'archive', step: 6, t: 'RMAN backup', lessons: [28] },
    { page: 'archive', step: 7, t: 'Autobackup', lessons: [42] },
    { page: 'archive', step: 8, t: 'Restore & recover', lessons: [31, 32] },
    { page: 'archive', step: 9, t: 'FRA full', lessons: [34] },
    { page: 'archive', step: 10, t: 'Summary', lessons: [41, 34] },
    { page: 'undo', step: 2, t: 'Undo', lessons: [95] },
    { page: 'undo', step: 3, t: 'ROLLBACK', lessons: [95] },
    { page: 'undo', step: 4, t: 'One point in time', lessons: [95] },
    { page: 'undo', step: 9, t: 'Fix', lessons: [24] },
    { page: 'undo', step: 10, t: 'Summary', lessons: [95] },
    { page: 'lock', step: 1, t: 'Problem', lessons: [27, 53] },
    { page: 'lock', step: 5, t: 'Writers queue', lessons: [27] },
    { page: 'lock', step: 7, t: 'Find', lessons: [27, 51] },
    { page: 'lock', step: 8, t: 'Summary', lessons: [27, 53] },
    { page: 'lock', step: 10, t: 'Summary', lessons: [53] },
    { page: 'checkpoint', step: 1, t: 'Problem', lessons: [51] },
    { page: 'checkpoint', step: 6, t: 'Falling behind', lessons: [51] },
    { page: 'checkpoint', step: 7, t: 'Check', lessons: [51, 52] },
    { page: 'checkpoint', step: 9, t: 'MTTR', lessons: [22] },
    { page: 'checkpoint', step: 10, t: 'Summary', lessons: [52] },
    { page: 'memory', step: 1, t: 'Problem', lessons: [14] },
    { page: 'memory', step: 5, t: 'Server process', lessons: [21] },
    { page: 'memory', step: 6, t: 'Background', lessons: [6, 23] },
    { page: 'memory', step: 8, t: 'HugePages', lessons: [14] },
    { page: 'memory', step: 9, t: 'HugePages short', lessons: [14] },
    { page: 'parse', step: 5, t: 'Hard · soft', lessons: [51] },
    { page: 'parse', step: 6, t: 'Cursors', lessons: [71] },
    { page: 'parse', step: 9, t: 'Literal SQL', lessons: [52] },
    { page: 'optimizer', step: 5, t: 'Access paths', lessons: [72] },
    { page: 'optimizer', step: 7, t: 'Reading plans', lessons: [71] },
    { page: 'optimizer', step: 9, t: 'Regather', lessons: [73] },
    { page: 'btree', step: 1, t: 'Problem', lessons: [72] },
    { page: 'btree', step: 5, t: 'Unique scan', lessons: [71] },
    { page: 'btree', step: 6, t: 'Range scan', lessons: [72] },
    { page: 'btree', step: 9, t: 'NULL', lessons: [73] },
    { page: 'btree', step: 10, t: 'Summary', lessons: [72] },
    { page: 'dataguard', step: 1, t: 'Problem', lessons: [83] },
    { page: 'dataguard', step: 4, t: 'Apply', lessons: [82] },
    { page: 'dataguard', step: 7, t: 'Broker', lessons: [81] },
    { page: 'dataguard', step: 9, t: 'Failover', lessons: [83] },
    { page: 'rac', step: 1, t: 'Problem', lessons: [103] },
    { page: 'rac', step: 2, t: 'Structure', lessons: [101] },
    { page: 'rac', step: 3, t: 'Connecting', lessons: [102] },
    { page: 'rac', step: 6, t: 'gc waits', lessons: [103] },
    { page: 'rac', step: 7, t: 'Node failure', lessons: [106] },
    { page: 'rac', step: 8, t: 'Service move', lessons: [102] },
    { page: 'rac', step: 9, t: 'Relocate back', lessons: [103] },
  ];
  const TITLES = {
    1: 'Connecting to the DB server for the first time', 2: 'Exploring the directories where Oracle lives', 3: 'Finding errors in the alert log', 4: 'Writing a work log with vi', 5: 'Understanding the oracle account and permissions', 6: 'Checking that the DB is alive through its processes',
    7: 'Responding to a "disk is full" call', 8: 'sqlplus: command not found?', 9: 'Graduation mission: do the morning check on your own', 10: 'Receiving a new server: pre-installation server check', 11: 'Preparing for installation in one go with the preinstall RPM',
    12: 'Checking kernel parameters', 13: 'Checking resource limits', 14: 'Configuring HugePages and checking THP', 15: 'Checking the disk I/O scheduler and the clock', 16: 'Creating role-separation groups and the grid user',
    17: 'Creating installation directories and path conventions', 18: 'Graduation mission: check and fix a server someone else prepared', 21: 'Connecting to the DB with SQL*Plus for the first time', 22: 'Shutting down the DB and starting it up step by step', 23: 'Bringing back the listener and checking remote connections',
    24: 'Add space to a full tablespace', 26: 'Re-create a deleted password file', 27: 'Clean up a session holding a lock', 28: 'Switching to archivelog mode and taking the first RMAN backup', 29: 'Graduation mission: morning check after a reboot',
    31: 'Bring back one deleted data file', 32: 'Save a DB that lost its SYSTEM data file', 33: 'When one control file copy is lost', 34: 'When the DB stops because the fast recovery area is full',
    41: 'Roll the DB back to just before the mistake (point-in-time recovery)', 42: 'When all control files are lost', 51: 'Seeing what the DB is waiting on right now (wait events)', 52: 'Looking into last night\'s batch with an AWR report', 53: 'Graduation mission: the morning order saving stopped',
    71: 'Read the execution plan of a slow SQL', 72: 'Fix the condition so the index is used', 73: 'Graduation mission: a morning of slow per-customer order lookups', 81: 'Check the status of the primary and standby DBs', 82: 'A standby DB whose apply stopped',
    83: 'Graduation mission: planned switchover', 91: 'Reading tables with SELECT', 95: 'INSERT, UPDATE, DELETE and COMMIT, ROLLBACK', 101: 'RAC cluster status check', 102: 'Move services and shut down one instance',
    103: 'Graduation mission: restore services after a node failure', 106: 'Node maintenance: empty the instance, then stop and restart Clusterware',
  };
  const PAGES = { linux: { name: 'Linux Anatomy', dir: 'linux/' }, oracle: { name: 'Oracle Anatomy', dir: '' }, instance: { name: 'Instance and database', dir: 'oracle/instance/' }, archive: { name: 'Archivelog and RMAN', dir: 'oracle/archive/' }, undo: { name: 'Undo and read consistency', dir: 'oracle/undo/' }, lock: { name: 'Locks and waits', dir: 'oracle/lock/' }, checkpoint: { name: 'Checkpoints', dir: 'oracle/checkpoint/' }, memory: { name: 'SGA, PGA and background processes', dir: 'oracle/memory/' }, parse: { name: 'Parsing and the shared pool', dir: 'oracle/parse/' }, optimizer: { name: 'The optimizer and execution plans', dir: 'oracle/optimizer/' }, btree: { name: 'B-tree indexes', dir: 'oracle/btree/' }, dataguard: { name: 'Data Guard', dir: 'oracle/dataguard/' }, rac: { name: 'RAC', dir: 'oracle/rac/' } };
  // "2단계 레슨 3"처럼 과정 메뉴와 같은 번호로 부른다.
  const whereOf = (id) => { const s = stageOfId(id); return s ? `Stage ${s.no}, lesson ${s.ids.indexOf(id) + 1}` : ''; };
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
        out.push({ page: x.page, step: x.step, href: `../${PAGES[x.page].dir}#step-${x.step}`, label: `${PAGES[x.page].name} from scene ${x.step} · ${same.length} related scenes` });
      } else out.push({ page: x.page, step: x.step, href: `../${PAGES[x.page].dir}#step-${x.step}`, label: `${PAGES[x.page].name} scene ${x.step} · ${x.t}` });
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
    return `<div class="theory"><span class="theory-k">See the principle first</span>${list.map(t => `<a href="${t.href}">${t.label} →</a>`).join('')}</div>`;
  }

  window.Course = { STAGES, render, nextElsewhere, stageOfId, THEORY, TITLES, practiceFor, theoryFor, theoryHtml };
})();
