// pages/api/silverconnect/config.js
// SilverConnect platform config — fetch, store, and sync from upstream system.
// GET  → returns current stored config
// POST → accepts upstream config payload, merges and stores it

import { DEFAULT_PLATFORM_CONFIG, applyUpstreamConfig } from '@/lib/silverconnect';
import path from 'path';
import fs from 'fs';

const CONFIG_PATH = path.join(process.cwd(), 'sc_data', 'platform_config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch {}
  return { ...DEFAULT_PLATFORM_CONFIG };
}

function saveConfig(cfg) {
  const dir = path.dirname(CONFIG_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(loadConfig());
  }

  if (req.method === 'POST') {
    // Accepts upstream config override from SilverConnect API or manual update
    const upstream = req.body;
    if (!upstream || typeof upstream !== 'object') {
      return res.status(400).json({ error: 'Request body must be a JSON config object' });
    }
    const base    = loadConfig();
    const merged  = applyUpstreamConfig(base, upstream);
    saveConfig(merged);
    return res.json({ status: 'updated', config: merged });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
