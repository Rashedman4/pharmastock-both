import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Dynamic import ensures db.ts is loaded AFTER app.prepare() populates process.env from .env.local
  const { initSocketIO } = await import('./src/lib/socket/socket-server');

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.MOBILE_APP_URL || 'http://localhost:8081',
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      ],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  initSocketIO(io);

  const PORT = parseInt(process.env.PORT || '3000', 10);
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
