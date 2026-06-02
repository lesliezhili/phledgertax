import { isConnected } from '../../lib/agent/persistence';
export default function handler(req, res) {
  res.json({
    status: 'ok',
    version: '3.0.0',
    agent: true,
    supabase: isConnected(),
    timestamp: new Date().toISOString(),
    stack: { hosting: 'Vercel', db: 'Supabase', nlp: 'Regex NLP', payments_au: 'PayTo NPP', payments_ca: 'Interac e-Transfer' }
  });
}
