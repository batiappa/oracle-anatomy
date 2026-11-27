#!/usr/bin/env python3
"""언어판 생성기: 한국어 원본(저장소 루트)에서 다른 언어판(예: en/)을 만든다.

원리
- 원본 파일에서 한글이 들어 있는 "문장 조각"을 찾는다.
  · HTML: 블록 태그 사이의 글자와 인라인 태그(<b>, <code>, <a> 등) 묶음 하나, 또는 한글이 든 속성 값 하나.
  · JS: 한글이 든 문자열 하나. 템플릿 문자열은 ${...} 자리를 ⟦0⟧, ⟦1⟧ 같은 자리표로 바꾼 글 하나.
  · 주석은 번역하지 않는다(생성된 파일에 한국어 주석이 그대로 남는다).
- tools/i18n/<언어>/<원본 경로>.json 사전에서 조각을 찾아 바꿔 <언어>/<원본 경로>에 쓴다.
- 터미널 명령과 출력은 원래 영어라서 한글이 없으면 손대지 않는다.

사용법
  python3 tools/i18n/i18n.py check en     # 빠진 번역, 쓰이지 않는 번역 보고
  python3 tools/i18n/i18n.py todo en      # 빠진 조각을 tools/i18n/en/_todo/*.json 으로 내보내기(번역할 목록)
  python3 tools/i18n/i18n.py build en     # en/ 생성. 빠진 번역이 있으면 실패
레슨을 고치거나 더하면: todo → 번역 채우기 → build → 커밋.
다른 언어(예: ja)를 붙일 때도 tools/i18n/ja/ 사전을 만들고 LANGS에 한 줄 더하면 된다.
"""
import json, os, re, sys, shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HERE = os.path.dirname(os.path.abspath(__file__))

# 번역할 원본(한글이 든 파일)과 그대로 복사할 파일
SOURCES = ['index.html', 'anatomy.js', 'course.js', 'tips.js', 'session.js', 'lang.js',
           'linux/index.html', 'lab/index.html', 'dba/index.html', 'oracle/instance/index.html', 'oracle/archive/index.html']
COPY = ['anatomy.css', 'favicon.svg', 'og.jpg', 'sw.js', 'stats.js']
SITE = 'https://batiappa.github.io/oracle-anatomy/'
LANGS = {
    'en': {'html_lang': 'en', 'og_locale': 'en_US'},
}

HANGUL = re.compile('[\u3131-\u318e\uac00-\ud7a3]')
PH = re.compile('⟦(\\d+)⟧')


def has_ko(s):
    return bool(HANGUL.search(s))


class Ctx:
    def __init__(self, src, dic):
        self.src, self.dic = src, dic
        self.keys = []          # 이 파일에서 찾은 조각(순서대로, 중복 없이)
        self.seen = set()
        self.missing = []
        self.warn = []

    def tr(self, key, kind):
        if key not in self.seen:
            self.seen.add(key)
            self.keys.append(key)
        if key in self.dic:
            return self.dic[key]
        self.missing.append(key)
        return None


# ---------------------------------------------------------------- JS
ESC = {'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}


def js_decode(raw):
    out, i = [], 0
    while i < len(raw):
        c = raw[i]
        if c != '\\':
            out.append(c); i += 1; continue
        n = raw[i + 1]
        if n in ESC and not (n == '0' and i + 2 < len(raw) and raw[i + 2].isdigit()):
            out.append(ESC[n]); i += 2
        elif n == 'u' and raw[i + 2] == '{':
            j = raw.index('}', i); out.append(chr(int(raw[i + 3:j], 16))); i = j + 1
        elif n == 'u':
            out.append(chr(int(raw[i + 2:i + 6], 16))); i += 6
        elif n == 'x':
            out.append(chr(int(raw[i + 2:i + 4], 16))); i += 4
        elif n == '\n':
            i += 2
        else:
            out.append(n); i += 2
    return ''.join(out)


def js_encode(s, q):
    s = s.replace('\\', '\\\\')
    if q == '`':
        return s.replace('`', '\\`').replace('${', '\\${')
    return s.replace(q, '\\' + q).replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')


KW_BEFORE_REGEX = {'return', 'typeof', 'case', 'in', 'of', 'do', 'else', 'instanceof', 'new', 'delete', 'void', 'throw', 'yield', 'await'}


def scan_js(s, i, ctx, stop=None):
    """s[i:]의 JS를 읽어 번역한 결과를 돌려준다. stop='}'이면 짝이 맞는 }에서 멈춘다(템플릿 ${...})."""
    out = []
    depth = 0
    prev = ''   # 마지막 의미 있는 토큰: 'id', 'num', ')', ']', '}', 'op'
    n = len(s)
    while i < n:
        c = s[i]
        if c == '/' and i + 1 < n and s[i + 1] == '/':
            j = s.find('\n', i); j = n if j < 0 else j
            out.append(s[i:j]); i = j; continue
        if c == '/' and i + 1 < n and s[i + 1] == '*':
            j = s.index('*/', i + 2) + 2
            out.append(s[i:j]); i = j; continue
        if c in '\'"':
            j = i + 1
            while s[j] != c:
                j += 2 if s[j] == '\\' else 1
            raw = s[i + 1:j]
            if has_ko(raw):
                t = ctx.tr(js_decode(raw), 'js')
                out.append(c + (js_encode(t, c) if t is not None else raw) + c)
            else:
                out.append(s[i:j + 1])
            i = j + 1; prev = 'id'; continue
        if c == '`':
            piece, i = scan_tpl(s, i, ctx)
            out.append(piece); prev = 'id'; continue
        if c == '/':
            if prev in ('id', 'num', ')', ']'):
                out.append(c); i += 1; prev = 'op'; continue
            # 정규식
            j = i + 1; cls = False
            while True:
                ch = s[j]
                if ch == '\\': j += 2; continue
                if ch == '[': cls = True
                elif ch == ']': cls = False
                elif ch == '/' and not cls: break
                elif ch == '\n': raise SyntaxError('regex newline at %d' % i)
                j += 1
            j += 1
            while j < n and (s[j].isalpha()):
                j += 1
            if has_ko(s[i:j]):
                ctx.warn.append('한글이 든 정규식(번역 안 함): ' + s[i:j][:80])
            out.append(s[i:j]); i = j; prev = 'id'; continue
        if c == '{':
            depth += 1; out.append(c); i += 1; prev = 'op'; continue
        if c == '}':
            if stop == '}' and depth == 0:
                return ''.join(out), i
            depth -= 1; out.append(c); i += 1; prev = '}'; continue
        if c.isalpha() or c in '_$':
            j = i
            while j < n and (s[j].isalnum() or s[j] in '_$'):
                j += 1
            w = s[i:j]
            prev = 'op' if w in KW_BEFORE_REGEX else 'id'
            out.append(w); i = j; continue
        if c.isdigit():
            j = i
            while j < n and (s[j].isalnum() or s[j] in '._'):
                j += 1
            out.append(s[i:j]); i = j; prev = 'num'; continue
        if c in ')]':
            prev = c
        elif not c.isspace():
            prev = 'op'
        if HANGUL.match(c):
            ctx.warn.append('코드 안의 한글(번역 안 함): ' + s[max(0, i - 30):i + 30])
        out.append(c); i += 1
    if stop:
        raise SyntaxError('unterminated ${')
    return ''.join(out), i


def scan_tpl(s, i, ctx):
    """s[i]=='`'. (번역한 템플릿, 끝 다음 위치)"""
    j = i + 1
    quasis, exprs, raw_exprs = [], [], []
    buf = []
    while True:
        ch = s[j]
        if ch == '\\':
            buf.append(s[j:j + 2]); j += 2; continue
        if ch == '`':
            quasis.append(''.join(buf)); j += 1; break
        if ch == '$' and s[j + 1] == '{':
            quasis.append(''.join(buf)); buf = []
            start = j + 2
            ex, k = scan_js(s, start, ctx, stop='}')
            exprs.append(ex); raw_exprs.append(s[start:k])
            j = k + 1; continue
        buf.append(ch); j += 1
    if any(has_ko(q) for q in quasis):
        key = ''
        for k, q in enumerate(quasis):
            key += js_decode(q)
            if k < len(exprs):
                key += '⟦%d⟧' % k
        t = ctx.tr(key, 'tpl')
        if t is not None:
            parts = PH.split(t)
            used = [int(x) for x in parts[1::2]]
            if sorted(used) != list(range(len(exprs))):
                ctx.warn.append('자리표가 맞지 않음: ' + key[:120])
                t = None
        if t is not None:
            o = '`'
            for k, p in enumerate(parts):
                o += js_encode(p, '`') if k % 2 == 0 else '${' + exprs[int(p)] + '}'
            return o + '`', j
    o = '`'
    for k, q in enumerate(quasis):
        o += q
        if k < len(exprs):
            o += '${' + exprs[k] + '}'
    return o + '`', j


# ---------------------------------------------------------------- HTML
INLINE = {'a', 'b', 'i', 'em', 'strong', 'code', 'span', 'br', 'small', 'kbd', 'sub', 'sup', 'mark', 'u', 's',
          'abbr', 'wbr', 'time', 'q', 'cite', 'var', 'samp', 'tspan', 'img'}
TAG_RE = re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"\']|"[^"]*"|\'[^\']*\')*)>', re.S)
ATTR_RE = re.compile(r'''([^\s=/>]+)(\s*=\s*)("([^"]*)"|'([^']*)')''')


def tr_attrs(tag, ctx):
    def rep(m):
        val = m.group(4) if m.group(4) is not None else m.group(5)
        if not has_ko(val):
            return m.group(0)
        name = m.group(1).lower()
        if name.startswith('on'):
            ctx.warn.append('이벤트 속성의 한글(번역 안 함): ' + val[:60]); return m.group(0)
        t = ctx.tr(val, 'attr')
        if t is None:
            return m.group(0)
        q = '"' if m.group(4) is not None else "'"
        return m.group(1) + m.group(2) + q + t + q
    return ATTR_RE.sub(rep, tag)


def scan_html(s, ctx):
    out = []
    run = []   # (kind, text) 인라인 묶음
    i, n = 0, len(s)

    def flush():
        if not run:
            return
        text = ''.join(t for _, t in run)
        plain = ''.join(t for k, t in run if k == 'text')
        if has_ko(plain):
            a = len(text) - len(text.lstrip()); b = len(text.rstrip())
            core = text[a:b]
            t = ctx.tr(core, 'html')
            out.append(text[:a] + (t if t is not None else core) + text[b:])
        else:
            for k, t in run:
                out.append(tr_attrs(t, ctx) if k == 'tag' else t)
        run.clear()

    while i < n:
        if s.startswith('<!--', i):
            flush(); j = s.index('-->', i) + 3; out.append(s[i:j]); i = j; continue
        if s.startswith('<!', i):
            flush(); j = s.index('>', i) + 1; out.append(s[i:j]); i = j; continue
        if s[i] == '<':
            m = TAG_RE.match(s, i)
            if not m:
                run.append(('text', s[i])); i += 1; continue
            name = m.group(2).lower(); closing = m.group(1) == '/'
            tag = m.group(0)
            if name in INLINE:
                run.append(('tag', tag)); i = m.end(); continue
            flush()
            out.append(tr_attrs(tag, ctx)); i = m.end()
            if not closing and name in ('script', 'style'):
                j = s.index('</' + name, i)
                body = s[i:j]
                if name == 'script' and ('src=' not in tag):
                    body, _ = scan_js(body, 0, ctx)
                out.append(body); i = j
            continue
        j = s.find('<', i); j = n if j < 0 else j
        run.append(('text', s[i:j])); i = j
    flush()
    return ''.join(out)


# ---------------------------------------------------------------- 사전과 생성
def dict_path(lang, src):
    return os.path.join(HERE, lang, src.replace('/', '__') + '.json')


def load_dict(lang, src):
    p = dict_path(lang, src)
    if not os.path.exists(p):
        return {}
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def save_dict(lang, src, d):
    p = dict_path(lang, src)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=0)
        f.write('\n')


def translate(src, lang):
    with open(os.path.join(ROOT, src), encoding='utf-8') as f:
        text = f.read()
    ctx = Ctx(src, load_dict(lang, src))
    if src.endswith('.html'):
        out = scan_html(text, ctx)
        cfg = LANGS[lang]
        out = out.replace('<html lang="ko">', '<html lang="%s">' % cfg['html_lang'], 1)
        out = out.replace('content="ko_KR"', 'content="%s"' % cfg['og_locale'])
        out = re.sub(r'(<link rel="canonical" href="|<meta property="og:url" content=")' + re.escape(SITE),
                     lambda m: m.group(1) + SITE + lang + '/', out)
    else:
        out, _ = scan_js(text, 0, ctx)
    return ctx, out


def cmd(action, lang):
    total_missing = 0
    for src in SOURCES:
        ctx, out = translate(src, lang)
        d = ctx.dic
        unused = [k for k in d if k not in ctx.seen]
        miss = list(dict.fromkeys(ctx.missing))
        total_missing += len(miss)
        for w in dict.fromkeys(ctx.warn):
            print('  주의 %s: %s' % (src, w))
        print('%-18s 조각 %4d  번역됨 %4d  빠짐 %4d  안 쓰임 %d' % (src, len(ctx.keys), len(ctx.keys) - len(miss), len(miss), len(unused)))
        if action == 'todo':
            p = os.path.join(HERE, lang, '_todo', src.replace('/', '__') + '.json')
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, 'w', encoding='utf-8') as f:
                json.dump(miss, f, ensure_ascii=False, indent=0)
        if action == 'prune' and unused:
            for k in unused:
                del d[k]
            save_dict(lang, src, d)
        if action == 'build':
            dst = os.path.join(ROOT, lang, src)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(dst, 'w', encoding='utf-8') as f:
                f.write(out)
    if action == 'build':
        for c in COPY:
            shutil.copyfile(os.path.join(ROOT, c), os.path.join(ROOT, lang, c))
        if total_missing:
            print('빠진 번역 %d개: 그 조각은 한국어 그대로 들어갔습니다.' % total_missing)
            return 1
    return 0


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ('check', 'todo', 'build', 'prune') or sys.argv[2] not in LANGS:
        print(__doc__); sys.exit(2)
    sys.exit(cmd(sys.argv[1], sys.argv[2]))
