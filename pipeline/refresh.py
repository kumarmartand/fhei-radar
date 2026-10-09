"""
FHEI Radar - refresh job. Free sources only, no API keys.
Run:  python pipeline/refresh.py          (writes ./data/*.json)
Every fetcher is isolated: if one source is down the others still run, and the failure is logged in data/source_health.json.
"""
import json, re, time, hashlib, datetime as dt, pathlib, urllib.parse
import requests, feedparser
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
CFG = json.loads((ROOT / 'pipeline' / 'config.json').read_text())
UA = {'User-Agent': 'FHEI-Radar/1.0 (internal research tool; contact: owner)'}
NOW = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
health = {}
PREV_HEALTH = {}

def jload(name, default):
    p = DATA / name
    return json.loads(p.read_text()) if p.exists() else default
def jsave(name, obj):
    (DATA / name).write_text(json.dumps(obj, indent=1, ensure_ascii=False))
def timed(name):
    def deco(fn):
        def wrap(*a, **k):
            t = time.time()
            try:
                out = fn(*a, **k); health[name] = {'ok': True, 'items': len(out) if hasattr(out, '__len__') else None, 'at': NOW, 'last_ok': NOW, 'secs': round(time.time() - t, 1)}
                return out
            except Exception as e:
                health[name] = {'ok': False, 'error': f'{type(e).__name__}: {str(e)[:160]}', 'at': NOW, 'last_ok': PREV_HEALTH.get(name, {}).get('last_ok')}
                return []
        return wrap
    return deco

def feed_entries(url, limit):
    f = feedparser.parse(url, request_headers=UA)
    if not f.entries and (f.get('bozo') or f.get('status', 200) >= 400):
        raise ConnectionError(f"{url[:60]} unreachable/invalid ({f.get('status', 'no response')})")
    return f.entries[:limit]

# ---------- 1. Official regulator list: UGC foreign HEI campuses ----------
@timed('UGC FHEI list')
def fetch_ugc():
    r = requests.get(CFG['ugc_fhei_url'], headers=UA, timeout=30); r.raise_for_status()
    soup = BeautifulSoup(r.text, 'lxml'); rows = []
    for tr in soup.select('table tr'):
        td = [c.get_text(' ', strip=True) for c in tr.find_all('td')]
        if len(td) >= 4 and td[0].isdigit():
            rows.append({'state': td[1], 'name': td[2], 'address': td[3]})
    if not rows: raise ValueError('table not found - page layout may have changed')
    return rows

# ---------- 2. News: Google News RSS (free, no key) ----------
@timed('Google News RSS')
def fetch_gnews():
    items, fails = [], 0
    for q in CFG['news_queries']:
        url = 'https://news.google.com/rss/search?q=' + urllib.parse.quote(q + ' when:30d') + '&hl=en-IN&gl=IN&ceid=IN:en'
        try: entries = feed_entries(url, 30)
        except ConnectionError: fails += 1; continue
        for e in entries:
            items.append({'title': e.get('title', ''), 'url': e.get('link', ''), 'source': (e.get('source') or {}).get('title', 'Google News'),
                          'published': iso(e.get('published_parsed')), 'summary': strip(e.get('summary', ''))})
    if fails == len(CFG['news_queries']): raise ConnectionError('all Google News queries failed')
    return items

# ---------- 3. News: GDELT DOC API (free, no key) ----------
@timed('GDELT')
def fetch_gdelt():
    """GDELT allows ~1 request per 5 s and answers 429 otherwise: pace requests, retry with back-off, and keep partial results."""
    items, errors = [], []
    queries = ['("foreign university" OR "offshore campus" OR "branch campus") india', '"letter of intent" university india campus UGC']
    for qi, q in enumerate(queries):
        if qi: time.sleep(8)
        u = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + urllib.parse.quote(q) + f"&mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan={CFG['gdelt_timespan']}"
        data = None
        for attempt in range(4):
            try:
                r = requests.get(u, headers=UA, timeout=40)
                if r.status_code == 429: time.sleep(10 * (attempt + 1)); continue
                r.raise_for_status(); data = r.json(); break
            except ValueError: errors.append('non-JSON reply'); break   # GDELT sometimes returns text errors
            except requests.RequestException as e: errors.append(type(e).__name__); time.sleep(5)
        if data is None: errors.append(f'query {qi + 1} gave no data'); continue
        for a in (data.get('articles') or []):
            d = a.get('seendate', '')
            items.append({'title': a.get('title', ''), 'url': a.get('url', ''), 'source': a.get('domain', 'GDELT'),
                          'published': (dt.datetime.strptime(d, '%Y%m%dT%H%M%SZ').replace(tzinfo=dt.timezone.utc).isoformat() if d else NOW), 'summary': ''})
    if errors and not items: raise ConnectionError('GDELT: ' + '; '.join(errors)[:150])
    if errors: health['GDELT partial'] = {'ok': True, 'warnings': '; '.join(errors)[:150], 'at': NOW}
    return items

# ---------- 4. Trade/government RSS feeds + optional Google Alerts feeds ----------
@timed('Trade & gov RSS')
def fetch_rss():
    items, fails = [], 0
    feeds = CFG['rss_feeds'] + [{'name': 'Google Alert', 'url': u} for u in CFG.get('google_alerts_rss', [])]
    for f in feeds:
        try:
            for e in feed_entries(f['url'], 60):
                items.append({'title': e.get('title', ''), 'url': e.get('link', ''), 'source': f['name'], 'published': iso(e.get('published_parsed')),
                              'summary': strip(e.get('summary', ''))})
        except Exception:
            fails += 1
    if feeds and fails == len(feeds): raise ConnectionError('all RSS feeds failed')
    if fails: health['Trade & gov RSS partial'] = {'ok': True, 'failed_feeds': fails, 'of': len(feeds), 'at': NOW}
    return items

def iso(t):
    return dt.datetime(*t[:6], tzinfo=dt.timezone.utc).isoformat() if t else NOW
def strip(s):
    return re.sub(r'\s+', ' ', BeautifulSoup(s or '', 'lxml').get_text(' ')).strip()[:400]

# ---------- classification ----------
_RE = {}
def term_re(t):
    """Whole-word match (so 'ied', 'mou', 'uwa' cannot fire inside other words). A trailing '*' means word-start match (stems like 'inaugurat*')."""
    if t not in _RE:
        raw = t.strip().lower()
        stem = raw.endswith('*'); raw = raw.rstrip('*')
        _RE[t] = re.compile(r"(?<![a-z0-9])" + re.escape(raw) + ("" if stem else r"(?![a-z0-9])"))
    return _RE[t]
def hit(text, words): return any(term_re(w).search(text) for w in words)

def classify(item, insts):
    title = item['title'].lower(); text = title + ' ' + item['summary'].lower()
    if not (hit(text, CFG['relevance_must_have_any']) and hit(text, CFG['relevance_india_any'])): return None
    matched, where = [], {}
    for iid, al in CFG['aliases'].items():
        if hit(title, al): matched.append(iid); where[iid] = 'headline'
        elif hit(text, al): matched.append(iid); where[iid] = 'summary'
    events = [r['label'] for r in CFG['event_rules'] if hit(text, r['any'])]
    conf = 'high' if 'headline' in where.values() else ('medium' if matched else 'sector')
    item = dict(item, institutions=matched, matched_in=where, confidence=conf, events=events or ['General'])
    # possible new entrant: relevant + campus-intent wording, but no watch-list institution recognised
    if not matched and hit(text, CFG['new_entrant_phrases']):
        names = re.findall(r"\b(?:University of [A-Z][a-z]+(?: [A-Z][a-z]+)?|[A-Z][a-z]+(?: [A-Z][a-z]+)? (?:University|College|Institute))\b", item['title'] + ' ' + item['summary'])
        item['possible_new_entrant'] = sorted(set(names))[:4]
    return item

def main():
    DATA.mkdir(exist_ok=True)
    PREV_HEALTH.update(jload('source_health.json', {}))
    insts = jload('institutions.json', {'institutions': []})['institutions']
    # --- UGC list + change detection
    ugc = fetch_ugc(); prev = jload('ugc_list.json', {'rows': []})['rows']
    changes = jload('changes.json', [])
    if ugc:
        old, new = {r['name'] for r in prev}, {r['name'] for r in ugc}
        if prev:
            for n in sorted(new - old): changes.append({'at': NOW, 'type': 'UGC list: campus ADDED', 'detail': n})
            for n in sorted(old - new): changes.append({'at': NOW, 'type': 'UGC list: campus REMOVED', 'detail': n})
        jsave('ugc_list.json', {'fetched': NOW, 'rows': ugc})
        sig = {}
        for i in insts:
            al = CFG['aliases'].get(i['id'], [])
            sig[i['id']] = {'on_ugc_list': any(hit(r['name'].lower(), al) for r in ugc), 'checked': NOW}
            was = jload('signals.json', {}).get(i['id'], {}).get('on_ugc_list')
            if was is not None and was != sig[i['id']]['on_ugc_list']:
                changes.append({'at': NOW, 'type': 'UGC list: ' + ('now lists' if sig[i['id']]['on_ugc_list'] else 'no longer lists') + ' ' + i['name'], 'detail': 'Seed stage: ' + i.get('stage', '')})
        jsave('signals.json', sig)
        jsave('changes.json', changes[-200:])
    # --- news
    raw = fetch_gnews() + fetch_gdelt() + fetch_rss()
    seen = {n['url']: n for n in jload('news.json', {'items': []})['items']}
    norm = lambda t: re.sub(r'[^a-z0-9]+', ' ', t.lower()).strip()
    seen_titles = {norm(n['title']) for n in seen.values()}
    added = 0
    for it in raw:
        if not it['url'] or it['url'] in seen or norm(it['title']) in seen_titles: continue
        c = classify(it, insts)
        if c:
            c['first_seen'] = NOW; seen[c['url']] = c; seen_titles.add(norm(c['title'])); added += 1
            if c.get('possible_new_entrant'):
                changes.append({'at': NOW, 'type': 'Possible new entrant (review)', 'detail': ', '.join(c['possible_new_entrant']) + ' - ' + c['title'][:120], 'url': c['url']})
    items = sorted(seen.values(), key=lambda x: x['published'], reverse=True)[:1500]
    jsave('news.json', {'fetched': NOW, 'items': items})
    jsave('changes.json', changes[-200:])
    health['_summary'] = {'last_run': NOW, 'raw_items': len(raw), 'new_relevant_items': added}
    jsave('source_health.json', health)
    print(json.dumps(health, indent=1))

if __name__ == '__main__':
    main()
