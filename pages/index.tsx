import type { ChangeEvent, DragEvent, KeyboardEvent, FC } from 'react';
import type {
  Transaction, AnalyticsResult, BASDraft, QuarterlyBAS,
  QuarterlyGST, TaxDraftAU, TaxDraftCA, FinancialStatements,
  HealthStatus, ChatResponse, Country,
} from '@/types/index';

// Extend Window for Chart.js loaded via CDN script tag
declare global {
  interface Window {
    Chart: {
      new (ctx: HTMLCanvasElement, config: object): { destroy(): void };
    };
  }
}


import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Script from 'next/script';

const PAGE_TITLES = {
  dash:'Dashboard', tx:'Transactions', bank:'Banking',
  bas:'BAS & GST', tax:'Tax Estimates', fin:'Financial Statements',
  chat:'AI Assistant', mig:'Migration'
};
const PAGE_SUBS = {
  dash:'Financial overview', tx:'All imported transactions', bank:'Upload bank CSV exports',
  bas:'AU BAS & CA GST/HST', tax:'AU & CA tax estimates', fin:'P&L · Balance Sheet · Cash Flow',
  chat:'Ask questions about your finances', mig:'Import historical data'
};
const CAT_COLORS = {
  '200':'#D1FAE5,#065F46','201':'#D1FAE5,#065F46','202':'#DCFCE7,#166534',
  '400':'#FEF9C3,#713F12','401':'#DBEAFE,#1E40AF','402':'#EDE9FE,#4C1D95',
  '403':'#FCE7F3,#831843','404':'#E0F2FE,#0C4A6E','405':'#FEF3C7,#78350F',
  '406':'#F3F4F6,#374151','407':'#FFF7ED,#7C2D12','408':'#F0FDF4,#14532D',
  '409':'#FDF4FF,#581C87','410':'#FFF1F2,#881337','499':'#F3F4F6,#6B7280'
};

function fmt(v) { return Math.abs(parseFloat(v)||0).toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function catStyle(code) {
  const c = (CAT_COLORS[code]||'#F3F4F6,#6B7280').split(',');
  return {background:c[0],color:c[1],padding:'2px 8px',borderRadius:'20px',fontSize:'.7rem',fontWeight:500};
}

export default function PHLedger() {
  const [pg, setPg]       = useState('dash');
  const [ctry, setCtry]   = useState('ALL');
  const [health, setHealth]     = useState<any>({});
  const [an, setAn]             = useState<any>({});
  const [txs, setTxs]           = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [bnkF, setBnkF]         = useState('');
  const [bas, setBas]           = useState<any>({});
  const [basQ, setBasQ]         = useState<any[]>([]);
  const [gst, setGst]           = useState<any[]>([]);
  const [taxAU, setTaxAU]       = useState<any>({co:null,pe:null});
  const [taxCA, setTaxCA]       = useState<any>({co:null,pe:null});
  const [fin, setFin]           = useState<any>({});
  const [msgs, setMsgs]         = useState<any[]>([{role:'bot',text:'👋 Hi! I\'m your PHLedger assistant.\nType help to see all commands.'}]);
  const [ci, setCi]             = useState('');
  const [cloading, setCloading] = useState(false);
  const [bkAU, setBkAU]         = useState('anz');
  const [bkCA, setBkCA]         = useState('rbc');
  const [rAU, setRAU]           = useState('');
  const [rCA, setRCA]           = useState('');
  const [migD, setMigD]         = useState<any>(null);
  const [migR, setMigR]         = useState(false);
  const [toast, setToast]       = useState<any>({show:false,msg:'',ty:'success'});
  const [dragAU, setDragAU]     = useState(false);
  const [dragCA, setDragCA]     = useState(false);
  const fAU = useRef(null), fCA = useRef(null), chatBox = useRef(null);
  const charts = useRef({});

  const api = useCallback(async (url) => {
    const r = await fetch(url); return r.json();
  }, []);

  const showToast = useCallback((msg, ty='success') => {
    setToast({show:true,msg,ty});
    setTimeout(()=>setToast(t=>({...t,show:false})), 4000);
  }, []);

  const loadAn = useCallback(async () => {
    const q = ctry !== 'ALL' ? `?country=${ctry}` : '';
    try { setAn(await api(`/api/analytics${q}`)); } catch {}
  }, [api, ctry]);

  const loadTx = useCallback(async () => {
    const q = ctry !== 'ALL' ? `?country=${ctry}&limit=500` : '?limit=500';
    try { setTxs(await api(`/api/transactions${q}`)); } catch {}
  }, [api, ctry]);

  const loadBAS = useCallback(async () => {
    try { setBas(await api('/api/bas')); } catch {}
    try { const h = await api('/api/gst/annual'); setGst(h.quarters||[]); } catch {}
    const now = new Date(); const fy = now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;
    try { const r = await api(`/api/bas/quarterly?year=${fy}`); setBasQ(r.quarters||[]); } catch {}
  }, [api]);

  const loadTax = useCallback(async () => {
    try { const co = await api('/api/tax/au/company');  setTaxAU(t=>({...t,co})); } catch {}
    try { const pe = await api('/api/tax/au/personal'); setTaxAU(t=>({...t,pe})); } catch {}
    try { const co = await api('/api/tax/ca/corporate'); setTaxCA(t=>({...t,co})); } catch {}
    try { const pe = await api('/api/tax/ca/personal');  setTaxCA(t=>({...t,pe})); } catch {}
  }, [api]);

  const loadFin = useCallback(async () => {
    const q = ctry !== 'ALL' ? `?country=${ctry}` : '';
    try { setFin(await api(`/api/financial-statements${q}`)); } catch {}
  }, [api, ctry]);

  useEffect(() => {
    api('/api/health').then(setHealth).catch(()=>{});
    loadTx(); loadAn();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Chart) return;
    drawIE();
  }, [an]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Chart || !fin.profit_loss) return;
    drawPL();
  }, [fin]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Chart || !basQ.length) return;
    drawBAS();
  }, [basQ]);

  function drawChart(id, config) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (charts.current[id]) charts.current[id].destroy();
    charts.current[id] = new window.Chart(ctx, config);
  }

  function drawIE() {
    const inc = an.total_income||0, exp = an.total_expenses||0;
    drawChart('chartIE', { type:'bar',
      data:{labels:['Q1','Q2','Q3','Q4'], datasets:[
        {label:'Income',   data:[inc*.22,inc*.28,inc*.25,inc*.25], backgroundColor:'rgba(0,134,58,.8)',  borderRadius:4},
        {label:'Expenses', data:[exp*.24,exp*.26,exp*.27,exp*.23], backgroundColor:'rgba(239,68,68,.7)', borderRadius:4}
      ]},
      options:{responsive:true,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true,ticks:{callback:v=>'$'+v.toLocaleString()}}}}
    });
    drawChart('chartCat', { type:'doughnut',
      data:{labels:['Software','Travel','Meals','Rent','Utilities','Other'],
        datasets:[{data:[20,15,12,25,8,20],backgroundColor:['#3B82F6','#8B5CF6','#F59E0B','#EF4444','#10B981','#6B7280'],borderWidth:2,borderColor:'#fff'}]},
      options:{responsive:true,plugins:{legend:{position:'bottom',labels:{font:{size:10}}}},cutout:'62%'}
    });
  }

  function drawBAS() {
    drawChart('chartBAS', { type:'bar',
      data:{labels:basQ.map(q=>`Q${q.quarter} ${q.label}`), datasets:[
        {label:'GST on Sales (1A)',     data:basQ.map(q=>q.gst_on_sales_1a),       backgroundColor:'rgba(0,134,58,.8)',   borderRadius:4},
        {label:'GST on Purchases (1B)', data:basQ.map(q=>q.gst_on_purchases_1b),   backgroundColor:'rgba(239,68,68,.7)',  borderRadius:4},
        {label:'Net GST',               data:basQ.map(q=>q.net_gst_payable),        backgroundColor:'rgba(12,133,153,.8)', borderRadius:4, type:'line'}
      ]},
      options:{responsive:true,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true,ticks:{callback:v=>'$'+v.toLocaleString()}}}}
    });
  }

  function drawPL() {
    const pl = fin.profit_loss||{};
    drawChart('chartPL', { type:'bar',
      data:{labels:['Revenue','Expenses','Net Income'],
        datasets:[{data:[pl.revenue||0,pl.expenses||0,pl.net_income||0],
          backgroundColor:['rgba(0,134,58,.8)','rgba(239,68,68,.8)',(pl.net_income||0)>=0?'rgba(12,133,153,.8)':'rgba(239,68,68,.8)'],
          borderRadius:6}]},
      options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>'$'+v.toLocaleString()}}}}
    });
  }

  async function go(p) {
    setPg(p);
    if (p==='tx')   loadTx();
    if (p==='bas')  loadBAS();
    if (p==='tax')  loadTax();
    if (p==='fin')  loadFin();
    if (p==='mig')  { try { setMigD(await api('/api/migrate')); } catch {} }
  }

  async function refresh() { await loadAn(); await loadTx(); }

  async function handleUpload(e, bank, side) {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('bank', bank); fd.append('file', file);
    try {
      const r = await fetch('/api/upload', {method:'POST', body:fd});
      const d = await r.json();
      const msg = d.error ? d.error : `✓ ${d.count} transactions from ${bank.toUpperCase()}`;
      if (side==='AU') setRAU(msg); else setRCA(msg);
      showToast(msg, d.error?'danger':'success');
      if (!d.error) { loadTx(); loadAn(); }
    } catch { showToast('Upload failed','danger'); }
  }

  async function handleDrop(e, side) {
    e.preventDefault(); setDragAU(false); setDragCA(false);
    const file = e.dataTransfer.files[0]; if (!file) return;
    const bank = side==='AU' ? bkAU : bkCA;
    const fd = new FormData(); fd.append('bank', bank); fd.append('file', file);
    const r = await fetch('/api/upload', {method:'POST', body:fd});
    const d = await r.json();
    const msg = d.error ? d.error : `✓ ${d.count} transactions from ${bank.toUpperCase()}`;
    if (side==='AU') setRAU(msg); else setRCA(msg);
    showToast(msg, d.error?'danger':'success');
  }

  async function sendChat() {
    if (!ci.trim()) return;
    const m = ci.trim(); setCi(''); setCloading(true);
    setMsgs(ms=>[...ms,{role:'user',text:m}]);
    try {
      const r = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m})});
      const d = await r.json();
      setMsgs(ms=>[...ms,{role:'bot',text:d.message}]);
      // Handle server-side actions returned by chat agent
      if (d.action === 'migrate') {
        setMsgs(ms=>[...ms,{role:'bot',text:'Starting migration...'}]);
        await runMigration();
        setMsgs(ms=>[...ms,{role:'bot',text:'✅ Migration complete! Check the Migrate tab for details.'}]);
      } else if (d.action === 'sync_supabase') {
        setMsgs(ms=>[...ms,{role:'bot',text:'Uploading to Supabase...'}]);
        try {
          const sr = await fetch('/api/migrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target:'supabase'})});
          const sd = await sr.json();
          setMsgs(ms=>[...ms,{role:'bot',text:`✅ Supabase sync complete: ${sd.total_transactions ?? 0} transactions uploaded.`}]);
        } catch { setMsgs(ms=>[...ms,{role:'bot',text:'❌ Supabase sync failed. Check SUPABASE_URL and SUPABASE_KEY env vars.'}]); }
      }
    } catch { setMsgs(ms=>[...ms,{role:'bot',text:'Error connecting to server.'}]); }
    setCloading(false);
    setTimeout(()=>{ if(chatBox.current) chatBox.current.scrollTop=chatBox.current.scrollHeight; },100);
  }

  async function runMigration(reset=false) {
    setMigR(true);
    try { const r = await fetch(`/api/migrate?reset=${reset}`,{method:'POST'}); setMigD(await r.json()); showToast('Migration complete!','success'); }
    catch { showToast('Migration failed','danger'); }
    setMigR(false);
  }

  const fy = () => { const n=new Date(); return n.getMonth()>=6?n.getFullYear():n.getFullYear()-1; };
  const filtTx = () => txs.filter(t => (!search||t.description.toLowerCase().includes(search.toLowerCase())) && (!bnkF||t.bank===bnkF));

  return (
    <>
      <Head>
        <title>PHLedger — Free Bookkeeping for AU &amp; CA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
      </Head>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js" strategy="afterInteractive"/>

      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="sb-logo">
          <div className="brand">PH<span>Ledger</span></div>
          <div className="tag">Free bookkeeping · AU &amp; CA</div>
        </div>
        <div className="sb-nav mt-1">
          <div className="nav-lbl">Main</div>
          {[['dash','grid-1x2-fill','Dashboard'],['tx','list-ul','Transactions'],['bank','bank2','Banking']].map(([p,ic,lb])=>(
            <a key={p} href="#" className={pg===p?'active':''} onClick={e=>{e.preventDefault();go(p);}}>
              <i className={`bi bi-${ic}`}/>{lb}
            </a>
          ))}
          <div className="nav-lbl">Reports</div>
          {[['bas','file-earmark-text','BAS / GST'],['tax','receipt','Tax Estimates'],['fin','bar-chart-line','Financials']].map(([p,ic,lb])=>(
            <a key={p} href="#" className={pg===p?'active':''} onClick={e=>{e.preventDefault();go(p);}}>
              <i className={`bi bi-${ic}`}/>{lb}
            </a>
          ))}
          <div className="nav-lbl">Tools</div>
          {[['chat','chat-dots','AI Assistant'],['mig','arrow-repeat','Migration']].map(([p,ic,lb])=>(
            <a key={p} href="#" className={pg===p?'active':''} onClick={e=>{e.preventDefault();go(p);}}>
              <i className={`bi bi-${ic}`}/>{lb}
            </a>
          ))}
        </div>
        <div className="sb-bot">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <span className="sb-badge" style={{textTransform:'uppercase'}}>{health.backend||'csv'}</span>
            <span className="sb-badge" style={{color:health.status==='ok'?'#4ade80':'#f87171',letterSpacing:0}}>
              {health.status==='ok'?'● live':'○ offline'}
            </span>
          </div>
          <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.2)',marginTop:5,letterSpacing:'.3px'}}>v{health.version||'2.0'}</div>
        </div>
      </nav>

      {/* MAIN */}
      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-t">{PAGE_TITLES[pg]||'PHLedger'}</div>
            <div className="topbar-s">{PAGE_SUBS[pg]||''}</div>
          </div>
          <div className="topbar-right">
            <div className="btn-group btn-group-sm">
              {[['AU','ct-au','🇦🇺'],['CA','ct-ca','🇨🇦'],['ALL','ct-all','🌐']].map(([c,cls,flag])=>(
                <button key={c} className={`btn btn-outline-secondary${ctry===c?' '+cls:''}`}
                  style={{fontSize:'.75rem',fontWeight:600,padding:'4px 10px'}}
                  onClick={()=>{ setCtry(c); setTimeout(refresh,50); }}>
                  {flag} {c}
                </button>
              ))}
            </div>
            <button className="btn-x pri" onClick={()=>go('bank')}>
              <i className="bi bi-upload"/>Upload CSV
            </button>
          </div>
        </div>

        <div className="pb">

          {/* ── DASHBOARD ── */}
          {pg==='dash' && (
            <div>
              {/* Xero-style summary strip */}
              <div className="stat-strip mb-4">
                <div className="ss-item"><div className="ss-val pos">${fmt(an.total_income)}</div><div className="ss-lbl">Total Income</div></div>
                <div className="ss-item"><div className="ss-val neg">${fmt(an.total_expenses)}</div><div className="ss-lbl">Total Expenses</div></div>
                <div className="ss-item"><div className={`ss-val ${(an.net||0)>=0?'pos':'neg'}`}>${fmt(an.net)}</div><div className="ss-lbl">Net Profit</div></div>
                <div className="ss-item"><div className="ss-val">{(an.total_transactions||0).toLocaleString()}</div><div className="ss-lbl">Transactions</div></div>
              </div>
              <div className="row g-3 mb-4">
                {[
                  ['inc','arrow-up-circle','Total Income',fmt(an.total_income),ctry!=='ALL'?ctry:'Combined'],
                  ['exp','arrow-down-circle','Total Expenses',fmt(an.total_expenses),ctry!=='ALL'?ctry:'Combined'],
                  ['net','graph-up','Net Profit',(an.net||0)>=0?fmt(an.net):'-'+fmt(an.net),'Before tax'],
                  ['cnt','receipt-cutoff','Transactions',(an.total_transactions||0).toLocaleString(),'All time'],
                ].map(([cls,ic,lbl,val,sub])=>(
                  <div key={cls} className="col-6 col-xl-3">
                    <div className={`kpi ${cls}`}>
                      <i className={`bi bi-${ic} ico`}/>
                      <div className="lbl">{lbl}</div>
                      <div className={`val${cls==='net'?(an.net||0)>=0?' pos':' neg':''}`}>{val}</div>
                      <div className="sub">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="row g-3 mb-4">
                <div className="col-lg-8">
                  <div className="cs">
                    <div className="cs-h"><h6><i className="bi bi-bar-chart me-2 text-primary"/>Income vs Expenses</h6><span className="pill neu">{ctry}</span></div>
                    <div className="cs-b"><canvas id="chartIE" height={190}/></div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="cs h-100">
                    <div className="cs-h"><h6><i className="bi bi-pie-chart me-2 text-warning"/>Expense Categories</h6></div>
                    <div className="cs-b d-flex justify-content-center align-items-center"><div style={{width:195}}><canvas id="chartCat"/></div></div>
                  </div>
                </div>
              </div>
              <div className="cs">
                <div className="cs-h"><h6><i className="bi bi-clock-history me-2"/>Recent Transactions</h6>
                  <a href="#" className="text-primary" style={{fontSize:'.8rem'}} onClick={e=>{e.preventDefault();go('tx');}}>View all →</a>
                </div>
                <div className="cs-b p-0">
                  <table className="tx-tbl">
                    <thead><tr><th className="ps-3">Date</th><th>Description</th><th>Bank</th><th>Category</th><th className="pe-3" style={{textAlign:'right'}}>Amount</th></tr></thead>
                    <tbody>
                      {txs.slice(0,8).map(t=>(
                        <tr key={t.id}>
                          <td className="ps-3 text-muted">{t.date}</td>
                          <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.description}</td>
                          <td><span className="badge rounded-pill bg-light text-dark" style={{fontSize:'.67rem',textTransform:'uppercase'}}>{t.bank||'—'}</span></td>
                          <td><span style={catStyle(t.account_code)}>{t.category||'—'}</span></td>
                          <td className={`pe-3 ${t.amount>0?'pos':'neg'}`} style={{textAlign:'right'}}>{t.amount>0?'+':''}{fmt(t.amount)}</td>
                        </tr>
                      ))}
                      {!txs.length && <tr><td colSpan={5} className="text-center text-muted py-4" style={{fontSize:'.85rem'}}>No transactions — upload a CSV to get started</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TRANSACTIONS ── */}
          {pg==='tx' && (
            <div className="cs">
              <div className="cs-h">
                <h6>All Transactions ({filtTx().length})</h6>
                <div className="d-flex gap-2">
                  <input className="form-control form-control-sm" placeholder="Search..." value={search} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} style={{width:170}}/>
                  <select className="form-select form-select-sm" value={bnkF} onChange={(e: ChangeEvent<HTMLSelectElement>) => setBnkF(e.target.value)} style={{width:130}}>
                    <option value="">All Banks</option>
                    {['anz','nab','cba','westpac','rbc','td','bmo','scotiabank','cibc'].map(b=><option key={b} value={b}>{b.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="cs-b p-0">
                <table className="tx-tbl">
                  <thead><tr><th className="ps-3">Date</th><th>Description</th><th>Bank</th><th>Category</th><th>Code</th><th>Tax</th><th style={{textAlign:'right'}} className="pe-3">Amount</th></tr></thead>
                  <tbody>
                    {filtTx().map(t=>(
                      <tr key={t.id}>
                        <td className="ps-3 text-muted">{t.date}</td>
                        <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.description}</td>
                        <td><span className="badge rounded-pill bg-light text-dark" style={{fontSize:'.67rem',textTransform:'uppercase'}}>{t.bank||'—'}</span></td>
                        <td><span style={catStyle(t.account_code)}>{t.category||'—'}</span></td>
                        <td className="text-muted">{t.account_code}</td>
                        <td className="text-muted" style={{fontSize:'.75rem'}}>{t.tax_code}</td>
                        <td className={`pe-3 ${t.amount>0?'pos':'neg'}`} style={{textAlign:'right'}}>{t.amount>0?'+':''}{fmt(t.amount)}</td>
                      </tr>
                    ))}
                    {!filtTx().length && <tr><td colSpan={7} className="text-center text-muted py-4">No transactions match your filter</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BANKING ── */}
          {pg==='bank' && (
            <div>
              <div className="row g-4 mb-4">
                {[
                  {side:'AU',flag:'🇦🇺',title:'Australian Banks',banks:['anz','nab','cba','westpac'],names:['ANZ','NAB','Commonwealth Bank','Westpac'],sel:bkAU,setSel:setBkAU,drag:dragAU,setDrag:setDragAU,ref:fAU,res:rAU,color:'var(--au)'},
                  {side:'CA',flag:'🇨🇦',title:'Canadian Banks', banks:['rbc','td','bmo','scotiabank','cibc'],names:['RBC Royal Bank','TD Bank','BMO','Scotiabank','CIBC'],sel:bkCA,setSel:setBkCA,drag:dragCA,setDrag:setDragCA,ref:fCA,res:rCA,color:'var(--ca)'}
                ].map(({side,flag,title,banks,names,sel,setSel,drag,setDrag,ref,res,color})=>(
                  <div key={side} className="col-md-6">
                    <div className="cs">
                      <div className="cs-h" style={{borderLeft:`4px solid ${color}`}}><h6>{flag} {title} — Upload CSV</h6></div>
                      <div className="cs-b">
                        <select className="form-select form-select-sm mb-3" value={sel} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSel(e.target.value)}>
                          {banks.map((b,i)=><option key={b} value={b}>{names[i]}</option>)}
                        </select>
                        <div className={`uz${drag?' over':''}`}
                          onDragOver={e=>{e.preventDefault();setDrag(true);}}
                          onDragLeave={()=>setDrag(false)}
                          onDrop={e=>handleDrop(e,side)}
                          onClick={()=>ref.current?.click()}>
                          <i className="bi bi-cloud-arrow-up"/>
                          <span className="uz-title">Drag &amp; drop or click to browse</span>
                          <span className="uz-sub">Supports ANZ, NAB, CBA, Westpac, RBC, TD, BMO, Scotiabank, CIBC</span>
                          <input type="file" ref={ref} className="d-none" accept=".csv" onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpload(e, sel, side)}/>
                        </div>
                        {res && <div className="mt-3 p-3 rounded" style={{background:side==='AU'?'#F0FDF4':'#FFF1F2',border:`1px solid ${side==='AU'?'#BBF7D0':'#FECDD3'}`,fontSize:'.8rem'}}>
                          <i className={`bi bi-check-circle-fill me-1`} style={{color}}/>{res}
                        </div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cs">
                <div className="cs-h"><h6><i className="bi bi-info-circle me-2 text-primary"/>How to Export CSV from Your Bank</h6></div>
                <div className="cs-b">
                  <div className="row g-3" style={{fontSize:'.82rem'}}>
                    {[['🇦🇺 ANZ','Internet Banking → Account → Transactions → Export → CSV'],['🇦🇺 NAB','NAB Connect → Transactions → Download → CSV'],['🇦🇺 CBA','NetBank → View Transactions → Export → CSV'],['🇦🇺 Westpac','Online Banking → Account Activity → Export → CSV'],['🇨🇦 RBC','Online Banking → Account → Download Transactions → CSV'],['🇨🇦 TD','EasyWeb → Accounts → Download → Spreadsheet (CSV)'],['🇨🇦 BMO','Online Banking → Accounts → Download Transactions → CSV'],['🇨🇦 Scotiabank','Scotia OnLine → Account Activity → Download → CSV']].map(([b,t])=>(
                      <div key={b} className="col-md-6"><strong>{b}:</strong> {t}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BAS/GST ── */}
          {pg==='bas' && (
            <div>
              <div className="row g-4">
                {ctry!=='CA' && (
                  <div className="col-md-6">
                    <div className="cs">
                      <div className="cs-h" style={{borderLeft:'4px solid var(--au)'}}><h6>🇦🇺 AU — BAS Draft</h6></div>
                      <div className="cs-b">
                        {[['G1 — Total Sales',fmt(bas.g1_total_sales),'pos'],['G11 — Non-Capital Purchases',fmt(bas.g11_non_capital_purchases),'neg'],['1A — GST on Sales',fmt(bas.gst_on_sales_1a),''],['1B — GST on Purchases (credit)',fmt(bas.gst_on_purchases_1b),'']].map(([l,v,c])=>(
                          <div key={l} className="rm"><span className="rl">{l}</span><span className={`rv ${c}`}>${v}</span></div>
                        ))}
                        <div className="rm" style={{borderTop:'2px solid var(--bd)',paddingTop:12,marginTop:4}}>
                          <span className="rl fw-semibold" style={{color:'#111'}}>Net GST Payable to ATO</span>
                          <span className={`fw-bold fs-5 ${(bas.net_gst_payable||0)>0?'neg':'pos'}`}>${fmt(bas.net_gst_payable)}</span>
                        </div>
                        <div className="mt-3 text-muted" style={{fontSize:'.76rem'}}>📌 Quarterly BAS due: 28 Oct · 28 Feb · 28 Apr · 28 Jul</div>
                      </div>
                    </div>
                  </div>
                )}
                {ctry!=='AU' && (
                  <div className="col-md-6">
                    <div className="cs">
                      <div className="cs-h" style={{borderLeft:'4px solid var(--ca)'}}><h6>🇨🇦 CA — GST/HST Quarterly</h6></div>
                      <div className="cs-b">
                        {gst.map(q=>(
                          <div key={q.quarter} className="rm">
                            <span className="rl">Q{q.quarter} {q.year}</span>
                            <span className="d-flex gap-2" style={{fontSize:'.82rem'}}>
                              <span className="text-success">Coll: ${fmt(q.gst_collected)}</span>
                              <span className="text-danger">Paid: ${fmt(q.gst_paid)}</span>
                              <span className={`fw-semibold ${(q.net_gst||0)>0?'neg':'pos'}`}>Net: ${fmt(q.net_gst)}</span>
                            </span>
                          </div>
                        ))}
                        {!gst.length && <div className="text-muted text-center py-3" style={{fontSize:'.84rem'}}>No CA transactions loaded</div>}
                        <div className="mt-3 text-muted" style={{fontSize:'.76rem'}}>📌 CRA GST/HST due: Apr 30 · Jul 31 · Oct 31 · Jan 31</div>
                      </div>
                    </div>
                  </div>
                )}
                {ctry!=='CA' && basQ.length > 0 && (
                  <div className="col-12">
                    <div className="cs">
                      <div className="cs-h"><h6>🇦🇺 Quarterly BAS — FY{fy()}-{String(fy()+1).slice(2)}</h6></div>
                      <div className="cs-b"><canvas id="chartBAS" height={100}/></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAX ── */}
          {pg==='tax' && (
            <div className="row g-4">
              {ctry!=='CA' && (
                <div className="col-md-6">
                  <div className="cs mb-3">
                    <div className="cs-h" style={{borderLeft:'4px solid var(--au)'}}><h6>🇦🇺 AU Company Tax — 25% SBD Rate</h6></div>
                    <div className="cs-b">
                      {taxAU.co && <><div className="rm"><span className="rl">Taxable Income</span><span className="rv">${fmt(taxAU.co.taxable_income)}</span></div>
                      <div className="rm"><span className="rl fw-semibold" style={{color:'#111'}}>Tax Payable</span><span className="rv neg fw-bold">${fmt(taxAU.co.tax_payable)}</span></div>
                      <div className="mt-2 text-muted" style={{fontSize:'.76rem'}}>{(taxAU.co.notes||[]).join(' · ')}</div></>}
                    </div>
                  </div>
                  <div className="cs">
                    <div className="cs-h" style={{borderLeft:'4px solid #059669'}}><h6>🇦🇺 AU Personal Tax — 2024-25 Stage 3</h6></div>
                    <div className="cs-b">
                      {taxAU.pe && <><div className="rm"><span className="rl">Taxable Income</span><span className="rv">${fmt(taxAU.pe.taxable_income)}</span></div>
                      <div className="rm"><span className="rl">Income Tax</span><span className="rv neg">${fmt(taxAU.pe.tax_payable)}</span></div>
                      <div className="rm"><span className="rl">Medicare Levy (2%)</span><span className="rv neg">${fmt(taxAU.pe.medicare_levy)}</span></div>
                      <div className="rm"><span className="rl fw-semibold" style={{color:'#111'}}>Total Liability</span><span className="rv neg fw-bold">${fmt((taxAU.pe.tax_payable||0)+(taxAU.pe.medicare_levy||0))}</span></div>
                      <div className="mt-2 text-muted" style={{fontSize:'.76rem'}}>{(taxAU.pe.notes||[]).join(' · ')}</div></>}
                    </div>
                  </div>
                </div>
              )}
              {ctry!=='AU' && (
                <div className="col-md-6">
                  <div className="cs mb-3">
                    <div className="cs-h" style={{borderLeft:'4px solid var(--ca)'}}><h6>🇨🇦 CA Corporate Tax — 9% SBD Federal</h6></div>
                    <div className="cs-b">
                      {taxCA.co && <><div className="rm"><span className="rl">Taxable Income</span><span className="rv">${fmt(taxCA.co.taxable_income)}</span></div>
                      <div className="rm"><span className="rl">Federal Tax (9%)</span><span className="rv">${fmt(taxCA.co.federal_tax)}</span></div>
                      <div className="rm"><span className="rl">Provincial (~8%)</span><span className="rv">${fmt(taxCA.co.provincial_tax)}</span></div>
                      <div className="rm"><span className="rl fw-semibold" style={{color:'#111'}}>Total Tax</span><span className="rv neg fw-bold">${fmt(taxCA.co.total_tax)}</span></div>
                      <div className="mt-2 text-muted" style={{fontSize:'.76rem'}}>{(taxCA.co.notes||[]).join(' · ')}</div></>}
                    </div>
                  </div>
                  <div className="cs">
                    <div className="cs-h" style={{borderLeft:'4px solid #DC2626'}}><h6>🇨🇦 CA Personal Tax — 2024 Brackets + BPA</h6></div>
                    <div className="cs-b">
                      {taxCA.pe && <><div className="rm"><span className="rl">Taxable Income</span><span className="rv">${fmt(taxCA.pe.taxable_income)}</span></div>
                      <div className="rm"><span className="rl">Federal Tax</span><span className="rv neg">${fmt(taxCA.pe.federal_tax)}</span></div>
                      <div className="rm"><span className="rl">Provincial</span><span className="rv neg">${fmt(taxCA.pe.provincial_tax)}</span></div>
                      <div className="rm"><span className="rl fw-semibold" style={{color:'#111'}}>Total Tax</span><span className="rv neg fw-bold">${fmt(taxCA.pe.total_tax)}</span></div>
                      <div className="mt-2 text-muted" style={{fontSize:'.76rem'}}>{(taxCA.pe.notes||[]).join(' · ')}</div></>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FINANCIALS ── */}
          {pg==='fin' && (
            <div>
              <div className="row g-4 mb-4">
                {[
                  {ic:'graph-up-arrow text-success',title:'Profit & Loss',rows:[['Revenue',fmt(fin.profit_loss?.revenue),'pos'],['Expenses',fmt(fin.profit_loss?.expenses),'neg'],['Net Income',fmt(fin.profit_loss?.net_income),(fin.profit_loss?.net_income||0)>=0?'pos fw-bold':'neg fw-bold']]},
                  {ic:'building text-primary',title:'Balance Sheet',rows:[['Cash at Bank',fmt(fin.balance_sheet?.assets?.cash),''],['Total Liabilities','0.00','text-muted'],['Retained Earnings',fmt(fin.balance_sheet?.equity?.retained_earnings),(fin.balance_sheet?.equity?.retained_earnings||0)>=0?'pos fw-bold':'neg fw-bold']]},
                  {ic:'cash-stack text-warning',title:'Cash Flow',rows:[['Operating',fmt(fin.cash_flow?.operating),(fin.cash_flow?.operating||0)>=0?'pos':'neg'],['Investing','0.00','text-muted'],['Financing','0.00','text-muted'],['Net Change',fmt(fin.cash_flow?.net_change),(fin.cash_flow?.net_change||0)>=0?'pos fw-bold':'neg fw-bold']]},
                ].map(({ic,title,rows})=>(
                  <div key={title} className="col-md-4">
                    <div className="cs">
                      <div className="cs-h"><h6><i className={`bi bi-${ic} me-2`}/>{title}</h6></div>
                      <div className="cs-b">
                        {rows.map(([l,v,c])=><div key={l} className="rm"><span className="rl">{l}</span><span className={`rv ${c}`}>${v}</span></div>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cs">
                <div className="cs-h"><h6><i className="bi bi-bar-chart me-2"/>P&amp;L Summary</h6><span className="pill neu">{ctry}</span></div>
                <div className="cs-b"><canvas id="chartPL" height={90}/></div>
              </div>
            </div>
          )}

          {/* ── CHAT ── */}
          {pg==='chat' && (
            <div className="cs" style={{maxWidth:680}}>
              <div className="cs-h"><h6><i className="bi bi-robot me-2 text-primary"/>PHLedger AI Assistant</h6><span className="pill neu" style={{fontSize:'.69rem'}}>type &#39;help&#39; for commands</span></div>
              <div className="cs-b">
                <div className="chat-box" ref={chatBox}>
                  {msgs.map((m,i)=><div key={i} className={`cb ${m.role}`}>{m.text}</div>)}
                </div>
                <div className="d-flex gap-2 mt-3">
                  <input className="form-control" placeholder="Try: 'au p&l', 'bas', 'status', 'help'" value={ci} onChange={(e: ChangeEvent<HTMLInputElement>) => setCi(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendChat()}/>
                  <button className="btn-x pri px-4" onClick={sendChat} disabled={cloading}>
                    {cloading ? <span className="spinner-border" style={{width:'1rem',height:'1rem'}}/> : <i className="bi bi-send-fill"/>}
                  </button>
                </div>
                <div className="mt-3 d-flex flex-wrap gap-2">
                  {['help','status','migrate','au p&l','ca p&l','bas','quarterly bas','au company tax'].map(cmd=>(
                    <button key={cmd} className="btn-x sec" onClick={()=>{setCi(cmd);setTimeout(sendChat,50);}}>{cmd}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MIGRATION ── */}
          {pg==='mig' && (
            <div className="cs" style={{maxWidth:600}}>
              <div className="cs-h"><h6><i className="bi bi-arrow-repeat me-2 text-primary"/>Historical Data Migration</h6></div>
              <div className="cs-b">
                <p className="text-muted" style={{fontSize:'.875rem'}}>Ingest all historical CSVs from <code>bank_data/</code>, auto-categorise, and generate summary reports.</p>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <button className="btn-x pri" onClick={()=>runMigration(false)} disabled={migR}>
                    {migR ? <><span className="spinner-border" style={{width:'.8rem',height:'.8rem',borderWidth:'2px'}}/>&nbsp;Running...</> : <><i className="bi bi-play-fill"/>Run Migration</>}
                  </button>
                  <button className="btn-x sec" onClick={()=>runMigration(true)} disabled={migR}><i className="bi bi-arrow-counterclockwise"/>Reset &amp; Rerun</button>
                </div>
                {migD && migD.total_transactions > 0 && (
                  <div style={{background:'var(--success-lt)',border:'1px solid #a7f3d0',borderRadius:'var(--radius)',padding:'14px 16px',fontSize:'.82rem'}}>
                    <div style={{fontWeight:700,color:'var(--success)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                      <i className="bi bi-check-circle-fill"/>&nbsp;Migration complete
                    </div>
                    <div className="stat-strip" style={{marginBottom:10}}>
                      <div className="ss-item"><div className="ss-val">{migD.total_transactions?.toLocaleString()}</div><div className="ss-lbl">Transactions</div></div>
                      <div className="ss-item"><div className="ss-val" style={{color:'var(--au)'}}>${fmt(migD.total_income_aud)}</div><div className="ss-lbl">AU Income</div></div>
                      <div className="ss-item"><div className="ss-val" style={{color:'var(--danger)'}}>${fmt(migD.total_expenses_aud)}</div><div className="ss-lbl">AU Expenses</div></div>
                    </div>
                    <div style={{color:'var(--tx-3)',fontSize:'.75rem'}}>Period: {migD.date_range?.from} → {migD.date_range?.to}</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* TOAST */}
      {toast.show && (
        <div className="toast-wrap">
          <div className={`toast show text-bg-${toast.ty}`} style={{minWidth:260}}>
            <div className="d-flex"><div className="toast-body">{toast.msg}</div>
              <button className={`btn-close me-2 m-auto${toast.ty==='light'?'':' btn-close-white'}`} onClick={()=>setToast(t=>({...t,show:false}))}/>
            </div>
          </div>
        </div>
      )}
    </>
  );
}