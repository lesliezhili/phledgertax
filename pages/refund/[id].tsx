import Layout from '../../components/Layout';
import { useState } from 'react';
import Head from 'next/head';
import { t, getLocale, Locale } from '../../lib/i18n';
import LanguageSelector from '../../components/LanguageSelector';

export default function RefundPage() {
  const [locale, setL] = useState<Locale>(typeof window !== 'undefined' ? getLocale() : 'en');
  const T = (k: any) => t(locale, k);
  const refund = { id: 'REF-2026-0015', amount: 79, currency: 'AUD', reason: 'Service not provided — cancellation within 24hrs', originalPayment: 'PAYTO-2026-0078', type: 'full', status: 'processed', date: '2026-06-01', processedAt: '2026-06-01T15:22:00Z' };

  return (<><Head><title>{T('refund_title')} — PHLedger</title></Head>
  <Layout><div style={{maxWidth:600,margin:'0 auto',padding:32,fontFamily:'-apple-system,sans-serif'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
      <h2 style={{margin:0,color:'#1e3a5f'}}>{T('refund_title')}</h2>
      <LanguageSelector compact onChange={l=>setL(l)}/></div>
    <div style={{background:'white',borderRadius:12,padding:24,border:'1px solid #e5e7eb'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={{fontSize:'1.8rem',fontWeight:700,color:'#dc2626'}}>${refund.amount.toFixed(2)} <span style={{fontSize:'.9rem',color:'#6b7280'}}>{refund.currency}</span></span>
        <span style={{padding:'4px 12px',borderRadius:12,fontSize:'.75rem',fontWeight:600,background:'#dcfce7',color:'#166534'}}>{T('refund_processed')}</span></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:'.83rem'}}>
        <div style={{gridColumn:'span 2'}}><span style={{color:'#6b7280'}}>{T('refund_reason')}</span><br/><strong>{refund.reason}</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('refund_original_payment')}</span><br/><strong>{refund.originalPayment}</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('refund_date')}</span><br/><strong>{refund.date}</strong></div>
        <div><span style={{color:'#6b7280'}}>Type</span><br/><strong>{T('refund_full')}</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('refund_status')}</span><br/><strong>{T('refund_processed')}</strong></div>
      </div></div>
    <div style={{marginTop:16,padding:12,background:'#fef2f2',borderRadius:8,fontSize:'.78rem',color:'#991b1b'}}>
      <strong>{T('refund_policy')}:</strong> Full refunds within 24 hours. Partial refunds at provider discretion after 24hrs.</div>
    <div style={{marginTop:20,textAlign:'center',fontSize:'.65rem',color:'#9ca3af'}}>{T('common_powered_by')}</div>
  </div></Layout></>);
}
