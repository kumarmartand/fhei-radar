"""Offline end-to-end run of the pipeline with mocked network: checks files written, change detection, UGC signals, dedupe, confidence."""
import sys, json, pathlib, tempfile, shutil
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'pipeline'))
import refresh

UGC = lambda names: "<table><tr><th>Sr No</th><th>State</th><th>HEI Name</th><th>Address</th></tr>" + ''.join(
    f"<tr><td>{i+1}</td><td>X</td><td>{n}</td><td>Addr</td></tr>" for i, n in enumerate(names)) + "</table>"
class R:
    def __init__(s, t): s.text = t; s.status_code = 200
    def raise_for_status(s): pass
def run(ugc_names, news):
    refresh.requests.get = lambda *a, **k: R(UGC(ugc_names))
    refresh.fetch_gnews = lambda: news
    refresh.fetch_gdelt = lambda: []
    refresh.fetch_rss = lambda: []
    refresh.health.clear(); refresh.main()

def test():
    tmp = pathlib.Path(tempfile.mkdtemp()); shutil.copytree(ROOT / 'data', tmp / 'data')
    refresh.DATA = tmp / 'data'
    n1 = {'title': 'Deakin University adds new programme at GIFT City campus India', 'url': 'u1', 'source': 's', 'published': refresh.NOW, 'summary': ''}
    dup = dict(n1, url='u2')  # same headline, different URL -> must be dropped
    sector = {'title': 'Foreign campuses in India: what students should know', 'url': 'u3', 'source': 's', 'published': refresh.NOW, 'summary': 'UGC campus rules'}
    run(['University of Southampton', 'University of York, UK'], [n1, dup, sector])
    news = json.loads((tmp / 'data/news.json').read_text())['items']
    assert len(news) == 2, news
    by = {n['url']: n for n in news}
    assert by['u1']['confidence'] == 'high' and by['u1']['institutions'] == ['deakin-university']
    assert by['u3']['confidence'] == 'sector'
    sig = json.loads((tmp / 'data/signals.json').read_text())
    assert sig['university-of-southampton']['on_ugc_list'] and not sig['deakin-university']['on_ugc_list']
    # second run: York removed, Deakin added -> changes logged
    run(['University of Southampton', 'Deakin University'], [])
    ch = json.loads((tmp / 'data/changes.json').read_text())
    types = [c['type'] for c in ch]
    assert 'UGC list: campus ADDED' in types and 'UGC list: campus REMOVED' in types, types
    assert any('now lists Deakin' in t for t in types), types
    h = json.loads((tmp / 'data/source_health.json').read_text())
    assert h['UGC FHEI list']['ok'] and h['UGC FHEI list']['last_ok']
    shutil.rmtree(tmp)
if __name__ == '__main__':
    test(); print('end-to-end test passed')
