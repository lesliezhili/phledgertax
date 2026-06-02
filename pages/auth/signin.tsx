import Layout from '../../components/Layout';
import{useState}from'react';import Head from'next/head';import{useRouter}from'next/router';
export default function SignIn(){const[email,setEmail]=useState('');const[pw,setPw]=useState('');const[err,setErr]=useState('');const[loading,setLoading]=useState(false);const router=useRouter();
const submit=async(e)=>{e.preventDefault();setErr('');setLoading(true);
try{const r=await fetch('/api/auth/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})});const d=await r.json();
if(!r.ok){setErr(d.error);setLoading(false);return;}localStorage.setItem('ph_token',d.token);localStorage.setItem('ph_user',JSON.stringify(d.user));router.push(d.user.role==='admin'?'/admin':'/agent');}catch{setErr('Network error');}setLoading(false);};
return(<><Head><title>Sign In — PHLedger</title></Head>
<Layout>
<div style={{background:'white',borderRadius:12,padding:'40px 36px',boxShadow:'0 4px 24px rgba(0,0,0,.08)',width:'100%',maxWidth:400}}>
<div style={{textAlign:'center',marginBottom:24}}><h1 style={{fontSize:'1.4rem',color:'#1e3a5f',margin:0}}>📒 PHLedger</h1><p style={{color:'#6b7280',fontSize:'.85rem',margin:'6px 0 0'}}>Sign in to your account</p></div>
<form onSubmit={submit}>
<label style={{display:'block',marginBottom:12}}><span style={{fontSize:'.75rem',color:'#374151',fontWeight:500}}>Email</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%',padding:'9px 11px',border:'1px solid #d1d5db',borderRadius:6,fontSize:'.85rem',marginTop:3,boxSizing:'border-box'}}/></label>
<label style={{display:'block',marginBottom:16}}><span style={{fontSize:'.75rem',color:'#374151',fontWeight:500}}>Password</span><input type="password" value={pw} onChange={e=>setPw(e.target.value)} required style={{width:'100%',padding:'9px 11px',border:'1px solid #d1d5db',borderRadius:6,fontSize:'.85rem',marginTop:3,boxSizing:'border-box'}}/></label>
{err&&<p style={{color:'#dc2626',fontSize:'.78rem',margin:'0 0 12px'}}>{err}</p>}
<button type="submit" disabled={loading} style={{width:'100%',padding:'10px',background:'#059669',color:'white',border:'none',borderRadius:6,fontSize:'.88rem',fontWeight:600,cursor:'pointer'}}>{loading?'Signing in...':'Sign In'}</button>
</form>
<p style={{textAlign:'center',fontSize:'.78rem',color:'#6b7280',marginTop:16}}>No account? <a href="/auth/signup" style={{color:'#059669',fontWeight:500}}>Sign up free</a></p>
<p style={{textAlign:'center',fontSize:'.78rem',color:'#6b7280',marginTop:8}}><a href="/pricing" style={{color:'#1e3a5f'}}>View pricing</a></p>
</div></Layout></>);}
