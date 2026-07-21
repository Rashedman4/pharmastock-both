import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Next's production app.prepare() replaces require.extensions, which wipes
  // out ts-node's '.ts' handler — re-registering it here (before this
  // require-after-prepare, which is needed so db.ts picks up process.env
  // from .env.local) restores the ability to require .ts files by extension-less
  // specifier.
  require('ts-node').register({
    project: require.resolve('./tsconfig.server.json'),
    transpileOnly: true,
  });
  const { initSocketIO } = require('./src/lib/socket/socket-server');

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
