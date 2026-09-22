import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './chatbot/chatRoutes.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Latency & SLA tracking middleware (Proving Story W-04: < 1.5s response time)
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time-Ms', duration);
    }
    return originalSend.call(this, body);
  };
  next();
});

// Health check (supports /api/health, /health, and root /)
app.get(['/api/health', '/health', '/'], (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'MAUSAM360 API',
    team: 'INFINITE LOOP (G2-T2)',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes matching Lab 3 & Lab 4 API Contract (with /api and fallback without)
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

app.use('/auth', authRoutes);
app.use('/weather', weatherRoutes);
app.use('/users', userRoutes);
app.use('/chat', chatRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler (guarantees server never crashes on malformed requests - Lab 1 NFR)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
