/* 실습 과정 공용 내비게이션: 리눅스 실습실(lab/)과 DBA 실습(dba/)을 1~11단계 한 과정으로 보여 준다.
   st는 페이지 안에서 쓰는 단계 키이고, 화면에 보이는 단계 번호(no)는 이 배열의 순서로 매긴다.
   (SQL 기초는 나중에 만들어 키가 10이지만 3단계 뒤에 두어 4단계로 보인다. RAC 기초는 키 11, 11단계.)
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
    { st: 11, part: 'dba', group: 'DBA', name: 'RAC 기초', ids: range(101, 103) },
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

  window.Course = { STAGES, render, nextElsewhere, stageOfId };
})();
