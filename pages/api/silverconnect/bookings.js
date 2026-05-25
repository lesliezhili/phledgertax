// pages/api/silverconnect/bookings.js
// SilverConnect booking transactions with auto fee-split on create.
// GET  → list all bookings (with fee breakdown)
// POST → create booking, auto-calculate platform fee + provider payout

import { calculateFees, DEFAULT_PLATFORM_CONFIG } from '@/lib/silverconnect';
import path from 'path';
import fs from 'fs';

const DATA_DIR  = path.join(process.cwd(), 'sc_data');
const BOOK_PATH = path.join(DATA_DIR, 'bookings.json');
const CFG_PATH  = path.join(DATA_DIR, 'platform_config.json');

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CFG_PATH, 'utf-8')); } catch {}
  return { ...DEFAULT_PLATFORM_CONFIG };
}
function loadBookings() {
  try { return JSON.parse(fs.readFileSync(BOOK_PATH, 'utf-8')); } catch {}
  return [];
}
function saveBookings(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BOOK_PATH, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
  const config = loadConfig();

  if (req.method === 'GET') {
    const bookings = loadBookings();
    // Attach fee breakdown to each booking
    const enriched = bookings.map(b => ({
      ...b,
      fees: calculateFees(b.gross_amount, config),
    }));
    return res.json({ bookings: enriched, config_fee_rate: config.platform_fee_rate });
  }

  if (req.method === 'POST') {
    const {
      booking_id, client_name, provider_id, provider_name,
      gross_amount, service_date, service_type, notes,
    } = req.body || {};

    if (!gross_amount || isNaN(parseFloat(gross_amount))) {
      return res.status(400).json({ error: 'gross_amount is required and must be numeric' });
    }

    const fees      = calculateFees(gross_amount, config);
    const bookings  = loadBookings();
    const id        = booking_id || `BK-${Date.now()}`;

    const newBooking = {
      booking_id:   id,
      client_name:  client_name || '',
      provider_id:  provider_id || '',
      provider_name: provider_name || '',
      gross_amount: fees.gross_amount,
      platform_fee: fees.platform_fee,
      provider_payout: fees.provider_payout,
      service_date: service_date || new Date().toISOString().slice(0, 10),
      service_type: service_type || '',
      status:       'completed',
      created_at:   new Date().toISOString(),
      notes:        notes || '',
      currency:     config.currency || 'AUD',
      fee_rate_applied: config.platform_fee_rate,
    };

    bookings.push(newBooking);
    saveBookings(bookings);
    return res.status(201).json({ booking: newBooking, fees });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
