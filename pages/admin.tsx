import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('ph_user') : null;
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role === 'admin') { setUser(u); setLoading(false); }
      else { router.push('/auth/signin'); }
    } else { router.push('/auth/signin'); }
  }, []);

  if (loading) return <div style={{padding:40,textAlign:'center'}}>Loading...</div>;
  if (!user) return null;

  return (<><Head><title>Admin — PHLedger</title></Head>
  <Layout>
    <main style={{maxWidth:900,margin:'0 auto',padding:'32px 20px'}}>
      <h1 style={{fontSize:'1.6rem',color:'#1e3a5f',marginBottom:24}}>Admin Dashboard</h1>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:32}}>
        {[
          {label:'Plan',value:'Free (Internal)',color:'#059669'},
          {label:'Role',value:'Administrator',color:'#7c3aed'},
          {label:'Country',value:'AU + CA',color:'#2563eb'},
          {label:'Agent',value:'Active',color:'#059669'},
        ].map((c,i)=><div key={i} style={{background:'white',borderRadius:10,padding:'16px 20px',border:'1px solid #e5e7eb'}}>
          <div style={{fontSize:'.72rem',color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px'}}>{c.label}</div>
          <div style={{fontSize:'1.1rem',fontWeight:600,color:c.color,marginTop:4}}>{c.value}</div>
        </div>)}
      </div>

      <div style={{background:'white',borderRadius:12,padding:'24px',border:'1px solid #e5e7eb',marginBottom:24}}>
        <h3 style={{margin:'0 0 16px',color:'#1e3a5f'}}>Quick Links</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
          {[
            {href:'/agent',label:'Finance Agent',desc:'NL chat interface'},
            {href:'/pricing',label:'Pricing',desc:'Plans & billing'},
            {href:'/invoice/demo',label:'Invoice (7 langs)',desc:'Multilingual invoices'},
            {href:'/payment/demo',label:'Payment (7 langs)',desc:'Payment receipts'},
            {href:'/refund/demo',label:'Refund (7 langs)',desc:'Refund details'},
            {href:'/feedback',label:'Feedback',desc:'Customer feedback'},
            {href:'/about',label:'About PHLedger',desc:'Company info'},
            {href:'/api/health',label:'Health Check',desc:'System status'},
          ].map((l,i)=><a key={i} href={l.href} style={{display:'block',padding:'12px',border:'1px solid #e5e7eb',borderRadius:8,textDecoration:'none',fontSize:'.82rem'}}>
            <div style={{fontWeight:600,color:'#1e3a5f'}}>{l.label}</div>
            <div style={{fontSize:'.7rem',color:'#6b7280',marginTop:2}}>{l.desc}</div>
          </a>)}
        </div>
      </div>

      <div style={{background:'white',borderRadius:12,padding:'24px',border:'1px solid #e5e7eb',marginBottom:24}}>
        <h3 style={{margin:'0 0 12px',color:'#1e3a5f'}}>Platform Access</h3>
        <table style={{width:'100%',fontSize:'.82rem',borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:'2px solid #e5e7eb'}}><th style={{textAlign:'left',padding:8}}>Email</th><th style={{textAlign:'left',padding:8}}>Role</th><th style={{textAlign:'left',padding:8}}>Plan</th></tr></thead>
          <tbody>
            <tr style={{borderBottom:'1px solid #f3f4f6'}}><td style={{padding:8}}>zhili@phledger.com</td><td style={{padding:8}}><span style={{background:'#fef3c7',padding:'2px 6px',borderRadius:4,fontSize:'.7rem'}}>admin</span></td><td style={{padding:8}}>Free (internal)</td></tr>
            <tr style={{borderBottom:'1px solid #f3f4f6'}}><td style={{padding:8}}>*@silverconnect.com.au</td><td style={{padding:8}}><span style={{background:'#dbeafe',padding:'2px 6px',borderRadius:4,fontSize:'.7rem'}}>customer</span></td><td style={{padding:8}}>Free (partner)</td></tr>
            <tr><td style={{padding:8}}>Others</td><td style={{padding:8}}><span style={{background:'#f3f4f6',padding:'2px 6px',borderRadius:4,fontSize:'.7rem'}}>customer</span></td><td style={{padding:8}}>14-day trial → Paid</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{background:'white',borderRadius:12,padding:'24px',border:'1px solid #e5e7eb'}}>
        <h3 style={{margin:'0 0 12px',color:'#1e3a5f'}}>7-Language Support</h3>
        <p style={{fontSize:'.82rem',color:'#374151',margin:'0 0 12px'}}>Customers and service providers can view invoices, payments, and refunds in their preferred language:</p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {['🇬🇧 English','🇨🇳 简体中文','🇹🇼 繁體中文','🇯🇵 日本語','🇰🇷 한국어','🇪🇸 Español','🇫🇷 Français'].map((l,i)=>
            <span key={i} style={{padding:'4px 10px',background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:6,fontSize:'.75rem'}}>{l}</span>)}
        </div>
      </div>
    </main>

    </Layout></>);
}
