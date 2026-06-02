# PHLedger Deployment Guide

## Architecture — 100% Free Stack

| Component | Service | Cost | Notes |
|-----------|---------|------|-------|
| Hosting | Vercel Free | $0/mo | Auto-deploy on git push |
| Database | Supabase Free | $0/mo | 500MB, 50K req/mo |
| CI/CD | GitHub Actions | $0/mo | Public repo, unlimited |
| NLP | Regex (80+ patterns) | $0/mo | No OpenAI/Claude |
| Payments AU | PayTo NPP | $0/tx | Real-time, <1s |
| Payments CA | Interac e-Transfer | $0.25/tx | <30 min |
| Bookkeeping | lib/ledger.ts | $0/mo | Replaces Xero ($65/mo) |

**Total: $0/month** (vs ~$2,500/mo with Stripe + Xero + OpenAI)

## Deploy Pipeline

```
git push origin main
    │
    ├─► GitHub Actions CI (.github/workflows/ci.yml)
    │     └─ npm ci → build → health check
    │
    └─► Vercel auto-deploy (Git integration)
          └─ Build (Next.js) → Deploy → Live at phledgertax.vercel.app
```

## URLs

- App: https://phledgertax.vercel.app
- Agent: https://phledgertax.vercel.app/agent
- API: https://phledgertax.vercel.app/api/agent
- Health: https://phledgertax.vercel.app/api/health

## Supabase Setup (one-time, 2 min)

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create New Project → Free plan → Region: ap-southeast-2 (Sydney)
3. SQL Editor → paste contents of `scripts/setup-supabase.sql` → Run
4. Settings → API → copy Project URL + `service_role` key
5. Vercel Dashboard → phledgertax → Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your project URL
   - `SUPABASE_SERVICE_KEY` = your service_role key
6. Redeploy (push empty commit or trigger from Vercel dashboard)

## CI/CD

- **Every push to main**: Build + deploy + health check
- **Every PR**: Build validation (blocks merge if broken)
- **Nightly (10pm UTC)**: Bank feed sync cron

## Environment Variables

| Variable | Required | Source |
|----------|----------|--------|
| NEXT_PUBLIC_SUPABASE_URL | For persistence | Supabase dashboard |
| SUPABASE_SERVICE_KEY | For persistence | Supabase dashboard |

Agent works without these (stateless mode) — persistence is optional.
