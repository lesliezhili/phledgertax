import Layout from '../components/Layout';
import Head from'next/head';
export default function About(){return(<><Head><title>About — PHLedger</title></Head>
<Layout>
<main style={{maxWidth:760,margin:'0 auto',padding:'48px 20px'}}>
<h1 style={{fontSize:'2rem',color:'#1e3a5f',marginBottom:8}}>About PHLedger</h1>
<p style={{fontSize:'1rem',color:'#374151',lineHeight:1.8,marginBottom:20}}>PHLedger is an intelligent finance platform purpose-built for Australian and Canadian small-to-medium businesses. We replace fragmented, expensive tools — bookkeeping (Xero/MYOB), payments (Stripe), and tax prep — with a single, modern platform powered by AI and real-time payment rails.</p>
<div style={{background:'white',borderRadius:12,padding:'28px',boxShadow:'0 2px 12px rgba(0,0,0,.05)',marginBottom:24}}>
<h2 style={{fontSize:'1.2rem',color:'#1e3a5f',margin:'0 0 12px'}}>Platform</h2>
<ul style={{color:'#374151',lineHeight:2.2,paddingLeft:20,margin:0}}>
<li><b>Double-entry bookkeeping engine</b> — GST (AU) and HST/GST (CA) compliant</li>
<li><b>BAS generation</b> — Quarterly, ATO-ready (G1, G11, 1A, 1B)</li>
<li><b>Annual tax returns</b> — AU company tax (25%) and CA T2 (9% SBD)</li>
<li><b>Real-time payments</b> — PayTo NPP (AU, $0/tx) and Interac (CA, $0.25/tx)</li>
<li><b>AI Finance Agent</b> — Natural language queries, 80+ intent patterns</li>
<li><b>Bank feed ingestion</b> — ANZ, RBC, and 7 more banks supported</li>
<li><b>Cash flow forecasting</b> — 3-month forward projections</li>
<li><b>Multi-entity</b> — AU + CA from one dashboard</li>
</ul></div>
<div style={{background:'white',borderRadius:12,padding:'28px',boxShadow:'0 2px 12px rgba(0,0,0,.05)',marginBottom:24}}>
<h2 style={{fontSize:'1.2rem',color:'#1e3a5f',margin:'0 0 12px'}}>Powered by PHLedger</h2>
<p style={{color:'#374151',lineHeight:1.7,margin:'0 0 12px'}}>These platforms run on PHLedger's finance infrastructure:</p>
<div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
<div style={{flex:1,minWidth:200,padding:14,background:'#f0fdf4',borderRadius:8,border:'1px solid #bbf7d0'}}>
<b style={{color:'#166534'}}>SilverConnect</b><br/><span style={{fontSize:'.78rem',color:'#374151'}}>Healthcare marketplace — provider payouts, platform fees, GST invoicing</span></div>
<div style={{flex:1,minWidth:200,padding:14,background:'#eff6ff',borderRadius:8,border:'1px solid #bfdbfe'}}>
<b style={{color:'#1e40af'}}>PHLedger Tax</b><br/><span style={{fontSize:'.78rem',color:'#374151'}}>Internal — PHLedger company bookkeeping and compliance (zhili@phledger.com)</span></div>
</div></div>
<div style={{background:'white',borderRadius:12,padding:'28px',boxShadow:'0 2px 12px rgba(0,0,0,.05)',marginBottom:24}}>
<h2 style={{fontSize:'1.2rem',color:'#1e3a5f',margin:'0 0 12px'}}>Company</h2>
<p style={{color:'#374151',lineHeight:1.7}}>PHLedger Pty Ltd is based in Melbourne, Australia, serving businesses across Australia and Canada. Founded with the mission to make professional-grade financial tools accessible through intelligent automation.</p>
<p style={{color:'#374151',lineHeight:1.7,marginTop:12}}>Industries: Technology, Professional Services, Healthcare, E-commerce, Mining & Resources.</p>
<p style={{marginTop:16}}><a href="https://www.linkedin.com/company/phledger/" target="_blank" rel="noopener" style={{color:'#059669',fontWeight:500}}>Follow us on LinkedIn →</a></p>
</div>
<div style={{textAlign:'center',padding:'24px',background:'linear-gradient(135deg,#1e3a5f,#0d7a3f)',borderRadius:12,color:'white'}}>
<h3 style={{margin:'0 0 8px'}}>Ready to modernise your finance stack?</h3>
<p style={{margin:'0 0 16px',opacity:.9,fontSize:'.88rem'}}>14-day free trial. Plans from $25 CAD / $29 AUD per month.</p>
<a href="/auth/signup" style={{padding:'10px 24px',background:'white',color:'#1e3a5f',borderRadius:6,textDecoration:'none',fontWeight:600}}>Get Started</a>
</div></main>
</Layout></>);}
