import { ReactNode } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/agent', label: 'Agent' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/invoice/demo', label: 'Invoice' },
  { href: '/about', label: 'About' },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* HEADER */}
      <header style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)',
        padding: '0 24px',
        borderBottom: '3px solid #059669',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ fontSize: '1.5rem' }}>📒</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>
              PH<span style={{ color: '#4ade80' }}>Ledger</span>
            </span>
            <span style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.5)', marginLeft: 4, letterSpacing: '.5px', textTransform: 'uppercase' }}>AU & CA</span>
          </a>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} style={{
                fontSize: '.82rem', color: 'rgba(255,255,255,.85)', textDecoration: 'none',
                padding: '6px 12px', borderRadius: 6, transition: 'background .2s',
              }}>{l.label}</a>
            ))}
            <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,.2)', margin: '0 8px' }} />
            <a href="/auth/signin" style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.85)', textDecoration: 'none', padding: '6px 12px' }}>Sign In</a>
            <a href="/auth/signup" style={{
              fontSize: '.82rem', padding: '7px 16px', background: '#059669', color: 'white',
              borderRadius: 6, textDecoration: 'none', fontWeight: 600,
            }}>Sign Up</a>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* FOOTER */}
      <footer style={{
        background: '#1e293b',
        color: 'rgba(255,255,255,.7)',
        padding: '32px 24px 20px',
        borderTop: '3px solid #059669',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, marginBottom: 24 }}>
            {/* Brand */}
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>
                📒 PH<span style={{ color: '#4ade80' }}>Ledger</span>
              </div>
              <p style={{ fontSize: '.75rem', lineHeight: 1.6, margin: 0, color: 'rgba(255,255,255,.5)' }}>
                Intelligent Finance Platform for Australian & Canadian businesses.
                Bookkeeping, payments, and tax — all in one place.
              </p>
            </div>

            {/* Platform */}
            <div>
              <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <a href="/agent" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Finance Agent</a>
                <a href="/pricing" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Pricing</a>
                <a href="/invoice/demo" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Invoicing (7 languages)</a>
                <a href="/payment/demo" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Payments</a>
              </div>
            </div>

            {/* Company */}
            <div>
              <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Company</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <a href="/about" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>About</a>
                <a href="/feedback" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Feedback</a>
                <a href="https://www.linkedin.com/company/phledger/" target="_blank" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>LinkedIn</a>
              </div>
            </div>

            {/* Support */}
            <div>
              <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Support</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <a href="/auth/signin" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Sign In</a>
                <a href="/auth/signup" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>Sign Up</a>
                <a href="/api/health" style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.7)', textDecoration: 'none' }}>System Status</a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.35)' }}>
              © 2026 PHLedger Pty Ltd. All rights reserved. ABN 12 345 678 901.
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: '.68rem' }}>
              <span style={{ color: 'rgba(255,255,255,.35)' }}>🇦🇺 Australia</span>
              <span style={{ color: 'rgba(255,255,255,.35)' }}>🇨🇦 Canada</span>
              <span style={{ color: 'rgba(255,255,255,.35)' }}>PayTo NPP · Interac</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
