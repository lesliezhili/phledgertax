// pages/api/platform/payouts.js
// Provider payout summary + platform P&L for any platform
// Query param: ?platform_id=silverconnect
import fs from 'fs';
import { getPlatform, platformDataPath } from '@/lib/platformRegistry';
import { generateProviderPayouts, generatePlatformPL } from '@/lib/platformFee';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const platformId = req.query.platform_id || 'silverconnect';
  const filePath   = platformDataPath(platformId, 'bookings');
  const config     = getPlatform(platformId);

  const bookings   = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];

  const payouts    = generateProviderPayouts(bookings, config);
  const platform_pl = generatePlatformPL(bookings, config);

  return res.json({ payouts, platform_pl, platform_id: platformId, platform_name: config.platform_name });
}
