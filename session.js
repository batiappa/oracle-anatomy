/* 실습 세션 자동 저장: 리눅스 실습실(lab/)과 DBA 실습(dba/)이 함께 쓴다.

   저장 방식
   - 화면이나 가상 서버 상태를 통째로 저장하지 않는다. 레슨을 시작한 순간의 정보(레슨 번호, 시각, 난수 씨앗)와
     그 뒤에 입력한 키(Enter, Tab, Ctrl+C, vi 입력 등)를 시각과 함께 localStorage에 적어 둔다.
   - 새로고침하면 같은 레슨을 같은 시각·같은 난수로 다시 만들고, 적어 둔 입력을 그때의 시각대로 다시 실행한다.
     그래서 터미널 화면, 명령 기록, 가상 서버 상태, 할 일 진행이 그대로 돌아온다.
   - 강력 새로고침(Ctrl+F5, Ctrl+Shift+R)을 하면 저장한 세션을 지운다. 브라우저는 강력 새로고침 때 서비스 워커를
     거치지 않으므로, 아무 일도 하지 않는 서비스 워커(../sw.js)를 두고 "새로고침인데 서비스 워커가 페이지를
     맡고 있지 않다"면 강력 새로고침으로 본다. 레슨 완료 표시(ohb:*:done)는 지우지 않는다.
   - "레슨 다시 시작"이나 다른 레슨으로 옮기면 그 레슨의 새 세션이 시작되고 이전 저장은 덮어쓴다. */
(function () {
  'use strict';
  const PART = /\/dba\/?(index\.html)?$/.test(location.pathname) ? 'dba' : 'lab';
  const KEY = 'ohb:' + PART + ':sess', KEYS = ['ohb:lab:sess', 'ohb:dba:sess'];
  const MAX_EV = 5000;
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  /* ---------- 강력 새로고침 감지 ---------- */
  let navType = '';
  try { const n = performance.getEntriesByType('navigation')[0]; navType = n ? n.type : ''; } catch (e) {}
  const swOk = 'serviceWorker' in navigator && window.isSecureContext;
  const controlled = swOk && !!navigator.serviceWorker.controller;
  let hardReload = false;
  if (swOk && navType === 'reload' && !controlled && ls.get('ohb:sw') === '1') { hardReload = true; KEYS.forEach(ls.del); }
  if (controlled) ls.set('ohb:sw', '1');
  if (swOk) window.addEventListener('load', () => { navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {}); });

  let saved = null;
  try { saved = JSON.parse(ls.get(KEY) || 'null'); } catch (e) { saved = null; }
  if (!saved || saved.v !== 1 || typeof saved.lesson !== 'number' || !Array.isArray(saved.ev)) saved = null;

  /* ---------- 시계: 다시 실행하는 동안에는 그때의 시각을 돌려준다 ---------- */
  const RD = Date, realNow = () => RD.now();
  let virt = null;
  class VDate extends RD {
    constructor(...a) { if (a.length === 0) super(virt == null ? realNow() : virt); else super(...a); }
    static now() { return virt == null ? realNow() : virt; }
  }
  window.Date = VDate;

  /* ---------- 난수: 레슨마다 씨앗을 정해 다시 실행해도 같은 값이 나오게 한다 ---------- */
  let st = 1;
  const rnd = () => { st = (st + 0x6D2B79F5) | 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const newSeed = () => { try { return crypto.getRandomValues(new Uint32Array(1))[0] | 0; } catch (e) { return (realNow() ^ 0x5bd1e995) | 0; } };
  Math.random = rnd;

  /* ---------- 타이머: 다시 실행하는 동안에는 가상 시계로 돌린다 ---------- */
  const rST = window.setTimeout.bind(window), rCT = window.clearTimeout.bind(window), rSI = window.setInterval.bind(window), rCI = window.clearInterval.bind(window);
  let replaying = false, vSeq = 1e7; const vq = new Map(), realOf = new Map();
  window.setTimeout = function (fn, ms, ...a) { if (!replaying) return rST(fn, ms, ...a); const id = ++vSeq; vq.set(id, { due: virt + (+ms || 0), fn, a, every: 0 }); return id; };
  window.setInterval = function (fn, ms, ...a) { if (!replaying) return rSI(fn, ms, ...a); const id = ++vSeq; const every = Math.max(10, +ms || 0); vq.set(id, { due: virt + every, fn, a, every }); return id; };
  const clr = (id) => { if (vq.delete(id)) return true; if (realOf.has(id)) { const r = realOf.get(id); rCT(r.t); rCI(r.t); realOf.delete(id); return true; } return false; };
  window.clearTimeout = function (id) { if (!clr(id)) rCT(id); };
  window.clearInterval = function (id) { if (!clr(id)) rCI(id); };
  let fires = 0;
  function runDue(until) {
    for (;;) {
      let pick = null, pid = 0;
      for (const [id, t] of vq) if (t.due <= until && (!pick || t.due < pick.due)) { pick = t; pid = id; }
      if (!pick || ++fires > 2000) return;
      virt = pick.due;
      if (pick.every) pick.due += pick.every; else vq.delete(pid);
      try { pick.fn(...pick.a); } catch (e) { console.error(e); }
    }
  }
  function releaseTimers() { // 남은 가상 타이머를 실제 타이머로 넘긴다
    for (const [id, t] of vq) {
      const wait = Math.max(0, t.due - realNow());
      if (t.every) { const r = { t: rST(() => { t.fn(...t.a); r.t = rSI(() => t.fn(...t.a), t.every); }, wait) }; realOf.set(id, r); }
      else realOf.set(id, { t: rST(() => { realOf.delete(id); t.fn(...t.a); }, wait) });
    }
    vq.clear();
  }

  /* ---------- 기록 ---------- */
  let sess = null, depth = 0, pending = saved, restoring = null;
  function write() { if (sess && sess.ev.length <= MAX_EV) ls.set(KEY, JSON.stringify(sess)); }
  function rec(e) { if (!sess || replaying) return; e.t = realNow() - sess.t0; sess.ev.push(e); write(); }

  const api = {
    part: PART,
    hardReload,
    /** 페이지의 NOW 상수: 이어서 불러올 세션이 있으면 그 페이지를 처음 연 시각 */
    now() { return pending ? pending.now : realNow(); },
    /** 이어서 불러올 레슨 번호(없으면 null). hashId가 있으면 그 레슨일 때만 */
    lessonToResume(hashId) { if (!pending) return null; if (hashId != null && hashId !== pending.lesson) { pending = null; return null; } return pending.lesson; },
    /** startLesson 맨 앞에서 부른다 */
    begin(id, pageNow) {
      if (pending && pending.lesson === id && pending.now === pageNow) {
        restoring = pending; pending = null;
        sess = { v: 1, lesson: id, now: pageNow, t0: restoring.t0, seed: restoring.seed, ev: restoring.ev.slice(), hints: restoring.hints || {} };
        st = sess.seed; virt = sess.t0; replaying = true; fires = 0;
      } else {
        pending = null; restoring = null;
        if (replaying) { replaying = false; virt = null; vq.clear(); }
        sess = { v: 1, lesson: id, now: pageNow, t0: realNow(), seed: newSeed(), ev: [], hints: {} };
        st = sess.seed; write();
      }
    },
    /** startLesson 맨 끝에서 부른다. handlers: { in(e), vk(k), vt(s), btn(name), done(info) } */
    end(h) {
      if (!restoring) return;
      const evs = restoring.ev; restoring = null;
      let n = 0;
      try {
        for (const e of evs) {
          runDue(sess.t0 + e.t);
          virt = sess.t0 + e.t;
          depth++;
          try { if (e.k === 'vk') h.vk(e.x); else if (e.k === 'vt') h.vt(e.x); else if (e.k === 'btn') h.btn(e.x); else h.in(e); } catch (err) { console.error(err); }
          depth--; n++;
        }
      } finally {
        replaying = false; virt = null; releaseTimers();
      }
      h.done({ count: n, hints: sess.hints, since: sess.t0 });
    },
    /** 사용자의 입력을 기록하고 fn을 실행한다. 안쪽에서 다시 불린 입력(예: Tab이 viType을 부름)은 한 번만 적는다. */
    wrap(e, fn) { if (replaying || depth > 0) return fn(); depth++; try { rec(e); return fn(); } finally { depth--; } },
    hints(h) { if (!sess) return; sess.hints = Object.assign({}, h); write(); },
    clear() { KEYS.forEach(ls.del); sess = null; },
    get replaying() { return replaying; },
  };
  window.Sess = api;
})();
