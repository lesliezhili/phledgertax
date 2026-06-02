import Layout from '../../components/Layout';
import { useState } from 'react';
import Head from 'next/head';
import { t, getLocale, Locale } from '../../lib/i18n';
import LanguageSelector from '../../components/LanguageSelector';

export default function PaymentPage() {
  const [locale, setL] = useState<Locale>(typeof window !== 'undefined' ? getLocale() : 'en');
  const T = (k: any) => t(locale, k);
  const payment = { id: 'PAYTO-2026-0091', amount: 500, currency: 'AUD', rail: 'PayTo NPP', fee: 0, speed: '< 1 second', recipient: 'Provider Services Pty Ltd', sender: 'SilverConnect AU', reference: 'SC-BOOK-2026-0042', status: 'settled', date: '2026-06-02T10:30:00Z', settledAt: '2026-06-02T10:30:01Z' };

  return (<><Head><title>{T('payment_title')} — PHLedger</title></Head>
  <Layout><div style={{maxWidth:600,margin:'0 auto',padding:32,fontFamily:'-apple-system,sans-serif'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
      <h2 style={{margin:0,color:'#1e3a5f'}}>{T('payment_title')}</h2>
      <LanguageSelector compact onChange={l=>setL(l)}/></div>
    <div style={{background:'white',borderRadius:12,padding:24,border:'1px solid #e5e7eb'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={{fontSize:'1.8rem',fontWeight:700,color:'#111'}}>${payment.amount.toFixed(2)} <span style={{fontSize:'.9rem',color:'#6b7280'}}>{payment.currency}</span></span>
        <span style={{padding:'4px 12px',borderRadius:12,fontSize:'.75rem',fontWeight:600,background:'#dcfce7',color:'#166534'}}>{T('payment_settled')}</span></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:'.83rem'}}>
        <div><span style={{color:'#6b7280'}}>{T('payment_recipient')}</span><br/><strong>{payment.recipient}</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('payment_sender')}</span><br/><strong>{payment.sender}</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('payment_method')}</span><br/><strong>{payment.rail}</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('payment_speed')}</span><br/><strong>{T('payment_realtime')}</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('payment_fee')}</span><br/><strong>$0.00</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('payment_reference')}</span><br/><strong>{payment.reference}</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('payment_date')}</span><br/><strong>{new Date(payment.date).toLocaleString()}</strong></div>
        <div><span style={{color:'#6b7280'}}>{T('payment_net')}</span><br/><strong>${payment.amount.toFixed(2)}</strong></div>
      </div></div>
    <div style={{marginTop:20,textAlign:'center',fontSize:'.65rem',color:'#9ca3af'}}>{T('common_powered_by')}</div>
  </div></Layout></>);
}
