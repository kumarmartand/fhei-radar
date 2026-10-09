import json, pathlib, datetime as dt, subprocess, sys
import pandas as pd, plotly.express as px, plotly.graph_objects as go, streamlit as st

ROOT = pathlib.Path(__file__).resolve().parent
DATA = ROOT / 'data'
st.set_page_config(page_title='FHEI Radar', page_icon='📡', layout='wide', initial_sidebar_state='expanded')

STAGES = ['Operating', 'Approved (not yet on UGC list)', 'Approved in principle', 'Letter of Intent', 'Application / state talks',
          'State talks', 'Reported intent', 'No India campus plan', 'Discontinued']
COLORS = {'Operating': '#22d3a6', 'Approved (not yet on UGC list)': '#38bdf8', 'Approved in principle': '#818cf8', 'Letter of Intent': '#fbbf24',
          'Application / state talks': '#fb923c', 'State talks': '#f472b6', 'Reported intent': '#a78bfa', 'No India campus plan': '#64748b', 'Discontinued': '#ef4444'}

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;600&display=swap');
html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
.stApp { background: radial-gradient(1200px 600px at 10% -10%, #1e1b4b55, transparent), radial-gradient(900px 500px at 100% 0%, #0e749055, transparent), #060913; color:#e2e8f0; }
header[data-testid="stHeader"] { background: transparent; }
section[data-testid="stSidebar"] * { color:#cbd5e1; } section[data-testid="stSidebar"] input { color:#0f172a !important; } section[data-testid="stSidebar"] { background: #0a0f1f; border-right: 1px solid #1e293b; }
.hero { padding: 6px 0 14px 0; }
.hero h1 { font-weight: 800; letter-spacing: -1.5px; font-size: 3rem; margin:0; background: linear-gradient(90deg,#22d3ee,#818cf8 55%,#f472b6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.hero p { color:#94a3b8; margin:2px 0 0 2px; font-size:1.02rem; }
.pulse { display:inline-block; width:9px; height:9px; border-radius:50%; background:#22d3a6; box-shadow:0 0 0 0 #22d3a6aa; animation:pulse 2s infinite; margin-right:8px; }
@keyframes pulse { 0%{box-shadow:0 0 0 0 #22d3a6aa} 70%{box-shadow:0 0 0 10px transparent} 100%{box-shadow:0 0 0 0 transparent} }
.kpi { background: linear-gradient(145deg,#0f172acc,#111c33cc); border:1px solid #1e293b; border-radius:18px; padding:16px 18px; backdrop-filter: blur(10px); position:relative; overflow:hidden; }
.kpi:before { content:''; position:absolute; inset:0 0 auto 0; height:3px; background:var(--c); }
.kpi .v { font-size:2.3rem; font-weight:800; line-height:1.05; color:#f8fafc; }
.kpi .l { font-size:.74rem; text-transform:uppercase; letter-spacing:.12em; color:#94a3b8; margin-top:4px; }
.kpi .s { font-size:.78rem; color:#64748b; margin-top:2px; }
.card { background: linear-gradient(160deg,#0f172acc,#0b1224cc); border:1px solid #1e293b; border-radius:16px; padding:16px 18px; margin-bottom:12px; transition:.2s; }
.card:hover { border-color:#334155; transform: translateY(-2px); box-shadow:0 10px 30px #0008; }
.card h4 { margin:0 0 4px 0; font-size:1.08rem; font-weight:700; color:#f1f5f9; }
.pill { display:inline-block; padding:2px 10px; border-radius:999px; font-size:.72rem; font-weight:600; border:1px solid; margin-right:6px; }
.meta { color:#94a3b8; font-size:.82rem; margin-top:6px; line-height:1.45; }
.news { border-left:3px solid var(--c); padding:10px 14px; margin-bottom:10px; background:#0b1224aa; border-radius:0 12px 12px 0; }
.news a { color:#e2e8f0; text-decoration:none; font-weight:600; } .news a:hover { color:#22d3ee; }
.news .m { color:#64748b; font-size:.76rem; font-family:'JetBrains Mono',monospace; margin-top:3px; }
.tag { font-size:.68rem; padding:1px 8px; border-radius:6px; background:#1e293b; color:#cbd5e1; margin-right:5px; }
.note { background:#0b1224; border:1px dashed #334155; border-radius:12px; padding:10px 14px; color:#94a3b8; font-size:.82rem; }
div[data-baseweb="tab-list"] { gap:6px; } button[data-baseweb="tab"] { background:#0b1224; border-radius:10px 10px 0 0; padding:8px 18px; }
</style>""", unsafe_allow_html=True)

@st.cache_data(ttl=300)
def load():
    rd = lambda n, d: json.loads((DATA / n).read_text()) if (DATA / n).exists() else d
    inst = rd('institutions.json', {'institutions': [], 'as_of': ''})
    news = rd('news.json', {'items': [], 'fetched': None})
    ugc = rd('ugc_list.json', {'rows': [], 'fetched': None})
    return inst, news, ugc, rd('changes.json', []), rd('source_health.json', {})
inst_doc, news_doc, ugc_doc, changes, health = load()
df = pd.DataFrame(inst_doc['institutions'])
news = pd.DataFrame(news_doc['items']) if news_doc['items'] else pd.DataFrame(columns=['title', 'url', 'source', 'published', 'summary', 'institutions', 'events'])
if len(news): news['published_dt'] = pd.to_datetime(news['published'], utc=True, errors='coerce')

def ago(iso):
    if not iso: return 'never'
    d = dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(iso)
    m = int(d.total_seconds() // 60)
    return f'{m} min ago' if m < 90 else f'{m // 60} h ago' if m < 2880 else f'{m // 1440} d ago'
last = max([x for x in [news_doc.get('fetched'), ugc_doc.get('fetched')] if x], default=None)

# ---------------- sidebar ----------------
with st.sidebar:
    st.markdown('### 📡 FHEI Radar')
    st.caption('Foreign higher-education institutions entering India')
    stage_sel = st.multiselect('Stage', STAGES, default=[s for s in STAGES if s in set(df.get('stage', []))])
    q = st.text_input('Search institution / city / programme', '')
    st.divider()
    st.markdown('**Data freshness**')
    st.write(f"Live feeds: {ago(last)}")
    st.write(f"Seed data as of: {inst_doc.get('as_of', '–')}")
    if st.button('⟳ Run live refresh now', width="stretch"):
        with st.spinner('Fetching UGC list, news, GDELT…'):
            r = subprocess.run([sys.executable, str(ROOT / 'pipeline' / 'refresh.py')], capture_output=True, text=True, timeout=240)
        st.cache_data.clear(); st.toast('Refresh finished' if r.returncode == 0 else 'Refresh failed – see Alerts tab'); st.rerun()
    st.markdown('<div class="note">Statuses come from the audited workbook (regulator lists + official pages). Live feeds add news and detect new UGC-list entries; they never silently overwrite a status.</div>', unsafe_allow_html=True)

f = df[df['stage'].isin(stage_sel)] if len(df) else df
if q and len(f):
    ql = q.lower(); f = f[f.apply(lambda r: ql in ' '.join(str(v) for v in r.values).lower(), axis=1)]

# ---------------- hero + KPIs ----------------
st.markdown(f"""<div class="hero"><h1>FHEI RADAR</h1>
<p><span class="pulse"></span>Live tracker of foreign universities building campuses in India · feeds updated {ago(last)}</p></div>""", unsafe_allow_html=True)
cnt = df['stage'].value_counts().to_dict() if len(df) else {}
week = int((news['published_dt'] > pd.Timestamp.now(tz='UTC') - pd.Timedelta(days=7)).sum()) if len(news) else 0
new_ent = [c for c in changes if 'new entrant' in c['type'].lower()]
kp = [('Operating', cnt.get('Operating', 0), 'UGC list + IFSCA-registered', '#22d3a6'),
      ('Approved / in principle', cnt.get('Approved (not yet on UGC list)', 0) + cnt.get('Approved in principle', 0), 'not yet on regulator list', '#38bdf8'),
      ('Letter of Intent', cnt.get('Letter of Intent', 0), 'UGC LoI stage', '#fbbf24'),
      ('Pipeline / talks', cnt.get('Application / state talks', 0) + cnt.get('State talks', 0) + cnt.get('Reported intent', 0), 'press / state reports', '#f472b6'),
      ('News · 7 days', week, 'relevant articles', '#818cf8'),
      ('To review', len(new_ent), 'possible new entrants', '#ef4444')]
for col, (l, v, s, c) in zip(st.columns(6), kp):
    col.markdown(f'<div class="kpi" style="--c:{c}"><div class="v">{v}</div><div class="l">{l}</div><div class="s">{s}</div></div>', unsafe_allow_html=True)
st.write('')

tab1, tab2, tab3, tab4, tab5 = st.tabs(['🗺  Command center', '🏛  Institutions', '📰  Live intel', '🚨  Alerts & source health', '⬇  Data'])

# ---------------- tab 1 ----------------
with tab1:
    c1, c2 = st.columns([1.55, 1])
    with c1:
        m = f.dropna(subset=['lat']).copy() if len(f) else f
        if len(m):
            order = {s: i for i, s in enumerate(STAGES)}
            g = m.groupby(['map_city', 'lat', 'lon']).apply(lambda d: pd.Series({
                'n': len(d), 'best': min(d['stage'], key=lambda s: order.get(s, 99)),
                'list': '<br>'.join(f"• {r['name']} <i>({r['stage']})</i>" for _, r in d.iterrows())}), include_groups=False).reset_index()
            fig = go.Figure()
            fig.add_trace(go.Scattergeo(lat=g['lat'], lon=g['lon'], mode='markers', marker=dict(size=g['n'] * 9 + 26, color=g['best'].map(COLORS), opacity=.25, line=dict(width=0)), hoverinfo='skip'))
            fig.add_trace(go.Scattergeo(lat=g['lat'], lon=g['lon'], mode='markers+text', text=g['n'].astype(str), textfont=dict(color='white', size=13),
                                        marker=dict(size=g['n'] * 5 + 15, color=g['best'].map(COLORS)), customdata=g[['map_city', 'list']],
                                        hovertemplate='<b>%{customdata[0]}</b><br>%{customdata[1]}<extra></extra>'))
            fig.update_layout(geo=dict(scope='asia', projection_type='mercator', lonaxis_range=[67,99], lataxis_range=[5,37], showland=True, landcolor='#111a33', showocean=True, oceancolor='#060b18', showcountries=True, countrycolor='#2a3b66', coastlinecolor='#2a3b66', showlakes=False, bgcolor='rgba(0,0,0,0)', resolution=50), margin=dict(l=0, r=0, t=0, b=0), height=520,
                              paper_bgcolor='rgba(0,0,0,0)', showlegend=False)
            st.plotly_chart(fig, width="stretch")
            st.caption('Bubble = city; number = institutions; colour = most advanced stage in that city. Hyderabad points are proposed/talks, not operating campuses.')
        else:
            st.info('No locations to map with the current filters.')
    with c2:
        sc = f['stage'].value_counts().reindex(STAGES).dropna().reset_index()
        sc.columns = ['stage', 'n']
        fig2 = px.bar(sc[::-1], x='n', y='stage', orientation='h', color='stage', color_discrete_map=COLORS, text='n')
        fig2.update_layout(showlegend=False, height=330, margin=dict(l=0, r=10, t=30, b=0), title='Pipeline by stage', paper_bgcolor='rgba(0,0,0,0)',
                           plot_bgcolor='rgba(0,0,0,0)', font_color='#cbd5e1', yaxis_title=None, xaxis_title=None, xaxis=dict(showgrid=False, visible=False))
        fig2.update_traces(textposition='outside', marker_line_width=0)
        st.plotly_chart(fig2, width="stretch")
        if len(f):
            f2 = f.copy(); f2['origin'] = f2['country_or_note'].str.extract(r'^(Australia|UK|USA|Italy|Belfast|Currently)', expand=False).replace({'Belfast': 'UK', 'Currently': 'UK'}).fillna('Other / see note')
            oc = f2['origin'].value_counts().reset_index(); oc.columns = ['origin', 'n']
            fig3 = px.pie(oc, names='origin', values='n', hole=.62, color_discrete_sequence=['#22d3ee', '#818cf8', '#f472b6', '#fbbf24', '#64748b'])
            fig3.update_layout(height=200, margin=dict(l=0, r=0, t=26, b=0), title='By home country', paper_bgcolor='rgba(0,0,0,0)', font_color='#cbd5e1', legend=dict(orientation='v'))
            st.plotly_chart(fig3, width="stretch")
    st.markdown('##### Latest signals')
    if len(news):
        for _, n in news.sort_values('published_dt', ascending=False).head(5).iterrows():
            st.markdown(f"<div class='news' style='--c:#22d3ee'><a href='{n['url']}' target='_blank'>{n['title']}</a><div class='m'>{n['source']} · {str(n['published'])[:10]}</div></div>", unsafe_allow_html=True)
    else:
        st.markdown('<div class="note">No live news yet - the first scheduled refresh (or the ⟳ button) will populate this.</div>', unsafe_allow_html=True)

# ---------------- tab 2 ----------------
with tab2:
    st.caption(f'{len(f)} institutions')
    cols = st.columns(2)
    for i, (_, r) in enumerate(f.iterrows()):
        c = COLORS.get(r['stage'], '#64748b')
        rel = ''
        if len(news):
            iid = r['id']
            hits = news[news['institutions'].apply(lambda x: (iid in x) if isinstance(x, list) else False)]
            if len(hits): rel = f" · 📰 {len(hits)} mentions"
        with cols[i % 2]:
            st.markdown(f"""<div class="card"><h4>{r['name']}</h4>
<span class="pill" style="color:{c};border-color:{c}55;background:{c}15">{r['stage']}</span>
<span class="pill" style="color:#94a3b8;border-color:#33415588">QS 2027: {r['qs_2027'] or '–'}</span>
<div class="meta"><b>India:</b> {r['india_location'] or r['map_city'] or 'location not confirmed'} · <b>Launch:</b> {str(r['launch'])[:110] or '–'}{rel}<br>
<b>Evidence:</b> {r['stage_evidence']}</div></div>""", unsafe_allow_html=True)
            with st.expander('Details'):
                for lab, key in [('Programmes', 'courses'), ('Leadership', 'leadership'), ('Structure', 'ownership'), ('Partner', 'partner'), ('Service provider', 'service_provider'),
                                 ('Intake', 'intake'), ('Domain strength', 'domain'), ('Students', 'students'), ('Founded', 'founded')]:
                    if r.get(key): st.markdown(f"**{lab}:** {str(r[key])[:700]}")
                for u in (r.get('sources') or [])[:6]: st.markdown(f'- {u}')

# ---------------- tab 3 ----------------
with tab3:
    if not len(news):
        st.markdown('<div class="note">No articles stored yet. Trigger a refresh (sidebar) or wait for the scheduled job.</div>', unsafe_allow_html=True)
    else:
        e1, e2, e3 = st.columns(3)
        ev_all = sorted({e for l in news['events'] for e in l})
        ev = e1.multiselect('Event type', ev_all)
        src = e2.multiselect('Source', sorted(news['source'].unique()))
        who = e3.multiselect('Institution', sorted(df['id'])) if len(df) else []
        v = news.copy()
        if ev: v = v[v['events'].apply(lambda l: any(x in l for x in ev))]
        if src: v = v[v['source'].isin(src)]
        if who: v = v[v['institutions'].apply(lambda l: any(x in l for x in who))]
        st.caption(f'{len(v)} articles')
        for _, n in v.sort_values('published_dt', ascending=False).head(80).iterrows():
            tags = ''.join(f"<span class='tag'>{e}</span>" for e in n['events']) + ''.join(f"<span class='tag' style='background:#164e63'>{i} ({(n.get('matched_in') or {}).get(i, 'matched')})</span>" for i in n['institutions'])
            st.markdown(f"<div class='news' style='--c:#818cf8'><a href='{n['url']}' target='_blank'>{n['title']}</a><div style='margin-top:5px'>{tags}</div><div class='m'>{n['source']} · {str(n['published'])[:16].replace('T', ' ')}</div></div>", unsafe_allow_html=True)

# ---------------- tab 4 ----------------
with tab4:
    a, b = st.columns([1.2, 1])
    with a:
        st.markdown('##### Change log')
        if changes:
            for c in reversed(changes[-40:]):
                col = '#ef4444' if 'REMOVED' in c['type'] else '#22d3a6' if 'ADDED' in c['type'] else '#fbbf24'
                link = f" · <a href='{c['url']}' target='_blank'>source</a>" if c.get('url') else ''
                st.markdown(f"<div class='news' style='--c:{col}'><b>{c['type']}</b><br>{c['detail']}{link}<div class='m'>{c['at'][:16].replace('T', ' ')} UTC</div></div>", unsafe_allow_html=True)
        else:
            st.markdown('<div class="note">No changes detected yet. The first run only records a baseline; later runs flag campuses added to / removed from the UGC list and press items naming universities not on the watch-list.</div>', unsafe_allow_html=True)
    with b:
        st.markdown('##### Official UGC list (live)')
        if ugc_doc['rows']:
            st.dataframe(pd.DataFrame(ugc_doc['rows']), hide_index=True, width="stretch")
            st.caption(f"Fetched {ago(ugc_doc.get('fetched'))}")
        else:
            st.markdown('<div class="note">UGC list not fetched yet.</div>', unsafe_allow_html=True)
        st.markdown('##### Source health')
        for k, v in health.items():
            if k.startswith('_'): continue
            ok = v.get('ok'); st.markdown(f"{'🟢' if ok else '🔴'} **{k}** — {('%s items' % v.get('items')) if ok and v.get('items') is not None else v.get('error', 'ok')}")

# ---------------- tab 5 ----------------
with tab5:
    st.download_button('Download institutions (CSV)', f.drop(columns=['sources']).to_csv(index=False).encode(), 'fhei_institutions.csv', 'text/csv')
    if len(news): st.download_button('Download news (CSV)', news.drop(columns=['published_dt']).astype(str).to_csv(index=False).encode(), 'fhei_news.csv', 'text/csv')
    st.dataframe(f.drop(columns=['sources', 'lat', 'lon']), hide_index=True, width="stretch", height=420)
