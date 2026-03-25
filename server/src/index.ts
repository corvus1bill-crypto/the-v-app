import http from 'http';
import { createApp, attachSocketIOAsync } from './app.js';
import { env } from './config/env.js';

const app = createApp();
const server = http.createServer(app);

await attachSocketIOAsync(server, app);

server.listen(env.PORT, () => {
  console.log(`THE V API listening on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`API docs: http://localhost:${env.PORT}/api-docs`);
});
