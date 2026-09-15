import { app } from './app.js';
import { db } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`🚀 MAUSAM360 Server running on port ${PORT} (http://localhost:${PORT})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
