"""언어판 점검 (규칙 10·11, 2026-11-16): en/ 페이지에 한글이 보이지 않는지, 공유 그림이 영어판인지,
날짜·숫자가 줄 끝에서 떨어지지 않게 묶였는지 확인한다. 주석·스크립트·스타일 안 글자는 보지 않는다."""
import re, sys, glob
bad = []
for p in sorted(glob.glob('en/**/*.html', recursive=True)):
    s = open(p, encoding='utf-8').read()
    v = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    v = re.sub(r'<(script|style)\b.*?</\1>', '', v, flags=re.S)
    for m in re.finditer(r'[가-힣]+', v):
        line = v[:m.start()].count('\n') + 1
        bad.append(f'{p}: 한글이 보임 "{m.group()}" (정리 뒤 {line}줄)')
    for m in re.finditer(r'<meta (?:property="og:image"|name="twitter:image") content="([^"]+)"', s):
        if '-en' not in m.group(1):
            bad.append(f'{p}: 공유 그림이 영어판이 아님 {m.group(1)}')
    for m in re.finditer(r'(?:January|February|March|April|May|June|July|August|September|October|November|December) \d', v):
        bad.append(f'{p}: 날짜를 줄바꿈 없는 공백으로 묶지 않음 "{m.group()}"')
# 일본어판 (2026-11-24): ja/ 페이지에 한글이 보이지 않는지(언어 고르기 '한국어' 링크만 예외), 공유 그림이 일본어판인지
for p in sorted(glob.glob('ja/**/*.html', recursive=True)):
    s = open(p, encoding='utf-8').read()
    v = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    v = re.sub(r'<(script|style)\b.*?</\1>', '', v, flags=re.S)
    v = v.replace('data-ko>한국어</a>', 'data-ko></a>')
    for m in re.finditer(r'[가-힣]+', v):
        line = v[:m.start()].count('\n') + 1
        bad.append(f'{p}: 한글이 보임 "{m.group()}" (정리 뒤 {line}줄)')
    for m in re.finditer(r'<meta (?:property="og:image"|name="twitter:image") content="([^"]+)"', s):
        if '-ja' not in m.group(1):
            bad.append(f'{p}: 공유 그림이 일본어판이 아님 {m.group(1)}')
# 링크 미리보기·검색 로봇이 영어판으로 옮겨지지 않게 (11/19 네이버 블로그 카드가 영어로 뜬 사고 재발 방지)
NEED = ['bot', 'crawl', 'spider', 'preview', 'yeti', 'naver', 'daum', 'kakao', 'facebookexternalhit', 'headless', 'google', 'bing']
for p in sorted(glob.glob('**/*.html', recursive=True)):
    if p.startswith(('en/', 'ja/')): continue
    s = open(p, encoding='utf-8').read()
    if re.search(r"location\.replace\([^;]*'/en/'", s):
        m = re.search(r"/(bot\|[^/]+)/i\.test\(n\.userAgent\)", s)
        miss = [w for w in NEED if not m or w not in m.group(1).split('|')]
        if miss: bad.append(f'{p}: 영어판 이동에서 빼야 할 로봇이 빠짐 {miss}')
        if 'n.webdriver' not in s: bad.append(f'{p}: 영어판 이동에서 자동 브라우저(webdriver)를 빼지 않음')
    for m in re.finditer(r'<meta property="og:(title|description)" content="([^"]*)"', s):
        if not re.search(r'[가-힣]', m.group(2)):
            bad.append(f'{p}: 한국어판 og:{m.group(1)}에 한글이 없음 "{m.group(2)}"')
for b in bad: print('✗', b)
print('언어판 점검:', '✗ %d건' % len(bad) if bad else '✓ 모두 맞습니다')
sys.exit(1 if bad else 0)
