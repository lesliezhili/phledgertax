import { isConnected } from '../../lib/agent/persistence';
export default function handler(req, res) {
  res.json({
    status: 'ok',
    version: '3.0.0',
    agent: true,
    supabase: isConnected(),
    timestamp: new Date().toISOString(),
    stack: { hosting: 'Vercel Free', db: 'Supabase Free', nlp: 'Regex (free)', payments_au: 'PayTo $0', payments_ca: 'Interac $0.25' }
  });
}
