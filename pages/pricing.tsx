import Layout from '../components/Layout';
import{useState}from'react';import Head from'next/head';
const plans=[

{id:'starter',name:'Starter',aud:29,cad:25,features:['Everything in Free, plus:','Unlimited bank accounts','5,000 transactions/month','PayTo payments (AU, $0/tx)','Interac payments (CA, $0.25/tx)','Auto-categorisation','P&L + Balance Sheet','Priority support'],cta:'Start Free Trial'},
{id:'professional',name:'Professional',aud:79,cad:69,rec:true,features:['Everything in Starter, plus:','Unlimited transactions','Multi-entity (AU + CA)','Auto-reconciliation','Cash flow forecasting','BAS auto-lodge','API access','Audit trail','Phone + chat support'],cta:'Start Free Trial'},
{id:'enterprise',name:'Enterprise',aud:199,cad:179,features:['Everything in Professional, plus:','Unlimited entities','Custom rules engine','Multi-user + team roles','SSO (SAML/OIDC)','Dedicated support manager','Custom integrations','99.9% SLA','On-premise available'],cta:'Contact Sales'},
];
export default function Pricing(){const[cur,setCur]=useState('AUD');const[annual,setAnnual]=useState(false);
return(<><Head><title>Pricing — PHLedger</title></Head>
<Layout>
<div style={{textAlign:'center',padding:'40px 20px 20px'}}>
<h1 style={{fontSize:'2rem',color:'#1e3a5f',margin:0}}>Simple, transparent pricing</h1>
<p style={{color:'#6b7280',margin:'8px 0 20px',fontSize:'.95rem'}}>Intelligent finance for Australian & Canadian businesses. 14-day free trial.</p>
<div style={{display:'flex',gap:12,justifyContent:'center',alignItems:'center',marginBottom:24}}>
<div style={{display:'flex',gap:4,background:'#e5e7eb',borderRadius:6,padding:3}}>
<button onClick={()=>setCur('AUD')} style={{padding:'4px 10px',borderRadius:4,border:'none',fontSize:'.75rem',fontWeight:600,cursor:'pointer',background:cur==='AUD'?'white':'transparent',color:cur==='AUD'?'#059669':'#6b7280'}}>AUD $</button>
<button onClick={()=>setCur('CAD')} style={{padding:'4px 10px',borderRadius:4,border:'none',fontSize:'.75rem',fontWeight:600,cursor:'pointer',background:cur==='CAD'?'white':'transparent',color:cur==='CAD'?'#059669':'#6b7280'}}>CAD $</button></div>
<label style={{fontSize:'.78rem',color:'#6b7280',display:'flex',alignItems:'center',gap:4}}><input type="checkbox" checked={annual} onChange={()=>setAnnual(!annual)}/> Annual (20% off)</label></div></div>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:16,maxWidth:1100,margin:'0 auto',padding:'0 16px 40px'}}>
{plans.map(p=>{const price=cur==='AUD'?p.aud:p.cad;const shown=annual&&price>0?Math.round(price*12*0.8):price;
return(<div key={p.id} style={{background:'white',borderRadius:12,padding:'24px 20px',border:p.rec?'2px solid #059669':'1px solid #e5e7eb',position:'relative',boxShadow:p.rec?'0 4px 12px rgba(5,150,105,.15)':'none'}}>
{p.rec&&<div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50)',background:'#059669',color:'white',fontSize:'.6rem',padding:'2px 8px',borderRadius:8,fontWeight:600}}>RECOMMENDED</div>}
<h3 style={{margin:'0 0 4px',fontSize:'1rem',color:'#1e3a5f'}}>{p.name}</h3>
<div style={{margin:'8px 0 16px'}}><span style={{fontSize:'2rem',fontWeight:700,color:'#111'}}>${shown}</span><span style={{fontSize:'.8rem',color:'#6b7280'}}>/{annual&&price>0?'year':'mo'}</span>{annual&&price>0&&<div style={{fontSize:'.65rem',color:'#059669'}}>Save {cur==='AUD'?'$'+Math.round(p.aud*12*0.2):' $'+Math.round(p.cad*12*0.2)}/yr</div>}</div>
<ul style={{listStyle:'none',padding:0,margin:'0 0 16px'}}>{p.features.map((f,i)=><li key={i} style={{fontSize:'.73rem',color:'#374151',padding:'3px 0',borderBottom:'1px solid #f3f4f6'}}>{f.startsWith('Everything')?<b>{f}</b>:'✓ '+f}</li>)}</ul>
<a href={p.id==='enterprise'?'mailto:hello@phledger.com?subject=Enterprise+Plan':'/auth/signup'} style={{display:'block',textAlign:'center',padding:'9px',background:p.rec?'#059669':'#f3f4f6',color:p.rec?'white':'#374151',borderRadius:6,textDecoration:'none',fontSize:'.82rem',fontWeight:600}}>{p.cta}</a>
</div>)})}</div>
<div style={{textAlign:'center',padding:'20px',borderTop:'1px solid #e5e7eb',background:'white'}}>
<p style={{fontSize:'.75rem',color:'#6b7280',margin:0}}>All plans include: No setup fees | PayTo $0/tx (AU) | Interac $0.25/tx (CA) | Supabase hosted | ATO-ready BAS</p>
<p style={{fontSize:'.7rem',color:'#9ca3af',marginTop:6}}>Payment via PayTo NPP (AU) or Interac e-Transfer (CA). Powered by PHLedger.</p>
</div></Layout></>);}
