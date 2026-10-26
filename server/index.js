import dns from 'node:dns';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import mysteriesRouter from './routes/mysteries.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

// Some local networks can't answer the SRV lookup that mongodb+srv:// needs; DNS_SERVERS lets dev machines bypass that
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()));
}

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy; needed for per-IP rate limiting
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/mysteries', mysteriesRouter);

// Unknown API routes get a JSON 404 instead of the React app
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Serve the built React app; any non-API route returns index.html so /mystery/:id survives a refresh
const distDir = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distDir));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  res.status(status).json({ error: err.expose ? err.message : 'Something went wrong' });
});

const port = process.env.PORT || 3001;

try {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'mystery-room', serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB');
} catch (err) {
  console.error('Could not connect to MongoDB:', err.message);
  process.exit(1);
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
