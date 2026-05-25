// pages/api/platform/refunds.js
// Process cancellation refunds for any platform
// Query param: ?platform_id=silverconnect
import fs from 'fs';
import { getPlatform, platformDataPath } from '@/lib/platformRegistry';
import { calculateRefund } from '@/lib/platformFee';

export default function handler(req, res) {
  const platformId = req.query.platform_id || 'silverconnect';
  const config     = getPlatform(platformId);

  if (req.method === 'GET') {
    const filePath = platformDataPath(platformId, 'refunds');
    const refunds  = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
    return res.json({ refunds, platform_id: platformId });
  }

  if (req.method === 'POST') {
    const { booking_id, hours_notice, reason } = req.body || {};
    if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

    const bkFilePath = platformDataPath(platformId, 'bookings');
    if (!fs.existsSync(bkFilePath)) return res.status(404).json({ error: 'No bookings found' });

    const bookings = JSON.parse(fs.readFileSync(bkFilePath, 'utf8'));
    const idx      = bookings.findIndex(b => b.booking_id === booking_id);
    if (idx < 0) return res.status(404).json({ error: 'Booking not found' });

    const booking = bookings[idx];
    const hoursVal = hours_notice === '' || hours_notice === null || hours_notice === undefined
      ? null : parseFloat(hours_notice);

    const refund = calculateRefund(booking, hoursVal, config);

    // Update booking status
    if (refund.refund_type !== 'pending_upstream') {
      bookings[idx] = { ...booking, status: 'refunded', refund };
      fs.writeFileSync(bkFilePath, JSON.stringify(bookings, null, 2));
    } else {
      bookings[idx] = { ...booking, status: 'pending_refund', refund };
      fs.writeFileSync(bkFilePath, JSON.stringify(bookings, null, 2));
    }

    // Append to refunds log
    const rfFilePath = platformDataPath(platformId, 'refunds');
    const refunds    = fs.existsSync(rfFilePath)
      ? JSON.parse(fs.readFileSync(rfFilePath, 'utf8')) : [];
    refunds.push({ ...refund, booking_id, reason: reason || '', processed_at: new Date().toISOString(), platform_id: platformId });
    fs.writeFileSync(rfFilePath, JSON.stringify(refunds, null, 2));

    return res.json({ refund, booking: bookings[idx] });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
