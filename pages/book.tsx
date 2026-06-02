import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import Head from 'next/head';

const SERVICES = [
  { id: 'bookkeeping', name: 'Bookkeeping & Reconciliation', price_aud: 79, price_cad: 69, desc: 'Monthly automated bookkeeping with bank feed sync', duration: 'Monthly' },
  { id: 'bas_lodge', name: 'BAS / GST Lodgement', price_aud: 149, price_cad: 129, desc: 'Quarterly BAS preparation and ATO lodgement', duration: 'Quarterly' },
  { id: 'tax_return', name: 'Annual Tax Return', price_aud: 299, price_cad: 259, desc: 'Company or personal tax return preparation and filing', duration: 'Annual' },
  { id: 'payroll', name: 'Payroll Processing', price_aud: 49, price_cad: 45, desc: 'Fortnightly payroll run with STP compliance', duration: 'Per run' },
  { id: 'advisory', name: 'Finance Advisory Session', price_aud: 199, price_cad: 179, desc: '1-hour strategy session with AI-powered insights', duration: '60 min' },
];

const CLOUD_PLATFORMS = [
  { id: 'vercel_free', name: 'Vercel Free', icon: '▲', serverless: true, db: 'Supabase Free', compute: 'Edge Functions', storage: '100 GB bandwidth', price_aud: 0, price_cad: 0, desc: 'Best for startups & small business', limits: '100K requests/day, 500MB DB' },
  { id: 'vercel_pro', name: 'Vercel Pro', icon: '▲', serverless: true, db: 'Supabase Pro', compute: 'Serverless Functions', storage: '1 TB bandwidth', price_aud: 35, price_cad: 30, desc: 'For growing businesses', limits: 'Unlimited requests, 8GB DB, analytics' },
  { id: 'aws_serverless', name: 'AWS Serverless', icon: '☁️', serverless: true, db: 'DynamoDB / Aurora Serverless', compute: 'Lambda + API Gateway', storage: 'S3 Standard', price_aud: 45, price_cad: 39, desc: 'Enterprise-grade auto-scaling', limits: 'Pay-per-use, 25GB DB included' },
  { id: 'azure_serverless', name: 'Azure Serverless', icon: '⬡', serverless: true, db: 'Azure SQL Serverless / Cosmos DB', compute: 'Azure Functions', storage: 'Blob Storage', price_aud: 50, price_cad: 43, desc: 'Microsoft ecosystem integration', limits: 'Auto-pause DB, consumption billing' },
  { id: 'gcp_serverless', name: 'Google Cloud Serverless', icon: '◆', serverless: true, db: 'Cloud SQL / Firestore', compute: 'Cloud Run + Cloud Functions', storage: 'Cloud Storage', price_aud: 42, price_cad: 36, desc: 'AI/ML ready with BigQuery', limits: '2M requests/mo free, auto-scale' },
  { id: 'dedicated', name: 'Dedicated Server', icon: '🖥️', serverless: false, db: 'PostgreSQL / MySQL (managed)', compute: '2 vCPU / 4GB RAM', storage: '50GB SSD', price_aud: 89, price_cad: 79, desc: 'Full control, predictable cost', limits: 'Fixed resources, manual scaling' },
];

const DB_OPTIONS = [
  { id: 'supabase', name: 'Supabase (PostgreSQL)', price_aud: 0, price_cad: 0, desc: 'Free tier: 500MB, 50K rows', icon: '⚡' },
  { id: 'supabase_pro', name: 'Supabase Pro', price_aud: 25, price_cad: 22, desc: '8GB, unlimited rows, daily backups', icon: '⚡' },
  { id: 'planetscale', name: 'PlanetScale (MySQL)', price_aud: 39, price_cad: 34, desc: 'Serverless MySQL, branching, 10GB', icon: '🌍' },
  { id: 'neon', name: 'Neon (PostgreSQL)', price_aud: 19, price_cad: 16, desc: 'Serverless Postgres, auto-suspend, 10GB', icon: '🔋' },
  { id: 'azure_sql', name: 'Azure SQL Serverless', price_aud: 55, price_cad: 48, desc: 'Auto-pause, auto-scale, enterprise', icon: '⬡' },
  { id: 'dynamodb', name: 'DynamoDB (NoSQL)', price_aud: 0, price_cad: 0, desc: 'Free: 25GB, 25 RCU/WCU. Pay-per-request after', icon: '☁️' },
];

export default function BookService() {
  const [country, setCountry] = useState('AU');
  const [selected, setSelected] = useState<string | null>(null);
  const [cloud, setCloud] = useState('vercel_free');
  const [db, setDb] = useState('supabase');
  const [payMethod, setPayMethod] = useState('payto');
  const [creditSetup, setCreditSetup] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const c = localStorage.getItem('ph_country') || 'AU';
    setCountry(c);
  }, []);

  const cur = country === 'AU' ? 'AUD' : 'CAD';
  const bankFee = country === 'AU' ? 0 : 0.25;
  const bankRail = country === 'AU' ? 'PayTo NPP' : 'Interac e-Transfer';
  const selService = SERVICES.find(s => s.id === selected);
  const selCloud = CLOUD_PLATFORMS.find(c => c.id === cloud)!;
  const selDb = DB_OPTIONS.find(d => d.id === db)!;
  const servicePrice = selService ? (country === 'AU' ? selService.price_aud : selService.price_cad) : 0;
  const cloudPrice = country === 'AU' ? selCloud.price_aud : selCloud.price_cad;
  const dbPrice = country === 'AU' ? selDb.price_aud : selDb.price_cad;
  const totalPrice = servicePrice + cloudPrice + dbPrice + bankFee;

  if (booked && selService) {
    return (<><Head><title>Booking Confirmed — PHLedger</title></Head>
    <Layout><div style={{ maxWidth: 540, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
        <h2 style={{ color: '#059669', margin: '0 0 8px' }}>Booking Confirmed!</h2>
        <p style={{ color: '#6b7280', fontSize: '.85rem' }}>{selService.name}</p>
        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 16, margin: '16px 0', fontSize: '.8rem', textAlign: 'left' }}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Service:</span><strong>${servicePrice.toFixed(2)} {cur}</strong></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Cloud ({selCloud.name}):</span><strong>${cloudPrice.toFixed(2)}/mo</strong></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Database ({selDb.name}):</span><strong>${dbPrice.toFixed(2)}/mo</strong></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span>Bank Fee ({bankRail}):</span><strong>${bankFee.toFixed(2)}</strong></div>
          <div style={{borderTop:'1px solid #bbf7d0',paddingTop:8,marginTop:8,display:'flex',justifyContent:'space-between',fontWeight:700}}><span>Total:</span><span>${totalPrice.toFixed(2)} {cur}</span></div>
          {creditSetup && <div style={{ marginTop: 8, color: '#059669' }}>✓ Credit setup for recurring payments</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <a href="/invoice/demo" style={{ padding: '8px 14px', background: '#1e3a5f', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: '.8rem' }}>View Invoice</a>
          <a href="/payment/demo" style={{ padding: '8px 14px', background: '#059669', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: '.8rem' }}>View Payment</a>
          <a href="/book" onClick={() => setBooked(false)} style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 6, textDecoration: 'none', fontSize: '.8rem', color: '#374151' }}>Book Another</a>
        </div>
      </div>
    </div></Layout></>);
  }

  return (<><Head><title>Book a Service — PHLedger</title></Head>
  <Layout>
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
    <h1 style={{ fontSize: '1.5rem', color: '#1e3a5f', marginBottom: 4 }}>Book a Service</h1>
    <p style={{ color: '#6b7280', fontSize: '.82rem', marginBottom: 24 }}>Select a service, choose your cloud infrastructure, and pay via {bankRail}.</p>

    {/* Step 1: Service */}
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: '.9rem', color: '#1e3a5f', marginBottom: 10 }}>① Select Service</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SERVICES.map(s => {
          const price = country === 'AU' ? s.price_aud : s.price_cad;
          return (
            <div key={s.id} onClick={() => setSelected(s.id)} style={{
              background: 'white', borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
              border: selected === s.id ? '2px solid #059669' : '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: '.84rem', fontWeight: 600, color: '#1e3a5f' }}>{s.name}</div>
                <div style={{ fontSize: '.72rem', color: '#6b7280' }}>{s.desc}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '.95rem', fontWeight: 700, color: '#059669' }}>${price}</div>
                <div style={{ fontSize: '.62rem', color: '#9ca3af' }}>{cur}/{s.duration}</div></div>
              </div></div>);
        })}
      </div>
    </div>

    {/* Step 2: Cloud Platform */}
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: '.9rem', color: '#1e3a5f', marginBottom: 10 }}>② Cloud Platform (Serverless & Hosting)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
        {CLOUD_PLATFORMS.map(c => {
          const price = country === 'AU' ? c.price_aud : c.price_cad;
          return (
            <div key={c.id} onClick={() => setCloud(c.id)} style={{
              background: 'white', borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
              border: cloud === c.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
              boxShadow: cloud === c.id ? '0 0 0 3px rgba(37,99,235,.1)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><div style={{ fontSize: '.8rem', fontWeight: 600, color: '#1e3a5f' }}>{c.icon} {c.name}</div>
                <div style={{ fontSize: '.68rem', color: '#6b7280', marginTop: 2 }}>{c.desc}</div>
                <div style={{ fontSize: '.65rem', color: '#9ca3af', marginTop: 4 }}>{c.compute} · {c.storage}</div>
                <div style={{ fontSize: '.62rem', color: '#9ca3af' }}>{c.limits}</div></div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '.88rem', fontWeight: 700, color: price === 0 ? '#059669' : '#2563eb' }}>{price === 0 ? 'FREE' : `$${price}`}</div>
                  {price > 0 && <div style={{ fontSize: '.6rem', color: '#9ca3af' }}>{cur}/mo</div>}
                </div>
              </div>
            </div>);
        })}
      </div>
    </div>

    {/* Step 3: Database */}
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: '.9rem', color: '#1e3a5f', marginBottom: 10 }}>③ Database</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
        {DB_OPTIONS.map(d => {
          const price = country === 'AU' ? d.price_aud : d.price_cad;
          return (
            <div key={d.id} onClick={() => setDb(d.id)} style={{
              background: 'white', borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
              border: db === d.id ? '2px solid #7c3aed' : '1px solid #e5e7eb',
              boxShadow: db === d.id ? '0 0 0 3px rgba(124,58,237,.1)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: '.78rem', fontWeight: 600, color: '#1e3a5f' }}>{d.icon} {d.name}</div>
                <div style={{ fontSize: '.65rem', color: '#6b7280', marginTop: 2 }}>{d.desc}</div></div>
                <div style={{ fontSize: '.85rem', fontWeight: 700, color: price === 0 ? '#059669' : '#7c3aed' }}>{price === 0 ? 'FREE' : `$${price}`}</div>
              </div>
            </div>);
        })}
      </div>
    </div>

    {/* Step 4: Checkout */}
    {selService && (
      <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,.04)' }}>
        <h3 style={{ fontSize: '1rem', color: '#1e3a5f', margin: '0 0 16px' }}>④ Checkout</h3>

        {/* Price breakdown */}
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: '.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Service: {selService.name}</span><span style={{ fontWeight: 600 }}>${servicePrice.toFixed(2)} {cur}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#2563eb' }}><span>Cloud: {selCloud.name} ({selCloud.serverless ? 'Serverless' : 'Dedicated'})</span><span style={{ fontWeight: 600 }}>${cloudPrice.toFixed(2)}/mo</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#7c3aed' }}><span>Database: {selDb.name}</span><span style={{ fontWeight: 600 }}>${dbPrice.toFixed(2)}/mo</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#6b7280' }}><span>Bank fee: {bankRail}</span><span>${bankFee.toFixed(2)}</span></div>
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '.9rem' }}>
            <span>Total</span><span style={{ color: '#059669' }}>${totalPrice.toFixed(2)} {cur}</span>
          </div>
        </div>

        {/* Payment method */}
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: '.72rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Payment Method</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: payMethod === 'payto' ? '2px solid #059669' : '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: payMethod === 'payto' ? '#f0fdf4' : 'white' }}>
              <input type="radio" name="pay" checked={payMethod === 'payto'} onChange={() => setPayMethod('payto')} style={{ accentColor: '#059669' }} />
              <div><div style={{ fontSize: '.76rem', fontWeight: 600 }}>{country === 'AU' ? '🇦🇺 PayTo NPP' : '🇨🇦 Interac'}</div>
              <div style={{ fontSize: '.63rem', color: '#6b7280' }}>{country === 'AU' ? 'Instant · $0 fee' : 'Instant · $0.25 fee'}</div></div>
            </label>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: payMethod === 'bank' ? '2px solid #059669' : '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: payMethod === 'bank' ? '#f0fdf4' : 'white' }}>
              <input type="radio" name="pay" checked={payMethod === 'bank'} onChange={() => setPayMethod('bank')} style={{ accentColor: '#059669' }} />
              <div><div style={{ fontSize: '.76rem', fontWeight: 600 }}>🏦 Bank Transfer</div>
              <div style={{ fontSize: '.63rem', color: '#6b7280' }}>1-2 days · $0 fee</div></div>
            </label>
          </div>
        </div>

        {/* Credit */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, cursor: 'pointer' }}>
          <input type="checkbox" checked={creditSetup} onChange={e => setCreditSetup(e.target.checked)} style={{ accentColor: '#059669', width: 16, height: 16 }} />
          <span style={{ fontSize: '.76rem', color: '#374151' }}>Setup credit for automatic recurring payments (cloud + DB billed monthly)</span>
        </label>

        <button onClick={() => setBooked(true)} style={{ width: '100%', padding: 12, background: '#059669', color: 'white', border: 'none', borderRadius: 8, fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}>
          Confirm & Pay ${totalPrice.toFixed(2)} {cur} via {bankRail}
        </button>

        <p style={{ fontSize: '.66rem', color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
          {country === 'AU' ? 'PayTo mandate — instant settlement, zero processing fees.' : 'Interac e-Transfer — $0.25/tx, instant confirmation.'}
          {' '}Cloud & database fees billed monthly. Cancel anytime.
        </p>
      </div>
    )}
  </div>
  </Layout></>);
}
