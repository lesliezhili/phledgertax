import formidable from 'formidable';
import fs from 'fs';
import { parseCsv } from '../../../lib/csvIngestion.js';
import { autoCategorise } from '../../../lib/categoriser.js';
import path from 'path';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Upload failed' });
    const bank = Array.isArray(fields.bank) ? fields.bank[0] : fields.bank;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    try {
      const content = fs.readFileSync(file.filepath, 'utf-8');
      const txs = parseCsv(content, bank);
      if (!txs.length) return res.status(400).json({ error: 'Empty file or no valid rows' });
      const categorised = autoCategorise(txs);
      // Save to bank_data/ in dev
      if (process.env.NODE_ENV === 'development' || process.env.BANK_DATA_PATH) {
        const first = txs[0].date;
        const [yr, mo] = first.split('-');
        const dir = path.join(process.env.BANK_DATA_PATH || path.join(process.cwd(),'bank_data'), bank, yr, mo);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, file.originalFilename || 'upload.csv'), content);
      }
      res.json({ message: `Uploaded ${categorised.length} transactions from ${bank.toUpperCase()}`,
                 bank, count: categorised.length, transactions: categorised });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });
}