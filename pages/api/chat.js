import { handleChat } from '@/lib/chatAgent.js';
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  res.json(handleChat(message));
}