import{useState,useRef,useEffect,useCallback}from'react';
export default function FinanceAgent({country='ALL'}){
const[msgs,setMsgs]=useState([{role:'system',content:"G'day! PHLedger Finance Agent.\nTry: show balance, generate BAS, cost savings vs stripe",data:null}]);
const[input,setInput]=useState('');const[loading,setLoading]=useState(false);const end=useRef(null);
useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'});},[msgs]);
const send=useCallback(async()=>{if(!input.trim()||loading)return;const m=input;setMsgs(p=>[...p,{role:'user',content:m,data:null}]);setInput('');setLoading(true);
try{const r=await fetch('/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m})});const d=await r.json();
setMsgs(p=>[...p,{role:'agent',content:d.success?d.response.content:d.error,data:d.response?.data||null}]);}catch{setMsgs(p=>[...p,{role:'agent',content:'Error',data:null}]);}setLoading(false);},[input,loading]);
const Q=['Show balance','Generate BAS','Tax return','P&L','Forecast','Cost vs Stripe'];
return(<div style={{display:'flex',flexDirection:'column',height:'100%',fontFamily:'-apple-system,sans-serif'}}>
<div style={{padding:'10px 14px',background:'linear-gradient(135deg,#1e3a5f,#0d7a3f)',color:'white'}}><b>PHLedger Finance Agent</b><div style={{fontSize:'.6rem',opacity:.8}}>Free: Vercel + Supabase + Regex NLP</div></div>
<div style={{padding:'5px 8px',borderBottom:'1px solid #eee',display:'flex',gap:'3px',flexWrap:'wrap'}}>{Q.map(q=><button key={q} onClick={()=>setInput(q)} style={{fontSize:'.6rem',padding:'2px 6px',borderRadius:'10px',border:'1px solid #ddd',background:'#fff',cursor:'pointer'}}>{q}</button>)}</div>
<div style={{flex:1,overflowY:'auto',padding:'8px'}}>{msgs.map((m,i)=><div key={i} style={{marginBottom:8,display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}><div style={{maxWidth:'82%',padding:'7px 10px',borderRadius:9,fontSize:'.8rem',lineHeight:1.35,whiteSpace:'pre-wrap',background:m.role==='user'?'#1e3a5f':m.role==='system'?'#f0fdf4':'#f8f9fa',color:m.role==='user'?'#fff':'#1f2937'}}>{m.content}{m.data&&<details style={{marginTop:4,fontSize:'.65rem'}}><summary style={{cursor:'pointer',color:'#888'}}>Data</summary><pre style={{overflow:'auto',maxHeight:120}}>{JSON.stringify(m.data,null,2)}</pre></details>}</div></div>)}
{loading&&<div style={{fontSize:'.75rem',color:'#888'}}>...</div>}<div ref={end}/></div>
<div style={{padding:'7px',borderTop:'1px solid #eee',display:'flex',gap:'5px'}}><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask about finances..." style={{flex:1,padding:'7px',border:'1px solid #d1d5db',borderRadius:5,fontSize:'.8rem'}}/><button onClick={send} disabled={loading} style={{padding:'7px 12px',background:'#059669',color:'#fff',border:'none',borderRadius:5,cursor:'pointer'}}>Send</button></div></div>);}
