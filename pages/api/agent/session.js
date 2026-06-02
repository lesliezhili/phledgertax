import { createSession, getMessages } from '../../../lib/agent/persistence';
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { country } = req.body;
    const session = await createSession(country || 'ALL');
    return res.json({ success: true, session });
  }
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    const messages = await getMessages(id);
    return res.json({ success: true, messages });
  }
  res.status(405).end();
}
