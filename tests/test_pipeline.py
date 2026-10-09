"""Offline tests: parsing + classification with canned inputs (run: python -m pytest tests  or  python tests/test_pipeline.py)."""
import sys, pathlib, json
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'pipeline'))
import refresh
from bs4 import BeautifulSoup

UGC_HTML = """<table><tr><th>Sr No</th><th>State</th><th>HEI Name</th><th>Address</th><th>Website</th></tr>
<tr><td>1</td><td>Haryana</td><td>University of Southampton</td><td>Block III, Gurugram</td><td>View</td></tr>
<tr><td>2</td><td>Maharashtra</td><td>University of York, UK</td><td>Powai, Mumbai</td><td>View</td></tr></table>"""
def test_ugc_parse(monkeypatch=None):
    class R:
        text = UGC_HTML
        status_code = 200
        def raise_for_status(self): pass
    refresh.requests.get = lambda *a, **k: R()
    rows = refresh.fetch_ugc()
    assert [r['name'] for r in rows] == ['University of Southampton', 'University of York, UK']

def test_classify():
    it = {'title': 'University of Birmingham gets UGC Letter of Intent for India campus', 'summary': 'Hyderabad', 'url': 'x', 'published': refresh.NOW, 'source': 't'}
    c = refresh.classify(it, [])
    assert c and 'university-of-birmingham' in c['institutions'] and 'Letter of Intent' in c['events']
    new = refresh.classify({'title': 'University of Leeds receives letter of intent to open campus in India', 'summary': '', 'url': 'y', 'published': refresh.NOW, 'source': 't'}, [])
    assert new['possible_new_entrant'] == ['University of Leeds']
    assert refresh.classify({'title': 'Football club signs new striker', 'summary': '', 'url': 'z', 'published': refresh.NOW, 'source': 't'}, []) is None

if __name__ == '__main__':
    test_ugc_parse(); test_classify(); print('all tests passed')

def test_no_substring_false_positives():
    mk = lambda t, s='': {'title': t, 'summary': s, 'url': t, 'published': refresh.NOW, 'source': 't'}
    # 'ied' must not match inside 'studied'/'tied'; 'mou' must not match 'mount'
    c = refresh.classify(mk('Students studied tied results as foreign university branch campus opens in India'), [])
    assert c and 'ied' not in c['institutions'] and 'MoU / agreement' not in c['events']
    # Aberdeen the city is not the university
    c = refresh.classify(mk('Aberdeen oil firm opens branch campus style office in India'), [])
    assert not c or 'university-of-aberdeen' not in c['institutions']
    # headline vs summary
    c = refresh.classify(mk('University of Liverpool Bengaluru campus welcomes first cohort'), [])
    assert c['matched_in']['university-of-liverpool'] == 'headline' and 'Launch / first cohort' in c['events']
    c = refresh.classify(mk('Foreign campuses in India expand', 'The UGC approved Deakin for a campus in Gujarat'), [])
    assert c['matched_in']['deakin-university'] == 'summary'
    # plural/stem forms still work
    c = refresh.classify(mk('Three foreign campuses inaugurated in India', 'UGC list'), [])
    assert c and 'Launch / first cohort' in c['events']
test_no_substring_false_positives()
print('substring tests passed')
