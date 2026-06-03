import type{NextApiRequest,NextApiResponse}from'next';
export default async function handler(req:NextApiRequest,res:NextApiResponse){
const{country}=req.query;const c=(country as string||'AU').toUpperCase();
if(c!=='AU'&&c!=='CA')return res.status(400).json({error:'Country must be AU or CA'});
const schema=c==='AU'?'phledger_au':'phledger_ca';
const fy=c==='AU'?{start:'2026-07-01',end:'2026-12-31',label:'FY2026-27 H1 (Jul-Dec 2026)'}:{start:'2026-01-01',end:'2026-12-31',label:'FY2026 (Jan-Dec 2026)'};
const{loadCountry}=await import('@/lib/store.js');
const{autoCategorise}=await import('@/lib/categoriser.js');
const raw=loadCountry(c);
const txs=autoCategorise(raw).filter((t:any)=>t.date>=fy.start&&t.date<=fy.end);
const income=txs.filter((t:any)=>t.amount>0).reduce((s:number,t:any)=>s+t.amount,0);
const expenses=txs.filter((t:any)=>t.amount<0).reduce((s:number,t:any)=>s+t.amount,0);
res.json({country:c,schema,fy:fy.label,supabase_url:'https://dtfbcvefttirngkjuqvl.supabase.co',transactions:txs.length,income:Math.round(income*100)/100,expenses:Math.round(expenses*100)/100,net:Math.round((income+expenses)*100)/100,currency:c==='AU'?'AUD':'CAD',bank:c==='AU'?'ANZ':'RBC',tax:c==='AU'?{gst:'10%',super:'11.5%',bas:'quarterly',company_tax:'25%'}:{gst:'5%',hst:'13%',cpp:'5.95%',ei:'1.63%',sbd:'9%'},sample:txs.slice(0,5)});
}
