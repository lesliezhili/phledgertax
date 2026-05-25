import { AU_BANKS, CA_BANKS } from '../../../lib/store.js';
export default function handler(req, res) {
  res.json({ status: 'ok', version: '2.0.0', framework: 'nextjs', backend: 'csv',
             au_banks: AU_BANKS, ca_banks: CA_BANKS });
}