#!/usr/bin/env python3
"""해부도 레슨 생성기.
lessons/<key>.py 에 META, LESSON 을 (한국어, 영어) 짝으로 적으면
  - oracle/<key>/index.html (한국어 원본)
  - course.js THEORY/TITLES/PAGES, 모든 해부도의 outline, sitemap, i18n SOURCES
  - 영어 사전(tools/i18n/en/*.json)의 빠진 항목
을 만든다.
사용(저장소 루트에서): python3 tools/anatomy-gen/gen.py lock undo ...
그다음: python3 tools/i18n/i18n.py prune en && python3 tools/i18n/i18n.py build en
"""
import json, os, re, subprocess, sys, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.abspath(os.path.join(HERE, '..', '..'))
EN = os.path.join(R, 'tools/i18n/en')
HANGUL = re.compile('[\u3131-\u318e\uac00-\ud7a3]')
P = {}  # ko -> en


def T(ko, en):
    return (ko, en)


def reg(x):
    if isinstance(x, tuple):
        P[x[0]] = x[1]
        return x[0]
    return x


# ------------------------------------------------------------ JS serializer
IDENT = re.compile(r'^[A-Za-z_$][\w$]*$')


def q(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n') + "'"


def js(v, ind=0):
    sp = '  ' * ind
    if isinstance(v, tuple):
        return q(reg(v))
    if isinstance(v, str):
        if HANGUL.search(v):
            raise SystemExit('untranslated string: ' + v[:60])
        return q(v)
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    if v is None:
        return 'null'
    if isinstance(v, list):
        inner = [js(x, ind + 1) for x in v]
        one = '[' + ', '.join(inner) + ']'
        if len(one) < 150 and '\n' not in one:
            return one
        return '[\n' + ',\n'.join('  ' * (ind + 1) + x for x in inner) + ',\n' + sp + ']'
    if isinstance(v, dict):
        parts = []
        for k, x in v.items():
            kk = str(k) if (isinstance(k, int) or IDENT.match(k)) else q(k)
            parts.append(kk + ': ' + js(x, ind + 1))
        one = '{ ' + ', '.join(parts) + ' }'
        if len(one) < 150 and '\n' not in one:
            return one
        return '{\n' + ',\n'.join('  ' * (ind + 1) + x for x in parts) + ',\n' + sp + '}'
    raise TypeError(type(v))


def lesson_js(L):
    out = ['const LESSON = {']
    for k, v in L.items():
        if k == 'steps':
            out.append('  steps: [')
            for s in v:
                out.append('    {')
                for sk, sv in s.items():
                    out.append('      ' + sk + ': ' + js(sv, 3) + ',')
                out.append('    },')
            out.append('  ],')
        elif k in ('entities', 'links') or k == 'zones' or k == 'metrics' or k == 'goals':
            if isinstance(v, dict):
                out.append('  ' + k + ': {')
                w = max(len(i) for i in v) + 1
                for ik, iv in v.items():
                    out.append('    ' + (ik + ':').ljust(w) + ' ' + js(iv, 2) + ',')
                out.append('  },')
            else:
                out.append('  ' + k + ': [')
                for iv in v:
                    out.append('    ' + js(iv, 2) + ',')
                out.append('  ],')
        else:
            out.append('  ' + k + ': ' + js(v, 1) + ',')
    out.append('};')
    return '\n'.join(out)


# ------------------------------------------------------------ outline (모든 해부도 공통)
OUTLINE = [
    ('먼저 보기 · 리눅스 해부도', [('명령 한 줄의 여정', 'linux')]),
    ('파트 1 · 아키텍처', [('인스턴스와 데이터베이스', 'instance'), ('SGA·PGA와 백그라운드 프로세스', 'memory')]),
    ('파트 2 · 트랜잭션', [('COMMIT의 여정', 'oracle'), ('Undo와 읽기 일관성', 'undo'), ('잠금과 대기', 'lock'), ('체크포인트', 'checkpoint')]),
    ('파트 3 · SQL 실행', [('파싱과 Shared Pool', 'parse'), ('옵티마이저와 실행계획', 'optimizer'), ('B-tree 인덱스', 'btree')]),
    ('파트 4 · 가용성', [('Archivelog와 RMAN', 'archive'), ('Data Guard', 'dataguard'), ('RAC와 Cache Fusion', 'rac')]),
]
P['SGA·PGA와 백그라운드 프로세스'] = 'SGA, PGA and background processes'
DIRS = {'linux': 'linux/', 'oracle': ''}


def page_dir(key):
    return DIRS.get(key, 'oracle/%s/' % key)


def exists(key):
    return os.path.exists(os.path.join(R, page_dir(key), 'index.html'))


def outline_js(here):
    """here: 지금 페이지 키. 'oracle'은 루트."""
    up = '' if here == 'oracle' else '../../'
    lines = ['  outline: [']
    for part, items in OUTLINE:
        its, cur = [], None
        for n, (text, key) in enumerate(items):
            if key == here:
                its.append(q(text)); cur = n; continue
            if key == 'linux':
                its.append("{ text: %s, href: %s, note: '리눅스 기초' }" % (q(text), q(up + 'linux/'))); continue
            if not exists(key):
                its.append(q(text)); continue
            if here == 'oracle':
                href = page_dir(key)
            elif key == 'oracle':
                href = '../../'
            else:
                href = '../%s/' % key
            its.append("{ text: %s, href: %s, note: '완성' }" % (q(text), q(href)))
        tail = ', current: %d' % cur if cur is not None else ''
        lines.append("    { part: %s, items: [%s]%s }," % (q(part), ', '.join(its), tail))
    lines.append('  ],')
    return '\n'.join(lines)


OL = re.compile(r'  outline: \[\n.*?\n  \],', re.S)


def update_outlines():
    keys = ['oracle'] + [k for _, it in OUTLINE for _, k in it if k not in ('oracle', 'linux')]
    for k in keys:
        if not exists(k):
            continue
        f = os.path.join(R, page_dir(k), 'index.html')
        s = open(f, encoding='utf-8').read()
        n = OL.sub(lambda m: outline_js(k), s, count=1)
        if n != s:
            open(f, 'w', encoding='utf-8').write(n)
    # 파트별 레슨 수(eyebrow)
    for part, items in OUTLINE[1:]:
        for i, (text, k) in enumerate(items):
            if not exists(k):
                continue
            f = os.path.join(R, page_dir(k), 'index.html')
            s = open(f, encoding='utf-8').read()
            ko = '<b>%s</b> / %d개 중 %d번째 레슨' % (part, len(items), i + 1)
            s2 = re.sub(r'(<div class="eyebrow">).*?(</div>)', lambda m: m.group(1) + ko + m.group(2), s, count=1)
            if s2 != s:
                open(f, 'w', encoding='utf-8').write(s2)
            pnum = re.search(r'\d', part).group(0)
            pen = {'1': 'Architecture', '2': 'Transactions', '3': 'SQL execution', '4': 'Availability'}[pnum]
            ords = {1: '1', 2: '2', 3: '3', 4: '4'}
            P[ko] = '<b>Part %s · %s</b> / lesson %d of %d' % (pnum, pen, i + 1, len(items))


# ------------------------------------------------------------ course.js
def dba_titles():
    s = open(os.path.join(R, 'dba/index.html'), encoding='utf-8').read()
    return {int(a): b for a, b in re.findall(r"^  \{ id: (\d+), stage: \d+, title: '([^']*)'", s, re.M)}


def update_course(key, name, practice, steps):
    f = os.path.join(R, 'course.js')
    s = open(f, encoding='utf-8').read()
    # THEORY: 이 페이지 줄을 지우고 끝에 다시 넣는다
    s = re.sub(r"\n    \{ page: '%s', step: \d+,[^\n]*\}," % key, '', s)
    rows = ''.join("\n    { page: '%s', step: %d, t: %s, lessons: [%s] }," % (key, st, q(steps[st - 1]['short'][0] if isinstance(steps[st - 1]['short'], tuple) else steps[st - 1]['short']), ', '.join(map(str, ids)))
                   for st, ids in sorted(practice.items()))
    i = s.index('\n  ];\n  const TITLES')
    s = s[:i] + rows + s[i:]
    # TITLES: 연결표가 쓰는 모든 id
    used = sorted({int(x) for x in re.findall(r'lessons: \[([^\]]*)\]', s) for x in re.findall(r'\d+', x)})
    tt = dba_titles()
    m = re.search(r'  const TITLES = \{\n(.*?)\n  \};', s, re.S)
    cur = {int(a): b for a, b in re.findall(r"(\d+): '([^']*)'", m.group(1))}
    for i2 in used:
        if i2 not in cur:
            if i2 not in tt:
                raise SystemExit('no title for lesson %d' % i2)
            cur[i2] = tt[i2]
    items = ["%d: %s" % (k, q(v)) for k, v in sorted(cur.items())]
    lines, line = [], '   '
    for it in items:
        if len(line) + len(it) > 150:
            lines.append(line); line = '   '
        line += ' ' + it + ','
    lines.append(line)
    s = s[:m.start(1)] + '\n'.join(lines) + s[m.end(1):]
    # PAGES
    m = re.search(r"  const PAGES = \{(.*?)\};", s)
    body = m.group(1)
    body = re.sub(r",? ?%s: \{ name: '[^']*', dir: '[^']*' \}" % key, '', body)
    body = body.rstrip() + ", %s: { name: %s, dir: '%s' } " % (key, q(name), page_dir(key))
    s = s[:m.start(1)] + body + s[m.end(1):]
    open(f, 'w', encoding='utf-8').write(s)


def update_sitemap(key):
    f = os.path.join(R, 'sitemap.xml')
    s = open(f, encoding='utf-8').read()
    base = 'https://batiappa.github.io/oracle-anatomy/'
    d = page_dir(key)
    if ('<loc>%s%s</loc>' % (base, d)) in s:
        return
    blk = ''
    for loc in (base + d, base + 'en/' + d):
        blk += ('  <url>\n    <loc>%s</loc>\n    <xhtml:link rel="alternate" hreflang="ko" href="%s"/>\n'
                '    <xhtml:link rel="alternate" hreflang="en" href="%s"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="%s"/>\n'
                '    <lastmod>2026-11-27</lastmod>\n  </url>\n') % (loc, base + d, base + 'en/' + d, base + d)
    s = s.replace('</urlset>', blk + '</urlset>')
    open(f, 'w', encoding='utf-8').write(s)


def update_sources(key):
    f = os.path.join(R, 'tools/i18n/i18n.py')
    s = open(f, encoding='utf-8').read()
    p = "'%sindex.html'" % page_dir(key)
    if p not in s:
        s = s.replace("'oracle/archive/index.html']", "'oracle/archive/index.html', %s]" % p) if "'oracle/archive/index.html']" in s else re.sub(r"(SOURCES = \[[^\]]*)\]", lambda m: m.group(1) + ', ' + p + ']', s, count=1)
        open(f, 'w', encoding='utf-8').write(s)


# ------------------------------------------------------------ page
def build_page(mod):
    M, L = mod.META, mod.LESSON
    key = M['key']
    tpl = open(os.path.join(R, 'oracle/archive/index.html'), encoding='utf-8').read()
    d = page_dir(key)
    s = tpl.replace('oracle/archive/', d)
    title = reg(M['title'])
    s = s.replace('Archivelog와 RMAN · Oracle 해부도', title)
    s = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + reg(M['desc']), s)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + reg(M['ogdesc']), s)
    s = re.sub(r'<h1>.*?</h1>', lambda m: '<h1>' + reg(M['h1']) + '</h1>', s)
    mins, lvl = M['minutes'], M['level']
    nst = len(L['steps'])
    bko = '<span class="badge ver">Oracle Database 19c</span><span class="badge">%d분</span><span class="badge">%s</span><span class="badge" id="stepBadge">%d단계</span>' % (mins, lvl[0], nst)
    P[bko] = '<span class="badge ver">Oracle Database 19c</span><span class="badge">%d min</span><span class="badge">%s</span><span class="badge" id="stepBadge">%d steps</span>' % (mins, lvl[1], nst)
    s = re.sub(r'(<div class="badges">).*?(</div>)', lambda m: m.group(1) + bko + m.group(2), s, count=1)
    s = re.sub(r'(<p class="summary">).*?(</p>)', lambda m: m.group(1) + reg(M['summary']) + m.group(2), s, count=1)
    s = re.sub(r'(<svg id="scene" role="img" aria-label=")[^"]*', lambda m: m.group(1) + reg(M['aria']), s)
    leg = '\n'.join('            <li><i style="background:var(--c-%s)"></i>%s</li>' % (tone, reg((('<i style="background:var(--c-%s)"></i>' % tone) + t[0], ('<i style="background:var(--c-%s)"></i>' % tone) + t[1]))[len('<i style="background:var(--c-%s)"></i>' % tone):]) for tone, t in M['legend'])
    s = re.sub(r'(<ul class="legend">\n).*?(\n          </ul>)', lambda m: m.group(1) + leg + m.group(2), s, flags=re.S)
    ct = M.get('ctitle', 'SQL*Plus')
    s = s.replace('<span id="consoleTitle">SQL*Plus</span>', '<span id="consoleTitle">%s</span>' % ct)
    legal = '\n'.join('      <p>%s</p>' % reg(p) for p in M['legal'])
    s = re.sub(r'(<h2>참고 사항</h2>\n)(      <p>.*?</p>\n)(      <p>.*?</p>\n)', lambda m: m.group(1) + legal + '\n', s, count=1, flags=re.S)
    # script
    a = s.index('/* =====================================================================\n   Oracle 해부도 파트')
    b = s.index('</script>\n<script src="../../course.js">')
    L = dict(L)
    L_out = {'page': key, 'base': '../../', 'storeKey': key + ':maxSeen', 'consoleTitle': ct, 'multiHost': True}
    L_out.update(L)
    L_out['outline'] = '__OUTLINE__'
    body = '/* =====================================================================\n   ' + M['comment'].strip().replace('\n', '\n   ') + '\n   ===================================================================== */\n'
    body += M.get('consts', '')
    lj = lesson_js(L_out)
    lj = lj.replace("  outline: '__OUTLINE__',", outline_js(key))
    s = s[:a] + body + lj + '\n' + s[b:]
    os.makedirs(os.path.join(R, d), exist_ok=True)
    open(os.path.join(R, d, 'index.html'), 'w', encoding='utf-8').write(s)
    update_course(key, reg(M['name']), M['practice'], L['steps'])
    update_sitemap(key)
    update_sources(key)


def load(key):
    spec = importlib.util.spec_from_file_location('l_' + key, os.path.join(HERE, 'lessons', key + '.py'))
    m = importlib.util.module_from_spec(spec)
    m.T = T
    spec.loader.exec_module(m)
    return m


def fill_dicts():
    """i18n todo 결과를 P와 기존 사전 전체에서 채운다."""
    todo = os.path.join(EN, '_todo')
    if os.path.isdir(todo):
        for f in os.listdir(todo):
            os.remove(os.path.join(todo, f))
    subprocess.run([sys.executable, os.path.join(R, 'tools/i18n/i18n.py'), 'todo', 'en'], cwd=R, capture_output=True)
    allD = {}
    for f in os.listdir(EN):
        if f.endswith('.json'):
            allD.update(json.load(open(os.path.join(EN, f), encoding='utf-8')))
    left = {}
    if not os.path.isdir(todo):
        return left
    for f in os.listdir(todo):
        keys = json.load(open(os.path.join(todo, f), encoding='utf-8'))
        if isinstance(keys, dict):
            keys = list(keys.keys())
        if not keys:
            os.remove(os.path.join(todo, f)); continue
        p = os.path.join(EN, f)
        dd = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
        for k in keys:
            if k in P:
                dd[k] = P[k]
            elif k in allD:
                dd[k] = allD[k]
            else:
                left.setdefault(f, []).append(k)
        with open(p, 'w', encoding='utf-8') as fh:
            json.dump(dd, fh, ensure_ascii=False, indent=0)
            fh.write('\n')
        os.remove(os.path.join(todo, f))
    os.rmdir(todo)
    return left


if __name__ == '__main__':
    for k in sys.argv[1:]:
        build_page(load(k))
    update_outlines()
    left = fill_dicts()
    for f, ks in left.items():
        for k in ks:
            print('MISSING', f, '|', k[:160])
    json.dump(left, open(os.path.join(HERE, 'left.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
