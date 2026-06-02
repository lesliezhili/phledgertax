import Layout from '../../components/Layout';
import { useRouter } from 'next/router';
import Head from 'next/head';
import InvoiceView from '../../components/InvoiceView';
import { getLocale, t } from '../../lib/i18n';

// Demo invoice (in production, fetch from API/Supabase by ID)
const DEMO_INVOICE = {
  number: 'INV-2026-0042', date: '2026-06-02', dueDate: '2026-07-02',
  from: { name: 'PHLedger Pty Ltd', abn: '12 345 678 901', address: 'Melbourne VIC 3000' },
  to: { name: 'SilverConnect AU', address: 'Sydney NSW 2000' },
  items: [
    { description: 'Professional Plan — June 2026', quantity: 1, unitPrice: 79, amount: 79 },
    { description: 'Additional entities (2)', quantity: 2, unitPrice: 15, amount: 30 },
  ],
  subtotal: 109, taxRate: 0.1, tax: 10.90, total: 119.90, currency: 'AUD', status: 'unpaid',
  bankDetails: 'BSB: 062-000 | Account: 1234 5678 | PHLedger Pty Ltd | CBA',
  notes: 'Payment via PayTo NPP (instant, $0 fee) or bank transfer within 30 days.',
};

export default function InvoicePage() {
  const router = useRouter();
  const locale = typeof window !== 'undefined' ? getLocale() : 'en';
  return (<>
    <Head><title>{t(locale, 'invoice_title')} {DEMO_INVOICE.number} — PHLedger</title></Head>
    <InvoiceView invoice={DEMO_INVOICE} />
  </>);
}
