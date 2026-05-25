// pages/api/kpi/targets.js
// Manage KPI targets (stored in sc_data/kpi_targets.json).
// GET  → { targets: { SC01: 50, SC04: 750, ... }, catalogue: [...] }
// POST → set/update one or more targets  { SC01: 60, SC04: 800 }
// DELETE → reset all targets to defaults

import { KPI_CATALOGUE } from '@/lib/kpiReport';
import path from 'path';
import fs from 'fs';

const DATA_DIR    = path.join(process.cwd(), 'sc_data');
const TARGET_PATH = path.join(DATA_DIR, 'kpi_targets.json');

function loadTargets() {
  try { return JSON.parse(fs.readFileSync(TARGET_PATH, 'utf-8')); } catch {}
  // Return defaults from catalogue
  return Object.fromEntries(
    KPI_CATALOGUE.filter(k => k.default_target !== null).map(k => [k.id, k.default_target])
  );
}
function saveTargets(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TARGET_PATH, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const targets = loadTargets();
    return res.json({
      targets,
      catalogue: KPI_CATALOGUE.map(k => ({
        id: k.id, name: k.name, category: k.category,
        format: k.format, default_target: k.default_target,
        current_target: targets[k.id] ?? k.default_target,
      })),
    });
  }

  if (req.method === 'POST') {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Body must be { KPI_ID: target_value, ... }' });
    }
    // Validate all provided keys are known KPI IDs
    const validIds = new Set(KPI_CATALOGUE.map(k => k.id));
    const invalid  = Object.keys(updates).filter(k => !validIds.has(k));
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Unknown KPI IDs: ${invalid.join(', ')}` });
    }
    const current = loadTargets();
    const merged  = { ...current, ...updates };
    saveTargets(merged);
    return res.json({ status: 'updated', targets: merged, updated_count: Object.keys(updates).length });
  }

  if (req.method === 'DELETE') {
    const defaults = Object.fromEntries(
      KPI_CATALOGUE.filter(k => k.default_target !== null).map(k => [k.id, k.default_target])
    );
    saveTargets(defaults);
    return res.json({ status: 'reset', targets: defaults });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
