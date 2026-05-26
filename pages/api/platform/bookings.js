// pages/api/platform/bookings.js
// Create and list bookings for any registered platform
// Query param: ?platform_id=silverconnect
import fs from 'fs';
import { getPlatform, platformDataPath } from '@/lib/platformRegistry';
import { calculateFees } from '@/lib/platformFee';

export default function handler(req, res) {
  const platformId = req.query.platform_id || 'silverconnect';
  const filePath   = platformDataPath(platformId, 'bookings');
  const config     = getPlatform(platformId);

  const load = () => fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];

  if (req.method === 'GET') {
    const bookings = load().map(b => ({ ...b, fees: calculateFees(b.gross_amount, config) }));
    return res.json({ bookings, platform_id: platformId, platform_name: config.platform_name });
  }

  if (req.method === 'POST') {
    const { gross_amount, provider_name, client_name, service_type, notes } = req.body || {};
    if (!gross_amount) return res.status(400).json({ error: 'gross_amount required' });

    const fees    = calculateFees(parseFloat(gross_amount), config);
    const booking = {
      booking_id:     `BK-${Date.now().toString(36).toUpperCase()}`,
      platform_id:    platformId,
      gross_amount:   fees.gross_amount,
      platform_fee:   fees.platform_fee,
      provider_payout: fees.provider_payout,
      provider_id:    provider_name || 'unknown',
      provider_name:  provider_name || '',
      client_name:    client_name   || '',
      service_type:   service_type  || '',
      notes:          notes         || '',
      status:         'completed',
      created_at:     new Date().toISOString(),
      fees,
    };

    const bookings = load();
    bookings.push(booking);
    fs.writeFileSync(filePath, JSON.stringify(bookings, null, 2));
    return res.json({ booking });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
