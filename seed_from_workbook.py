"""One-off: turn the audited Excel workbook into data/institutions.json (the dashboard's seed)."""
import openpyxl, json, re, sys
src = sys.argv[1]
ws = openpyxl.load_workbook(src)['Sheet1']
H = {c: str(ws.cell(2, c).value).strip() for c in range(2, 19)}
col = lambda r, c: (str(ws.cell(r, c).value).strip() if ws.cell(r, c).value not in (None, '') else '')
strip_email = lambda s: re.sub(r'\s*[\w.\-]+@[\w.\-]+\.\w+', '', s)

# Status is assigned from sources checked on 6-8 Oct 2026 (see Verification Audit sheet), not guessed.
STATUS = {  # key -> (stage, short evidence)
 'deakin': ('Operating', 'IFSCA-registered IBC (FUI2024IBC0001)'),
 'wollongong': ('Operating', 'IFSCA-registered IBC (FUI2024IBC0002)'),
 "queen's": ('Operating', 'IFSCA-registered IBC (FUI2026IBC0003)'),
 'southampton': ('Operating', 'On UGC FHEI list'),
 'liverpool': ('Operating', 'On UGC FHEI list'),
 'york': ('Operating', 'On UGC FHEI list'),
 'aberdeen': ('Operating', 'On UGC FHEI list'),
 'illinois': ('Operating', 'On UGC FHEI list'),
 'victoria': ('Operating', 'On UGC FHEI list'),
 'bristol': ('Operating', 'On UGC FHEI list'),
 'university of new south': ('Operating', 'On UGC FHEI list'),
 'university of western australia': ('Approved (not yet on UGC list)', 'UWA reports Mumbai opening 18 Sep 2026 and Chennai UGC final approval 5 Oct 2026; not on UGC FHEI page as of 8 Oct 2026'),
 'birkbeck': ('Approved (not yet on UGC list)', 'Birkbeck release 1 Sep 2026 reports UGC Letter of Approval; not on UGC FHEI page as of 8 Oct 2026'),
 'coventry': ('Approved in principle', 'IFSCA in-principle approval only; not IFSCA-registered as of 25 Mar 2026'),
 'surrey': ('Approved in principle', 'Not in IFSCA directory of 25 Mar 2026; first intake planned Summer 2027'),
 'la trobe': ('Letter of Intent', 'UGC LoI reported Jul 2025'),
 'lancaster': ('Letter of Intent', 'UGC LoI reported Oct/Nov 2025'),
 'flinders': ('Letter of Intent', 'UGC LoI announced by Flinders, 9 Jul 2026'),
 'ied': ('Letter of Intent', 'LoI ceremony 14 Jun 2025'),
 'western sydney': ('Letter of Intent', 'Plans for Greater Noida, first students 2027 per NSW Government release (31 Aug 2026)'),
 'university of london': ('Application / state talks', 'UGC application reported by press; Telangana govt announced plan'),
 'university of colorado': ('Application / state talks', 'UGC application reported by press (campus not specified)'),
 'northeastern': ('State talks', 'Telangana govt announced plan; no UGC application reported'),
 'newcastle': ('State talks', 'Exploring Telangana (Telangana Today, Apr 2026)'),
 'birmingham': ('State talks', 'Interest in Telangana reported by press'),
 'purdue': ('State talks', 'Reported in discussions with Telangana; Delhi centre announced Nov 2024'),
 'sussex': ('Reported intent', 'Single trade-press report (May 2026); no regulator listing found'),
 'exeter': ('No India campus plan', 'No India campus plan found; branch campus is in Egypt'),
 'icn': ('Discontinued', 'ICN pathway college states operations discontinued'),
}
def status_for(name):
    n = re.sub(r'\s*\(.*?\)\s*$', '', name).lower()
    for k, v in STATUS.items():
        if re.search(r'\b' + re.escape(k) + r'\b', n): return v
    return ('Unclassified', '')
CITY = {  # India city -> (lat, lon)
 'gift city': (23.1645, 72.6836, 'GIFT City, Gandhinagar'), 'gurugram': (28.4595, 77.0266, 'Gurugram'),
 'bengaluru': (12.9716, 77.5946, 'Bengaluru'), 'mumbai': (19.0760, 72.8777, 'Mumbai'),
 'chennai': (13.0827, 80.2707, 'Chennai'), 'greater noida': (28.4744, 77.5040, 'Greater Noida'),
 'hyderabad': (17.3850, 78.4867, 'Hyderabad'), 'delhi': (28.6139, 77.2090, 'Delhi'), 'noida': (28.5355, 77.3910, 'Noida')}
def city_for(name, loc, status):
    n = re.sub(r'\s*\(.*?\)\s*$', '', name).lower() if False else name.lower(); l = (loc or '').lower()
    for k in ('gift city','gurugram','bengaluru','mumbai','greater noida','hyderabad','chennai','delhi'):
        if k in l: return CITY[k]
    if any(x in n for x in ('lancaster','flinders','la trobe','birkbeck')): return CITY['bengaluru']
    if 'western australia' in n: return CITY['mumbai']
    if 'western sydney' in n: return CITY['greater noida']
    if any(x in n for x in ('university of london','colorado','northeastern','newcastle','birmingham','purdue')) : return CITY['hyderabad']
    return None
out = []
for r in range(3, 32):
    name = col(r, 3)
    if not name: continue
    clean = re.sub(r'\s*\(.*?\)\s*$', '', name).strip()
    stage, ev = status_for(name)
    city = city_for(name, col(r, 5), stage)
    out.append({
        'id': re.sub(r'[^a-z0-9]+', '-', clean.lower()).strip('-'),
        'name': clean, 'country_or_note': col(r, 4)[:300], 'india_location': col(r, 5),
        'stage': stage, 'stage_evidence': ev,
        'lat': city[0] if city else None, 'lon': city[1] if city else None, 'map_city': city[2] if city else '',
        'qs_2027': col(r, 6), 'founded': col(r, 7), 'students': col(r, 8), 'domain': col(r, 9),
        'achievements': col(r, 10), 'launch': col(r, 11), 'intake': col(r, 12), 'courses': col(r, 13),
        'leadership': strip_email(col(r, 14)), 'ownership': col(r, 15), 'partner': col(r, 16),
        'service_provider': col(r, 17), 'sources': col(r, 18).split('\n') if col(r, 18) else [],
    })
json.dump({'generated_from': src.split('/')[-1], 'as_of': '2026-10-08', 'institutions': out},
          open('data/institutions.json', 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print(len(out), Counter(o['stage'] for o in out))
