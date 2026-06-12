// app/api/phledger/finance/route.ts -- POST ledger rows for a finance summary,
// or action=settle (admin-only) to compute escrow releases for completed bookings.
import { NextResponse } from 'next/server'
import { summarizeFinance, autoReleaseEscrow, type BookingLedgerRow } from '@/lib/phledger/finance'
import { isPhledgerAdmin } from '@/lib/phledger/auth'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      rows?: BookingLedgerRow[]; action?: string; adminEmail?: string; adminPassword?: string
    }
    const rows = body.rows ?? []
    if (body.action === 'settle') {
      if (!isPhledgerAdmin(body.adminEmail, body.adminPassword)) {
        return NextResponse.json({ error: 'admin authentication required' }, { status: 401 })
      }
      const releases = rows.map(autoReleaseEscrow)
      const totalReleased = Number(releases.reduce((t, r) => t + r.amount, 0).toFixed(2))
      return NextResponse.json({ releases, totalReleased })
    }
    return NextResponse.json({ summary: summarizeFinance(rows) })
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 })
  }
}
