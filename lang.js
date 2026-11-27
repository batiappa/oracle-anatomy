/* 언어 전환: 머리글의 테마 버튼 앞에 "한국어 / English" 단추를 붙이고, 고른 언어를 기억한다.

   - 한국어 원본은 저장소 루트에, 다른 언어판은 en/ 같은 하위 폴더에 같은 경로로 있다(tools/i18n/i18n.py가 만든다).
   - 이 파일의 위치(document.currentScript)로 사이트의 뿌리를 알아내므로, GitHub Pages(/oracle-anatomy/)나
     로컬 서버(/) 어디서든 같은 페이지의 다른 언어판 주소를 계산한다. #lesson-12 같은 해시도 그대로 넘긴다.
   - 고른 언어는 localStorage 'ohb:lang'에 적는다. 다음에 다른 언어판 주소로 들어오면 고른 언어판으로 옮긴다.
   - 진행 기록과 자동 저장 세션은 두 언어판이 함께 쓴다(같은 주소 체계, 같은 저장소 키). */
(function () {
  'use strict';
  var LANGS = [
    { code: 'ko', label: '한국어', dir: '' },
    { code: 'en', label: 'English', dir: 'en/' },
  ];
  var KEY = 'ohb:lang';
  var me = document.currentScript;
  if (!me || !me.src) return;
  var base = new URL('.', me.src).pathname;        // 이 언어판의 뿌리, 예: /oracle-anatomy/en/
  var here = (document.documentElement.lang || 'ko').slice(0, 2);
  var cur = LANGS.filter(function (l) { return l.code === here; })[0] || LANGS[0];
  if (cur.dir && base.slice(-cur.dir.length) !== cur.dir) return;
  var root = base.slice(0, base.length - cur.dir.length); // 한국어 원본의 뿌리, 예: /oracle-anatomy/
  var path = location.pathname;
  if (path.indexOf(base) !== 0) return;
  var rel = path.slice(base.length);                // 예: lab/ , dba/index.html , ''
  function urlOf(l) { return root + l.dir + rel + location.search + location.hash; }

  var pref = null;
  try { pref = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  var want = LANGS.filter(function (l) { return l.code === pref; })[0];
  if (want && want !== cur) { location.replace(urlOf(want)); return; }

  function mount() {
    var anchor = document.getElementById('themeBtn');
    if (!anchor || document.getElementById('langSwitch')) return;
    var st = document.createElement('style');
    st.textContent = '.lang-sw{display:inline-flex;flex:none;align-items:center;height:36px;border:1px solid var(--line);border-radius:10px;background:var(--panel);overflow:hidden;font-size:12.5px;margin-right:8px}' +
      '.lang-sw a{display:inline-flex;align-items:center;height:100%;padding:0 9px;color:var(--muted);text-decoration:none;font-weight:500}' +
      '.lang-sw a+a{border-left:1px solid var(--line)}' +
      '.lang-sw a:hover{color:var(--ink)}' +
      '.lang-sw a[aria-current="true"]{color:var(--ink);font-weight:700;background:var(--panel-2,transparent)}' +
      '@media (max-width:600px){.lang-sw a{padding:0 7px}}';
    document.head.appendChild(st);
    var nav = document.createElement('nav');
    nav.className = 'lang-sw'; nav.id = 'langSwitch';
    nav.setAttribute('aria-label', 'Language');
    LANGS.forEach(function (l) {
      var a = document.createElement('a');
      a.href = urlOf(l); a.lang = l.code; a.hreflang = l.code; a.textContent = l.label;
      if (l === cur) a.setAttribute('aria-current', 'true');
      a.addEventListener('click', function (e) {
        try { localStorage.setItem(KEY, JSON.stringify(l.code)); } catch (err) {}
        if (l === cur) { e.preventDefault(); return; }
        a.href = urlOf(l); // 해시가 바뀌었을 수 있으니 누르는 순간의 주소로
      });
      nav.appendChild(a);
    });
    anchor.parentNode.insertBefore(nav, anchor);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
